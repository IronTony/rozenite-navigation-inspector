import type { NavigationState } from '@react-navigation/routers'
import type { SitemapEntry } from './shared/types'

function stripRouteGroups(name: string): string {
  return name.replace(/\([^)]*\)\/?/g, '')
}

function extractDynamicSegments(name: string): string[] {
  const matches = name.matchAll(/\[(\w+)\]/g)
  return Array.from(matches, (m) => m[1])
}

export function buildSitemapFromState(
  state: NavigationState,
  visitedRoutes: Set<string>,
  parentPath = ''
): SitemapEntry[] {
  const entries: SitemapEntry[] = []

  for (const name of state.routeNames) {
    const route = state.routes.find((r) => r.name === name)
    const childState = route?.state
    const cleanName = stripRouteGroups(name)
    const isInternal = name.startsWith('_')
    const isTransparent = isInternal || cleanName === ''

    if (isTransparent) {
      if (childState && childState.stale === false) {
        entries.push(...buildSitemapFromState(childState as NavigationState, visitedRoutes, parentPath))
      }
      continue
    }

    const isIndex = cleanName === 'index'
    const path = isIndex
      ? (parentPath || '/')
      : (parentPath ? `${parentPath}/${cleanName}` : `/${cleanName}`)

    const isDynamic = name.includes('[')
    const dynamicSegments = extractDynamicSegments(name)

    const children =
      childState && childState.stale === false
        ? buildSitemapFromState(childState as NavigationState, visitedRoutes, path)
        : []

    entries.push({
      path,
      name,
      isDynamic,
      dynamicSegments,
      hasBeenVisited: visitedRoutes.has(name),
      lastVisited: visitedRoutes.has(name) ? Date.now() : undefined,
      children,
    })
  }

  return entries
}
