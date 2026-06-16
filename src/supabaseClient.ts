import { createClient } from '@supabase/supabase-js';

// Vite এর জন্য env রিড করার নিয়ম
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
