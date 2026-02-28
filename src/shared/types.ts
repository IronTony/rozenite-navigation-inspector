export type NavigatorType = 'stack' | 'tabs' | 'drawer' | 'screen' | 'group'

export type NavigationTree = {
  id: string
  type: NavigatorType
  name: string
  routeName?: string
  path?: string
  params?: Record<string, unknown>
  focused: boolean
  children: NavigationTree[]
}

export type RouteInfo = {
  name: string
  path: string
  params: Record<string, unknown>
  key: string
  navigatorType: NavigatorType
}

export type NavigationEventType =
  | 'push'
  | 'pop'
  | 'replace'
  | 'navigate'
  | 'tab-switch'
  | 'focus'
  | 'blur'
  | 'reset'
  | 'unknown'

export type NavigationEvent = {
  id: string
  type: NavigationEventType
  timestamp: number
  fromRoute: RouteInfo | null
  toRoute: RouteInfo | null
  params?: Record<string, unknown>
}

export type SitemapEntry = {
  path: string
  name: string
  isDynamic: boolean
  dynamicSegments: string[]
  hasBeenVisited: boolean
  lastVisited?: number
  children: SitemapEntry[]
}
