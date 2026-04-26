import { useState, useMemo } from 'react'
import { useStore } from '@/app/store'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const diffSummary = useStore(s => s.diffSummary)
  const setActiveItem = useStore(s => s.setActiveItem)

  const results = useMemo(() => {
    if (!diffSummary || query.trim().length < 2) return []
    const q = query.toLowerCase()
    return diffSummary.items.filter(
      item =>
        item.elementId.toLowerCase().includes(q) ||
        item.elementName?.toLowerCase().includes(q) ||
        item.elementType.toLowerCase().includes(q),
    )
  }, [diffSummary, query])

  return (
    <div className="search-bar">
      <input
        type="search"
        className="search-bar__input"
        placeholder="Search elements by id, name or type..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label="Search diff items"
      />
      {results.length > 0 && query.trim().length >= 2 && (
        <ul className="search-bar__results" role="listbox">
          {results.slice(0, 10).map(item => (
            <li
              key={item.id}
              role="option"
              className="search-bar__result"
              onClick={() => {
                setActiveItem(item)
                setQuery('')
              }}
            >
              <span className={`search-result__badge search-result__badge--${item.changeType}`}>
                {item.changeType[0].toUpperCase()}
              </span>
              <span className="search-result__name">
                {item.elementName ?? item.elementId}
              </span>
              <span className="search-result__type">{item.elementType}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
