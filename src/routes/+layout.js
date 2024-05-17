import { createBrowserClient, createServerClient, isBrowser, parse } from '@supabase/ssr'

const PUBLIC_SUPABASE_URL = 'https://hmmouvlvvbflnflaboau.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbW91dmx2dmJmbG5mbGFib2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ2MjU0NjIsImV4cCI6MjAzMDIwMTQ2Mn0._U5vmg9dV5M1-r80Q1OzyNkaWHy8lw42TEHkQjOieic';


export const load = async ({ data, depends, fetch }) => {
  console.log("balance in script", data.balance)
  /**
   * Declare a dependency so the layout can be invalidated, for example, on
   * session refresh.
   */
  depends('supabase:auth')

  const supabase = isBrowser()
    ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
          fetch,
        },
        cookies: {
          get(key) {
            const cookie = parse(document.cookie)
            return cookie[key]
          },
        },
      })
    : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
          fetch,
        },
        cookies: {
          get() {
            return JSON.stringify(data.session)
          },
        },
      })

  /**
   * It's fine to use `getSession` here, because on the client, `getSession` is
   * safe, and on the server, it reads `session` from the `LayoutData`, which
   * safely checked the session using `safeGetSession`.
   */
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (session && !data.balance) {
    const {data: balance} = await supabase.from('balances').select().eq('user_id', user.id).single();
    data.balance = balance;
  }
  console.log("balance in script 2", data.balance)

  return { ...data, session, supabase, user }
}