import { Differ, ChangeHandler } from 'bpmn-js-differ'
import type { BpmnModel, DiffItem, DiffSummary, Severity } from '@/core/models'

/** Structural element types are runtime-critical changes. */
const CRITICAL_LOCAL_TYPES = new Set([
  'startEvent', 'endEvent',
  'exclusiveGateway', 'parallelGateway', 'inclusiveGateway', 'eventBasedGateway',
  'sequenceFlow', 'messageFlow',
])

/** Attribute names that are critical when changed on any element type. */
const CRITICAL_ATTRS = new Set([
  'conditionExpression', 'targetRef', 'sourceRef',
  'calledElement', 'implementation', '$type',
])

/** Extract the camelCase local name from a moddle $type string like 'bpmn:ServiceTask'. */
function localType(el: unknown): string {
  if (!el || typeof el !== 'object') return 'unknown'
  const t = (el as Record<string, unknown>).$type
  if (typeof t !== 'string') return 'unknown'
  const local = t.split(':').pop() ?? t
  return local.charAt(0).toLowerCase() + local.slice(1)
}

function elementName(el: unknown): string | undefined {
  if (!el || typeof el !== 'object') return undefined
  const n = (el as Record<string, unknown>).name
  return typeof n === 'string' && n.length > 0 ? n : undefined
}

function elementId(el: unknown): string {
  if (!el || typeof el !== 'object') return 'unknown'
  const id = (el as Record<string, unknown>).id
  return typeof id === 'string' ? id : 'unknown'
}

function severityFor(type: string, fieldPath?: string): Severity {
  if (CRITICAL_LOCAL_TYPES.has(type)) return 'critical'
  if (fieldPath && CRITICAL_ATTRS.has(fieldPath)) return 'critical'
  if (fieldPath?.includes('extension') || fieldPath?.includes('Extension')) return 'warning'
  return 'info'
}

/**
 * Compute semantic + layout differences between two BPMN models using
 * bpmn-js-differ, which operates on the moddle object graph for schema-aware
 * diffing (correct reference handling, no back-reference false-positives,
 * layout change detection).
 */
export function computeDiff(left: BpmnModel, right: BpmnModel): DiffSummary {
  const handler = new ChangeHandler()
  new Differ().diff(left.definitions, right.definitions, handler)

  const items: DiffItem[] = []

  // Added
  for (const [id, el] of Object.entries(handler._added)) {
    const type = localType(el)
    items.push({
      id: `added-${id}`,
      changeType: 'added',
      elementId: id,
      elementType: type,
      elementName: elementName(el),
      severity: severityFor(type),
    })
  }

  // Removed
  for (const [id, el] of Object.entries(handler._removed)) {
    const type = localType(el)
    items.push({
      id: `removed-${id}`,
      changeType: 'removed',
      elementId: id,
      elementType: type,
      elementName: elementName(el),
      severity: severityFor(type),
    })
  }

  // Changed — one DiffItem per changed property
  for (const [id, entry] of Object.entries(handler._changed)) {
    const el = entry.model
    const type = localType(el)
    for (const [prop, change] of Object.entries(entry.attrs)) {
      items.push({
        id: `changed-${id}-${prop}`,
        changeType: 'modified',
        elementId: id,
        elementType: type,
        elementName: elementName(el),
        fieldPath: prop,
        before: change.oldValue,
        after: change.newValue,
        severity: severityFor(type, prop),
      })
    }
  }

  // Layout changed (position / size / waypoints)
  for (const [id, el] of Object.entries(handler._layoutChanged)) {
    // Skip if the element already has a semantic change entry — avoid duplicates
    if (handler._changed[id] || handler._added[id] || handler._removed[id]) continue
    const type = localType(el)
    items.push({
      id: `layout-${id}`,
      changeType: 'layout',
      elementId: id,
      elementType: type,
      elementName: elementName(el) ?? elementId(el),
      fieldPath: 'layout',
      severity: 'info',
    })
  }

  return {
    counts: {
      added:    items.filter(i => i.changeType === 'added').length,
      removed:  items.filter(i => i.changeType === 'removed').length,
      modified: items.filter(i => i.changeType === 'modified').length,
      layout:   items.filter(i => i.changeType === 'layout').length,
    },
    items,
    source: {
      leftLabel: left.label,
      rightLabel: right.label,
      generatedAt: new Date().toISOString(),
    },
  }
}
