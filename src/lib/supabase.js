import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

console.log("SUPABASE URL:", supabaseUrl);
console.log("SUPABASE KEY EXISTS:", Boolean(supabaseAnonKey));

let supabase = null;

if (isValidHttpUrl(supabaseUrl) && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error("Invalid Supabase config", {
    supabaseUrl,
    hasAnonKey: Boolean(supabaseAnonKey),
  });
}

export { supabase };