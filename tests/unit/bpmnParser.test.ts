import { describe, it, expect } from 'vitest'
import { parseBpmn } from '@/core/parser'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const fixturePath = (name: string) =>
  resolve(__dirname, '../../test/fixtures', name)

describe('parseBpmn', () => {
  it('rejects DOCTYPE (XXE mitigation)', async () => {
    const result = await parseBpmn('<!DOCTYPE foo []><definitions/>', 'test')
    expect(result.ok).toBe(false)
  })

  it('returns error on completely invalid XML', async () => {
    const result = await parseBpmn('not xml at all %%%', 'test')
    expect(result.ok).toBe(false)
  })

  it('parses old.bpmn fixture without errors', async () => {
    const xml = readFileSync(fixturePath('old.bpmn'), 'utf-8')
    const result = await parseBpmn(xml, 'old.bpmn')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.model.definitions).toBeDefined()
      expect(result.model.sourceXml).toBe(xml)
      expect(result.model.label).toBe('old.bpmn')
    }
  })

  it('parses new.bpmn fixture without errors', async () => {
    const xml = readFileSync(fixturePath('new.bpmn'), 'utf-8')
    const result = await parseBpmn(xml, 'new.bpmn')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.model.definitions).toBeDefined()
    }
  })

  it('definitions root has rootElements', async () => {
    const xml = readFileSync(fixturePath('old.bpmn'), 'utf-8')
    const result = await parseBpmn(xml, 'old.bpmn')
    if (!result.ok) throw new Error('Parse failed')
    // moddle definitions always has rootElements array
    expect(Array.isArray(result.model.definitions.rootElements)).toBe(true)
  })
})
