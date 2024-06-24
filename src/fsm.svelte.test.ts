import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fsm, type Action } from '$lib/fsm.svelte.js';

describe('FSM of a simple toggle switch', () => {
	type myStates = 'on' | 'off';
	type myEvents = 'toggle';

	let f: ReturnType<typeof fsm>;
	const offEnterHandler = vi.fn();
	const offExitHandler = vi.fn();
	const onEnterHandler = vi.fn();
	const onExitHandler = vi.fn();
	beforeEach(() => {
		offEnterHandler.mockClear();
		offExitHandler.mockClear();
		onEnterHandler.mockClear();
		onExitHandler.mockClear();
		f = fsm<myStates, myEvents>('off', {
			off: {
				toggle: 'on',
				_enter: offEnterHandler,
				_exit: offExitHandler
			},
			on: {
				toggle: 'off',
				_enter: onEnterHandler,
				_exit: onExitHandler
			}
		});
	});

	it('starts in the off state', () => {
		expect(f.current).toBe('off');
	});

	it('toggles to on', () => {
		f.send('toggle');
		expect(f.current).toBe('on');
	});

	it('toggles to off', () => {
		f.send('toggle');
		f.send('toggle');
		expect(f.current).toBe('off');
	});

	it('does nothing for missing events', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		f.send('missing');
		expect(f.current).toBe('off');
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(
			'No action defined for event',
			'missing',
			'in state',
			'off'
		);
		warnSpy.mockRestore();
	});

	it('synthetically calls _enter handler for initial state', () => {
		expect(f.current).toBe('off');
		expect(offEnterHandler).toHaveBeenCalledTimes(1);
		expect(offExitHandler).not.toHaveBeenCalled();
		expect(onEnterHandler).not.toHaveBeenCalled();
		expect(onExitHandler).not.toHaveBeenCalled();
	});

	it('calls _enter and _exit handlers', () => {
		f.send('toggle');
		expect(f.current).toBe('on');
		expect(offEnterHandler).toHaveBeenCalledTimes(1);
		expect(offExitHandler).toHaveBeenCalledTimes(1);
		expect(onEnterHandler).toHaveBeenCalledTimes(1);
		expect(onExitHandler).not.toHaveBeenCalled();
	});

	it('passes arguments array to _enter and _exit handlers', () => {
		const args = [1, 2, 3];
		f.send('toggle', ...args);
		expect(offEnterHandler).toHaveBeenCalledWith({ from: null, to: 'off', event: null, args: [] });
		expect(offExitHandler).toHaveBeenCalledWith({ from: 'off', to: 'on', event: 'toggle', args });
		expect(onEnterHandler).toHaveBeenCalledWith({ from: 'off', to: 'on', event: 'toggle', args });
		expect(onExitHandler).not.toHaveBeenCalled();
	});

	it('passes a single argument to _enter and _exit handlers', () => {
		const origin = { x: 0, y: 0 };
		f.send('toggle', origin);
		expect(offEnterHandler).toHaveBeenCalledWith({ from: null, to: 'off', event: null, args: [] });
		expect(offExitHandler).toHaveBeenCalledWith({
			from: 'off',
			to: 'on',
			event: 'toggle',
			args: [origin]
		});
		expect(onEnterHandler).toHaveBeenCalledWith({
			from: 'off',
			to: 'on',
			event: 'toggle',
			args: [origin]
		});
		expect(onExitHandler).not.toHaveBeenCalled();
	});
});

describe('FSM which uses action handlers instead of strings', () => {
	type myStates = 'on' | 'off';
	type myEvents = 'toggle';

	let f: ReturnType<typeof fsm>;
	const offEnterHandler = vi.fn();
	const offExitHandler = vi.fn();
	const onEnterHandler = vi.fn();
	const onExitHandler = vi.fn();
	const toggleOnAction = vi.fn(() => 'on');
	const toggleOffAction = vi.fn(() => 'off');
	beforeEach(() => {
		offEnterHandler.mockClear();
		offExitHandler.mockClear();
		onEnterHandler.mockClear();
		onExitHandler.mockClear();
		toggleOnAction.mockClear();
		toggleOffAction.mockClear();
		f = fsm<myStates, myEvents>('off', {
			off: {
				toggle: toggleOnAction as Action<myStates>,
				_enter: offEnterHandler,
				_exit: offExitHandler
			},
			on: {
				toggle: toggleOffAction as Action<myStates>,
				_enter: onEnterHandler,
				_exit: onExitHandler
			}
		});
	});

	it('toggles to another state', () => {
		f.send('toggle');
		expect(toggleOnAction).toHaveBeenCalledTimes(1);
		expect(toggleOffAction).not.toHaveBeenCalled();
		expect(f.current).toBe('on');
	});

	it('does nothing for missing events', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		f.send('notAnEvent');
		expect(toggleOnAction).not.toHaveBeenCalled();
		expect(toggleOffAction).not.toHaveBeenCalled();
		expect(f.current).toBe('off');
		warnSpy.mockRestore();
	});
});

