import { it as test } from "vitest"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import ts from "typescript"

const source = readFileSync(new URL("../instrumentation.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function makeProcess(runtime: string | undefined = "nodejs") {
  return {
    version: "v24.22.1",
    versions: new Proxy({ brotli: "1.2.1", openssl: "3.5.7" }, {
      get(target, key) {
        assert.ok(key === "brotli" || key === "openssl", "only approved version fields may be read")
        return target[key as keyof typeof target]
      },
      ownKeys() { throw new Error("must not enumerate process.versions") },
    }),
    env: new Proxy({ NEXT_RUNTIME: runtime }, {
      get(target, key) {
        assert.equal(key, "NEXT_RUNTIME", "must not read credentials or other environment values")
        return target.NEXT_RUNTIME
      },
      ownKeys() { throw new Error("must not enumerate environment values") },
    }),
  }
}

function load(runtime: ReturnType<typeof makeProcess>, info: (...args: unknown[]) => void) {
  const exports: { register?: () => void } = {}
  runInNewContext(compiled, { exports, process: runtime, console: { info } })
  assert.equal(typeof exports.register, "function")
  return exports.register!
}

test("logs exactly the three approved version values", () => {
  const output: unknown[][] = []
  load(makeProcess(), (...args) => output.push(args))()
  assert.equal(output.length, 1)
  assert.equal(output[0][0], "[runtime-security]")
  assert.deepEqual(JSON.parse(output[0][1] as string), {
    node: "v24.22.1", brotli: "1.2.1", openssl: "3.5.7",
  })
})

test("logs once even across repeated registration and separately loaded module copies", () => {
  const runtime = makeProcess()
  const output: unknown[][] = []
  const log = (...args: unknown[]) => output.push(args)
  const register = load(runtime, log)
  register()
  register()
  load(runtime, log)()
  assert.equal(output.length, 1)
})

test("a different process can produce its own single measurement", () => {
  const output: unknown[][] = []
  const log = (...args: unknown[]) => output.push(args)
  load(makeProcess(), log)()
  load(makeProcess(), log)()
  assert.equal(output.length, 2)
})

test("Edge and unknown runtimes never inspect Node versions or emit output", () => {
  for (const runtimeName of ["edge", "", undefined]) {
    const runtime = makeProcess()
    runtime.env.NEXT_RUNTIME = runtimeName
    Object.defineProperty(runtime, "versions", { get() { throw new Error("Node API must not be read") } })
    Object.defineProperty(runtime, "version", { get() { throw new Error("Node API must not be read") } })
    load(runtime, () => assert.fail("must not log outside Node"))()
  }
})

test("a logging failure cannot break startup or cause repeated attempts", () => {
  let attempts = 0
  const runtime = makeProcess()
  const register = load(runtime, () => { attempts++; throw new Error("logger unavailable") })
  assert.doesNotThrow(register)
  assert.doesNotThrow(register)
  assert.equal(attempts, 1)
})

test("a non-extensible process object cannot turn diagnostics into a startup failure", () => {
  const runtime = Object.preventExtensions(makeProcess())
  const register = load(runtime, () => assert.fail("guard could not be set"))
  assert.doesNotThrow(register)
})
