import type { NavigationState } from '@react-navigation/routers'
import type { NavigationEvent, NavigationEventType } from './shared/types'
import { extractFocusedRoute } from './tree-builder'

let eventCounter = 0

function generateId(): string {
  return `nav-${Date.now()}-${++eventCounter}`
}

function findDeepestChangedNavigators(
  prev: NavigationState,
  next: NavigationState
): { prevLeaf: NavigationState; nextLeaf: NavigationState } {
  let prevLeaf = prev
  let nextLeaf = next

  while (true) {
    const prevFocusedRoute = prevLeaf.routes[prevLeaf.index]
    const nextFocusedRoute = nextLeaf.routes[nextLeaf.index]

    if (!prevFocusedRoute || !nextFocusedRoute) break

    const prevChild = prevFocusedRoute.state
    const nextChild = nextFocusedRoute.state

    if (!prevChild || !nextChild) break
    if (prevChild.stale !== false || nextChild.stale !== false) break
    if (prevChild.key !== nextChild.key) break

    prevLeaf = prevChild as NavigationState
    nextLeaf = nextChild as NavigationState
  }

  return { prevLeaf, nextLeaf }
}

function classifyEvent(
  prev: NavigationState | undefined,
  next: NavigationState
): NavigationEventType {
  if (!prev) return 'navigate'

  const { prevLeaf, nextLeaf } = findDeepestChangedNavigators(prev, next)

  if (prevLeaf.type === 'tab' || nextLeaf.type === 'tab') {
    if (prevLeaf.index !== nextLeaf.index) {
      return 'tab-switch'
    }
  }

  if (nextLeaf.type === 'stack') {
    const prevRouteCount = prevLeaf.routes.length
    const nextRouteCount = nextLeaf.routes.length

    if (nextRouteCount > prevRouteCount) return 'push'
    if (nextRouteCount < prevRouteCount) return 'pop'

    const prevTopRoute = prevLeaf.routes[prevLeaf.index]
    const nextTopRoute = nextLeaf.routes[nextLeaf.index]

    if (prevTopRoute && nextTopRoute && prevTopRoute.name !== nextTopRoute.name) {
      return 'replace'
    }
  }

  if (prev.index !== next.index && prev.routes.length === next.routes.length) {
    return 'navigate'
  }

  return 'navigate'
}

export function diffStates(
  prev: NavigationState | undefined,
  next: NavigationState
): NavigationEvent {
  const prevFocused = prev ? extractFocusedRoute(prev) : null
  const nextFocused = extractFocusedRoute(next)
  const eventType = classifyEvent(prev, next)

  return {
    id: generateId(),
    type: eventType,
    timestamp: Date.now(),
    fromRoute: prevFocused,
    toRoute: nextFocused,
    params: nextFocused?.params,
  }
}
