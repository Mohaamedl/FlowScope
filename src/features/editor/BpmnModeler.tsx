import type { DiffItem } from '@/core/models'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

import {
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    CamundaPlatformPropertiesProviderModule,
} from 'bpmn-js-properties-panel'
import BpmnModelerJS from 'bpmn-js/lib/Modeler'
import CamundaBehaviors from 'camunda-bpmn-js-behaviors/lib/camunda-platform'
import CamundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json'

import '@bpmn-io/properties-panel/assets/properties-panel.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/diagram-js.css'

export interface BpmnModelerHandle {
  getXml: () => Promise<string | null>
  undo: () => void
  redo: () => void
}

interface Props {
  xml: string
  label: string
  diffItems?: DiffItem[]
  activeItemId?: string | null
  onChange?: (xml: string) => void
  propertiesPanelOpen?: boolean
  onTogglePropertiesPanel?: () => void
}

export const BpmnModeler = forwardRef<BpmnModelerHandle, Props>(
  function BpmnModeler({ xml, label, diffItems = [], activeItemId, onChange, propertiesPanelOpen = true, onTogglePropertiesPanel }, ref) {
    const containerRef    = useRef<HTMLDivElement>(null)
    const propertiesRef   = useRef<HTMLDivElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelerRef      = useRef<any>(null)
    const onChangeRef     = useRef(onChange)
    const fromModelerRef  = useRef(false)

    useEffect(() => { onChangeRef.current = onChange })

    // ── Imperative handle ────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      async getXml() {
        if (!modelerRef.current) return null
        try {
          const { xml: out } = await modelerRef.current.saveXML({ format: true })
          return out ?? null
        } catch { return null }
      },
      undo() { modelerRef.current?.get('commandStack')?.undo() },
      redo() { modelerRef.current?.get('commandStack')?.redo() },
    }), [])

    // ── Mount modeler once ───────────────────────────────────────────────────
    useEffect(() => {
      if (!containerRef.current || !propertiesRef.current) return

      const modeler = new BpmnModelerJS({
        container: containerRef.current,
        propertiesPanel: {
          parent: propertiesRef.current,
        },
        additionalModules: [
          BpmnPropertiesPanelModule,
          BpmnPropertiesProviderModule,
          CamundaPlatformPropertiesProviderModule,
          CamundaBehaviors,
        ],
        moddleExtensions: {
          camunda: CamundaModdleDescriptor,
        },
      })

      modelerRef.current = modeler

      modeler.on('commandStack.changed', async () => {
        try {
          const { xml: updated } = await modeler.saveXML({ format: true })
          if (updated) {
            fromModelerRef.current = true
            onChangeRef.current?.(updated)
          }
        } catch { /* ignore */ }
      })

      return () => {
        modeler.destroy()
        modelerRef.current = null
      }
    }, []) // mount once only

    // ── Import xml prop when it comes from outside ───────────────────────────
    useEffect(() => {
      if (!xml) return
      if (fromModelerRef.current) {
        fromModelerRef.current = false
        return
      }
      const modeler = modelerRef.current
      if (!modeler) return
      modeler.importXML(xml)
        .then(() => modeler.get('canvas').zoom('fit-viewport'))
        .catch(console.error)
    }, [xml])

    // ── Diff overlays ────────────────────────────────────────────────────────
    useEffect(() => {
      const modeler = modelerRef.current
      if (!modeler) return
      try {
        const canvas   = modeler.get('canvas')
        const overlays = modeler.get('overlays')
        const registry = modeler.get('elementRegistry')

        overlays.clear()
        registry.forEach((el: { id: string }) => {
          canvas.removeMarker(el.id, 'diff-added')
          canvas.removeMarker(el.id, 'diff-removed')
          canvas.removeMarker(el.id, 'diff-modified')
          canvas.removeMarker(el.id, 'diff-layout')
        })

        for (const item of diffItems) {
          try {
            canvas.addMarker(item.elementId, `diff-${item.changeType}`)
            overlays.add(item.elementId, {
              position: { top: -14, left: 0 },
              html: `<span class="diff-badge diff-badge--${item.changeType}">${item.changeType}</span>`,
            })
          } catch { /* element not in this diagram */ }
        }

        if (activeItemId) {
          const active = diffItems.find(i => i.id === activeItemId)
          if (active) {
            try { canvas.scrollToElement(active.elementId) } catch { /* not in diagram */ }
          }
        }
      } catch { /* modeler not ready */ }
    }, [diffItems, activeItemId])

    return (
      <div className="bpmn-modeler-root">
        <div className="bpmn-viewer-label bpmn-viewer-label--editable">
          {label} <span className="editable-badge">editable</span>
        </div>
        <div className={`bpmn-modeler-workspace ${propertiesPanelOpen ? '' : 'bpmn-modeler-workspace--panel-collapsed'}`}>
          <div ref={containerRef} className="bpmn-modeler-canvas" />
          <button 
            type="button" 
            className={`bpmn-properties-panel__toggle ${propertiesPanelOpen ? '' : 'bpmn-properties-panel__toggle--collapsed'}`}
            onClick={onTogglePropertiesPanel}
            title={propertiesPanelOpen ? "Collapse properties panel" : "Expand properties panel"}
          >
            <span className="bpmn-properties-panel__chevron">{propertiesPanelOpen ? '▸' : '◂'}</span>
          </button>
          <div 
            ref={propertiesRef} 
            className={`bpmn-properties-panel ${propertiesPanelOpen ? '' : 'bpmn-properties-panel--hidden'}`}
          />
        </div>
      </div>
    )
  }
)
