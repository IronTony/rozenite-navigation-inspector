/** @jest-environment jsdom */
import { renderHook } from '@testing-library/react'
import { buildRoute, buildState } from './test-helpers/navigation-state'
import { createFakeNavigationRef } from './test-helpers/fake-navigation-ref'

let mockClient: ReturnType<typeof createClient> | null
const mockFallbackRef = createFakeNavigationRef().ref
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

jest.mock('./shared/navigation-runtime', () => ({
  useNavigationContainerRef: () => mockFallbackRef,
  StackActions: null,
  CommonActions: null,
}))

jest.mock('expo-router', () => ({ router: mockExpoRouterApi }), { virtual: true })

jest.mock(
  'expo-router/build/global-state/router-store',
  () => ({ store: { navigationRef: mockExpoNav.ref, routeNode: null } }),
  { virtual: true }
)

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

describe('useNavigationInspectorNative with expo-router present', () => {
  it('binds to the expo-router store ref and routes navigation through expo-router', () => {
    const client = createClient()
    mockClient = client

    const { result } = renderHook(() => useNavigationInspectorNative())

    expect(result.current).toBe(mockExpoNav.ref)
    expect(client.send).toHaveBeenCalledWith('nav:tree-snapshot', expect.anything())

    client.handlers['nav:navigate']({ path: '/home', action: 'push' })
    expect(mockExpoRouterApi.push).toHaveBeenCalledWith('/home')
  })
})
