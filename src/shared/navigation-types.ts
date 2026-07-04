// Local structural types for the navigation primitives this plugin reads.
// The plugin only touches a tiny subset of React Navigation's surface, so it
// describes that subset structurally instead of importing types from
// @react-navigation/* or expo-router. That keeps the plugin decoupled from the
// exact package layout, which changed in Expo Router 6 / SDK 56 where the
// standalone @react-navigation/* packages no longer exist.

export type NavigationRouteLike = {
  key: string;
  name: string;
  params?: object;
  path?: string;
  state?: NavigationStateLike;
};

export type NavigationStateLike = {
  key: string;
  type: string;
  index: number;
  routeNames: string[];
  routes: NavigationRouteLike[];
  stale?: boolean;
};

export type NavigationStateListenerEvent = {
  data: { state: NavigationStateLike | undefined };
};

export type NavigationRefLike = {
  current: unknown;
  isReady(): boolean;
  getRootState(): NavigationStateLike | undefined;
  addListener(
    type: 'state',
    callback: (event: NavigationStateListenerEvent) => void,
  ): () => void;
  dispatch(action: unknown): void;
};

export type ExpoRouterLike = {
  push(href: unknown): void;
  replace(href: unknown): void;
  navigate(href: unknown): void;
};

export type RouteNodeLike = {
  type: string;
  route: string;
  children: RouteNodeLike[];
  internal?: boolean;
  generated?: boolean;
  dynamic: Array<{ name: string }> | null;
};
