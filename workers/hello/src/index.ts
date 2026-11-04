// Test Worker for the self-hosted workerd cluster. Reports which node served the request, and
// reads and writes the replicated SQL store (rqlite, the D1 role) through a service binding.
interface Env {
  NODE: string;
  MESH_IP: string;
  DB?: { fetch(input: string, init?: RequestInit): Promise<Response> };
  DB_AUTH?: string;
}

async function db(env: Env, path: string, body?: unknown): Promise<unknown> {
  if (!env.DB || !env.DB_AUTH) throw new Error("DB binding not configured");
  const res = await env.DB.fetch(`http://rqlite${path}`, {
    method: body ? "POST" : "GET",
    headers: { authorization: env.DB_AUTH, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = { "x-served-by": env.NODE };
    if (url.pathname === "/health") return new Response("ok\n", { headers });
    if (url.pathname === "/db") {
      await db(env, "/db/execute", [
        "CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY, node TEXT, at TEXT)",
      ]);
      if (request.method === "POST") {
        await db(env, "/db/execute", [["INSERT INTO visits (node, at) VALUES (?, ?)", env.NODE, new Date().toISOString()]]);
      }
      const rows = await db(env, "/db/query?level=strong&q=" + encodeURIComponent("SELECT node, COUNT(*) FROM visits GROUP BY node ORDER BY node"));
      return Response.json({ node: env.NODE, visits: rows }, { headers });
    }
    return Response.json(
      { worker: "hello", runtime: "workerd", node: env.NODE, mesh_ip: env.MESH_IP, method: request.method, path: url.pathname, time: new Date().toISOString() },
      { headers },
    );
  },
};
