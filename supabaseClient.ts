import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings -> API
const supabaseUrl = 'https://cjeuddketzmhrvqfxphi.supabase.co';

// IMPORTANT: This is the public key from your project's API settings.
const supabaseAnonKey = 'sb_publishable_1taNA7nNVozo5C0cZijg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
