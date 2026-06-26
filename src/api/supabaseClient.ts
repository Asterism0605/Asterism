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

    // detectSessionInUrl 預設 true：OAuth 回流到 /auth/callback 時，client 會自動解析網址、
    // 完成 PKCE code 交換並寫入 session，AuthCallback 再以 hydrate() 讀回。
    client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  }

  return client;
}
