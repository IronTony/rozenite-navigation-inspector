import type {
  NavigationRefLike,
  NavigationStateLike,
} from '../shared/navigation-types'

export type FakeNavigationRef = {
  ref: NavigationRefLike
  dispatched: unknown[]
  emit: (state: NavigationStateLike | undefined) => void
  isRemoved: () => boolean
}

export function createFakeNavigationRef(
  opts: {
    state?: NavigationStateLike
    current?: unknown
    ready?: boolean
  } = {}
): FakeNavigationRef {
  const dispatched: unknown[] = []
  let listener:
    | ((event: { data: { state: NavigationStateLike | undefined } }) => void)
    | null = null
  let removed = false

  const ref: NavigationRefLike = {
    current: 'current' in opts ? opts.current : {},
    isReady: () => opts.ready ?? true,
    getRootState: () => opts.state,
    addListener: (_type, cb) => {
      listener = cb
      return () => {
        removed = true
      }
    },
    dispatch: (action) => {
      dispatched.push(action)
    },
  }

  return {
    ref,
    dispatched,
    emit: (state) => listener?.({ data: { state } }),
    isRemoved: () => removed,
  }
}
