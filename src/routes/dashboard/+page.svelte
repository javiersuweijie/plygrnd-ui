<script>
	import * as Card from '$lib/components/ui/card/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Table from "$lib/components/ui/table/index.js";
  import { Badge, badgeVariants } from "$lib/components/ui/badge/index.js";

  import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';

	export let data;
  let launches = data.launches;
</script>

<div class="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
  <h1 class="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">Dashboard</h1>
  <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-2">
	<Card.Root
		data-x-chunk-name="dashboard-05-chunk-1"
	>
		<Card.Header class="pb-2">
			<Card.Description>Costs per day</Card.Description>
			<Card.Title class="text-4xl">{data.costs}</Card.Title>
		</Card.Header>
	</Card.Root>
	<Card.Root
		data-x-chunk-name="dashboard-05-chunk-2"
	>
		<Card.Header class="pb-2">
			<Card.Description>This Month</Card.Description>
			<Card.Title class="text-3xl">$53.29</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="text-xs text-muted-foreground">+10% from last month</div>
		</Card.Content>
	</Card.Root>
  </div>
    <div class="grid gap-4 md:gap-8 lg:grid-cols-1 xl:grid-cols-1">
      <Card.Root
        class="xl:col-span-1"
        data-x-chunk-name="dashboard-01-chunk-4"
        data-x-chunk-description="A card showing a table of recent transactions with a link to view all transactions."
      >
        <Card.Header class="flex flex-row items-center">
          <div class="grid gap-2">
            <Card.Title>Playgrounds Launched</Card.Title>
            <Card.Description>All the playgrounds that you launched</Card.Description>
          </div>
          <Button href="##" size="sm" class="ml-auto gap-1">
            View All
            <ArrowUpRight class="h-4 w-4" />
          </Button>
        </Card.Header>
        <Card.Content>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Playground Name</Table.Head>
                <Table.Head class="xl:table.-column">Date Created</Table.Head>
                <Table.Head class="xl:table.-column">Status</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each launches as launch}
                <Table.Row>
                  <Table.Cell>
                    <div class="font-medium">{launch.playgrounds.name}</div>
                    <div class="text-sm text-muted-foreground md:inline">
                      {launch.playgrounds.repository_url}
                    </div>
                  </Table.Cell>
                  <Table.Cell class="md:table.-cell xl:table.-column" >
                    {new Date(launch.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}  {new Date(launch.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </Table.Cell>
                  <Table.Cell class="xl:table.-column">
                    <Badge class="text-xs"  variant="{launch.status === "RUNNING" ? 'secondary' : 'outline'}">{launch.status}</Badge>
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </Card.Content>
      </Card.Root>
  </div>
</div>
