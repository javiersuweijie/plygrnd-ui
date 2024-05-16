<script>
	import { LoaderCircle } from 'lucide-svelte';
	import Star from 'lucide-svelte/icons/star';

	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from "$lib/components/ui/select/index.js";


	import { enhance } from '$app/forms';

	export let data;

	let launching;
	let launchingPlayground = (id) => () => {
		launching = id;
		return true
	};

	const gpus = [
		'NONE',
		'NVIDIA A100',
		'NVIDIA RTX4090'
	]
</script>

<div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
	{#each data.playgrounds as playground}
		<Card.Root class='flex flex-col'>
			<Card.Header>
				<Card.Title>{playground.name}</Card.Title>
				<p class="text-xs font-mono overflow-hidden">{playground.repository_url}</p>
			</Card.Header>
			<Card.Content>
				<img src="https://source.unsplash.com/200x100?{playground.name}" alt="Random" />
				<br />
				<p>{playground.description}</p>
			</Card.Content>
			<Card.Footer class='mt-auto'>
				<div class="flex w-full justify-between">
					<div class="flex items-center">
						<Star class="mr-1 h-4 w-4" /><span>{playground.stars} Stars</span>
					</div>
					<form on:submit={launchingPlayground(playground.id)} method="POST" action="/launch">
						<input name="playground.id" type="hidden" value={playground.id} />
						<Button variant="secondary" size="sm" type="submit" disabled={!!launching}>
							{#if launching && launching === playground.id}
								<LoaderCircle class="animate-spin"></LoaderCircle>
							{:else}
								Launch
							{/if}
						</Button>
					</form>
				</div>
			</Card.Footer>
		</Card.Root>
	{/each}
	<Card.Root class='flex flex-col'>
		<Card.Header>
		</Card.Header>
		<Card.Content class="flex w-full flex-col items-center flex-1 justify-center">
			<Card.Title>Add your own playground</Card.Title>
			<Dialog.Root>
				<Dialog.Trigger class="{buttonVariants({ variant: "outline" })} mt-4"
				  >Create</Dialog.Trigger
				>
				<Dialog.Content class="sm:max-w-[425px]">
				  <Dialog.Header>
					<Dialog.Title>Create Playground</Dialog.Title>
					<Dialog.Description>
						Use any huggingface spaces URL to create a playground. You can also use a GitHub repository URL but you will need to specify the entrypoint.
					</Dialog.Description>
				  </Dialog.Header>
				  <div class="grid gap-4 py-4">
					<div class="grid grid-cols-4 items-center gap-4">
					  <Label for="name" class="text-right">Name</Label>
					  <Input id="name" value="" class="col-span-3" />
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
					  <Label for="username" class="text-right">Repository URL</Label>
					  <Input id="username" value="" class="col-span-3" />
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
					  <Label for="username" class="text-right">Entrypoint</Label>
					  <Input id="username" value="app.py" class="col-span-3" />
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
					  <Label for="username" class="text-right">GPU Selection</Label>
					  <Select.Root portal={null}>
						<Select.Trigger class="w-full col-span-3">
						  <Select.Value placeholder="Select class of GPU to use" />
						</Select.Trigger>
						<Select.Content>
						  <Select.Group>
							{#each gpus as gpu}
							  <Select.Item value={gpu} label={gpu}
								>{gpu}</Select.Item
							  >
							{/each}
						  </Select.Group>
						</Select.Content>
						<Select.Input name="favoriteFruit" />
					  </Select.Root>
					</div>
				  </div>
				  <Dialog.Footer>
					<Button type="submit">Create</Button>
				  </Dialog.Footer>
				</Dialog.Content>
			  </Dialog.Root>
		</Card.Content>
		<Card.Footer class='mt-auto'>
		</Card.Footer>
	</Card.Root>
</div>
