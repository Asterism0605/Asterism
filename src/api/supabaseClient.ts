import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy 單例：只有真的要打 Supabase 時才建 client（測試 mock 時不觸發）。
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 未設定');
    }

    client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  }

  return client;
}
