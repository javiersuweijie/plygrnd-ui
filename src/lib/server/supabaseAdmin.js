// place files you want to import through the `$lib` alias in this folder.

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN_KEY } from "$env/static/private";

export const supabase = createClient('https://hmmouvlvvbflnflaboau.supabase.co', SUPABASE_ADMIN_KEY);