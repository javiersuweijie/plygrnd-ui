<script>
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import Menu from 'lucide-svelte/icons/menu';
	import Package2 from 'lucide-svelte/icons/package-2';
	import Search from 'lucide-svelte/icons/search';
	import Star from 'lucide-svelte/icons/star';
	import  CirclePlus  from 'lucide-svelte/icons/circle-plus';

	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import '../app.pcss';

	import { goto, invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loadStripe } from '@stripe/stripe-js';

	export let data;
	$: ({ session, supabase} = data);
	let balance = data.balance;

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});

	function logout() {
		supabase.auth.signOut();
	}

	let paymentDialog = false;
	let displayStripe = false;
	let checkout;

	async function openPaymentDialog() {
		paymentDialog = true;
		setTimeout(async () => {
			const res = await fetch('/api/payment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({})
			});
			const { clientSecret } = await res.json();
			const stripe = await loadStripe("pk_test_51PHFI9FspKI3SJpm8MpJps4PrqQXjcfU1D6E28kgz4YhiWY9SL87bYFC2MwXxm8aFjIIQPabAnOAf6WELD0TumUg00WQyJh8ur");
			checkout = await stripe.initEmbeddedCheckout({ clientSecret });
			// Mount Checkout
			checkout.mount('#checkout');
			displayStripe = true;
		}, 100)
	}

	function onCloseDialog() {
		paymentDialog = false;
		displayStripe = false;
		checkout.unmount('#checkout');
		checkout.destroy();
		checkout = null;
	}
</script>

<div class="flex min-h-screen w-full flex-col">
	<header class="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
		<nav
			class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
		>
			<span class="flex items-center gap-2 text-lg font-semibold md:text-base">
				<Package2 class="h-6 w-6" />
				<span class="sr-only">Akash Playground</span>
			</span>
			<a href="/" class="text-foreground transition-colors hover:text-foreground"> Home </a>
			<a href="/explore" class="text-muted-foreground hover:text-foreground"> Explore </a>
			<a href="/dashboard" class="text-muted-foreground hover:text-foreground"> Dashboard </a>
			<a href="/explore" class="text-muted-foreground hover:text-foreground"> Datasets </a>
			<a href="/explore" class="text-muted-foreground hover:text-foreground"> Community </a>
		</nav>
		<Sheet.Root>
			<Sheet.Trigger asChild let:builder>
				<Button variant="outline" size="icon" class="shrink-0 md:hidden" builders={[builder]}>
					<Menu class="h-5 w-5" />
					<span class="sr-only">Toggle navigation menu</span>
				</Button>
			</Sheet.Trigger>
			<Sheet.Content side="left">
				<nav class="grid gap-6 text-lg font-medium">
					<a href="##" class="flex items-center gap-2 text-lg font-semibold">
						<Package2 class="h-6 w-6" />
						<span class="sr-only">Akash Playground</span>
					</a>
					<a href="/" class="hover:text-foreground"> Home </a>
					<a href="/explore" class="text-muted-foreground hover:text-foreground"> Explore </a>
					<a href="/" class="text-muted-foreground hover:text-foreground"> Datasets </a>
					<a href="/" class="text-muted-foreground hover:text-foreground"> Community </a>
				</nav>
			</Sheet.Content>
		</Sheet.Root>
		<div class="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
			<form class="ml-auto flex-1 sm:flex-initial">
				<div class="relative">
					<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search playgrounds..."
						class="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
					/>
				</div>
			</form>
			{#if session}
			<div class="flex flex-row justify-center items-center">
				<div>
					{#if !balance || balance.amount === 0}
						Top up
					{:else}
						{balance.amount.toLocaleString('en-US', {
							style: 'currency',
							currency: 'USD',
						})}
					{/if}
				  </div>
				<button class="ml-2 hover:cursor-pointer" on:click={openPaymentDialog}>
					<CirclePlus size="20"/>
				</button>
				<Dialog.Root open={paymentDialog} onOutsideClick={onCloseDialog}>
					<Dialog.ContentWithoutClose class="flex flex-1 items-center justify-center">
						{#if !displayStripe}
							<div class="font-bold text-lg">Generating Payment Page...</div>
						{/if}
						<div id="checkout"></div>
					</Dialog.ContentWithoutClose>
				</Dialog.Root>
			</div>
			<DropdownMenu.Root >
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]} variant="secondary" size="icon" class="rounded-full">
						<CircleUser class="h-5 w-5" />
						<span class="sr-only">Toggle user menu</span>
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Label>My Account</DropdownMenu.Label>
					<DropdownMenu.Item>Support</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item on:click={logout}>Logout</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			{:else}
				<a href="/login" class="text-muted-foreground hover:text-foreground"> Login </a>
			{/if}
		</div>
	</header>
	<main class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
		<slot></slot>
	</main>
</div>
