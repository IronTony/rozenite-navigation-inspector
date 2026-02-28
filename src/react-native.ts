const isDev = process.env.NODE_ENV !== 'production'
const isServer = typeof window === 'undefined'
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative'

export let useNavigationInspector: () => void

if (isDev && isReactNative && !isServer) {
  useNavigationInspector =
    require('./useNavigationInspectorNative').useNavigationInspectorNative
} else {
  useNavigationInspector = () => {}
}

export type { NavigationAdapter } from './adapters/types'
export type { NavigationTree, RouteInfo, NavigationEvent, SitemapEntry } from './shared/types'
