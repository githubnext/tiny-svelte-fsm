<script lang="ts">
	import { fsm } from '$lib/fsm.svelte';

	type myStates = 'on' | 'off';
	type myEvents = 'toggle';

	const f = fsm<myStates, myEvents>('off', {
		off: {
			toggle: 'on'
		},
		on: {
			toggle: 'off'
		}
	});
</script>

<h1>tiny-svelte-fsm</h1>

<div>
	<p>Current state: {f.current}</p>
	<button on:click={() => f.send('toggle')}>Toggle</button>
</div>

<div>
	<p>The above toggle is powered by this very simple state machine:</p>
	<pre class="tab2"><code>{`
type myStates = 'on' | 'off';
type myEvents = 'toggle';

const f = fsm<myStates, myEvents>('off', {
	off: {
		toggle: 'on'
	},
	on: {
		toggle: 'off'
	}
});
`}</code></pre>
</div>

<style>
	.tab2 {
		tab-size: 2;
	}
</style>