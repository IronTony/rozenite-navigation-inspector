import {
  buildTreeFromState,
  extractFocusedRoute,
  collectRouteNames,
} from './tree-builder';
import { buildRoute, buildState } from './test-helpers/navigation-state';

describe('buildTreeFromState', () => {
  it('maps a flat stack into screen children with focus on the active index', () => {
    const state = buildState({
      type: 'stack',
      index: 1,
      routes: [
        buildRoute({ key: 'a', name: 'home' }),
        buildRoute({ key: 'b', name: 'details' }),
      ],
    });

    const tree = buildTreeFromState(state);

    expect(tree.id).toBe('state-key');
    expect(tree.type).toBe('stack');
    expect(tree.name).toBe('Root');
    expect(tree.children).toHaveLength(2);
    expect(tree.children[0].focused).toBe(false);
    expect(tree.children[1].focused).toBe(true);
    expect(tree.children[1].routeName).toBe('details');
    expect(tree.children[0].path).toBe('/home');
  });

  it('infers tabs and drawer navigator types and defaults unknown types to stack', () => {
    expect(buildTreeFromState(buildState({ type: 'tab' })).type).toBe('tabs');
    expect(buildTreeFromState(buildState({ type: 'drawer' })).type).toBe(
      'drawer',
    );
    expect(buildTreeFromState(buildState({ type: 'something' })).type).toBe(
      'stack',
    );
  });

  it('recurses into a non-stale nested navigator', () => {
    const nested = buildState({
      key: 'nested',
      routes: [buildRoute({ key: 'inner', name: 'profile' })],
    });
    const state = buildState({
      routes: [buildRoute({ key: 'outer', name: 'account', state: nested })],
    });

    const tree = buildTreeFromState(state);

    expect(tree.children[0].routeName).toBe('account');
    expect(tree.children[0].children[0].routeName).toBe('profile');
  });

  it('normalizes deep-link paths and strips route groups when no path is present', () => {
    const state = buildState({
      routes: [
        buildRoute({
          key: 'a',
          name: '(tabs)/home',
          path: 'myapp:///settings//deep',
        }),
      ],
    });

    const tree = buildTreeFromState(state);

    expect(tree.children[0].path).toBe('/settings/deep');
  });
});

describe('extractFocusedRoute', () => {
  it('returns null when there are no routes', () => {
    expect(extractFocusedRoute(buildState({ routes: [] }))).toBeNull();
  });

  it('drills into nested navigators to the focused leaf', () => {
    const nested = buildState({
      key: 'nested',
      index: 0,
      routes: [buildRoute({ key: 'leaf', name: 'leaf', params: { id: '7' } })],
    });
    const state = buildState({
      routes: [buildRoute({ key: 'outer', name: 'account', state: nested })],
    });

    const focused = extractFocusedRoute(state);

    expect(focused).not.toBeNull();
    expect(focused?.name).toBe('leaf');
    expect(focused?.params).toEqual({ id: '7' });
    expect(focused?.navigatorType).toBe('screen');
  });

  it('returns empty params when the focused route has none', () => {
    const focused = extractFocusedRoute(buildState());
    expect(focused?.params).toEqual({});
  });
});

describe('collectRouteNames', () => {
  it('collects nested route names with path prefixes', () => {
    const nested = buildState({
      key: 'nested',
      routeNames: ['settings'],
      routes: [buildRoute({ key: 'inner', name: 'settings' })],
    });
    const state = buildState({
      routeNames: ['home', 'account'],
      routes: [
        buildRoute({ key: 'a', name: 'home' }),
        buildRoute({ key: 'b', name: 'account', state: nested }),
      ],
    });

    expect(collectRouteNames(state)).toEqual([
      'home',
      'account',
      'account/settings',
    ]);
  });
});
