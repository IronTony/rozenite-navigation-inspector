const ID_EXPO_PUBLIC = 'expo-router'
const ID_EXPO_VENDORED = 'expo-router/build/react-navigation'
const ID_REACT_NAVIGATION = '@react-navigation/native'

type ModuleShape = Record<string, unknown>

function mockModules(modules: Record<string, ModuleShape>) {
  // Every test mocks all three sources so the latest registration fully
  // determines resolution (no leftover state from a previous test).
  jest.doMock(ID_EXPO_PUBLIC, () => modules[ID_EXPO_PUBLIC] ?? {}, {
    virtual: true,
  })
  jest.doMock(ID_EXPO_VENDORED, () => modules[ID_EXPO_VENDORED] ?? {}, {
    virtual: true,
  })
  jest.doMock(ID_REACT_NAVIGATION, () => modules[ID_REACT_NAVIGATION] ?? {}, {
    virtual: true,
  })
  return require('./navigation-runtime')
}

beforeEach(() => {
  jest.resetModules()
})

describe('navigation-runtime resolver', () => {
  it('uses the public expo-router hook and vendored actions on Expo Router 6', () => {
    const publicHook = jest.fn()
    const CommonActions = { navigate: jest.fn() }
    const StackActions = { push: jest.fn(), replace: jest.fn() }

    const runtime = mockModules({
      [ID_EXPO_PUBLIC]: { useNavigationContainerRef: publicHook },
      [ID_EXPO_VENDORED]: {
        useNavigationContainerRef: jest.fn(),
        CommonActions,
        StackActions,
      },
      // @react-navigation/native absent under SDK 56.
    })

    expect(runtime.useNavigationContainerRef).toBe(publicHook)
    expect(runtime.CommonActions).toBe(CommonActions)
    expect(runtime.StackActions).toBe(StackActions)
  })

  it('falls back to @react-navigation/native actions on older Expo Router', () => {
    const publicHook = jest.fn()
    const CommonActions = { navigate: jest.fn() }
    const StackActions = { push: jest.fn(), replace: jest.fn() }

    const runtime = mockModules({
      [ID_EXPO_PUBLIC]: { useNavigationContainerRef: publicHook },
      // No vendored react-navigation in older SDKs.
      [ID_REACT_NAVIGATION]: {
        useNavigationContainerRef: jest.fn(),
        CommonActions,
        StackActions,
      },
    })

    expect(runtime.useNavigationContainerRef).toBe(publicHook)
    expect(runtime.CommonActions).toBe(CommonActions)
    expect(runtime.StackActions).toBe(StackActions)
  })

  it('resolves everything from @react-navigation/native in a bare React Navigation app', () => {
    const hook = jest.fn()
    const CommonActions = { navigate: jest.fn() }
    const StackActions = { push: jest.fn(), replace: jest.fn() }

    const runtime = mockModules({
      // expo-router absent in a bare RN app.
      [ID_REACT_NAVIGATION]: {
        useNavigationContainerRef: hook,
        CommonActions,
        StackActions,
      },
    })

    expect(runtime.useNavigationContainerRef).toBe(hook)
    expect(runtime.CommonActions).toBe(CommonActions)
    expect(runtime.StackActions).toBe(StackActions)
  })
})
