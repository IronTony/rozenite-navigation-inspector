/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { buildRoute, buildState } from './test-helpers/navigation-state'
import type { ExpoSitemapNode } from './shared/navigation-types'
import { createFakeNavigationRef } from './test-helpers/fake-navigation-ref'

let mockClient: ReturnType<typeof createClient> | null
const mockExpoNav = createFakeNavigationRef({
  state: buildState({ routes: [buildRoute({ name: 'home' })] }),
})
const mockExpoRouterApi = {
  push: jest.fn(),
  replace: jest.fn(),
  navigate: jest.fn(),
}

jest.mock('@rozenite/plugin-bridge', () => ({
  useRozeniteDevToolsClient: () => mockClient,
}))

let mockSitemap: ExpoSitemapNode | null = null

jest.mock('expo-router', () => ({
  router: mockExpoRouterApi,
  useNavigationContainerRef: () => mockExpoNav.ref,
  useSitemap: () => mockSitemap,
}), { virtual: true })
jest.mock('expo-router/build/global-state/router-store', () => {
  throw new Error('Expo Router 58 does not ship router-store')
}, { virtual: true })

function node(contextKey: string, href: string, children: ExpoSitemapNode[] = [], isGenerated = false): ExpoSitemapNode {
  return { contextKey, href, children, isGenerated, isInternal: false }
}

import { useNavigationInspectorNative } from './useNavigationInspectorNative'

function createClient() {
  const handlers: Record<string, (payload: unknown) => void> = {}
  return {
    send: jest.fn(),
    onMessage: jest.fn((type: string, cb: (payload: unknown) => void) => {
      handlers[type] = cb
      return { remove: jest.fn() }
    }),
    handlers,
  }
}

beforeEach(() => {
  mockSitemap = null
  jest.useFakeTimers()
  global.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(0)
    return 1
  }) as unknown as typeof requestAnimationFrame
  global.cancelAnimationFrame = jest.fn() as unknown as typeof cancelAnimationFrame
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})

describe('useNavigationInspectorNative on Expo Router 58', () => {
  it('uses the public Expo ref when the legacy store does not exist', () => {
    const client = createClient()
    mockClient = client

    const { result } = renderHook(() => useNavigationInspectorNative())

    expect(result.current).toBe(mockExpoNav.ref)
    expect(client.send).toHaveBeenCalledWith('nav:tree-snapshot', expect.anything())

    client.handlers['nav:navigate']({ path: '/home', action: 'push' })
    expect(mockExpoRouterApi.push).toHaveBeenCalledWith('/home')
  })


  it('refreshes the sitemap when Router mounts and includes unvisited child routes', () => {
    const client = createClient()
    mockClient = client
    const { rerender } = renderHook(() => useNavigationInspectorNative())

    mockSitemap = node('./_layout.tsx', '/', [
      node('./index.tsx', '/'),
      node('./(tabs)/_layout.tsx', '/(tabs)', [
        node('./(tabs)/profiles/[id].tsx', '/(tabs)/profiles/[id]'),
        node('./(tabs)/docs/[...slug].tsx', '/(tabs)/docs/[...slug]/1714157713372'),
        node('./(tabs)/data+api.ts', '/(tabs)/data'),
      ]),
      node('./_sitemap.tsx', '/_sitemap', [], true),
    ], true)
    act(() => rerender())

    expect(client.send).toHaveBeenLastCalledWith('nav:routes-list', {
      routes: ['/', '/profiles/[id]', '/docs/[...slug]'],
    })
    expect(client.send).toHaveBeenCalledWith('nav:sitemap', {
      entries: [
        expect.objectContaining({ path: '/', name: 'index' }),
        expect.objectContaining({ path: '/profiles/[id]', name: 'profiles/[id]', dynamicSegments: ['id'], hasBeenVisited: false }),
        expect.objectContaining({ path: '/docs/[...slug]', dynamicSegments: ['slug'] }),
      ],
    })
  })
})
