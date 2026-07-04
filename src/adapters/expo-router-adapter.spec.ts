import type { ExpoRouterLike, RouteNodeLike } from '../shared/navigation-types'
import { buildRoute, buildState } from '../test-helpers/navigation-state'
import { createFakeNavigationRef } from '../test-helpers/fake-navigation-ref'

let mockRouteNode: RouteNodeLike | null = null
let mockThrows = false

jest.mock(
  'expo-router/build/global-state/router-store',
  () => ({
    store: {
      get routeNode() {
        if (mockThrows) throw new Error('store unavailable')
        return mockRouteNode
      },
    },
  }),
  { virtual: true }
)

import { createExpoRouterAdapter } from './expo-router-adapter'

function createExpoRouter(): ExpoRouterLike & {
  push: jest.Mock
  replace: jest.Mock
  navigate: jest.Mock
} {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
  }
}

beforeEach(() => {
  mockRouteNode = null
  mockThrows = false
  jest.clearAllMocks()
})

describe('createExpoRouterAdapter', () => {
  it('reports availability and reads tree / active route from the ref', () => {
    const state = buildState({ routes: [buildRoute({ name: 'home' })] })
    const adapter = createExpoRouterAdapter(
      createFakeNavigationRef({ state }).ref,
      createExpoRouter()
    )

    expect(adapter.isAvailable()).toBe(true)
    expect(adapter.getTree()?.id).toBe('state-key')
    expect(adapter.getActiveRoute()?.name).toBe('home')
  })

  it('normalizes paths and routes navigate intents through the expo router', () => {
    const router = createExpoRouter()
    const adapter = createExpoRouterAdapter(createFakeNavigationRef().ref, router)

    adapter.navigate?.('/details', { id: '1' }, 'push')
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/details',
      params: { id: '1' },
    })

    adapter.navigate?.('myapp:///foo//bar', undefined, 'replace')
    expect(router.replace).toHaveBeenCalledWith('/foo/bar')

    adapter.navigate?.('plain', undefined, 'navigate')
    expect(router.navigate).toHaveBeenCalledWith('/plain')
  })

  it('builds routes and sitemap from the expo-router route node when available', () => {
    mockRouteNode = {
      type: 'layout',
      route: '',
      dynamic: null,
      children: [
        { type: 'route', route: 'index', children: [], dynamic: null },
        {
          type: 'route',
          route: 'user/[id]',
          children: [],
          dynamic: [{ name: 'id' }],
        },
        { type: 'route', route: 'about', children: [], dynamic: null },
        { type: 'api', route: 'api/health', children: [], dynamic: null },
        {
          type: 'route',
          route: 'secret',
          children: [],
          internal: true,
          dynamic: null,
        },
      ],
    }
    const adapter = createExpoRouterAdapter(
      createFakeNavigationRef().ref,
      createExpoRouter()
    )

    expect(adapter.getAllRoutes?.()).toEqual(['/', '/user/[id]', '/about'])

    const sitemap = adapter.getSitemap?.() ?? []
    expect(sitemap.map((e) => e.name)).toEqual(['index', 'user/[id]', 'about'])
    const dynamic = sitemap.find((e) => e.name === 'user/[id]')
    expect(dynamic?.isDynamic).toBe(true)
    expect(dynamic?.dynamicSegments).toEqual(['id'])
  })

  it('falls back to state-based discovery when the route node is absent', () => {
    const state = buildState({
      routeNames: ['home'],
      routes: [buildRoute({ name: 'home' })],
    })
    const adapter = createExpoRouterAdapter(
      createFakeNavigationRef({ state }).ref,
      createExpoRouter()
    )

    expect(adapter.getAllRoutes?.()).toEqual(['home'])
    expect(adapter.getSitemap?.()[0].path).toBe('/home')
  })

  it('falls back to state when the route store throws', () => {
    mockThrows = true
    const state = buildState({
      routeNames: ['home'],
      routes: [buildRoute({ name: 'home' })],
    })
    const adapter = createExpoRouterAdapter(
      createFakeNavigationRef({ state }).ref,
      createExpoRouter()
    )

    expect(adapter.getAllRoutes?.()).toEqual(['home'])
    expect(adapter.getSitemap?.()[0].name).toBe('home')
  })

  it('returns empty results when there is neither a route node nor state', () => {
    const adapter = createExpoRouterAdapter(
      createFakeNavigationRef().ref,
      createExpoRouter()
    )
    expect(adapter.getAllRoutes?.()).toEqual([])
    expect(adapter.getSitemap?.()).toEqual([])
  })

  it('notifies subscribers on fresh state only', () => {
    const fake = createFakeNavigationRef({ state: buildState() })
    const adapter = createExpoRouterAdapter(fake.ref, createExpoRouter())
    const cb = jest.fn()

    adapter.subscribe(cb)
    fake.emit(buildState({ routes: [buildRoute({ name: 'next' })] }))
    fake.emit({ ...buildState(), stale: true })

    expect(cb).toHaveBeenCalledTimes(1)
  })
})
