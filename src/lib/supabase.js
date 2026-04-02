import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export let supabaseConfigError = null;
export let supabase = null;

if (!supabaseUrl || !supabaseKey) {
  supabaseConfigError =
    "Supabase environment variables are missing. " +
    "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your " +
    "Vercel project settings, then redeploy.";
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    supabaseConfigError = `Failed to initialise Supabase: ${e.message}`;
  }
}
