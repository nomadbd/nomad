// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Vercel-এর Environment Variables থেকে স্বয়ংক্রিয়ভাবে তথ্যগুলো চলে আসবে
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
