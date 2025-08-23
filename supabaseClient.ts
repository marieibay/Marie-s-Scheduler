import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings -> API
const supabaseUrl = 'https://cjeuddketzmhrvqfxphi.supabase.co';

// IMPORTANT: The previous key was causing errors. 
// Please replace the placeholder below with your project's public 'anon' key.
// You can find it in your Supabase project under Settings > API > Project API Keys.
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
