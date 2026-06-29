// Supabase Edge Function：line-callback
// LINE 登入後端：LINE OAuth → 換 token → 取 email → find-or-create Supabase 帳號 → 鑄 session 鑰匙
// → 302 導回前端 /auth/callback?token_hash=...&type=magiclink（前端 verifyOtp 換 session）。
//
// 單一 function 兩條路徑：無 code = start（種 state cookie + 導去 LINE 授權頁）、有 code = callback。
// 部署在 Supabase Dashboard（Verify JWT 已關）；本檔為版本控管來源，改完需重新 deploy。
//
// secrets：LINE_CHANNEL_ID、LINE_CHANNEL_SECRET、FRONTEND_ORIGINS（逗號分隔白名單，
//          如 "https://asterism.pics,http://localhost:5173"；SUPABASE_URL/SERVICE_ROLE_KEY 自動有）。

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CHANNEL_ID = Deno.env.get("LINE_CHANNEL_ID")!;
const CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET")!;
const REDIRECT_URI = "https://lioiaxlkwesthfshtmop.supabase.co/functions/v1/line-callback";

// 前端 origin 白名單：prod + 本地 dev 同時可用，組員 review 不必改 secret。
const ALLOWED_ORIGINS = (Deno.env.get("FRONTEND_ORIGINS") ?? "https://asterism.pics")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// 只回白名單內的 origin，否則退回第一個（prod）→ 擋掉用 origin 參數做 open redirect。
function pickOrigin(requested: string | null): string {
  return requested && ALLOWED_ORIGINS.includes(requested) ? requested : ALLOWED_ORIGINS[0];
}

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// 只接受站內單一 / 開頭的路徑，擋掉 open redirect（與前端 getSafeRedirectPath 同規則）。
function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}

function getCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function cookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function redirect(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ Location: location });
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // ── start：無 code → 種 state cookie（CSRF）+ 記住 next/origin → 302 到 LINE 授權頁 ──
  if (!code) {
    const state = crypto.randomUUID();
    const next = sanitizeNext(url.searchParams.get("next"));
    const origin = pickOrigin(url.searchParams.get("origin"));
    const authUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", CHANNEL_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("scope", "openid profile email");
    authUrl.searchParams.set("state", state);
    return redirect(authUrl.toString(), [
      cookie("line_state", state, 600),
      cookie("line_next", next, 600),
      cookie("line_origin", origin, 600),
    ]);
  }

  // ── callback：有 code ──
  const next = sanitizeNext(getCookie(req, "line_next"));
  const origin = pickOrigin(getCookie(req, "line_origin"));
  const clearCookies = [
    cookie("line_state", "", 0),
    cookie("line_next", "", 0),
    cookie("line_origin", "", 0),
  ];
  const fail = (reason: string) =>
    redirect(`${origin}/auth/callback?error=${reason}`, clearCookies);

  // CSRF：網址 state 必須等於 start 種下的 cookie。
  const returnedState = url.searchParams.get("state");
  if (!returnedState || returnedState !== getCookie(req, "line_state")) {
    return fail("state");
  }

  // 換 token
  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CHANNEL_ID,
      client_secret: CHANNEL_SECRET,
    }),
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok) {
    return fail("token");
  }

  // 驗證 + 解開 id_token
  const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: token.id_token, client_id: CHANNEL_ID }),
  });
  const profile = await verifyRes.json();
  // id_token 驗證失敗（竄改/過期）→ profile.sub 會缺，不能往下建帳號。
  if (!verifyRes.ok || !profile.sub) {
    return fail("verify");
  }

  // 沒 email → 用 sub 造佔位 email（不擋登入，此帳號獨立不併）
  const email = profile.email ?? `line_${profile.sub}@line.asterism.local`;

  // find-or-create：先試建。「已存在」= 併到既有帳號（預期）；其他錯誤才當真失敗。
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: profile.name,
      name: profile.name,
      avatar_url: profile.picture,
      line_sub: profile.sub,
    },
  });
  if (createErr && !/registered|already|exists/i.test(createErr.message ?? "")) {
    return fail("create");
  }

  // 產一次性 magic link token_hash = Supabase session 的鑰匙
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkErr || !linkData) {
    return fail("link");
  }

  // 302 回前端：verifyOtp 用 token_hash 換 session 後即把網址洗掉。
  const dest = new URL(`${origin}/auth/callback`);
  dest.searchParams.set("token_hash", linkData.properties.hashed_token);
  dest.searchParams.set("type", "magiclink");
  if (next !== "/") dest.searchParams.set("next", next);
  return redirect(dest.toString(), clearCookies);
});
