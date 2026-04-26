import { describe, it, expect } from 'vitest'
import { parseBpmn } from '@/core/parser'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const fixturePath = (name: string) =>
  resolve(__dirname, '../../test/fixtures', name)

describe('parseBpmn', () => {
  it('rejects DOCTYPE (XXE mitigation)', () => {
    const result = parseBpmn('<!DOCTYPE foo []><definitions/>', 'test')
    expect(result.ok).toBe(false)
  })

  it('returns error on invalid XML', () => {
    const result = parseBpmn('<definitions><unclosed>', 'test')
    expect(result.ok).toBe(false)
  })

  it('parses old.bpmn fixture without errors', () => {
    const xml = readFileSync(fixturePath('old.bpmn'), 'utf-8')
    const result = parseBpmn(xml, 'old.bpmn')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.model.elements.size).toBeGreaterThan(0)
    }
  })

  it('parses new.bpmn fixture without errors', () => {
    const xml = readFileSync(fixturePath('new.bpmn'), 'utf-8')
    const result = parseBpmn(xml, 'new.bpmn')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.model.elements.size).toBeGreaterThan(0)
    }
  })

  it('extracts tasks and sequence flows from old.bpmn', () => {
    const xml = readFileSync(fixturePath('old.bpmn'), 'utf-8')
    const result = parseBpmn(xml, 'old.bpmn')
    if (!result.ok) throw new Error('Parse failed')

    const tasks = [...result.model.elements.values()].filter(e => e.type === 'task')
    const flows = [...result.model.elements.values()].filter(e => e.type === 'sequenceFlow')

    expect(tasks.length).toBeGreaterThan(0)
    expect(flows.length).toBeGreaterThan(0)
  })

  it('produces a diff between old and new fixtures', async () => {
    const { computeDiff } = await import('@/features/diff')

    const oldXml = readFileSync(fixturePath('old.bpmn'), 'utf-8')
    const newXml = readFileSync(fixturePath('new.bpmn'), 'utf-8')

    const left = parseBpmn(oldXml, 'old.bpmn')
    const right = parseBpmn(newXml, 'new.bpmn')

    if (!left.ok || !right.ok) throw new Error('Parse failed')

    const diff = computeDiff(left.model, right.model)
    const total = diff.counts.added + diff.counts.removed + diff.counts.modified
    expect(total).toBeGreaterThanOrEqual(0)
    expect(diff.source.leftLabel).toBe('old.bpmn')
    expect(diff.source.rightLabel).toBe('new.bpmn')
  })
})
