export const load = async ({ locals: { supabase, suberbaseAdmin, user }, url}) => {
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
        if (["RUNNING", "LAUNCHING"].includes(launch.status)) {
            console.log(launch);
            costs += launch.cost_per_second * 60 * 60 * 24;
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