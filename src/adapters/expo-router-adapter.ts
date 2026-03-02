import type { NavigationContainerRefWithCurrent, ParamListBase } from '@react-navigation/native'
import type { NavigationState } from '@react-navigation/routers'
import type { Router } from 'expo-router'
import type { RouteNode } from 'expo-router/build/Route'
import type { NavigationAdapter } from './types'
import type { NavigationEvent, SitemapEntry } from '../shared/types'
import { buildTreeFromState, extractFocusedRoute, collectRouteNames } from '../tree-builder'
import { diffStates } from '../state-differ'
import { buildSitemapFromState } from '../sitemap-builder'

function collectRoutesFromRouteNode(node: RouteNode, parents: string[] = []): string[] {
  if (node.internal || node.generated) return []
  if (node.type === 'api' || node.type === 'redirect' || node.type === 'rewrite') return []

  const routes: string[] = []
  const segments = [...parents, ...node.route.split('/')]

  const path =
    '/' +
    segments
      .map((s) => (s === 'index' ? '' : s))
      .filter(Boolean)
      .join('/')

  if (node.type === 'route') {
    routes.push(path || '/')
  }

  for (const child of node.children) {
    routes.push(...collectRoutesFromRouteNode(child, segments))
  }

  return routes
}

function buildSitemapFromRouteNode(
  node: RouteNode,
  visitedRoutes: Set<string>,
  parentPath = ''
): SitemapEntry[] {
  if (node.internal || node.generated) return []
  if (node.type === 'api' || node.type === 'redirect' || node.type === 'rewrite') return []

  const entries: SitemapEntry[] = []
  const routeSegments = node.route.split('/')
  let currentPath = parentPath

  for (const segment of routeSegments) {
    const isGroup = segment.startsWith('(') && segment.endsWith(')')
    if (isGroup || segment === '') continue
    if (segment === 'index') continue
    currentPath = currentPath ? `${currentPath}/${segment}` : `/${segment}`
  }

  if (node.type === 'layout') {
    for (const child of node.children) {
      entries.push(...buildSitemapFromRouteNode(child, visitedRoutes, currentPath))
    }
    return entries
  }

  const path = currentPath || '/'
  const name = node.route
  const isDynamic = node.dynamic !== null && node.dynamic.length > 0
  const dynamicSegments = isDynamic ? node.dynamic!.map((d) => d.name) : []

  const children: SitemapEntry[] = []
  for (const child of node.children) {
    children.push(...buildSitemapFromRouteNode(child, visitedRoutes, path))
  }

  entries.push({
    path,
    name,
    isDynamic,
    dynamicSegments,
    hasBeenVisited: visitedRoutes.has(name),
    lastVisited: visitedRoutes.has(name) ? Date.now() : undefined,
    children,
  })

  return entries
}

export function createExpoRouterAdapter(
  navigationRef: NavigationContainerRefWithCurrent<ParamListBase>,
  expoRouter: Router
): NavigationAdapter {
  let previousState: NavigationState | undefined
  const visitedRoutes = new Set<string>()

  return {
    name: 'expo-router',

    isAvailable() {
      return navigationRef.current !== null && navigationRef.isReady()
    },

    getTree() {
      const state = navigationRef.getRootState()
      if (!state) return null
      return buildTreeFromState(state)
    },

    getActiveRoute() {
      const state = navigationRef.getRootState()
      if (!state) return null
      const route = extractFocusedRoute(state)
      if (route) {
        visitedRoutes.add(route.name)
      }
      return route
    },

    subscribe(cb) {
      const unsubscribe = navigationRef.addListener('state', (e) => {
        const newState = e.data.state
        if (!newState || newState.stale !== false) return

        const navState = newState as NavigationState
        const tree = buildTreeFromState(navState)
        const activeRoute = extractFocusedRoute(navState)

        if (activeRoute) {
          visitedRoutes.add(activeRoute.name)
        }

        const event: NavigationEvent = diffStates(previousState, navState)
        previousState = navState

        cb(event, tree)
      })

      previousState = navigationRef.getRootState()

      return unsubscribe
    },

    navigate(path, params, action = 'navigate') {
      let normalizedPath = path
      normalizedPath = normalizedPath.replace(/^[a-zA-Z][\w+.-]*:\/\/\/?/, '/')
      normalizedPath = normalizedPath.replace(/\/{2,}/g, '/')
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath
      }

      const href =
        params && Object.keys(params).length > 0
          ? ({ pathname: normalizedPath, params } as never)
          : (normalizedPath as never)

      switch (action) {
        case 'push':
          expoRouter.push(href)
          break
        case 'replace':
          expoRouter.replace(href)
          break
        default:
          expoRouter.navigate(href)
          break
      }
    },

    getAllRoutes() {
      try {
        const { store: routerStore } = require('expo-router/build/global-state/router-store')
        const routeNode = routerStore.routeNode
        if (routeNode) {
          return collectRoutesFromRouteNode(routeNode)
        }
      } catch {
        // store.routeNode access failed, fall through to state-based approach
      }
      const state = navigationRef.getRootState()
      if (!state) return []
      return collectRouteNames(state)
    },

    getSitemap(): SitemapEntry[] {
      try {
        const { store: routerStore } = require('expo-router/build/global-state/router-store')
        const routeNode = routerStore.routeNode
        if (routeNode) {
          return buildSitemapFromRouteNode(routeNode, visitedRoutes)
        }
      } catch {
        // fall through to state-based approach
      }
      const state = navigationRef.getRootState()
      if (!state) return []
      return buildSitemapFromState(state, visitedRoutes)
    },
  }
}
