import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pucpdgnbpydaubbxwtwn.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_HKs_bqhvjdcEbsDY58TYnQ_N5BCSVK3';

export const supabase = createClient(supabaseUrl, supabaseKey);
