import { useState } from 'react'
import { RefreshCw, ChevronRight, ChevronDown, Globe, Search } from 'lucide-react'
import type { SitemapEntry } from '../../shared/types'

interface SitemapViewProps {
  entries: SitemapEntry[]
  onRefresh: () => void
  onNavigate?: (path: string) => void
}

function SitemapNode({
  entry,
  depth,
  onNavigate,
}: {
  entry: SitemapEntry
  depth: number
  onNavigate?: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = entry.children.length > 0

  return (
    <div>
      <div
        className="sitemap-node__row"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onNavigate?.(entry.path)}
      >
        {hasChildren ? (
          <button
            className="sitemap-node__toggle"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="sitemap-node__spacer" />
        )}

        <Globe size={12} className="sitemap-node__icon" />

        <span className="sitemap-node__name">{entry.name}</span>

        {entry.isDynamic && (
          <span className="sitemap-node__dynamic">
            {entry.dynamicSegments.map((s) => `[${s}]`).join(', ')}
          </span>
        )}

        <span
          className={`sitemap-node__badge${
            entry.hasBeenVisited
              ? ' sitemap-node__badge--visited'
              : ' sitemap-node__badge--unvisited'
          }`}
        >
          {entry.hasBeenVisited ? 'visited' : 'unvisited'}
        </span>
      </div>

      {expanded &&
        hasChildren &&
        entry.children.map((child) => (
          <SitemapNode key={child.path} entry={child} depth={depth + 1} onNavigate={onNavigate} />
        ))}
    </div>
  )
}

export function SitemapView({ entries, onRefresh, onNavigate }: SitemapViewProps) {
  const [search, setSearch] = useState('')

  const filteredEntries = search
    ? filterEntries(entries, search.toLowerCase())
    : entries

  return (
    <div className="sitemap">
      <div className="sitemap__header">
        <div className="sitemap__search-wrap">
          <Search size={12} className="sitemap__search-icon" />
          <input
            type="text"
            className="sitemap__search-input"
            placeholder="Search routes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="sitemap__refresh-btn" onClick={onRefresh} title="Refresh sitemap">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="sitemap__list">
        {filteredEntries.length === 0 ? (
          <div className="sitemap__empty">
            <p className="sitemap__empty-text">
              {entries.length === 0
                ? 'No sitemap data. Click refresh to load.'
                : 'No matching routes'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <SitemapNode key={entry.path} entry={entry} depth={0} onNavigate={onNavigate} />
          ))
        )}
      </div>
    </div>
  )
}

function filterEntries(entries: SitemapEntry[], query: string): SitemapEntry[] {
  return entries
    .map((entry) => {
      const childMatches = filterEntries(entry.children, query)
      const nameMatches = entry.name.toLowerCase().includes(query)
      const pathMatches = entry.path.toLowerCase().includes(query)

      if (nameMatches || pathMatches || childMatches.length > 0) {
        return { ...entry, children: childMatches }
      }
      return null
    })
    .filter((e): e is SitemapEntry => e !== null)
}
