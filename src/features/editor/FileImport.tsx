import { useRef } from 'react'

interface Props {
  side: 'left' | 'right'
  label?: string
  onLoad: (xml: string, filename: string) => void
}

export function FileImport({ side, label, onLoad }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === 'string') {
        onLoad(text, file.name)
      }
    }
    reader.readAsText(file)

    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className={`file-import file-import--${side}`}>
      <button
        type="button"
        className="file-import__btn"
        onClick={() => inputRef.current?.click()}
      >
        {label ?? `Load ${side} BPMN`}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".bpmn,.xml"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}
