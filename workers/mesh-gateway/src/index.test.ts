import { describe, expect, it } from "bun:test";
import app from "./index";

describe("YOLO Edge Mesh Gateway", () => {
  const env = {
    NODE: "test-node",
    MESH_IP: "10.200.77.99",
  };

  it("answers liveness probe on /health", async () => {
    const res = await app.request("/health", {}, env);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok\n");
    expect(res.headers.get("X-Served-By-Node")).toBe("test-node");
    expect(res.headers.get("X-Mesh-IP")).toBe("10.200.77.99");
  });

  it("returns cluster mesh telemetry on /_mesh/health", async () => {
    const res = await app.request("/_mesh/health", {}, env);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe("healthy");
    expect(data.node).toBe("test-node");
    expect(data.capabilities).toContain("d1_rqlite_storage");
    expect(data.capabilities).toContain("r2_garage_s3");
  });

  it("renders SEO metadata for standard and crawler requests", async () => {
    // Normal JSON request
    const resJson = await app.request("/seo/meta?path=/docs", {}, env);
    expect(resJson.status).toBe(200);
    const meta = (await resJson.json()) as any;
    expect(meta.canonical).toBe("https://aphrody.com/docs");
    expect(meta.isBot).toBe(false);

    // Googlebot crawler request
    const resBot = await app.request(
      "/seo/meta?path=/docs",
      {
        headers: {
          "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
        },
      },
      env,
    );
    expect(resBot.status).toBe(200);
    expect(resBot.headers.get("content-type")).toContain("text/html");
    const html = await resBot.text();
    expect(html).toContain("<title>");
    expect(html).toContain("https://schema.org");
  });

  it("serves root gateway directory", async () => {
    const res = await app.request("/", {}, env);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.gateway).toBe("yolo-edge-mesh-gateway");
    expect(data.node).toBe("test-node");
    expect(data.endpoints.v1_origin).toContain("https://api.aphrody.com/v1/");
  });

  it("handles /v1/ origin routing through prod origin", async () => {
    const res = await app.request("/v1/health", {}, env);
    // Origin may return 200 or 502 in offline test runner, but routing logic executes
    expect([200, 502]).toContain(res.status);
    expect(res.headers.get("X-Served-By-Node")).toBe("test-node");
  });
});
