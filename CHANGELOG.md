# Changelog

## [1.2.0] - 2026-07-04

### Added

- **Test suite**: Jest + ts-jest + Testing Library covering the adapters, tree/state/sitemap builders, the runtime resolver, and the native hook. New `typecheck`, `test`, and `test:coverage` scripts.
- `@react-navigation/native` is now an optional peer dependency via `peerDependenciesMeta`.

### Changed

- Navigation runtime (`StackActions`, `CommonActions`, `useNavigationContainerRef`) is resolved at module load from `expo-router` or `@react-navigation/native` via the new `shared/navigation-runtime` module.
- Source decoupled from hard `@react-navigation/native` imports using structural `NavigationRefLike` / `NavigationStateLike` types.
- `tsconfig` lib bumped from ES2020 to ES2021.

### Fixed

- React Navigation adapter no longer dispatches when the resolved action creators are absent (null guards on `StackActions` / `CommonActions`).

## [1.1.0] - 2026-03-04

### Added

- **React Navigation support**: The plugin now works with plain React Navigation apps (without Expo Router). The hook auto-detects which router is available at runtime.
- New `react-navigation-adapter` that uses `CommonActions`/`StackActions` for navigation and state-based route discovery.
- `useNavigationInspector()` now returns a `navigationRef` that React Navigation users pass to `<NavigationContainer ref={navigationRef}>`. Expo Router users can ignore the return value.
- `expo-router` is now an optional peer dependency via `peerDependenciesMeta`.

### Changed

- Replaced static `import from 'expo-router'` with lazy runtime `require()` inside try/catch to prevent crashes in non-Expo apps.
- Public return type changed from `NavigationContainerRefWithCurrent<ParamListBase>` to `{ current: any }` for cross-package type compatibility.
- Updated README with React Navigation setup instructions and compatibility table.

## [1.0.2] - 2025-01-15

### Fixed

- Prevent navigation inspector from breaking other Rozenite plugins when setup fails.

## [1.0.1] - 2025-01-14

### Added

- Initial release with Expo Router support.
- Real-time navigation tree visualization.
- Sitemap view with visited-route tracking.
- Navigation timeline with event classification.
- Navigation console with route autocomplete.
