import { useState } from 'react'
import { Trash2, Filter } from 'lucide-react'
import type { NavigationEvent, NavigationEventType } from '../../shared/types'
import { TimelineEventRow } from './TimelineEvent'

const EVENT_TYPES: NavigationEventType[] = [
  'push',
  'pop',
  'replace',
  'navigate',
  'tab-switch',
  'focus',
  'blur',
  'reset',
]

interface TimelineProps {
  events: NavigationEvent[]
  onClear: () => void
}

export function Timeline({ events, onClear }: TimelineProps) {
  const [filterTypes, setFilterTypes] = useState<Set<NavigationEventType>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const filteredEvents =
    filterTypes.size > 0 ? events.filter((e) => filterTypes.has(e.type)) : events

  const displayedEvents = [...filteredEvents].reverse()

  const toggleFilter = (type: NavigationEventType) => {
    setFilterTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  return (
    <div className="timeline">
      <div className="timeline__header">
        <div className="timeline__header-left">
          <span className="timeline__count">{filteredEvents.length} events</span>
          <button
            className={`timeline__icon-btn${showFilters ? ' timeline__icon-btn--active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters"
          >
            <Filter size={14} />
          </button>
        </div>
        <button className="timeline__icon-btn" onClick={onClear} title="Clear timeline">
          <Trash2 size={14} />
        </button>
      </div>

      {showFilters && (
        <div className="timeline__filters">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              className={`timeline__filter-btn${
                filterTypes.has(type) ? ' timeline__filter-btn--active' : ''
              }`}
              onClick={() => toggleFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <div className="timeline__list">
        {displayedEvents.length === 0 ? (
          <div className="timeline__empty">
            <p className="timeline__empty-text">No navigation events recorded</p>
          </div>
        ) : (
          displayedEvents.map((event) => <TimelineEventRow key={event.id} event={event} />)
        )}
      </div>
    </div>
  )
}
