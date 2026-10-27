import { describe, expect, it } from "vitest"
import { limitStayRequests, readStayBody, stayErrorResponse, validatePublicStay } from "@/lib/public-stay-request"
const now = new Date('2026-10-27T06:30:00Z') // Still October 26 in Washington.
describe('public stay request constraints', () => {
  it('validates real dates in Pacific time and bounds request cost', () => {
    expect(validatePublicStay({checkIn:'2026-10-26',checkOut:'2026-10-29',guests:2},now).checkIn).toBe('2026-10-26')
    for (const bad of [
      {checkIn:'2027-02-29',checkOut:'2027-03-02',guests:2},
      {checkIn:'2026-10-25',checkOut:'2026-10-27',guests:2},
      {checkIn:'2026-10-28',checkOut:'2027-10-29',guests:2},
      {checkIn:'2030-10-28',checkOut:'2030-10-29',guests:2},
      {checkIn:'2026-10-28',checkOut:'2026-10-28',guests:2},
      {checkIn:'2026-10-28',checkOut:'2026-10-29',guests:2.5},
    ]) expect(()=>validatePublicStay(bad,now)).toThrow()
  })
  it('enforces a bounded request window with retry guidance', async () => {
    const request = new Request('https://example.com/agent/quote',{headers:{'x-forwarded-for':'rate-limit-test'}})
    for(let i=0;i<20;i++) limitStayRequests(request,1000)
    try { limitStayRequests(request,1000); throw new Error('expected limit') } catch(error) {
      const response = stayErrorResponse(error)
      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
    }
    expect(()=>limitStayRequests(request,61001)).not.toThrow()
  })
  it('limits actual body bytes without trusting content-length', async () => {
    const request = new Request('https://example.com/api/search',{method:'POST',body:JSON.stringify({padding:'x'.repeat(5000)})})
    await expect(readStayBody(request)).rejects.toMatchObject({status:413})
  })
  it('does not disclose unexpected upstream errors', async () => {
    const response = stayErrorResponse(new Error('API secret or guest record'))
    expect(response.status).toBe(503)
    expect(await response.text()).not.toMatch(/secret|guest record/)
  })
})
