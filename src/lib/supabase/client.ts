
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if the environment variables are set. If not, it's a configuration issue.
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL or anonymous key is missing. " +
      "Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables. " +
      "If using a local .env file, ensure it's named .env.local and is in the root directory."
    );
  }

  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