describe('FSM which uses wildcard handlers', () => {
	type myStates = 'on' | 'off';
	type myEvents = 'toggle' | 'foo';

	let f: ReturnType<typeof fsm>;
	const offEnterHandler = vi.fn();
	const offExitHandler = vi.fn();
	const onEnterHandler = vi.fn();
	const onExitHandler = vi.fn();
	const wildcardHandler = vi.fn(() => 'off');
	beforeEach(() => {
		offEnterHandler.mockClear();
		offExitHandler.mockClear();
		onEnterHandler.mockClear();
		onExitHandler.mockClear();
		wildcardHandler.mockClear();
		f = fsm<myStates, myEvents>('off', {
			off: {
				toggle: 'on',
				_enter: offEnterHandler,
				_exit: offExitHandler
			},
			on: {
				toggle: 'off',
				_enter: onEnterHandler,
				_exit: onExitHandler
			},
			'*': {
				foo: wildcardHandler as Action<myStates>,
				toggle: wildcardHandler as Action<myStates>
			}
		});
	});

	it('falls back to the wildcard state for missing events', () => {
		f.send('toggle');
		f.send('foo');
		expect(wildcardHandler).toHaveBeenCalledTimes(1);
		expect(f.current).toBe('off');
	});

	it('does not fall back to the wildcard state when it does not need to', () => {
		f.send('toggle');
		expect(wildcardHandler).not.toHaveBeenCalled();
		expect(f.current).toBe('on');
	});
});

describe('FSM which uses async debounce', () => {
	type myStates = 'on' | 'off';
	type myEvents = 'toggle';

	let f: ReturnType<typeof fsm>;
	const toggleOnAction = vi.fn(() => 'on');
	const toggleOffAction = vi.fn(() => 'off');
	const offEnterHandler = vi.fn();
	const offExitHandler = vi.fn();
	const onEnterHandler = vi.fn();
	const onExitHandler = vi.fn();
	beforeEach(() => {
		toggleOnAction.mockClear();
		toggleOffAction.mockClear();
		offEnterHandler.mockClear();
		offExitHandler.mockClear();
		onEnterHandler.mockClear();
		onExitHandler.mockClear();
		f = fsm<myStates, myEvents>('off', {
			off: {
				toggle: toggleOnAction as Action<myStates>,
				_enter: offEnterHandler,
				_exit: offExitHandler
			},
			on: {
				toggle: toggleOffAction as Action<myStates>,
				_enter: onEnterHandler,
				_exit: onExitHandler
			}
		});
	});

	it('debounces the event', async () => {
		await Promise.any([f.debounce(50, 'toggle'), f.debounce(50, 'toggle')]);
		expect(toggleOnAction).toHaveBeenCalledTimes(1);
		expect(toggleOffAction).not.toHaveBeenCalled();
		expect(f.current).toBe('on');
	});

	it('debounces the event with different wait times', async () => {
		await Promise.any([f.debounce(100, 'toggle'), f.debounce(50, 'toggle')]);
		expect(toggleOnAction).toHaveBeenCalledTimes(1);
		expect(toggleOffAction).not.toHaveBeenCalled();
		expect(f.current).toBe('on');
	});

	it('invokes enter and exit handlers for debounced events', async () => {
		await f.debounce(100, 'toggle');
		expect(offEnterHandler).toHaveBeenCalledTimes(1);
		expect(offExitHandler).toHaveBeenCalledTimes(1);
		expect(onEnterHandler).toHaveBeenCalledTimes(1);
		expect(onExitHandler).not.toHaveBeenCalled();
	});
});
