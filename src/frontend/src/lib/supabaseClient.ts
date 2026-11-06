import { createClient } from '@supabase/supabase-js';

// Supabase configuration - these should be set as environment variables
// VITE_SUPABASE_URL=https://your-project-ref.supabase.co
// VITE_SUPABASE_ANON_KEY=your_anon_public_key
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);