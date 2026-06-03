import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nieciyvbeuvqkxomnlhz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QuPtth6QXxv80TWAcEablg_sDqY-ONh';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
