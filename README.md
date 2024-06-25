# tiny-svelte-fsm

A minimalistic finite state machine library for Svelte 5, heavily inspired by [kenkunz/svelte-fsm](https://github.com/kenkunz/svelte-fsm) — but strongly-typed, and powered by Svelte 5 runes.

FSMs are ideal for representing many different kinds of systems and interaction patterns. Stately's [xstate](https://github.com/statelyai/xstate) is an incredibly powerful library with more functionality. This is a much smaller and simpler library, and hopefully it's easy to understand.


## Usage

### Installation

`pnpm i @githubnext/tiny-svelte-fsm`

### Introduction

Every state machine is defined as a collection of _states_ and _events_. To define a state machine, create a list of the valid states and events:

```ts
type myStates = 'on' | 'off';
type myEvents = 'toggle';
```

Next, create the actual state machine:

```ts
const f = fsm<myStates, myEvents>('off', {
	off: {
		toggle: 'on'
	},
	on: {
		toggle: 'off'
	}
});
```

The first argument is the initial state. The second argument is an object with one key for each state. Each state then describes which events are valid for that state, and which state that event should lead to.

In the above example of a simple switch, there are two states (`on` and `off`). The `toggle` event in either state leads to the other state.

You send events to the fsm using `f.send`. To send the `toggle` event, invoke `f.send('toggle')`.

### Actions

Maybe you want fancier logic for an event handler, or you want to conditionally transition into another state:

```ts
type myStates = 'on' | 'off' | 'cooldown';

const f = fsm<myStates, myEvents>('off', {
	off: {
		toggle: () => {
			// You can prevent state transitions from happening by returning nothing.
			if (isTuesday) {
				// switch can only turn on during Tuesdays
				return 'on'
			}
		}
	},
	on: {
		toggle: (heldMillis: number) => {
			// You can also dynamically return the next state
			// only turn off if switch is depressed for 3 seconds
			// otherwise enter the `cooldown` state
			return heldMillis > 3000 ? 'off' : 'cooldown'
		}
	}
});
```

### Lifecycle methods

You can define special handlers that are invoked whenever a state is entered or exited:

```ts
const f = fsm<myStates, myEvents>('off', {
	off: {
		toggle: 'on'
		_enter: () => { console.log('switch is off')}
		_exit: () => { console.log('switch is no longer off')}
	},
	on: {
		toggle: 'off'
		_enter: () => { console.log('switch is on')}
		_exit: () => { console.log('switch is no longer on')}
	}
});
```

The lifecycle methods are invoked with an argument containing useful metadata:

- `from`: the name of the event that is being exited
- `to`: the name of the event that is being entered
- `event`: the name of the event which has triggered the transition
- `args`: (optional) you may pass additional metadata when invoking an action with `f.send('theAction', additional, params, as, args)`

The `_enter` handler for the initial state is called upon creation of the FSM. It is invoked with both the `from` and `event` fields set to `null`.

### Wildcard handlers

There is one special state used as a fallback: `*`. If you attempt to `send()` an event that is not handled by the current state, it will try to find a handler for that event on the `*` state:

```ts
const f = fsm<myStates, myEvents>('off', {
	off: {
		toggle: 'on'
	},
	on: {
		toggle: 'off'
	}
	'*': {
		emergency: 'off'
	}
});

// will always result in the switch turning off.
f.send('emergency');
```

### Debouncing

Frequently, you want to transition to another state after some time has elapsed. To do this, use the `debounce` method:

```ts
f.send('toggle'); // turn on immediately
f.debounce(5000, 'toggle'); // turn off in 5000 milliseconds
```

If you re-invoke debounce with the same event, it will cancel the existing timer and start the countdown over:

```ts
// schedule a toggle in five seconds
f.debounce(5000, 'toggle');

// Cancels the original timer, and starts a fresh one:
f.debounce(5000, 'toggle'); 
```