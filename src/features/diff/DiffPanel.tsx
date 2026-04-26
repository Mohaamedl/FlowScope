import { useMemo } from 'react'
import { useStore } from '@/app/store'
import type { DiffFilter } from '@/app/store'
import type { DiffItem } from '@/core/models'

const FILTERS: { value: DiffFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'added', label: 'Added' },
  { value: 'removed', label: 'Removed' },
  { value: 'modified', label: 'Modified' },
]

export function DiffPanel() {
  const diffSummary = useStore(s => s.diffSummary)
  const filter = useStore(s => s.filter)
  const activeItemId = useStore(s => s.activeItemId)
  const setFilter = useStore(s => s.setFilter)
  const setActiveItem = useStore(s => s.setActiveItem)
  const filteredItems = useMemo(() => {
    if (!diffSummary) return []
    if (filter === 'all') return diffSummary.items
    return diffSummary.items.filter(i => i.changeType === filter)
  }, [diffSummary, filter])

  if (!diffSummary) {
    return (
      <aside className="diff-panel diff-panel--empty">
        <p>Load two BPMN files and click <strong>Compare</strong> to see differences.</p>
      </aside>
    )
  }

  const { counts } = diffSummary

  return (
    <aside className="diff-panel">
      <header className="diff-panel__header">
        <h2>Diff Results</h2>
        <div className="diff-panel__counts">
          <span className="badge badge--added">+{counts.added}</span>
          <span className="badge badge--removed">-{counts.removed}</span>
          <span className="badge badge--modified">~{counts.modified}</span>
        </div>
      </header>

      <nav className="diff-panel__filters" aria-label="Filter diff results">
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            className={`filter-btn filter-btn--${f.value} ${filter === f.value ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </nav>

      <ul className="diff-panel__list" role="list">
        {filteredItems.length === 0 && (
          <li className="diff-panel__empty">No changes in this category.</li>
        )}
        {filteredItems.map(item => (
          <DiffItemRow
            key={item.id}
            item={item}
            isActive={item.id === activeItemId}
            onClick={() => setActiveItem(item.id === activeItemId ? null : item)}
          />
        ))}
      </ul>
    </aside>
  )
}

interface RowProps {
  item: DiffItem
  isActive: boolean
  onClick: () => void
}

function DiffItemRow({ item, isActive, onClick }: RowProps) {
  return (
    <li
      className={`diff-item diff-item--${item.changeType} ${isActive ? 'diff-item--active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <span className={`diff-item__badge diff-item__badge--${item.changeType}`}>
        {item.changeType[0].toUpperCase()}
      </span>
      <div className="diff-item__info">
        <span className="diff-item__type">{item.elementType}</span>
        {item.elementName && <span className="diff-item__name">{item.elementName}</span>}
        <span className="diff-item__id">{item.elementId}</span>
        {item.fieldPath && (
          <span className="diff-item__field">{item.fieldPath}</span>
        )}
      </div>
      <span className={`diff-item__severity diff-item__severity--${item.severity}`}>
        {item.severity}
      </span>
    </li>
  )
}
