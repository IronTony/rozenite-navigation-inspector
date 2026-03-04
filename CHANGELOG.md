# Changelog

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
