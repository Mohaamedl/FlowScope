import { useCallback } from 'react'
import { parseBpmn } from '@/core/parser'
import { computeDiff } from '@/features/diff'
import { useStore } from './store'
import { FileImport } from '@/features/editor/FileImport'
import { BpmnViewer } from '@/features/editor/BpmnViewer'
import { DiffPanel } from '@/features/diff/DiffPanel'
import { SearchBar } from '@/features/search/SearchBar'

export function App() {
  const leftModel = useStore(s => s.leftModel)
  const rightModel = useStore(s => s.rightModel)
  const diffSummary = useStore(s => s.diffSummary)
  const activeItemId = useStore(s => s.activeItemId)
  const setLeftModel = useStore(s => s.setLeftModel)
  const setRightModel = useStore(s => s.setRightModel)
  const setDiffSummary = useStore(s => s.setDiffSummary)

  const handleLoad = useCallback(
    (side: 'left' | 'right') => (xml: string, filename: string) => {
      const result = parseBpmn(xml, filename)
      if (!result.ok) {
        alert(`Failed to parse ${filename}:\n${result.errors.map(e => e.message).join('\n')}`)
        return
      }
      if (side === 'left') setLeftModel(result.model)
      else setRightModel(result.model)

      // Clear previous diff result when a file changes
      setDiffSummary(null)
    },
    [setLeftModel, setRightModel, setDiffSummary],
  )

  function handleCompare() {
    if (!leftModel || !rightModel) return
    const summary = computeDiff(leftModel, rightModel)
    setDiffSummary(summary)
  }

  const leftDiffItems = diffSummary?.items ?? []
  const rightDiffItems = diffSummary?.items ?? []

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">FlowScope</h1>
        <p className="app-subtitle">BPMN Visual Diff &amp; Live Editing</p>
        <div className="app-header__actions">
          <SearchBar />
          <FileImport side="left" label="Load Baseline BPMN" onLoad={handleLoad('left')} />
          <FileImport side="right" label="Load Target BPMN" onLoad={handleLoad('right')} />
          <button
            type="button"
            className="compare-btn"
            disabled={!leftModel || !rightModel}
            onClick={handleCompare}
          >
            Compare
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="viewer-pane">
          {leftModel ? (
            <BpmnViewer
              xml={leftModel.sourceXml}
              label={leftModel.label}
              diffItems={leftDiffItems}
              activeItemId={activeItemId}
            />
          ) : (
            <EmptyState label="Baseline" side="left" />
          )}
        </section>

        <section className="viewer-pane">
          {rightModel ? (
            <BpmnViewer
              xml={rightModel.sourceXml}
              label={rightModel.label}
              diffItems={rightDiffItems}
              activeItemId={activeItemId}
            />
          ) : (
            <EmptyState label="Target" side="right" />
          )}
        </section>

        <DiffPanel />
      </main>
    </div>
  )
}

function EmptyState({ label, side }: { label: string; side: string }) {
  return (
    <div className={`empty-state empty-state--${side}`}>
      <p>No {label} loaded</p>
      <p className="empty-state__hint">Use the button above to load a BPMN file.</p>
    </div>
  )
}
