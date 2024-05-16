import { getLogs, loadPrerequisites } from "$lib/server/akash";
import { json } from "@sveltejs/kit";

export async function GET({ params, locals: {supabase, user} }) {
    const {id} = params;
    
    console.log("getting logs", user.id, "dseq", id)
    const response = await supabase.from("launches")
        .select()
        .filter("launched_by", "eq", user.id)
        .filter("dseq", "eq", +id)
        .filter("status", "eq", "LAUNCHING");

    console.log(response);
    let launch = response.data.length > 0 ? response.data[0] : null;

    if (!launch) {
        return json({ error: "Valid launch not found" }, { status: 404 });
    }

    let lease = {
        id: {
            owner: launch.owner,
            dseq: launch.dseq,
            provider: launch.provider,
            oseq: 1,
            gseq: 1,
        }
    }
    const {certificate} = await loadPrerequisites();
    const logs = await getLogs(lease, certificate);
    console.log("logs",logs)
    return json(logs)
}