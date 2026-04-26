import { DiffEditor } from '@monaco-editor/react'
import { useStore } from '@/app/store'

export function XmlDiffView() {
  const leftModel = useStore(s => s.leftModel)
  const rightModel = useStore(s => s.rightModel)

  if (!leftModel || !rightModel) {
    return (
      <div className="xml-diff-empty">
        <p>Load two BPMN files to see the XML diff.</p>
      </div>
    )
  }

  return (
    <div className="xml-diff-view">
      <div className="xml-diff-labels">
        <span className="xml-diff-label">{leftModel.label}</span>
        <span className="xml-diff-label">{rightModel.label}</span>
      </div>
      <DiffEditor
        height="100%"
        language="xml"
        original={leftModel.sourceXml}
        modified={rightModel.sourceXml}
        theme="vs-dark"
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          fontSize: 12,
          lineNumbers: 'on',
          diffWordWrap: 'on',
        }}
      />
    </div>
  )
}
