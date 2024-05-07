<script>
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import Menu from 'lucide-svelte/icons/menu';
	import Package2 from 'lucide-svelte/icons/package-2';
	import Search from 'lucide-svelte/icons/search';
	import Star from 'lucide-svelte/icons/star';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';

	export let data;
</script>

<div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
	{#each data.playgrounds as playground}
		<Card.Root>
			<Card.Header>
				<Card.Title>{playground.name}</Card.Title>
			</Card.Header>
			<Card.Content>
				<img src="https://source.unsplash.com/400x200" alt="Random" />
				<br />
				<p>{playground.description}</p>
			</Card.Content>
			<Card.Footer>
				<div class="flex w-full justify-between">
					<div class="flex items-center">
						<Star class="mr-1 h-4 w-4" /><span>{playground.stars} Stars</span>
					</div>
					<form method="POST" action="/launch">
						<input name="playground.id" type="hidden" value={playground.id} />
						<Button variant="secondary" size="sm" type="submit">Launch</Button>
					</form>
				</div>
			</Card.Footer>
		</Card.Root>
	{/each}
</div>
