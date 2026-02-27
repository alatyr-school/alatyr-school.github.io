import { createClient } from "@supabase/supabase-js";

const supabaseUrl = globalThis.__SUPABASE_URL__ ?? "";
const supabaseAnonKey = globalThis.__SUPABASE_ANON_KEY__ ?? "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("YOUR_SUPABASE_URL") &&
    !supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
