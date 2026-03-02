import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge'
import { useEffect, useRef } from 'react'
import { useNavigationContainerRef, router as expoRouter } from 'expo-router'
import { createExpoRouterAdapter } from './adapters/expo-router-adapter'
import type { NavigationAdapter } from './adapters/types'
import type { NavigationInspectorEventMap } from './shared/event-map'
import type { NavigationEvent } from './shared/types'

const PLUGIN_ID = 'rozenite-navigation-inspector'
const MAX_TIMELINE_SIZE = 200
const READY_POLL_MS = 500

export function useNavigationInspectorNative(): void {
  const client = useRozeniteDevToolsClient<NavigationInspectorEventMap>({
    pluginId: PLUGIN_ID,
  })

  const navigationRef = useNavigationContainerRef()
  const adapterRef = useRef<NavigationAdapter | null>(null)
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
      const adapter = createExpoRouterAdapter(navigationRef, expoRouter)
      adapterRef.current = adapter

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
}
