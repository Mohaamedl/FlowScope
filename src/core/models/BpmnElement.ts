/** A single node or edge parsed from a BPMN 2.0 XML document. */
export interface BpmnElement {
  id: string
  kind: 'node' | 'edge'
  type: string
  name?: string
  /** Source element id — only present when kind === 'edge' */
  sourceRef?: string
  /** Target element id — only present when kind === 'edge' */
  targetRef?: string
  attrs: Record<string, string>
  extensions?: Record<string, unknown>
}

/** The parsed representation of a BPMN 2.0 process model. */
export interface BpmnModel {
  elements: Map<string, BpmnElement>
  /** Raw XML string that was parsed to produce this model. */
  sourceXml: string
  /** Human-readable label for the source (filename, git ref, etc.). */
  label: string
}
