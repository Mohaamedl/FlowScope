import { useEffect, useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface Props {
  xml: string
  label: string
  onValidChange?: (xml: string) => void
  readOnly?: boolean
}

const DEBOUNCE_MS = 600

export function XmlEditor({ xml, label, onValidChange, readOnly = false }: Props) {
  const editorRef       = useRef<editor.IStandaloneCodeEditor | null>(null)
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Always-current callback — avoids stale closure in debounce timeout
  const onValidChangeRef = useRef(onValidChange)
  // Last xml value we pushed into the editor programmatically
  const lastExternalRef = useRef<string>('')

  useEffect(() => { onValidChangeRef.current = onValidChange })

  // ── Mount: set initial value (uncontrolled — no value prop passed) ────────
  const handleMount: OnMount = (ed) => {
    editorRef.current = ed
    ed.setValue(xml)
    lastExternalRef.current = xml
  }

  // ── Sync external xml changes into the editor ─────────────────────────────
  // Only triggers when xml comes from outside (diagram change or file load),
  // not from our own debounced edits.
  useEffect(() => {
    const ed = editorRef.current
    if (!ed || xml === lastExternalRef.current) return
    lastExternalRef.current = xml
    // setValue preserves Monaco's internal undo stack for the editor itself
    ed.getModel()?.setValue(xml)
  }, [xml])

  // ── User edits → debounced propagation ───────────────────────────────────
  function handleChange(value: string | undefined) {
    if (!value || readOnly) return
    // If this matches what we just set programmatically, it's an echo — skip
    if (value === lastExternalRef.current) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (value.includes('<') && value.includes('>')) {
        // Mark as "coming from us" before propagating so the xml effect won't
        // re-push it back into the editor
        lastExternalRef.current = value
        onValidChangeRef.current?.(value)
      }
    }, DEBOUNCE_MS)
  }

  return (
    <div className="xml-editor">
      <div className="xml-editor__label">{label}</div>
      {/* Uncontrolled: no value prop — we control content via ref */}
      <Editor
        height="100%"
        language="xml"
        theme="vs-dark"
        onMount={handleMount}
        onChange={handleChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          fontSize: 12,
          lineNumbers: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  )
}
