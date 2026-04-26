/** The kind of change detected for a BPMN element or attribute. */
export type ChangeType = 'added' | 'removed' | 'modified' | 'layout'

/**
 * Severity reflects how impactful the change is expected to be on runtime
 * behaviour: structural changes are 'critical', attribute changes 'warning',
 * metadata-only changes 'info'.
 */
export type Severity = 'info' | 'warning' | 'critical'

/** A single detected difference between two BPMN models. */
export interface DiffItem {
  /** Deterministic id used for stable UI navigation anchors. */
  id: string
  changeType: ChangeType
  elementId: string
  elementType: string
  elementName?: string
  /** Property path from bpmn-js-differ, e.g. "name", "targetRef", "eventDefinitions[0]". */
  fieldPath?: string
  before?: unknown
  after?: unknown
  severity: Severity
}

/** Aggregated diff result produced by DiffService. */
export interface DiffSummary {
  counts: {
    added: number
    removed: number
    modified: number
    layout: number
  }
  items: DiffItem[]
  source: {
    leftLabel: string
    rightLabel: string
    generatedAt: string
  }
}
