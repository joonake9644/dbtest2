import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error(
      "Missing or invalid NEXT_PUBLIC_SUPABASE_URL. Set it to your https://<project>.supabase.co URL in .env.local or your hosting environment."
    );
  }
  if (!anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy the anon key from Supabase project settings into .env.local or your hosting environment."
    );
  }

  return createBrowserClient(url, anonKey);
}
