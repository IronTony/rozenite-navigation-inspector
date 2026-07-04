// Runtime resolver for the navigation values the plugin needs
// (useNavigationContainerRef, CommonActions, StackActions).
//
// Across the supported runtimes these live in different places:
//   - Expo Router 6 / SDK 56: @react-navigation/* no longer exist; React
//     Navigation is vendored under expo-router/build/react-navigation, and the
//     public useNavigationContainerRef is exported from expo-router itself.
//   - Older Expo Router (<= SDK 53): expo-router still depends on the real
//     @react-navigation/native package and re-exports the hook publicly.
//   - Bare React Navigation: everything comes from @react-navigation/native.
//
// Each require below is a string literal inside its own try/catch. Metro treats
// require() calls in a try/catch as OPTIONAL dependencies, so an absent module
// does not fail the consumer's bundle. A variable argument would defeat this
// (Metro cannot statically resolve it), so the three sources are kept separate.

import type { NavigationRefLike } from './navigation-types';

type UseNavigationContainerRef = () => NavigationRefLike;

type NavigationActions = {
  navigate: (...args: unknown[]) => unknown;
};

type StackActionsLike = {
  push: (...args: unknown[]) => unknown;
  replace: (...args: unknown[]) => unknown;
};

function loadExpoRouterPublic(): any {
  try {
    return require('expo-router');
  } catch {
    return null;
  }
}

function loadExpoRouterVendoredNavigation(): any {
  try {
    return require('expo-router/build/react-navigation');
  } catch {
    return null;
  }
}

function loadReactNavigationNative(): any {
  try {
    return require('@react-navigation/native');
  } catch {
    return null;
  }
}

const expoPublic = loadExpoRouterPublic();
const expoVendored = loadExpoRouterVendoredNavigation();
const reactNav = loadReactNavigationNative();

// Stable fallback so the exported hook is always callable. Used only when no
// navigation library is installed, which is a degenerate case in a real app.
const NOOP_NAVIGATION_REF: NavigationRefLike = {
  current: null,
  isReady: () => false,
  getRootState: () => undefined,
  addListener: () => () => undefined,
  dispatch: () => undefined,
};

const noopUseNavigationContainerRef: UseNavigationContainerRef = () =>
  NOOP_NAVIGATION_REF;

// Prefer the non-deprecated public expo-router hook, then the vendored copy,
// then the standalone package.
export const useNavigationContainerRef: UseNavigationContainerRef =
  expoPublic?.useNavigationContainerRef ??
  expoVendored?.useNavigationContainerRef ??
  reactNav?.useNavigationContainerRef ??
  noopUseNavigationContainerRef;

export const CommonActions: NavigationActions | null =
  expoVendored?.CommonActions ?? reactNav?.CommonActions ?? null;

export const StackActions: StackActionsLike | null =
  expoVendored?.StackActions ?? reactNav?.StackActions ?? null;
