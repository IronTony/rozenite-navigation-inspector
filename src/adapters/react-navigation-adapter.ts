import type { NavigationContainerRefWithCurrent, ParamListBase } from '@react-navigation/native'
import { StackActions, CommonActions } from '@react-navigation/native'
import type { NavigationState } from '@react-navigation/routers'
import type { NavigationAdapter } from './types'
import type { NavigationEvent } from '../shared/types'
import { buildTreeFromState, extractFocusedRoute, collectRouteNames } from '../tree-builder'
import { diffStates } from '../state-differ'
import { buildSitemapFromState } from '../sitemap-builder'

export function createReactNavigationAdapter(
  navigationRef: NavigationContainerRefWithCurrent<ParamListBase>
): NavigationAdapter {
  let previousState: NavigationState | undefined
  const visitedRoutes = new Set<string>()

  return {
    name: 'react-navigation',

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
      const screenName = path.replace(/^\//, '')

      switch (action) {
        case 'push':
          navigationRef.dispatch(StackActions.push(screenName, params))
          break
        case 'replace':
          navigationRef.dispatch(StackActions.replace(screenName, params))
          break
        default:
          navigationRef.dispatch(CommonActions.navigate(screenName, params))
          break
      }
    },

    getAllRoutes() {
      const state = navigationRef.getRootState()
      if (!state) return []
      return collectRouteNames(state)
    },

    getSitemap() {
      const state = navigationRef.getRootState()
      if (!state) return []
      return buildSitemapFromState(state, visitedRoutes)
    },
  }
}
