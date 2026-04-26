import type { BpmnModel, DiffItem, DiffSummary, Severity } from '@/core/models'

/** Structural element types are treated as critical changes. */
const STRUCTURAL_TYPES = new Set([
  'startEvent', 'endEvent', 'exclusiveGateway', 'parallelGateway',
  'inclusiveGateway', 'eventBasedGateway', 'sequenceFlow',
])

/** Attributes whose change is treated as critical (runtime-impacting). */
const CRITICAL_ATTRS = new Set([
  'conditionExpression', 'eventDefinitionRef', 'sourceRef', 'targetRef',
  'calledElement', 'implementation',
])

let _idCounter = 0
function nextId(): string {
  return `diff-${++_idCounter}`
}

function severityFor(elementType: string, fieldPath?: string): Severity {
  if (STRUCTURAL_TYPES.has(elementType)) return 'critical'
  if (fieldPath && CRITICAL_ATTRS.has(fieldPath.replace(/^attrs\./, ''))) return 'critical'
  if (fieldPath?.startsWith('extensions.')) return 'warning'
  return 'info'
}

/**
 * Compute semantic differences between two BPMN models.
 *
 * Algorithm:
 * 1. Elements in right but not left → added.
 * 2. Elements in left but not right → removed.
 * 3. Elements in both → compare attrs and extensions field-by-field → modified.
 */
export function computeDiff(left: BpmnModel, right: BpmnModel): DiffSummary {
  const items: DiffItem[] = []

  // Pass 1: added (in right, not in left)
  for (const [id, rEl] of right.elements) {
    if (!left.elements.has(id)) {
      items.push({
        id: nextId(),
        changeType: 'added',
        elementId: id,
        elementType: rEl.type,
        elementName: rEl.name,
        severity: severityFor(rEl.type),
      })
    }
  }

  // Pass 2: removed (in left, not in right)
  for (const [id, lEl] of left.elements) {
    if (!right.elements.has(id)) {
      items.push({
        id: nextId(),
        changeType: 'removed',
        elementId: id,
        elementType: lEl.type,
        elementName: lEl.name,
        severity: severityFor(lEl.type),
      })
    }
  }

  // Pass 3: modified (present in both — diff attrs + extensions)
  for (const [id, lEl] of left.elements) {
    const rEl = right.elements.get(id)
    if (!rEl) continue

    // --- attribute-level diff ---
    const allAttrKeys = new Set([
      ...Object.keys(lEl.attrs),
      ...Object.keys(rEl.attrs),
    ])

    for (const key of allAttrKeys) {
      const before = lEl.attrs[key]
      const after = rEl.attrs[key]
      if (before !== after) {
        const fieldPath = `attrs.${key}`
        items.push({
          id: nextId(),
          changeType: 'modified',
          elementId: id,
          elementType: lEl.type,
          elementName: rEl.name ?? lEl.name,
          fieldPath,
          before,
          after,
          severity: severityFor(lEl.type, fieldPath),
        })
      }
    }

    // --- extension-level diff ---
    const lExt = lEl.extensions ?? {}
    const rExt = rEl.extensions ?? {}
    const allExtKeys = new Set([...Object.keys(lExt), ...Object.keys(rExt)])

    for (const key of allExtKeys) {
      const before = lExt[key]
      const after = rExt[key]
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        const fieldPath = `extensions.${key}`
        items.push({
          id: nextId(),
          changeType: 'modified',
          elementId: id,
          elementType: lEl.type,
          elementName: rEl.name ?? lEl.name,
          fieldPath,
          before,
          after,
          severity: severityFor(lEl.type, fieldPath),
        })
      }
    }
  }

  const counts = {
    added: items.filter(i => i.changeType === 'added').length,
    removed: items.filter(i => i.changeType === 'removed').length,
    modified: items.filter(i => i.changeType === 'modified').length,
  }

  return {
    counts,
    items,
    source: {
      leftLabel: left.label,
      rightLabel: right.label,
      generatedAt: new Date().toISOString(),
    },
  }
}
