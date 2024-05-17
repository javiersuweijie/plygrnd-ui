import { BID_CLOSED, closeDeployment, createLease, generateSDL, loadPrerequisites, sendManifest } from "$lib/server/akash";
import { json } from "@sveltejs/kit";

export async function POST({ request, locals: {supabase, user} }) {
    console.log(request);
    const { id } = await request.json();
    const response = await supabase.from("launches")
        .select()
        .filter("launched_by", "eq", user.id)
        .filter("dseq", "eq", +id);
    let launch  = response.data.length > 0 ? response.data[0] : null;

    if (!launch || launch.status === "CLOSED") {
        return json({ error: "Valid launch not found" }, { status: 404 });
    }

    console.log("launching deployment");
    const deployment = {
        id: {
            dseq: launch.dseq,
            owner: launch.owner
        }
    }
    const { wallet, client, certificate } = await loadPrerequisites();
    const { data: playground } = await supabase.from('playgrounds').select().eq('id', launch.playground_id).single();
    const sdl = generateSDL(playground.repository_url, playground.entrypoint, playground.need_gpu);

    const lease = await createLease(deployment, wallet, client);
    if (lease.status === BID_CLOSED) {
        console.log("bid closed, closing deployment");
        await closeDeployment(deployment, wallet, client);
        console.log("deployment closed");
        let {data} = await supabase.from('launches').update({status: "CLOSED"}).eq('dseq', deployment.id.dseq).select();
        console.log("launch updated to closed");
        return json(data[0])
    }
    console.log("lease", lease);

    const fetchRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=akash-network&vs_currencies=usd").then(json);
    const { usd } = fetchRes["akash-network"] || {usd: 5};
    const cost_per_second = usd * lease.price.amount / 1000000 / 6;

    await sendManifest(sdl, lease, wallet, certificate);
    console.log("end")

    let {data} = await supabase.from('launches').update({status: "LAUNCHING", provider: lease.id.provider, cost_per_second}).eq('dseq', deployment.id.dseq).select();
    console.log("launch updated to launching with provider", lease.id.provider, data);

    return json(data[0]);
}