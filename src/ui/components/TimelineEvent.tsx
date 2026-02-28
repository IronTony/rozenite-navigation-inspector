import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { NavigationEvent } from '../../shared/types'

const EVENT_BADGE_CLASSES: Record<string, string> = {
  push: 'timeline-event__badge--push',
  pop: 'timeline-event__badge--pop',
  replace: 'timeline-event__badge--replace',
  navigate: 'timeline-event__badge--navigate',
  'tab-switch': 'timeline-event__badge--tab-switch',
  focus: 'timeline-event__badge--focus',
  blur: 'timeline-event__badge--blur',
  reset: 'timeline-event__badge--reset',
  unknown: 'timeline-event__badge--unknown',
}

interface TimelineEventProps {
  event: NavigationEvent
}

export function TimelineEventRow({ event }: TimelineEventProps) {
  const [expanded, setExpanded] = useState(false)
  const badgeClass = EVENT_BADGE_CLASSES[event.type] || EVENT_BADGE_CLASSES.unknown
  const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })

  const hasParams = event.params && Object.keys(event.params).length > 0

  return (
    <div className="timeline-event">
      <div
        className="timeline-event__row"
        onClick={() => setExpanded(!expanded)}
      >
        {hasParams ? (
          <span className="timeline-event__expand-icon">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        ) : (
          <span className="timeline-event__expand-spacer" />
        )}

        <span className={`timeline-event__badge ${badgeClass}`}>
          {event.type.toUpperCase()}
        </span>

        <span className="timeline-event__route">
          {event.fromRoute?.name && (
            <>
              <span className="timeline-event__route-from">{event.fromRoute.name}</span>
              <span className="timeline-event__route-arrow">&rarr;</span>
            </>
          )}
          <span className="timeline-event__route-to">{event.toRoute?.name || 'N/A'}</span>
        </span>

        <span className="timeline-event__time">{time}</span>
      </div>

      {expanded && hasParams && (
        <div className="timeline-event__params">
          <pre className="timeline-event__params-pre">
            {JSON.stringify(event.params, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
