import { supabase } from "$lib/supabaseClient";
import { redirect } from "@sveltejs/kit";

export async function load() {
  const { data } = await supabase.from("playgrounds").select();
  return {
    playgrounds: data ?? [],
  };
}

export const actions = {
  launch: async ({request}) => {
    console.log(await request.formData())
    redirect(300, "/loading")
  }
};