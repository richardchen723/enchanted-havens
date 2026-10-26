import { randomUUID } from "node:crypto"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ownerInquirySchema } from "@/lib/owner-inquiry-schema"

const mocks = vi.hoisted(() => ({ configured: vi.fn(), sql: vi.fn(), begin: vi.fn(), send: vi.fn() }))
vi.mock("@/lib/db", () => ({ isDatabaseConfigured: mocks.configured, ensureSchema: vi.fn(), db: () => Object.assign(mocks.sql, { json: (value: unknown) => value, begin: mocks.begin }) }))
vi.mock("@/lib/email", () => ({ sendOwnerInquiryNotification: mocks.send }))
import { deliverOwnerInquiry } from "@/lib/owner-inquiries"

type StoredInquiry = { id: string; fingerprint: string; reference: string; delivery_status: string }
let records: Map<string, StoredInquiry>
let input: ReturnType<typeof ownerInquirySchema.parse>

beforeEach(() => {
  vi.clearAllMocks()
  records = new Map()
  input = ownerInquirySchema.parse({ name: "Avery Stone", email: "avery@example.com", propertyAddress: "123 Example Lane, Port Angeles, WA 98362", bedrooms: 3, bathrooms: 2.5, features: ["Lakefront", "Sauna"], submissionKey: randomUUID() })
  mocks.configured.mockReturnValue(true)
  mocks.send.mockResolvedValue(true)
  mocks.sql.mockImplementation(async (_strings, ...values) => {
    const [id, key, fingerprint, reference] = values
    if (!records.has(key)) records.set(key, { id, fingerprint, reference, delivery_status: "stored" })
  })
  mocks.begin.mockImplementation(async (callback) => {
    const transaction = async (strings: TemplateStringsArray, ...values: string[]) => {
      if (strings[0].includes("select")) return [records.get(values[0])]
      const record = [...records.values()].find((item) => item.id === values[0])
      if (record) record.delivery_status = "notified"
      return []
    }
    return callback(transaction)
  })
})

describe("owner inquiry persistence and retries", () => {
  it("stores the address, room counts, and selected features and sends them to the team", async () => {
    await deliverOwnerInquiry(input)
    expect(mocks.sql.mock.calls[0][5]).toMatchObject({ propertyAddress: input.propertyAddress, bedrooms: 3, bathrooms: 2.5, features: ["Lakefront", "Sauna"] })
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ propertyAddress: input.propertyAddress, bedrooms: 3, bathrooms: 2.5, features: ["Lakefront", "Sauna"] }))
  })
  it("does not send or claim success without durable storage", async () => {
    mocks.configured.mockReturnValue(false)
    await expect(deliverOwnerInquiry(input)).rejects.toMatchObject({ status: 503 })
    expect(mocks.send).not.toHaveBeenCalled()
    expect(records.size).toBe(0)
  })

  it("retains the inquiry on mail failure and retries with the same reference", async () => {
    mocks.send.mockResolvedValueOnce(false)
    await expect(deliverOwnerInquiry(input)).rejects.toMatchObject({ status: 503 })
    const stored = records.get(input.submissionKey!)!
    expect(stored.delivery_status).toBe("stored")
    const result = await deliverOwnerInquiry(input)
    expect(result).toMatchObject({ ok: true, duplicate: false, reference: stored.reference })
    expect(stored.delivery_status).toBe("notified")
    expect(records.size).toBe(1)
  })

  it("returns the original receipt without sending a second notification", async () => {
    const first = await deliverOwnerInquiry(input)
    const second = await deliverOwnerInquiry(input)
    expect(second).toEqual({ ...first, duplicate: true })
    expect(mocks.send).toHaveBeenCalledTimes(1)
    expect(records.size).toBe(1)
  })

  it("rejects a reused submission key carrying different owner details", async () => {
    await deliverOwnerInquiry(input)
    for (const change of [{ email: "another@example.com" }, { bedrooms: 4 }, { bathrooms: 3 }, { propertyAddress: "456 Example Lane, Port Angeles, WA 98362" }, { features: ["Hot tub"] as typeof input.features }]) {
      await expect(deliverOwnerInquiry({ ...input, ...change })).rejects.toMatchObject({ status: 409 })
    }
    expect(mocks.send).toHaveBeenCalledTimes(1)
  })
})
