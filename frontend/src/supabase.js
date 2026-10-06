import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rywfmocrdpygovckkarv.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_RnXmOfUXRS7D0kWz1jEJIQ_svXPD_JV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
