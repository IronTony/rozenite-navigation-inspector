import { useState, useRef, useEffect, useMemo } from 'react'
import { Play } from 'lucide-react'

interface NavigationConsoleProps {
  routes: string[]
  onNavigate: (path: string, params?: Record<string, unknown>, action?: string) => void
}

function HighlightedRoute({ route, query }: { route: string; query: string }) {
  if (!query) return <>{route}</>

  const lowerRoute = route.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const matchIndex = lowerRoute.indexOf(lowerQuery)

  if (matchIndex === -1) return <>{route}</>

  const before = route.slice(0, matchIndex)
  const match = route.slice(matchIndex, matchIndex + query.length)
  const after = route.slice(matchIndex + query.length)

  return (
    <>
      {before}
      <span className="highlight-match">{match}</span>
      {after}
    </>
  )
}

export function NavigationConsole({ routes, onNavigate }: NavigationConsoleProps) {
  const [path, setPath] = useState('')
  const [paramsText, setParamsText] = useState('')
  const [action, setAction] = useState<'navigate' | 'push' | 'replace'>('navigate')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    if (path.length > 0) {
      return routes.filter((r) => r.toLowerCase().includes(path.toLowerCase()))
    }
    return routes
  }, [path, routes])

  useEffect(() => {
    setSelectedIndex(-1)
  }, [suggestions])

  const handleSubmit = () => {
    if (!path.trim()) return

    let params: Record<string, unknown> | undefined
    if (paramsText.trim()) {
      try {
        params = JSON.parse(paramsText)
      } catch {
        return
      }
    }

    onNavigate(path, params, action)
    setPath('')
    setParamsText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        return
      }
      if (e.key === 'Enter' && !e.shiftKey && selectedIndex >= 0) {
        e.preventDefault()
        setPath(suggestions[selectedIndex])
        setShowSuggestions(false)
        setSelectedIndex(-1)
        return
      }
      if (e.key === 'Tab' && selectedIndex >= 0) {
        e.preventDefault()
        setPath(suggestions[selectedIndex])
        setShowSuggestions(false)
        setSelectedIndex(-1)
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="nav-console">
      <div className="nav-console__header">
        <span className="nav-console__header-text">Navigation Console</span>
      </div>

      <div className="nav-console__form-wrap">
        <div className="nav-console__form">
          <select
            className="nav-console__select"
            value={action}
            onChange={(e) => setAction(e.target.value as typeof action)}
          >
            <option value="navigate">navigate</option>
            <option value="push">push</option>
            <option value="replace">replace</option>
          </select>

          <div className="nav-console__input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="nav-console__input"
              placeholder="Route path (e.g., home/(tabs)/policies)"
              value={path}
              onChange={(e) => {
                setPath(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="nav-console__suggestions">
                {suggestions.map((route, index) => (
                  <button
                    key={route}
                    className={`nav-console__suggestion${
                      index === selectedIndex ? ' nav-console__suggestion--selected' : ''
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setPath(route)
                      setShowSuggestions(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <HighlightedRoute route={route} query={path} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="nav-console__submit"
            onClick={handleSubmit}
            disabled={!path.trim()}
          >
            <Play size={12} />
            Go
          </button>
        </div>

        <div className="nav-console__params-wrap">
          <textarea
            className="nav-console__params"
            placeholder='Params JSON (optional): {"id": "123"}'
            rows={2}
            value={paramsText}
            onChange={(e) => setParamsText(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
