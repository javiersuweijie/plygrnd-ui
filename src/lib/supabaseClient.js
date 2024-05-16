// place files you want to import through the `$lib` alias in this folder.

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient('https://hmmouvlvvbflnflaboau.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbW91dmx2dmJmbG5mbGFib2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ2MjU0NjIsImV4cCI6MjAzMDIwMTQ2Mn0._U5vmg9dV5M1-r80Q1OzyNkaWHy8lw42TEHkQjOieic')