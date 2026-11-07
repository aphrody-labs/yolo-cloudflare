/**
 * Aphrody Cloudflare Edge Email Worker (2026 Edition)
 * Inbound Email Handler & Forwarding Relay.
 * Logs all inbound communications to Cloudflare D1 aphrody-app and forwards to verified destination.
 */

export interface Env {
  DB?: any;
  CACHE?: any;
  FORWARD_DESTINATION?: string;
}

export default {
  async email(message: any, env: Env, ctx: any): Promise<void> {
    const id = `in_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const from = message.from || "unknown";
    const to = message.to || "unknown";
    const subject = message.headers?.get("subject") || "(No Subject)";
    const messageId = message.headers?.get("message-id") || id;
    const spfStatus = message.headers?.get("received-spf") || "unknown";
    const dkimStatus = message.headers?.get("dkim-signature") ? "signed" : "unsigned";

    // 1. Persist inbound event to Cloudflare D1
    if (env.DB) {
      try {
        await env.DB.prepare(
          "INSERT INTO inbound_emails (id, messageId, fromAddress, toAddress, subject, spfStatus, dkimStatus, rawHeaders, bodySnippet, receivedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
          .bind(
            id,
            messageId,
            from,
            to,
            subject,
            spfStatus,
            dkimStatus,
            "",
            "",
            Date.now()
          )
          .run();
      } catch (err) {
        console.error("Failed to insert inbound email into D1:", err);
      }
    }

    // 2. Forward to destination (e.g. contact@aphrody.com)
    const destination = env.FORWARD_DESTINATION || "contact@aphrody.com";
    try {
      await message.forward(destination);
    } catch (fwdErr) {
      console.error(`Failed to forward email to ${destination}:`, fwdErr);
    }
  },

  async fetch(req: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "healthy",
        worker: "aphrody-email-worker",
        edge: "cloudflare",
        d1_connected: !!env.DB,
        time: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/inbound/latest" && env.DB) {
      try {
        const rows = await env.DB.prepare(
          "SELECT * FROM inbound_emails ORDER BY receivedAt DESC LIMIT 20"
        ).all();
        return Response.json({ emails: rows.results });
      } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
      }
    }

    return new Response("Aphrody Cloudflare Edge Email Worker (2026)", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  },
};
