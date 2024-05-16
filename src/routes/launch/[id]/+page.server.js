import { BID_CLOSED, closeDeployment, createLease, getLogs, loadPrerequisites, sendManifest } from "$lib/server/akash";
import { redirect } from "@sveltejs/kit";

async function getLaunchByUserAndId(supabase, uid, dseq) {
    const response = await supabase.from("launches")
        .select()
        .filter("launched_by", "eq", uid)
        .filter("dseq", "eq", +dseq);
    const launch  = response.data.length > 0 ? response.data[0] : null;
    return launch;
}


export const load = async ({ params, locals: {supabase, user} }) => {
    const { id } = params;
    console.log("entering launch with id", id)
    const launch = await getLaunchByUserAndId(supabase, user.id, id);
    if (launch === null) {
        redirect(303, '/explore')
    }

    return {
        id,
        launch,
        user,
        state: {
            logs: [],
            status: launch.status,
            url: launch.url
        }
    }
}