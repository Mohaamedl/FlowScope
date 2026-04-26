import BpmnModdle from 'bpmn-moddle'
import type { BpmnModel } from '@/core/models'

export interface ValidationError {
  message: string
  elementId?: string
}

export interface BpmnParseResult {
  ok: true
  model: BpmnModel
  warnings: ValidationError[]
}

export interface BpmnParseFailure {
  ok: false
  errors: ValidationError[]
}

/**
 * Parse a BPMN 2.0 XML string into a BpmnModel using bpmn-moddle.
 *
 * bpmn-moddle uses a pure-JS SAX parser (no network/FS access), so it is
 * XXE-safe by design. We additionally block DOCTYPE declarations as a
 * defence-in-depth measure (NFR-010).
 *
 * The resulting `definitions` object is the moddle root required by
 * bpmn-js-differ for schema-aware diffing.
 */
export async function parseBpmn(
  xml: string,
  label: string,
): Promise<BpmnParseResult | BpmnParseFailure> {
  if (/<!DOCTYPE/i.test(xml)) {
    return {
      ok: false,
      errors: [{ message: 'DOCTYPE declarations are not permitted.' }],
    }
  }

  try {
    const moddle = new BpmnModdle()
    const { rootElement: definitions, warnings: rawWarnings } = await moddle.fromXML(xml)

    if (!definitions) {
      return {
        ok: false,
        errors: [{ message: 'No BPMN definitions root element found.' }],
      }
    }

    const warnings: ValidationError[] = (rawWarnings ?? []).map((w: unknown) => ({
      message: w instanceof Error ? w.message : String(w),
    }))

    return {
      ok: true,
      model: { definitions, sourceXml: xml, label },
      warnings,
    }
  } catch (err) {
    return {
      ok: false,
      errors: [{ message: err instanceof Error ? err.message : String(err) }],
    }
  }
}
