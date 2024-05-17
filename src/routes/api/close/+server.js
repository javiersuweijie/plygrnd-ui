import { closeDeployment, loadPrerequisites } from "$lib/server/akash";
import { json } from "@sveltejs/kit";

export async function POST({ request, locals: {supabase, supabaseAdmin, user} }) {
    const { id } = await request.json();
    const response = await supabase.from("launches")
        .select()
        .filter("launched_by", "eq", user.id)
        .filter("dseq", "eq", +id);
    let launch  = response.data.length > 0 ? response.data[0] : null;

    if (!launch || launch.status === "CLOSED") {
        return json({ error: "Valid launch not found" }, { status: 404 });
    }

    console.log("closing deployment");
    const deployment = {
        id: {
            dseq: launch.dseq,
            owner: launch.owner
        }
    }
    const { wallet, client } = await loadPrerequisites();
    await closeDeployment(deployment, wallet, client);
    let {data} = await supabase.from('launches').update({status: "CLOSED"}).eq('dseq', deployment.id.dseq).select();
    const updated_launch = data[0];
    const duration = (new Date() - new Date(updated_launch.created_at)) / 1000;
    const cost = Math.max(duration * updated_launch.cost_per_second, 0.10) + 0.5 // gas fees;
    console.log("launch cost", cost, "with actual cost", duration*updated_launch.cost_per_second);
    let {data: balance} = await supabaseAdmin.from('balances').select().eq('user_id', user.id).single();
    let res = await supabaseAdmin.from('balances').update({amount: balance.amount - cost}).eq('user_id',user.id);

    console.log("launch updated to closed");
    return json(launch)
}