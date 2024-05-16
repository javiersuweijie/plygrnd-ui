import { loadPrerequisites, generateSDL, createDeployment } from '$lib/server/akash';
import { supabase } from '$lib/supabaseClient';
import { redirect } from '@sveltejs/kit'

async function getLaunchesByUserAndPlayground(supabase, uid, playgroundId) {
    const response = await supabase.from("launches")
        .select()
        .filter("launched_by", "eq", uid)
        .filter("playground_id", "eq", +playgroundId)
        .or("status.eq.CREATING,status.eq.LAUNCHING,status.eq.RUNNING");
    console.log(response);
    return response.data;
}

/**
 * post /launch
 * 1. check if there is a running deployment for the user and playground
 * 2. if not, display the loading page
 * 3. create a new deployment
 * 4. create lease
 * 5. pool for logs until url is ready
 * 6. redirect to the deployment page 
 * 
 *  
 * 2. if yes, redirect to the deployment page
 */


export const actions = {
    default: async ({ request, locals: {supabase, user}}) => {
        const formData = await request.formData();
        const playgroundId = formData.get('playground.id');
        console.log("launching playground", playgroundId)
        const { data: playground } = await supabase.from('playgrounds').select().eq('id', +playgroundId).single();
        console.log("playground", playground);

        const launches = await getLaunchesByUserAndPlayground(supabase, user.id, playgroundId);
        console.log("launches", launches);
        if (launches.length > 0) {
            return redirect(303, `/launch/${launches[0].dseq}`)
        }
        console.log("No launches found")

        let deployment;
        try {
            const { wallet, client } = await loadPrerequisites();
            const sdl = generateSDL(playground.repository_url, playground.entrypoint, playground.need_gpu);
            deployment = await createDeployment(sdl, wallet, client);
            console.log("deployment", deployment);
            await supabase.from('launches').insert({
                playground_id: playgroundId,
                dseq: deployment.id.dseq,
                launched_by: user.id,
                status: 'CREATING',
                owner: deployment.id.owner,
                provider: "",
            });
            console.log("launch inserted");
        } catch (e) {
            console.log(e);
            return redirect(303, `/error`)
        }
        return redirect(303, `/launch/${deployment.id.dseq}`)
    }
};