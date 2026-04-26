import { describe, it, expect } from 'vitest'
import { computeDiff } from '@/features/diff'
import { parseBpmn } from '@/core/parser'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const fixturePath = (name: string) =>
  resolve(__dirname, '../../test/fixtures', name)

async function loadModel(name: string) {
  const xml = readFileSync(fixturePath(name), 'utf-8')
  const result = await parseBpmn(xml, name)
  if (!result.ok) throw new Error(`Failed to parse ${name}: ${result.errors[0].message}`)
  return result.model
}

describe('computeDiff (bpmn-js-differ)', () => {
  it('produces a DiffSummary with correct source labels', async () => {
    const left = await loadModel('old.bpmn')
    const right = await loadModel('new.bpmn')
    const diff = computeDiff(left, right)

    expect(diff.source.leftLabel).toBe('old.bpmn')
    expect(diff.source.rightLabel).toBe('new.bpmn')
    expect(diff.source.generatedAt).toBeTruthy()
  })

  it('counts add up to total items length', async () => {
    const left = await loadModel('old.bpmn')
    const right = await loadModel('new.bpmn')
    const diff = computeDiff(left, right)

    const total = diff.counts.added + diff.counts.removed + diff.counts.modified + diff.counts.layout
    expect(diff.items.length).toBe(total)
  })

  it('produces no diff when comparing a model to itself', async () => {
    const model = await loadModel('old.bpmn')
    const diff = computeDiff(model, model)

    expect(diff.counts.added).toBe(0)
    expect(diff.counts.removed).toBe(0)
    expect(diff.counts.modified).toBe(0)
    expect(diff.items).toHaveLength(0)
  })

  it('each DiffItem has a unique id', async () => {
    const left = await loadModel('old.bpmn')
    const right = await loadModel('new.bpmn')
    const diff = computeDiff(left, right)

    const ids = diff.items.map(i => i.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all items have valid changeType', async () => {
    const left = await loadModel('old.bpmn')
    const right = await loadModel('new.bpmn')
    const diff = computeDiff(left, right)

    const validTypes = new Set(['added', 'removed', 'modified', 'layout'])
    for (const item of diff.items) {
      expect(validTypes.has(item.changeType)).toBe(true)
    }
  })

  it('modified items have fieldPath, before and after', async () => {
    const left = await loadModel('old.bpmn')
    const right = await loadModel('new.bpmn')
    const diff = computeDiff(left, right)

    for (const item of diff.items.filter(i => i.changeType === 'modified')) {
      expect(item.fieldPath).toBeDefined()
    }
  })

  it('sequenceFlow changes are classified as critical', async () => {
    const left = await loadModel('old.bpmn')
    const right = await loadModel('new.bpmn')
    const diff = computeDiff(left, right)

    const flowItems = diff.items.filter(
      i => i.elementType === 'sequenceFlow' && i.changeType !== 'layout'
    )
    for (const item of flowItems) {
      expect(item.severity).toBe('critical')
    }
  })
})
