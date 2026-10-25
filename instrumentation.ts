// Temporary diagnostic: remove after managed-runtime patch coverage is verified.
const runtimeSecurityLogged = Symbol.for("runtime-security.versions.logged")

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  try {
    const runtime = process as typeof process & {
      [runtimeSecurityLogged]?: boolean
    }
    if (runtime[runtimeSecurityLogged]) return
    runtime[runtimeSecurityLogged] = true

    console.info("[runtime-security]", JSON.stringify({
      node: runtime.version,
      brotli: runtime.versions.brotli ?? null,
      openssl: runtime.versions.openssl ?? null,
    }))
  } catch {
    // A temporary diagnostic must not prevent the server from starting.
  }
}
