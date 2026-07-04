/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Specs use virtual module mocks (expo-router, @react-navigation/native) for
  // the same ids across files. Run serially so the mock registry is
  // deterministic and never races across parallel workers.
  maxWorkers: 1,
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts', '**/*.spec.tsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          jsx: 'react-jsx',
          esModuleInterop: true,
        },
      },
    ],
  },
  // Coverage is scoped to the code changed for the Expo Router 6 migration.
  collectCoverageFrom: [
    'src/shared/navigation-runtime.ts',
    'src/adapters/react-navigation-adapter.ts',
    'src/adapters/expo-router-adapter.ts',
    'src/tree-builder.ts',
    'src/state-differ.ts',
    'src/sitemap-builder.ts',
    'src/useNavigationInspectorNative.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
