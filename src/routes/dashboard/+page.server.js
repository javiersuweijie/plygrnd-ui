export const load = async ({ locals: { supabase, user } }) => {
    const { data: launches, error } = await supabase.from("launches")
        .select(`
           *,
           playgrounds (
                name,
                repository_url,
                need_gpu
           )
        `)
        .filter("launched_by", "eq", user.id)
        .order('created_at', { ascending: false });
    console.log(error);
    let costs = 0;
    for (const launch of launches) {
        if (launch.status === "RUNNING") {
            console.log(launch);
            costs += launch.playgrounds.need_gpu ? 3.50 : 0.13;
        }
    }
    return {
        launches,
        costs: costs.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        })
    }
}