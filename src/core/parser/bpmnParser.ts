import type { BpmnElement, BpmnModel } from '@/core/models'

/** BPMN 2.0 semantic namespace URI. */
const BPMN_NS = 'http://www.omg.org/spec/BPMN/20100524/MODEL'

/** All recognised BPMN flow node local-names. */
const FLOW_NODE_TYPES = new Set([
  'startEvent', 'endEvent',
  'intermediateCatchEvent', 'intermediateThrowEvent', 'boundaryEvent',
  'task', 'userTask', 'serviceTask', 'scriptTask',
  'sendTask', 'receiveTask', 'manualTask', 'businessRuleTask',
  'callActivity', 'subProcess', 'adHocSubProcess', 'transaction',
  'parallelGateway', 'exclusiveGateway', 'inclusiveGateway',
  'eventBasedGateway', 'complexGateway',
])

/** Sequence/message flows and associations are edges. */
const FLOW_EDGE_TYPES = new Set([
  'sequenceFlow', 'messageFlow', 'association', 'dataInputAssociation',
  'dataOutputAssociation',
])

export interface ValidationError {
  message: string
  elementId?: string
  path?: string
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
 * Parse a BPMN 2.0 XML string into a BpmnModel.
 *
 * Uses the browser's DOMParser which is XXE-safe (no network/FS access).
 * Vendor extensions (Camunda/Flowable/Activiti) are preserved in the
 * `extensions` bag without causing parse failure.
 */
export function parseBpmn(
  xml: string,
  label: string,
): BpmnParseResult | BpmnParseFailure {
  // Block DOCTYPE (XXE vector) before handing to DOMParser
  if (/<!DOCTYPE/i.test(xml)) {
    return {
      ok: false,
      errors: [{ message: 'DOCTYPE declarations are not permitted.' }],
    }
  }

  const domParser = new DOMParser()
  const doc = domParser.parseFromString(xml, 'application/xml')

  // DOMParser signals XML errors via a <parsererror> root element
  const parseError = doc.querySelector('parseerror, parsererror')
  if (parseError) {
    return {
      ok: false,
      errors: [{ message: parseError.textContent ?? 'XML parse error.' }],
    }
  }

  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Locate <definitions> — supports both namespaced and non-namespaced files
  const definitions =
    doc.getElementsByTagNameNS(BPMN_NS, 'definitions')[0] ??
    doc.getElementsByTagName('definitions')[0] ??
    // Some files use a prefix mapping (e.g. semantic:definitions)
    findByLocalName(doc.documentElement, 'definitions')

  if (!definitions) {
    errors.push({ message: 'No BPMN <definitions> element found.' })
    return { ok: false, errors }
  }

  const elements = new Map<string, BpmnElement>()

  // Walk all descendant elements of all <process> elements
  const processes = [
    ...Array.from(getElementsByLocalName(definitions, 'process')),
    ...Array.from(getElementsByLocalName(definitions, 'choreography')),
    ...Array.from(getElementsByLocalName(definitions, 'collaboration')),
  ]

  if (processes.length === 0) {
    warnings.push({ message: 'No <process> element found in BPMN file.' })
  }

  for (const process of processes) {
    collectElements(process, elements, warnings)
  }

  return {
    ok: true,
    model: { elements, sourceXml: xml, label },
    warnings,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function collectElements(
  parent: Element,
  out: Map<string, BpmnElement>,
  warnings: ValidationError[],
): void {
  // Iterate direct and nested children
  const stack: Element[] = [parent]

  while (stack.length > 0) {
    const el = stack.pop()!

    for (let i = 0; i < el.children.length; i++) {
      stack.push(el.children[i])
    }

    const localName = el.localName
    const kind = FLOW_NODE_TYPES.has(localName)
      ? 'node'
      : FLOW_EDGE_TYPES.has(localName)
        ? 'edge'
        : null

    if (!kind) continue

    const id = el.getAttribute('id')
    if (!id) {
      warnings.push({ message: `<${localName}> element has no id attribute.` })
      continue
    }

    if (out.has(id)) {
      warnings.push({
        message: `Duplicate element id "${id}" — second occurrence ignored.`,
        elementId: id,
      })
      continue
    }

    const attrs: Record<string, string> = {}
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i]
      attrs[attr.localName] = attr.value
    }

    const element: BpmnElement = {
      id,
      kind,
      type: localName,
      name: el.getAttribute('name') ?? undefined,
      attrs,
    }

    if (kind === 'edge') {
      element.sourceRef = el.getAttribute('sourceRef') ?? undefined
      element.targetRef = el.getAttribute('targetRef') ?? undefined
    }

    // Collect vendor extension child elements as serialized strings
    const extensions = collectExtensions(el)
    if (Object.keys(extensions).length > 0) {
      element.extensions = extensions
    }

    out.set(id, element)
  }
}

function collectExtensions(el: Element): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i]
    // extensionElements wrapper — descend into it
    if (child.localName === 'extensionElements') {
      for (let j = 0; j < child.children.length; j++) {
        const ext = child.children[j]
        const key = ext.prefix ? `${ext.prefix}:${ext.localName}` : ext.localName
        result[key] = ext.textContent ?? ext.outerHTML
      }
    }
  }
  return result
}

function getElementsByLocalName(parent: Element, localName: string): Element[] {
  const results: Element[] = []
  const stack: Element[] = [parent]
  while (stack.length > 0) {
    const el = stack.pop()!
    if (el.localName === localName) results.push(el)
    for (let i = 0; i < el.children.length; i++) {
      stack.push(el.children[i])
    }
  }
  return results
}

function findByLocalName(root: Element, localName: string): Element | null {
  if (root.localName === localName) return root
  for (let i = 0; i < root.children.length; i++) {
    const found = findByLocalName(root.children[i], localName)
    if (found) return found
  }
  return null
}
