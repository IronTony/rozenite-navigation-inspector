// No navigation library is mocked here, so every optional require throws and is
// caught. This exercises the catch branches and the no-op hook fallback.
import {
  useNavigationContainerRef,
  CommonActions,
  StackActions,
} from './navigation-runtime'

describe('navigation-runtime resolver with no navigation library present', () => {
  it('exposes null actions and a callable no-op hook', () => {
    expect(CommonActions).toBeNull()
    expect(StackActions).toBeNull()
    expect(typeof useNavigationContainerRef).toBe('function')

    const ref = useNavigationContainerRef()
    expect(ref.current).toBeNull()
    expect(ref.isReady()).toBe(false)
    expect(ref.getRootState()).toBeUndefined()
    expect(typeof ref.addListener('state', () => undefined)).toBe('function')
    expect(() => ref.dispatch({})).not.toThrow()
  })
})
