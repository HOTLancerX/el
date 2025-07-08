import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or anon key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Example of how to use it:
// if (supabase) {
//   const { data, error } = await supabase.from('your_table_name').select('*');
//   if (error) console.error('Error fetching data:', error);
//   else console.log('Data:', data);
// } else {
//   console.log('Supabase client is not initialized. Please check your environment variables.');
// }
