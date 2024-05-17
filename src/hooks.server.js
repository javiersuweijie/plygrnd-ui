import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { SUPABASE_ADMIN_KEY, STRIPE_SECRET } from '$env/static/private';
import stripe from 'stripe';

const PUBLIC_SUPABASE_URL = 'https://hmmouvlvvbflnflaboau.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbW91dmx2dmJmbG5mbGFib2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ2MjU0NjIsImV4cCI6MjAzMDIwMTQ2Mn0._U5vmg9dV5M1-r80Q1OzyNkaWHy8lw42TEHkQjOieic';

const supabase = async ({ event, resolve }) => {
  /**
   * Creates a Supabase client specific to this server request.
   *
   * The Supabase client gets the Auth token from the request cookies.
   */
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => event.cookies.get(key),
      /**
       * SvelteKit's cookies API requires `path` to be explicitly set in
       * the cookie options. Setting `path` to `/` replicates previous/
       * standard behavior.
       */
      set: (key, value, options) => {
        event.cookies.set(key, value, { ...options, path: '/' })
      },
      remove: (key, options) => {
        event.cookies.delete(key, { ...options, path: '/' })
      },
    },
  })

  event.locals.supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_ADMIN_KEY);

  /**
   * Unlike `supabase.auth.getSession()`, which returns the session _without_
   * validating the JWT, this function also calls `getUser()` to validate the
   * JWT before returning the session.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();
    if (!session) {
      return { session: null, user: null };
    }

    const {
      data: { user },
      error
    } = await event.locals.supabase.auth.getUser();
    if (error) {
      // JWT validation has failed
      return { session: null, user: null };
    }

    delete session.user;

    return { session: Object.assign({}, session, { user }), user };
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      /**
       * Supabase libraries use the `content-range` and `x-supabase-api-version`
       * headers, so we need to tell SvelteKit to pass it through.
       */
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

const privatePaths = ['/launch', '/dashboard']

const authGuard = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession()
  event.locals.session = session
  event.locals.user = user

  if (!event.locals.session) {
    for (const path of privatePaths) {
      if (event.url.pathname.startsWith(path)) {
        console.log("not logged in, redirecting to /login")
        return redirect(303, '/login')
      }
    }
  }

  return resolve(event)
}

const stripeInit = async ({ event, resolve }) => {
  event.locals.stripe = stripe(STRIPE_SECRET);
  return resolve(event)
}

export const handle = sequence(supabase, authGuard, stripeInit)