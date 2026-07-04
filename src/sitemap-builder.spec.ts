import { buildSitemapFromState } from './sitemap-builder'
import { buildRoute, buildState } from './test-helpers/navigation-state'

describe('buildSitemapFromState', () => {
  it('maps a flat route list with index collapsing to the parent path', () => {
    const state = buildState({
      routeNames: ['index', 'settings'],
      routes: [
        buildRoute({ key: 'a', name: 'index' }),
        buildRoute({ key: 'b', name: 'settings' }),
      ],
    })

    const entries = buildSitemapFromState(state, new Set())

    expect(entries).toHaveLength(2)
    expect(entries[0].path).toBe('/')
    expect(entries[1].path).toBe('/settings')
  })

  it('flattens internal and group routes transparently into the parent', () => {
    const inner = buildState({
      key: 'inner',
      routeNames: ['profile'],
      routes: [buildRoute({ key: 'p', name: 'profile' })],
    })
    const state = buildState({
      routeNames: ['(tabs)'],
      routes: [buildRoute({ key: 'g', name: '(tabs)', state: inner })],
    })

    const entries = buildSitemapFromState(state, new Set())

    expect(entries).toHaveLength(1)
    expect(entries[0].name).toBe('profile')
    expect(entries[0].path).toBe('/profile')
  })

  it('skips an underscore-prefixed internal route while keeping its children', () => {
    const inner = buildState({
      key: 'inner',
      routeNames: ['home'],
      routes: [buildRoute({ key: 'h', name: 'home' })],
    })
    const state = buildState({
      routeNames: ['_layout'],
      routes: [buildRoute({ key: 'l', name: '_layout', state: inner })],
    })

    const entries = buildSitemapFromState(state, new Set())

    expect(entries.map((e) => e.name)).toEqual(['home'])
  })

  it('flags dynamic segments and marks visited routes', () => {
    const state = buildState({
      routeNames: ['user/[id]'],
      routes: [buildRoute({ key: 'u', name: 'user/[id]' })],
    })

    const entries = buildSitemapFromState(state, new Set(['user/[id]']))

    expect(entries[0].isDynamic).toBe(true)
    expect(entries[0].dynamicSegments).toEqual(['id'])
    expect(entries[0].hasBeenVisited).toBe(true)
    expect(typeof entries[0].lastVisited).toBe('number')
  })

  it('nests children under their parent path', () => {
    const inner = buildState({
      key: 'inner',
      routeNames: ['edit'],
      routes: [buildRoute({ key: 'e', name: 'edit' })],
    })
    const state = buildState({
      routeNames: ['account'],
      routes: [buildRoute({ key: 'a', name: 'account', state: inner })],
    })

    const entries = buildSitemapFromState(state, new Set())

    expect(entries[0].path).toBe('/account')
    expect(entries[0].children[0].path).toBe('/account/edit')
    expect(entries[0].hasBeenVisited).toBe(false)
    expect(entries[0].lastVisited).toBeUndefined()
  })
})
