import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// createBrowserClient stores the session in cookies (in addition to localStorage)
// so the server-side client can read auth state on SSR requests
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
