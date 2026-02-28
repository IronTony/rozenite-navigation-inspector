import type { NavigationState } from '@react-navigation/routers'
import type { NavigationTree, NavigatorType, RouteInfo } from './shared/types'

function inferNavigatorType(type: string): NavigatorType {
  switch (type) {
    case 'stack':
      return 'stack'
    case 'tab':
      return 'tabs'
    case 'drawer':
      return 'drawer'
    default:
      return 'stack'
  }
}

function stripRouteGroups(name: string): string {
  return name.replace(/\([^)]*\)\/?/g, '')
}

function normalizeRoutePath(path: string): string {
  let normalized = path.replace(/^[a-zA-Z][\w+.-]*:\/\/\/?/, '/')
  normalized = normalized.replace(/\/{2,}/g, '/')
  if (!normalized.startsWith('/')) normalized = '/' + normalized
  return normalized
}

export function buildTreeFromState(state: NavigationState, parentPath = ''): NavigationTree {
  const navigatorType = inferNavigatorType(state.type)
  const focusedIndex = state.index

  return {
    id: state.key,
    type: navigatorType,
    name: parentPath || 'Root',
    focused: true,
    children: state.routes.map((route, index) => {
      const isFocused = index === focusedIndex
      const childState = route.state

      if (childState && childState.stale === false) {
        const subtree = buildTreeFromState(childState as NavigationState, route.name)
        return {
          ...subtree,
          id: route.key,
          name: route.name,
          routeName: route.name,
          path: (route.path ? normalizeRoutePath(route.path) : undefined) || `/${stripRouteGroups(route.name)}`,
          params: route.params as Record<string, unknown> | undefined,
          focused: isFocused,
        }
      }

      return {
        id: route.key,
        type: 'screen' as const,
        name: route.name,
        routeName: route.name,
        path: (route.path ? normalizeRoutePath(route.path) : undefined) || `/${stripRouteGroups(route.name)}`,
        params: route.params as Record<string, unknown> | undefined,
        focused: isFocused,
        children: [],
      }
    }),
  }
}

export function extractFocusedRoute(state: NavigationState): RouteInfo | null {
  if (!state.routes || state.routes.length === 0) return null

  const focusedRoute = state.routes[state.index]
  if (!focusedRoute) return null

  const childState = focusedRoute.state

  if (childState && childState.stale === false) {
    return extractFocusedRoute(childState as NavigationState)
  }

  return {
    name: focusedRoute.name,
    path: (focusedRoute.path ? normalizeRoutePath(focusedRoute.path) : undefined) || `/${stripRouteGroups(focusedRoute.name)}`,
    params: (focusedRoute.params as Record<string, unknown>) || {},
    key: focusedRoute.key,
    navigatorType: 'screen',
  }
}

export function collectRouteNames(state: NavigationState, prefix = ''): string[] {
  const names: string[] = []

  for (const routeName of state.routeNames) {
    const fullPath = prefix ? `${prefix}/${routeName}` : routeName
    names.push(fullPath)

    const route = state.routes.find((r) => r.name === routeName)
    const childState = route?.state

    if (childState && childState.stale === false) {
      const childNames = collectRouteNames(childState as NavigationState, fullPath)
      names.push(...childNames)
    }
  }

  return names
}
