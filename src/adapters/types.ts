import type { NavigationTree, RouteInfo, NavigationEvent, SitemapEntry } from '../shared/types'

export interface NavigationAdapter {
  name: string
  isAvailable(): boolean
  getTree(): NavigationTree | null
  getActiveRoute(): RouteInfo | null
  subscribe(cb: (event: NavigationEvent, tree: NavigationTree) => void): () => void
  navigate?(path: string, params?: Record<string, unknown>, action?: 'push' | 'navigate' | 'replace'): void
  getAllRoutes?(): string[]
  getSitemap?(): SitemapEntry[]
}
