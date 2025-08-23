import { createClient } from '@supabase/supabase-js';

// These details are from your Supabase project settings -> API
const supabaseUrl = 'https://cjeuddketzmhrvqfxphi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZXVkZGtldHptaHJ2cWZ4cGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDkyNjIsImV4cCI6MjA3MTQ4NTI2Mn0.VxKzCBYlH4HrtjpiNN69DLCwG1Y2W0_ktTsEJQIP66I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);