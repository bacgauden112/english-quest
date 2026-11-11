// English Quest — Cloudflare Worker
// Serves the static app from ./public and a tiny sync API backed by Workers KV.
//   GET  /api/state  -> saved progress (JSON) or null
//   PUT  /api/state  -> save progress (JSON body)
// Both need header  x-pass: <APP_PASSWORD>  (set with: npx wrangler secret put APP_PASSWORD)

const MAX_BYTES = 5 * 1024 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function sameSecret(a, b) {
  // constant-time comparison of two strings via SHA-256 digests
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(da), y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/state") {
      if (!env.APP_PASSWORD) return json({ error: "APP_PASSWORD is not set" }, 500);
      const pass = request.headers.get("x-pass") || "";
      if (!(await sameSecret(pass, env.APP_PASSWORD))) return json({ error: "unauthorized" }, 401);

      if (request.method === "GET") {
        const value = await env.EQ_KV.get("state");
        return new Response(value || "null", {
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
        });
      }
      if (request.method === "PUT") {
        const body = await request.text();
        if (body.length > MAX_BYTES) return json({ error: "too large" }, 413);
        let parsed;
        try { parsed = JSON.parse(body); } catch { return json({ error: "invalid json" }, 400); }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "invalid state" }, 400);
        await env.EQ_KV.put("state", body);
        return json({ ok: true, updatedAt: parsed.updatedAt || null });
      }
      return json({ error: "method not allowed" }, 405);
    }

    return env.ASSETS.fetch(request);
  },
};
