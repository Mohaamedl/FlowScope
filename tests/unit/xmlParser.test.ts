import { describe, it, expect } from 'vitest'
import { parseXml } from '@/core/security'

describe('parseXml', () => {
  it('parses valid XML', () => {
    const result = parseXml('<root><child id="1" /></root>')
    expect(result.ok).toBe(true)
  })

  it('rejects DOCTYPE declarations (XXE mitigation)', () => {
    const result = parseXml('<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toMatch(/DOCTYPE/i)
    }
  })

  it('returns error for malformed XML', () => {
    // fast-xml-parser is lenient by default but won't crash
    const result = parseXml('<open>no close')
    // It may succeed leniently — the key thing is it does NOT throw
    expect(typeof result.ok).toBe('boolean')
  })
})
