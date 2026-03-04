import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge'
import { useEffect, useRef } from 'react'
import { useNavigationContainerRef } from '@react-navigation/native'
import type { NavigationContainerRefWithCurrent, ParamListBase } from '@react-navigation/native'
import { createReactNavigationAdapter } from './adapters/react-navigation-adapter'
import type { NavigationAdapter } from './adapters/types'
import type { NavigationInspectorEventMap } from './shared/event-map'
import type { NavigationEvent } from './shared/types'

const PLUGIN_ID = 'rozenite-navigation-inspector'
const MAX_TIMELINE_SIZE = 200
const READY_POLL_MS = 500

// Lazy expo-router detection (cached after first call)
let _expoRouterDetected: boolean | null = null
let _expoRouterModule: any = null

function getExpoRouter(): any | null {
  if (_expoRouterDetected !== null) {
    return _expoRouterDetected ? _expoRouterModule : null
  }
  try {
    _expoRouterModule = require('expo-router')
    _expoRouterDetected = true
    return _expoRouterModule
  } catch {
    _expoRouterDetected = false
    return null
  }
}

function tryCreateExpoSetup(
  fallbackRef: NavigationContainerRefWithCurrent<ParamListBase>
): {
  adapter: NavigationAdapter
  navigationRef: NavigationContainerRefWithCurrent<ParamListBase>
} | null {
  const expoRouter = getExpoRouter()
  if (!expoRouter) return null

  try {
    const { createExpoRouterAdapter } = require('./adapters/expo-router-adapter')
    // Access expo-router's singleton navigationRef directly from the store
    // to avoid calling useNavigationContainerRef as a conditional hook
    const { store } = require('expo-router/build/global-state/router-store')
    const expoNavRef = store.navigationRef as NavigationContainerRefWithCurrent<ParamListBase>

    if (expoNavRef) {
      return {
        adapter: createExpoRouterAdapter(expoNavRef, expoRouter.router),
        navigationRef: expoNavRef,
      }
    }
  } catch {
    // expo-router internals not accessible, fall back to React Navigation
  }

  return null
}

export function useNavigationInspectorNative(): { current: any } {
  const client = useRozeniteDevToolsClient<NavigationInspectorEventMap>({
    pluginId: PLUGIN_ID,
  })

  // Always create a React Navigation ref (used when expo-router is not available)
  const rnNavigationRef = useNavigationContainerRef() as unknown as NavigationContainerRefWithCurrent<ParamListBase>

  const setupRef = useRef<{
    adapter: NavigationAdapter
    navigationRef: NavigationContainerRefWithCurrent<ParamListBase>
  } | null>(null)

  if (setupRef.current === null) {
    const expoSetup = tryCreateExpoSetup(rnNavigationRef)
    if (expoSetup) {
      setupRef.current = expoSetup
    } else {
      setupRef.current = {
        adapter: createReactNavigationAdapter(rnNavigationRef),
        navigationRef: rnNavigationRef,
      }
    }
  }

  const { adapter, navigationRef } = setupRef.current
  const timelineRef = useRef<NavigationEvent[]>([])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!client) return

    let stateUnsubscribe: (() => void) | null = null
    let readyPollTimer: ReturnType<typeof setInterval> | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let requestSnapshotSub: { remove: () => void } | null = null
    let requestSitemapSub: { remove: () => void } | null = null
    let requestRoutesSub: { remove: () => void } | null = null
    let navigateSub: { remove: () => void } | null = null

    try {
      const sendSnapshot = () => {
        try {
          const tree = adapter.getTree()
          const activeRoute = adapter.getActiveRoute()
          if (tree) {
            client.send('nav:tree-snapshot', { tree, activeRoute })
          }
          const sitemap = adapter.getSitemap?.()
          if (sitemap) {
            client.send('nav:sitemap', { entries: sitemap })
          }
          try {
            const routes = adapter.getAllRoutes?.() || []
            client.send('nav:routes-list', { routes })
          } catch {
            client.send('nav:routes-list', { routes: [] })
          }
        } catch {
          // Snapshot failed — navigation container may not be ready yet
        }
      }

      const startStateSubscription = () => {
        if (stateUnsubscribe) return
        stateUnsubscribe = adapter.subscribe((event, tree) => {
          if (rafRef.current !== null) return

          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            try {
              const activeRoute = adapter.getActiveRoute()

              client.send('nav:tree-update', { tree, activeRoute })
              client.send('nav:event', event)

              const sitemap = adapter.getSitemap?.()
              if (sitemap) {
                client.send('nav:sitemap', { entries: sitemap })
              }

              timelineRef.current.push(event)
              if (timelineRef.current.length > MAX_TIMELINE_SIZE) {
                timelineRef.current = timelineRef.current.slice(-MAX_TIMELINE_SIZE)
              }
            } catch {
              // State update failed — swallow to avoid breaking other plugins
            }
          })
        })
      }

      if (adapter.isAvailable()) {
        sendSnapshot()
        startStateSubscription()
        retryTimer = setTimeout(() => {
          if (adapter.isAvailable()) sendSnapshot()
        }, 1500)
      } else {
        readyPollTimer = setInterval(() => {
          if (adapter.isAvailable()) {
            if (readyPollTimer) clearInterval(readyPollTimer)
            readyPollTimer = null
            sendSnapshot()
            startStateSubscription()
            retryTimer = setTimeout(() => {
              if (adapter.isAvailable()) sendSnapshot()
            }, 1500)
          }
        }, READY_POLL_MS)
      }

      requestSnapshotSub = client.onMessage('nav:request-snapshot', () => {
        if (adapter.isAvailable()) sendSnapshot()
      })

      requestSitemapSub = client.onMessage('nav:request-sitemap', () => {
        if (!adapter.isAvailable()) return
        const sitemap = adapter.getSitemap?.()
        if (sitemap) {
          client.send('nav:sitemap', { entries: sitemap })
        }
      })

      requestRoutesSub = client.onMessage('nav:request-routes', () => {
        try {
          const routes = adapter.getAllRoutes?.() || []
          client.send('nav:routes-list', { routes })
        } catch {
          client.send('nav:routes-list', { routes: [] })
        }
      })

      navigateSub = client.onMessage('nav:navigate', ({ path, params, action }) => {
        if (adapter.isAvailable()) adapter.navigate?.(path, params, action)
      })
    } catch {
      // Setup failed — clean up silently to avoid breaking other Rozenite plugins
    }

    return () => {
      if (retryTimer) clearTimeout(retryTimer)
      if (readyPollTimer) clearInterval(readyPollTimer)
      if (stateUnsubscribe) stateUnsubscribe()
      requestSnapshotSub?.remove()
      requestSitemapSub?.remove()
      requestRoutesSub?.remove()
      navigateSub?.remove()
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [client, navigationRef])

  return navigationRef
}
