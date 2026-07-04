import { diffStates } from './state-differ';
import { buildRoute, buildState } from './test-helpers/navigation-state';

describe('diffStates', () => {
  it('classifies the first state as a navigate event with no fromRoute', () => {
    const next = buildState({ routes: [buildRoute({ name: 'home' })] });

    const event = diffStates(undefined, next);

    expect(event.type).toBe('navigate');
    expect(event.fromRoute).toBeNull();
    expect(event.toRoute?.name).toBe('home');
    expect(event.id).toMatch(/^nav-/);
    expect(typeof event.timestamp).toBe('number');
  });

  it('detects a push when the stack grows', () => {
    const prev = buildState({
      index: 0,
      routes: [buildRoute({ key: 'a', name: 'home' })],
    });
    const next = buildState({
      index: 1,
      routes: [
        buildRoute({ key: 'a', name: 'home' }),
        buildRoute({ key: 'b', name: 'details' }),
      ],
    });

    expect(diffStates(prev, next).type).toBe('push');
  });

  it('detects a pop when the stack shrinks', () => {
    const prev = buildState({
      index: 1,
      routes: [
        buildRoute({ key: 'a', name: 'home' }),
        buildRoute({ key: 'b', name: 'details' }),
      ],
    });
    const next = buildState({
      index: 0,
      routes: [buildRoute({ key: 'a', name: 'home' })],
    });

    expect(diffStates(prev, next).type).toBe('pop');
  });

  it('detects a replace when the top route name changes at the same depth', () => {
    const prev = buildState({
      index: 0,
      routes: [buildRoute({ key: 'a', name: 'home' })],
    });
    const next = buildState({
      index: 0,
      routes: [buildRoute({ key: 'a', name: 'profile' })],
    });

    expect(diffStates(prev, next).type).toBe('replace');
  });

  it('detects a tab switch when the active index changes inside a tab navigator', () => {
    const prev = buildState({
      type: 'tab',
      index: 0,
      routes: [
        buildRoute({ key: 'a', name: 'feed' }),
        buildRoute({ key: 'b', name: 'inbox' }),
      ],
    });
    const next = buildState({
      type: 'tab',
      index: 1,
      routes: [
        buildRoute({ key: 'a', name: 'feed' }),
        buildRoute({ key: 'b', name: 'inbox' }),
      ],
    });

    expect(diffStates(prev, next).type).toBe('tab-switch');
  });

  it('traverses into the deepest shared navigator before classifying', () => {
    const prevInner = buildState({
      key: 'inner',
      type: 'stack',
      index: 0,
      routes: [buildRoute({ key: 'x', name: 'list' })],
    });
    const nextInner = buildState({
      key: 'inner',
      type: 'stack',
      index: 1,
      routes: [
        buildRoute({ key: 'x', name: 'list' }),
        buildRoute({ key: 'y', name: 'item' }),
      ],
    });
    const prev = buildState({
      routes: [buildRoute({ key: 'tab', name: 'home', state: prevInner })],
    });
    const next = buildState({
      routes: [buildRoute({ key: 'tab', name: 'home', state: nextInner })],
    });

    expect(diffStates(prev, next).type).toBe('push');
  });
});
