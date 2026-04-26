import { XMLParser } from 'fast-xml-parser'

/**
 * XXE-safe XML parser configuration.
 *
 * fast-xml-parser is a pure-JS parser with no network or file-system access,
 * so it is not vulnerable to XXE by design. These options harden it further:
 * - processEntities: false — do not expand &entities; at all.
 * - allowBooleanAttributes: false — strict attribute handling.
 * Scripts embedded in BPMN XML are never evaluated; they are stored as
 * plain strings in the parsed tree (NFR-011).
 */
export function createSecureParser(): XMLParser {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    attributesGroupName: false,
    parseAttributeValue: false,   // keep attrs as strings (no type coercion)
    processEntities: false,       // do not expand entities — XXE mitigation
    allowBooleanAttributes: false,
    preserveOrder: false,
    trimValues: true,
  })
}

export interface ParseResult {
  ok: true
  tree: Record<string, unknown>
}

export interface ParseError {
  ok: false
  message: string
}

/**
 * Parse raw XML text into a JS object tree using the secure parser.
 * Returns a typed discriminated union so callers must handle errors.
 */
export function parseXml(xml: string): ParseResult | ParseError {
  // Reject DOCTYPE declarations which are the main XXE vector in browsers
  if (/<!DOCTYPE/i.test(xml)) {
    return { ok: false, message: 'DOCTYPE declarations are not permitted.' }
  }

  try {
    const parser = createSecureParser()
    const tree = parser.parse(xml) as Record<string, unknown>
    return { ok: true, tree }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, message }
  }
}
