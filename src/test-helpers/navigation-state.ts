import type {
  NavigationRouteLike,
  NavigationStateLike,
} from '../shared/navigation-types';

export function buildRoute(
  overrides: Partial<NavigationRouteLike> = {},
): NavigationRouteLike {
  return {
    key: 'route-key',
    name: 'home',
    ...overrides,
  };
}

export function buildState(
  overrides: Partial<NavigationStateLike> = {},
): NavigationStateLike {
  const routes = overrides.routes ?? [buildRoute()];
  return {
    key: 'state-key',
    type: 'stack',
    index: 0,
    routeNames: routes.map((r) => r.name),
    routes,
    stale: false,
    ...overrides,
  };
}
