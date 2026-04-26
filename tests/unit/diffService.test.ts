import { describe, it, expect } from 'vitest'
import { computeDiff } from '@/features/diff'
import type { BpmnModel, BpmnElement } from '@/core/models'

function makeModel(
  elements: BpmnElement[],
  label = 'test',
): BpmnModel {
  return {
    elements: new Map(elements.map(e => [e.id, e])),
    sourceXml: '',
    label,
  }
}

function node(id: string, type = 'task', name?: string, attrs?: Record<string, string>): BpmnElement {
  return { id, kind: 'node', type, name, attrs: attrs ?? {} }
}

function edge(id: string, sourceRef: string, targetRef: string): BpmnElement {
  return { id, kind: 'edge', type: 'sequenceFlow', attrs: { sourceRef, targetRef }, sourceRef, targetRef }
}

describe('computeDiff', () => {
  it('detects added elements', () => {
    const left = makeModel([node('t1')])
    const right = makeModel([node('t1'), node('t2', 'task', 'New Task')])
    const diff = computeDiff(left, right)
    expect(diff.counts.added).toBe(1)
    expect(diff.items[0].changeType).toBe('added')
    expect(diff.items[0].elementId).toBe('t2')
  })

  it('detects removed elements', () => {
    const left = makeModel([node('t1'), node('t2')])
    const right = makeModel([node('t1')])
    const diff = computeDiff(left, right)
    expect(diff.counts.removed).toBe(1)
    expect(diff.items[0].elementId).toBe('t2')
  })

  it('detects name change as modified', () => {
    const left = makeModel([node('t1', 'task', 'Old Name', { id: 't1', name: 'Old Name' })])
    const right = makeModel([node('t1', 'task', 'New Name', { id: 't1', name: 'New Name' })])
    const diff = computeDiff(left, right)
    expect(diff.counts.modified).toBeGreaterThan(0)
    const mod = diff.items.find(i => i.fieldPath === 'attrs.name')
    expect(mod).toBeDefined()
    expect(mod?.before).toBe('Old Name')
    expect(mod?.after).toBe('New Name')
  })

  it('produces no diff for identical models', () => {
    const el = [node('t1'), edge('f1', 't1', 't1')]
    const diff = computeDiff(makeModel(el), makeModel(el))
    expect(diff.items).toHaveLength(0)
  })

  it('classifies sequenceFlow changes as critical', () => {
    const left = makeModel([edge('f1', 'a', 'b')])
    const right = makeModel([])
    const diff = computeDiff(left, right)
    expect(diff.items[0].severity).toBe('critical')
  })

  it('includes correct counts in summary', () => {
    const left = makeModel([node('a'), node('b')])
    const right = makeModel([node('b'), node('c')])
    const diff = computeDiff(left, right)
    expect(diff.counts.added).toBe(1)
    expect(diff.counts.removed).toBe(1)
    expect(diff.counts.modified).toBe(0)
  })
})
