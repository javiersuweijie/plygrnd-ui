import { closeDeployment, loadPrerequisites } from "$lib/server/akash";
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
    console.log("launch updated to closed");
    return json(data[0])
}