
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Be resilient during build/preview: if envs are missing, avoid throwing and
  // return a client configured with harmless placeholders. Any actual network
  // call will fail at call time with a descriptive error, but the app can build
  // and render without crashing.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(
        'Supabase env vars are missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Using placeholder client; calls will fail at runtime.'
      );
    }
    return createBrowserClient('http://localhost', 'public-anon-key');
  }

  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
