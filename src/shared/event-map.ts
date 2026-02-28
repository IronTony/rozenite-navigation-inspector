import type { NavigationTree, RouteInfo, NavigationEvent, SitemapEntry } from './types'

export type NavigationInspectorEventMap = {
  'nav:tree-snapshot': {
    tree: NavigationTree
    activeRoute: RouteInfo | null
  }
  'nav:tree-update': {
    tree: NavigationTree
    activeRoute: RouteInfo | null
  }
  'nav:event': NavigationEvent
  'nav:sitemap': {
    entries: SitemapEntry[]
  }
  'nav:routes-list': {
    routes: string[]
  }
  'nav:request-snapshot': undefined
  'nav:request-sitemap': undefined
  'nav:request-routes': undefined
  'nav:navigate': {
    path: string
    params?: Record<string, unknown>
    action: 'push' | 'navigate' | 'replace'
  }
}
