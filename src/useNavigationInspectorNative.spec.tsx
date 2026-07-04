/** @jest-environment jsdom */
import { renderHook } from '@testing-library/react'
import { buildRoute, buildState } from './test-helpers/navigation-state'
import { createFakeNavigationRef } from './test-helpers/fake-navigation-ref'

let mockClient: ReturnType<typeof createClient> | null
let mockRef: ReturnType<typeof createFakeNavigationRef>['ref']

jest.mock('@rozenite/plugin-bridge', () => ({
  useRozeniteDevToolsClient: () => mockClient,
}))

jest.mock('./shared/navigation-runtime', () => ({
  useNavigationContainerRef: () => mockRef,
  StackActions: null,
  CommonActions: null,
}))

import { useNavigationInspectorNative } from './useNavigationInspectorNative'

function createClient() {
  const handlers: Record<string, (payload: unknown) => void> = {}
  const removers: jest.Mock[] = []
  return {
    send: jest.fn(),
    onMessage: jest.fn((type: string, cb: (payload: unknown) => void) => {
      handlers[type] = cb
      const remove = jest.fn()
      removers.push(remove)
      return { remove }
    }),
    handlers,
    removers,
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

describe('useNavigationInspectorNative', () => {
  it('returns the navigation ref and no-ops when the devtools client is unavailable', () => {
    mockClient = null
    mockRef = createFakeNavigationRef().ref

    const { result } = renderHook(() => useNavigationInspectorNative())

    expect(result.current).toBe(mockRef)
  })

  it('sends a snapshot and streams updates when navigation is available', () => {
    const client = createClient()
    mockClient = client
    const fake = createFakeNavigationRef({
      state: buildState({ routes: [buildRoute({ name: 'home' })] }),
    })
    mockRef = fake.ref

    renderHook(() => useNavigationInspectorNative())

    expect(client.send).toHaveBeenCalledWith(
      'nav:tree-snapshot',
      expect.objectContaining({ tree: expect.anything() })
    )
    expect(client.send).toHaveBeenCalledWith('nav:routes-list', expect.anything())

    client.send.mockClear()
    fake.emit(buildState({ routes: [buildRoute({ name: 'next' })] }))

    expect(client.send).toHaveBeenCalledWith('nav:tree-update', expect.anything())
    expect(client.send).toHaveBeenCalledWith('nav:event', expect.anything())
  })

  it('responds to inbound devtools requests', () => {
    const client = createClient()
    mockClient = client
    mockRef = createFakeNavigationRef({ state: buildState() }).ref

    renderHook(() => useNavigationInspectorNative())
    client.send.mockClear()

    client.handlers['nav:request-snapshot'](undefined)
    expect(client.send).toHaveBeenCalledWith('nav:tree-snapshot', expect.anything())

    client.handlers['nav:request-routes'](undefined)
    expect(client.send).toHaveBeenCalledWith('nav:routes-list', expect.anything())

    client.handlers['nav:request-sitemap'](undefined)
    expect(client.send).toHaveBeenCalledWith('nav:sitemap', expect.anything())

    expect(() =>
      client.handlers['nav:navigate']({ path: '/home', action: 'navigate' })
    ).not.toThrow()
  })

  it('tears down listeners and subscriptions on unmount', () => {
    const client = createClient()
    mockClient = client
    const fake = createFakeNavigationRef({ state: buildState() })
    mockRef = fake.ref

    const { unmount } = renderHook(() => useNavigationInspectorNative())
    unmount()

    expect(fake.isRemoved()).toBe(true)
    client.removers.forEach((remove) => expect(remove).toHaveBeenCalled())
  })

  it('polls until the navigation container reports ready', () => {
    const client = createClient()
    mockClient = client
    const fake = createFakeNavigationRef({ state: buildState() })
    let ready = false
    fake.ref.isReady = () => ready
    mockRef = fake.ref

    renderHook(() => useNavigationInspectorNative())
    expect(client.send).not.toHaveBeenCalled()

    ready = true
    jest.advanceTimersByTime(500)

    expect(client.send).toHaveBeenCalledWith('nav:tree-snapshot', expect.anything())
  })
})
