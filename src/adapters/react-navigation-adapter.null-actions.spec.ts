import { createFakeNavigationRef } from '../test-helpers/fake-navigation-ref'

// Simulates an environment where no navigation library resolved the action
// creators (e.g. a bare app missing @react-navigation/native). navigate() must
// no-op instead of throwing.
jest.mock('../shared/navigation-runtime', () => ({
  StackActions: null,
  CommonActions: null,
  useNavigationContainerRef: jest.fn(),
}))

import { createReactNavigationAdapter } from './react-navigation-adapter'

describe('createReactNavigationAdapter without action creators', () => {
  it('no-ops every navigate intent instead of dispatching', () => {
    const fake = createFakeNavigationRef()
    const adapter = createReactNavigationAdapter(fake.ref)

    adapter.navigate?.('/home', undefined, 'push')
    adapter.navigate?.('/home', undefined, 'replace')
    adapter.navigate?.('/home', undefined, 'navigate')

    expect(fake.dispatched).toHaveLength(0)
  })
})
