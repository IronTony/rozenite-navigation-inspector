import { buildRoute, buildState } from '../test-helpers/navigation-state'
import { createFakeNavigationRef } from '../test-helpers/fake-navigation-ref'

jest.mock('../shared/navigation-runtime', () => ({
  StackActions: {
    push: jest.fn((name: string, params: unknown) => ({
      type: 'PUSH',
      name,
      params,
    })),
    replace: jest.fn((name: string, params: unknown) => ({
      type: 'REPLACE',
      name,
      params,
    })),
  },
  CommonActions: {
    navigate: jest.fn((name: string, params: unknown) => ({
      type: 'NAVIGATE',
      name,
      params,
    })),
  },
  useNavigationContainerRef: jest.fn(),
}))

import { StackActions, CommonActions } from '../shared/navigation-runtime'
import { createReactNavigationAdapter } from './react-navigation-adapter'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('createReactNavigationAdapter', () => {
  it('reports availability from the ref current value and ready state', () => {
    expect(createReactNavigationAdapter(createFakeNavigationRef().ref).isAvailable()).toBe(
      true
    )
    expect(
      createReactNavigationAdapter(createFakeNavigationRef({ ready: false }).ref).isAvailable()
    ).toBe(false)
    expect(
      createReactNavigationAdapter(createFakeNavigationRef({ current: null }).ref).isAvailable()
    ).toBe(false)
  })

  it('builds the tree from the root state and returns null without one', () => {
    const state = buildState()
    expect(createReactNavigationAdapter(createFakeNavigationRef({ state }).ref).getTree()?.id).toBe(
      'state-key'
    )
    expect(createReactNavigationAdapter(createFakeNavigationRef().ref).getTree()).toBeNull()
  })

  it('returns the active route and null without state', () => {
    const state = buildState({ routes: [buildRoute({ name: 'home' })] })
    expect(
      createReactNavigationAdapter(createFakeNavigationRef({ state }).ref).getActiveRoute()?.name
    ).toBe('home')
    expect(
      createReactNavigationAdapter(createFakeNavigationRef().ref).getActiveRoute()
    ).toBeNull()
  })

  it('notifies subscribers on fresh state and ignores stale state', () => {
    const fake = createFakeNavigationRef({ state: buildState() })
    const adapter = createReactNavigationAdapter(fake.ref)
    const cb = jest.fn()

    const unsubscribe = adapter.subscribe(cb)
    fake.emit(buildState({ index: 0, routes: [buildRoute({ name: 'next' })] }))
    expect(cb).toHaveBeenCalledTimes(1)

    fake.emit({ ...buildState(), stale: true })
    expect(cb).toHaveBeenCalledTimes(1)

    fake.emit(undefined)
    expect(cb).toHaveBeenCalledTimes(1)

    unsubscribe()
    expect(fake.isRemoved()).toBe(true)
  })

  it('dispatches the correct action per navigate intent', () => {
    const fake = createFakeNavigationRef()
    const adapter = createReactNavigationAdapter(fake.ref)

    adapter.navigate?.('/details', { id: '1' }, 'push')
    expect(StackActions!.push).toHaveBeenCalledWith('details', { id: '1' })

    adapter.navigate?.('/details', undefined, 'replace')
    expect(StackActions!.replace).toHaveBeenCalledWith('details', undefined)

    adapter.navigate?.('/details', undefined, 'navigate')
    expect(CommonActions!.navigate).toHaveBeenCalledWith('details', undefined)

    expect(fake.dispatched).toHaveLength(3)
  })

  it('collects routes and sitemap from state, empty without state', () => {
    const state = buildState({
      routeNames: ['home'],
      routes: [buildRoute({ name: 'home' })],
    })
    const adapter = createReactNavigationAdapter(createFakeNavigationRef({ state }).ref)
    expect(adapter.getAllRoutes?.()).toEqual(['home'])
    expect(adapter.getSitemap?.()[0].path).toBe('/home')

    const empty = createReactNavigationAdapter(createFakeNavigationRef().ref)
    expect(empty.getAllRoutes?.()).toEqual([])
    expect(empty.getSitemap?.()).toEqual([])
  })
})
