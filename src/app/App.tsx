import { parseBpmn } from '@/core/parser'
import { computeDiff } from '@/features/diff'
import { DiffPanel } from '@/features/diff/DiffPanel'
import { XmlDiffView } from '@/features/diff/XmlDiffView'
import { BpmnModeler, type BpmnModelerHandle } from '@/features/editor/BpmnModeler'
import { BpmnViewer } from '@/features/editor/BpmnViewer'
import { FileImport } from '@/features/editor/FileImport'
import { XmlEditor } from '@/features/editor/XmlEditor'
import { SearchBar } from '@/features/search/SearchBar'
import { fetchGitHubBpmnAtRef, type GitCommitMetadata } from '@/features/git/githubService'
import { FlowScopeBrand } from '@/shared/ui/FlowScopeBrand'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from './store'

export function App() {
  const leftModel    = useStore(s => s.leftModel)
  const rightModel   = useStore(s => s.rightModel)
  const diffSummary  = useStore(s => s.diffSummary)
  const activeItemId = useStore(s => s.activeItemId)
  const viewMode     = useStore(s => s.viewMode)

  const setLeftModel   = useStore(s => s.setLeftModel)
  const setRightModel  = useStore(s => s.setRightModel)
  const setDiffSummary = useStore(s => s.setDiffSummary)
  const setViewMode    = useStore(s => s.setViewMode)

  const modelerRef = useRef<BpmnModelerHandle>(null)

  // XML panel open/closed state (per side)
  const [leftXmlOpen,  setLeftXmlOpen]  = useState(false)
  const [rightXmlOpen, setRightXmlOpen] = useState(false)

  // Collapsible panels state
  const [diffPanelOpen,        setDiffPanelOpen]        = useState(true)
  const [propertiesPanelOpen,  setPropertiesPanelOpen]  = useState(true)

  // Left/right visualization split state
  const [leftPaneWidthPct, setLeftPaneWidthPct] = useState(50)
  const visualWorkspaceRef = useRef<HTMLDivElement>(null)
  const splitDraggingRef = useRef(false)

  // Tracks right side XML for the XML editor
  const [rightXml, setRightXml] = useState('')

  // Git compare state
  const [gitOwner, setGitOwner] = useState('Mohaamedl')
  const [gitRepo, setGitRepo] = useState('FlowScope')
  const [gitFilePath, setGitFilePath] = useState('test/fixtures/old.bpmn')
  const [leftRef, setLeftRef] = useState('main')
  const [rightRef, setRightRef] = useState('main')
  const [leftRefMeta, setLeftRefMeta] = useState<GitCommitMetadata | null>(null)
  const [rightRefMeta, setRightRefMeta] = useState<GitCommitMetadata | null>(null)
  const [gitError, setGitError] = useState<string | null>(null)
  const [gitBusy, setGitBusy] = useState(false)
  const [gitCompareEnabled, setGitCompareEnabled] = useState(false)

  // ── Stable refs so callbacks don't recreate when models change ───────────
  const leftModelRef  = useRef(leftModel)
  const rightLabelRef = useRef(rightModel?.label ?? 'target')
  useEffect(() => { leftModelRef.current  = leftModel  }, [leftModel])
  useEffect(() => { rightLabelRef.current = rightModel?.label ?? 'target' }, [rightModel?.label])

  // ── File load ─────────────────────────────────────────────────────────────
  const handleLoad = useCallback(
    (side: 'left' | 'right') => async (xml: string, filename: string) => {
      const result = await parseBpmn(xml, filename)
      if (!result.ok) {
        alert(`Failed to parse ${filename}:\n${result.errors.map(e => e.message).join('\n')}`)
        return
      }
      if (side === 'left') {
        setLeftModel(result.model)
      } else {
        setRightModel(result.model)
        setRightXml(xml)
      }
      setDiffSummary(null)
    },
    [setLeftModel, setRightModel, setDiffSummary],
  )

  // ── Compare (manual) ─────────────────────────────────────────────────────
  async function handleCompare() {
    const leftM = leftModelRef.current
    if (!leftM || !rightModel) return
    setDiffSummary(computeDiff(leftM, rightModel))
  }

  // ── Modeler change → re-parse + auto diff ────────────────────────────────
  // useCallback with STABLE deps only (setters never change).
  // leftModel / rightLabel are read via refs — no deps needed.
  const handleModelerChange = useCallback(async (updatedXml: string) => {
    setRightXml(updatedXml)

    const leftM = leftModelRef.current
    if (!leftM) return

    const reparsed = await parseBpmn(updatedXml, rightLabelRef.current)
    if (!reparsed.ok) return

    setRightModel(reparsed.model)
    setDiffSummary(computeDiff(leftM, reparsed.model))
  }, [setRightModel, setDiffSummary]) // ← stable setters only

  // ── XML editor → diagram sync ─────────────────────────────────────────────
  // Same pattern: read models via refs, stable callback identity.
  const handleXmlEditorChange = useCallback(async (xml: string) => {
    const leftM = leftModelRef.current
    const reparsed = await parseBpmn(xml, rightLabelRef.current)
    if (!reparsed.ok) return

    setRightXml(xml)
    setRightModel(reparsed.model)
    if (leftM) setDiffSummary(computeDiff(leftM, reparsed.model))
  }, [setRightModel, setDiffSummary])

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  function handleUndo() { modelerRef.current?.undo() }
  function handleRedo() { modelerRef.current?.redo() }

  // ── Export BPMN ───────────────────────────────────────────────────────────
  async function handleExportBpmn() {
    const xml = (await modelerRef.current?.getXml()) ?? rightModel?.sourceXml
    if (!xml) return
    download(xml, (rightModel?.label ?? 'diagram') + '.bpmn', 'application/xml')
  }

  // ── Export diff JSON ──────────────────────────────────────────────────────
  function handleExportDiff() {
    if (!diffSummary) return
    download(JSON.stringify(diffSummary, null, 2), 'diff.json', 'application/json')
  }

  // ── Drag and drop ──────────────────────────────────────────────────────────
  const [dragActive, setDragActive] = useState(false)
  const [dragTarget, setDragTarget] = useState<'left' | 'right' | null>(null)

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
      // Determine which side based on cursor position
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
      const midpoint = rect.left + rect.width / 3
      setDragTarget(e.clientX < midpoint ? 'left' : 'right')
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.currentTarget === e.target) {
      setDragActive(false)
      setDragTarget(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setDragTarget(null)

    if (!e.dataTransfer.files) return

    const files = Array.from(e.dataTransfer.files)
    const bpmnFile = files.find(f => f.name.endsWith('.bpmn') || f.type.includes('xml'))

    if (!bpmnFile) return

    const xml = await bpmnFile.text()
    const side = dragTarget || 'right'
    await handleLoad(side)(xml, bpmnFile.name)
  }

  const loadModelFromGitRef = useCallback(async (side: 'left' | 'right', ref: string) => {
    setGitError(null)
    const result = await fetchGitHubBpmnAtRef({
      owner: gitOwner,
      repo: gitRepo,
      ref,
      filePath: gitFilePath,
    })

    if (!result.ok) {
      setGitError(result.error)
      return null
    }

    const label = `${gitOwner}/${gitRepo}@${ref}:${gitFilePath}`
    const parsed = await parseBpmn(result.xml, label)
    if (!parsed.ok) {
      setGitError(parsed.errors.map(e => e.message).join(' | '))
      return null
    }

    if (side === 'left') {
      setLeftModel(parsed.model)
      setLeftRefMeta(result.metadata)
    } else {
      setRightModel(parsed.model)
      setRightXml(result.xml)
      setRightRefMeta(result.metadata)
    }

    return parsed.model
  }, [gitOwner, gitRepo, gitFilePath, setLeftModel, setRightModel])

  const handleLoadLeftRef = useCallback(async () => {
    if (!leftRef.trim()) return
    setGitBusy(true)
    try {
      await loadModelFromGitRef('left', leftRef.trim())
      setDiffSummary(null)
    } finally {
      setGitBusy(false)
    }
  }, [leftRef, loadModelFromGitRef, setDiffSummary])

  const handleLoadRightRef = useCallback(async () => {
    if (!rightRef.trim()) return
    setGitBusy(true)
    try {
      await loadModelFromGitRef('right', rightRef.trim())
      setDiffSummary(null)
    } finally {
      setGitBusy(false)
    }
  }, [rightRef, loadModelFromGitRef, setDiffSummary])

  const handleCompareRefs = useCallback(async () => {
    if (!leftRef.trim() || !rightRef.trim()) return
    setGitBusy(true)
    try {
      const left = await loadModelFromGitRef('left', leftRef.trim())
      const right = await loadModelFromGitRef('right', rightRef.trim())
      if (left && right) setDiffSummary(computeDiff(left, right))
    } finally {
      setGitBusy(false)
    }
  }, [leftRef, rightRef, loadModelFromGitRef, setDiffSummary])

  const handleCompareLeftRefWithWorkingTree = useCallback(async () => {
    if (!leftRef.trim()) return
    const workingTreeModel = rightModel
    if (!workingTreeModel) {
      setGitError('Load or edit a target model first to compare against working tree state.')
      return
    }

    setGitBusy(true)
    try {
      const left = await loadModelFromGitRef('left', leftRef.trim())
      if (left) setDiffSummary(computeDiff(left, workingTreeModel))
    } finally {
      setGitBusy(false)
    }
  }, [leftRef, loadModelFromGitRef, rightModel, setDiffSummary])

  const updateSplitFromClientX = useCallback((clientX: number) => {
    const workspace = visualWorkspaceRef.current
    if (!workspace) return

    const rect = workspace.getBoundingClientRect()
    if (rect.width <= 0) return

    const nextPct = ((clientX - rect.left) / rect.width) * 100
    setLeftPaneWidthPct(Math.min(80, Math.max(20, nextPct)))
  }, [])

  const handleSplitPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    splitDraggingRef.current = true
    updateSplitFromClientX(e.clientX)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!splitDraggingRef.current) return
      updateSplitFromClientX(moveEvent.clientX)
    }

    const handlePointerUp = () => {
      splitDraggingRef.current = false
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }, [updateSplitFromClientX])

  useEffect(() => {
    visualWorkspaceRef.current?.style.setProperty('--visual-left-width', `${leftPaneWidthPct}%`)
  }, [leftPaneWidthPct])

  const diffItems = diffSummary?.items ?? []

  return (
    <div className="app">
      <header className="app-header">
        <FlowScopeBrand compact showTagline={false} />

        <div className="app-header__actions">
          <SearchBar />

          <div className="view-toggle">
            <button
              type="button"
              className={`view-btn ${viewMode === 'visual' ? 'view-btn--active' : ''}`}
              onClick={() => setViewMode('visual')}
            >Visual</button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'xml-diff' ? 'view-btn--active' : ''}`}
              onClick={() => setViewMode('xml-diff')}
            >XML Diff</button>
          </div>

          <FileImport side="left"  label="Load Baseline" onLoad={handleLoad('left')}  />
          <FileImport side="right" label="Load Target"   onLoad={handleLoad('right')} />

          <button
            type="button"
            className="compare-btn"
            disabled={!leftModel || !rightModel}
            onClick={handleCompare}
          >Compare</button>

          {rightModel && (
            <>
              <button type="button" onClick={handleUndo} title="Undo (Ctrl+Z)" className="icon-btn">↩</button>
              <button type="button" onClick={handleRedo} title="Redo (Ctrl+Y)" className="icon-btn">↪</button>
              <button type="button" onClick={handleExportBpmn} className="export-btn">Export BPMN</button>
            </>
          )}
          {diffSummary && (
            <button type="button" onClick={handleExportDiff} className="export-btn">Export Diff</button>
          )}
        </div>
      </header>

      <section className="git-compare-shell" aria-label="Git comparison controls">
        <button
          type="button"
          className="git-toggle"
          onClick={() => setGitCompareEnabled(enabled => !enabled)}
        >
          <span className="git-toggle__label">Git Compare</span>
          <span className="git-toggle__state">{gitCompareEnabled ? 'On' : 'Off'}</span>
        </button>

        {gitCompareEnabled && (
          <div className="git-compare-bar">
            <div className="git-compare-grid">
              <input
                className="git-input"
                value={gitOwner}
                onChange={(e) => setGitOwner(e.target.value)}
                placeholder="owner"
                aria-label="Git owner"
              />
              <input
                className="git-input"
                value={gitRepo}
                onChange={(e) => setGitRepo(e.target.value)}
                placeholder="repo"
                aria-label="Git repository"
              />
              <input
                className="git-input git-input--path"
                value={gitFilePath}
                onChange={(e) => setGitFilePath(e.target.value)}
                placeholder="path/to/file.bpmn"
                aria-label="BPMN file path in repository"
              />
              <input
                className="git-input"
                value={leftRef}
                onChange={(e) => setLeftRef(e.target.value)}
                placeholder="left ref"
                aria-label="Left git ref"
              />
              <input
                className="git-input"
                value={rightRef}
                onChange={(e) => setRightRef(e.target.value)}
                placeholder="right ref"
                aria-label="Right git ref"
              />
              <button type="button" className="git-btn" onClick={handleLoadLeftRef} disabled={gitBusy}>Load Left Ref</button>
              <button type="button" className="git-btn" onClick={handleLoadRightRef} disabled={gitBusy}>Load Right Ref</button>
              <button type="button" className="git-btn git-btn--primary" onClick={handleCompareRefs} disabled={gitBusy}>Compare Refs</button>
              <button type="button" className="git-btn" onClick={handleCompareLeftRefWithWorkingTree} disabled={gitBusy}>Left Ref vs Working Tree</button>
            </div>
            {(leftRefMeta || rightRefMeta || gitError) && (
              <div className="git-compare-meta">
                {leftRefMeta && (
                  <span className="git-meta-item">
                    Left: {leftRefMeta.sha} by {leftRefMeta.author} - {leftRefMeta.message}
                  </span>
                )}
                {rightRefMeta && (
                  <span className="git-meta-item">
                    Right: {rightRefMeta.sha} by {rightRefMeta.author} - {rightRefMeta.message}
                  </span>
                )}
                {gitError && <span className="git-meta-item git-meta-item--error">{gitError}</span>}
              </div>
            )}
          </div>
        )}
      </section>

      <main 
        className={`app-main ${dragActive ? 'app-main--drag-active' : ''} ${dragTarget ? `app-main--drop-zone-${dragTarget}` : ''} ${diffPanelOpen ? '' : 'app-main--diff-collapsed'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {viewMode === 'xml-diff' ? (
          <div className="xml-diff-pane">
            <XmlDiffView />
          </div>
        ) : (
          <div ref={visualWorkspaceRef} className="visual-workspace">
            {/* ── Left: read-only baseline ── */}
            <div className="viewer-pane viewer-pane--split viewer-pane--baseline">
              {leftModel ? (
                <>
                  <BpmnViewer
                    xml={leftModel.sourceXml}
                    label={leftModel.label}
                    diffItems={diffItems}
                    activeItemId={activeItemId}
                    showControls
                  />
                  <XmlDrawer
                    open={leftXmlOpen}
                    onToggle={() => setLeftXmlOpen(o => !o)}
                    label="Baseline XML"
                  >
                    <XmlEditor xml={leftModel.sourceXml} label="" readOnly />
                  </XmlDrawer>
                </>
              ) : (
                <EmptyState 
                  label="Baseline" 
                  side="left"
                  onLoad={handleLoad('left')}
                />
              )}
            </div>

            <div
              className="visual-splitter"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize diagram panes"
              tabIndex={0}
              onPointerDown={handleSplitPointerDown}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') setLeftPaneWidthPct(p => Math.max(20, p - 5))
                if (e.key === 'ArrowRight') setLeftPaneWidthPct(p => Math.min(80, p + 5))
              }}
            >
              <span className="visual-splitter__handle" />
            </div>

            {/* ── Right: editable target ── */}
            <div className="viewer-pane viewer-pane--split">
              {rightModel ? (
                <>
                  <BpmnModeler
                    ref={modelerRef}
                    xml={rightModel.sourceXml}
                    label={rightModel.label}
                    diffItems={diffItems}
                    activeItemId={activeItemId}
                    onChange={handleModelerChange}
                    propertiesPanelOpen={propertiesPanelOpen}
                    onTogglePropertiesPanel={() => setPropertiesPanelOpen(o => !o)}
                  />
                  <XmlDrawer
                    open={rightXmlOpen}
                    onToggle={() => setRightXmlOpen(o => !o)}
                    label="Target XML"
                  >
                    <XmlEditor
                      xml={rightXml || rightModel.sourceXml}
                      label=""
                      onValidChange={handleXmlEditorChange}
                    />
                  </XmlDrawer>
                </>
              ) : (
                <EmptyState 
                  label="Target" 
                  side="right"
                  onLoad={handleLoad('right')}
                />
              )}
            </div>
          </div>
        )}

        <DiffPanel 
          open={diffPanelOpen} 
          onToggle={() => setDiffPanelOpen(o => !o)} 
        />
      </main>

      <footer className="app-footer" aria-label="FlowScope highlights">
        <div className="app-footer__brand">
          <FlowScopeBrand showTagline={false} />
          <span className="app-footer__tagline">Visual diff and version control for BPMN workflows.</span>
        </div>
        <div className="app-footer__highlights">
          <span>Visual Diff</span>
          <span>Code Aware</span>
          <span>Git Integrated</span>
          <span>Collaborate</span>
        </div>
      </footer>
    </div>
  )
}

// ── Collapsable XML drawer ────────────────────────────────────────────────────
interface DrawerProps {
  open: boolean
  onToggle: () => void
  label: string
  children: React.ReactNode
}

function XmlDrawer({ open, onToggle, label, children }: DrawerProps) {
  return (
    <div className={`xml-drawer ${open ? 'xml-drawer--open' : ''}`}>
      <button type="button" className="xml-drawer__toggle" onClick={onToggle}>
        <span className="xml-drawer__chevron">{open ? '▾' : '▸'}</span>
        {label}
      </button>
      {open && <div className="xml-drawer__body">{children}</div>}
    </div>
  )
}

function EmptyState({ 
  label, 
  side, 
  onLoad 
}: { 
  label: string
  side: string
  onLoad: (xml: string, filename: string) => Promise<void>
}) {
  return (
    <div className={`empty-state empty-state--${side}`}>
      <p>No {label} loaded</p>
      <div className="empty-state__actions">
        <FileImport 
          side={side as 'left' | 'right'}
          label={`Load ${label}`}
          onLoad={onLoad}
        />
      </div>
      <p className="empty-state__hint">Drag & drop .bpmn files here</p>
    </div>
  )
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
