import type { DiffItem } from '@/core/models'
import { useEffect, useRef } from 'react'

// bpmn-js is CommonJS — types declared in src/global.d.ts
import BpmnJS from 'bpmn-js'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/diagram-js.css'

/** Color palette matching SRS FR-010. */
const CHANGE_COLORS: Record<string, { stroke: string; fill: string }> = {
  added:    { stroke: '#22c55e', fill: '#dcfce7' },
  removed:  { stroke: '#ef4444', fill: '#fee2e2' },
  modified: { stroke: '#eab308', fill: '#fef9c3' },
}

interface Props {
  xml: string
  label: string
  diffItems?: DiffItem[]
  activeItemId?: string | null
  onReady?: () => void
  showControls?: boolean
}

export function BpmnViewer({ xml, label, diffItems = [], activeItemId, onReady, showControls = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<InstanceType<typeof BpmnJS> | null>(null)

  const zoomBy = (delta: number) => {
    const viewer = viewerRef.current
    if (!viewer) return

    const canvas = viewer.get('canvas')
    const current = canvas.zoom() as number
    const next = Math.min(4, Math.max(0.2, +(current + delta).toFixed(2)))
    canvas.zoom(next)
  }

  const fitToViewport = () => {
    viewerRef.current?.get('canvas').zoom('fit-viewport')
  }

  // Mount viewer once
  useEffect(() => {
    if (!containerRef.current) return

    viewerRef.current = new BpmnJS({ container: containerRef.current })

    return () => {
      viewerRef.current?.destroy()
      viewerRef.current = null
    }
  }, [])

  // Import XML whenever it changes
  useEffect(() => {
    if (!viewerRef.current || !xml) return

    viewerRef.current.importXML(xml).then(() => {
      viewerRef.current!.get('canvas').zoom('fit-viewport')
      onReady?.()
    }).catch(console.error)
  }, [xml, onReady])

  // Apply diff overlays whenever diffItems or activeItemId changes
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    const overlays = viewer.get('overlays')
    const canvas = viewer.get('canvas')
    overlays.clear()

    for (const item of diffItems) {
      const colors = CHANGE_COLORS[item.changeType]
      if (!colors) continue

      try {
        // Highlight element via canvas marker (bpmn-js coloring API)
        const elementRegistry = viewer.get('elementRegistry')
        const el = elementRegistry.get(item.elementId)
        if (!el) continue

        canvas.addMarker(item.elementId, `diff-${item.changeType}`)

        overlays.add(item.elementId, {
          position: { top: -12, left: 0 },
          html: `<span class="diff-badge diff-badge--${item.changeType}">${item.changeType}</span>`,
        })
      } catch {
        // Element may not exist in this side's diagram — skip silently
      }
    }

    // Scroll to active item
    if (activeItemId) {
      const activeItem = diffItems.find(i => i.id === activeItemId)
      if (activeItem) {
        try {
          viewerRef.current?.get('canvas').scrollToElement(activeItem.elementId)
        } catch {
          /* element not in this diagram */
        }
      }
    }
  }, [diffItems, activeItemId])

  return (
    <div className="bpmn-viewer-wrapper">
      <div className="bpmn-viewer-label">{label}</div>
      {showControls && (
        <div className="bpmn-viewer-controls">
          <button type="button" className="bpmn-viewer-control" onClick={() => zoomBy(0.2)} aria-label="Zoom in">+</button>
          <button type="button" className="bpmn-viewer-control" onClick={() => zoomBy(-0.2)} aria-label="Zoom out">−</button>
          <button type="button" className="bpmn-viewer-control" onClick={fitToViewport} aria-label="Fit diagram">⤢</button>
        </div>
      )}
      <div ref={containerRef} className="bpmn-viewer-canvas" />
    </div>
  )
}
