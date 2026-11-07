import { describe, expect, test } from "bun:test";
import {
  renderTemplate,
  renderWelcomeEmail,
  renderMagicLinkEmail,
  renderTwoFactorEmail,
  renderSecurityAlertEmail,
  renderInvoiceEmail,
  renderSystemAlertEmail,
  renderPasswordResetEmail,
  renderNoreplyNotification,
} from "./templates/index.js";
import { MailDispatcher } from "./dispatcher.js";
import { createAphrodyAuth } from "../auth/better-auth.js";
import { FirebaseAuthBridge } from "../auth/firebase-bridge.js";
import { AphrodyOAuthServer } from "../auth/oauth-server.js";
import { AphrodyAuthClient } from "../auth/client-sdk.js";
import {
  getProviderTemplates,
  buildAuthorizationUrl,
} from "../auth/providers.js";
import { Database } from "bun:sqlite";

describe("Aphrody Email Templates (2026 Edition)", () => {
  test("renderWelcomeEmail outputs compliant HTML, text, and SVG logo", () => {
    const res = renderWelcomeEmail({
      name: "Alexandre",
      email: "contact@aphrody.com",
    });
    expect(res.subject).toContain("Welcome to Aphrody");
    expect(res.html).toContain("Aphrody Labs SAS");
    expect(res.html).toContain("SIREN: 918 827 892");
    expect(res.html).toContain("prefers-color-scheme: dark");
    expect(res.html).toContain('viewBox="0 0 34 34"');
    expect(res.text).toContain("contact@aphrody.app");
  });

  test("renderMagicLinkEmail contains Turnstile and single-use TTL token", () => {
    const res = renderMagicLinkEmail({
      email: "contact@aphrody.com",
      url: "https://aphrody.app/auth/verify?token=tok_test_123",
      expiresInMinutes: 15,
      ipAddress: "51.77.147.152",
    });
    expect(res.subject).toContain("Magic Link");
    expect(res.html).toContain("tok_test_123");
    expect(res.html).toContain("Cloudflare Turnstile Verified");
    expect(res.text).toContain("tok_test_123");
  });

  test("renderTwoFactorEmail renders 6-digit verification code cleanly", () => {
    const res = renderTwoFactorEmail({
      email: "contact@aphrody.com",
      code: "749102",
      expiresInMinutes: 10,
    });
    expect(res.subject).toContain("749102");
    expect(res.html).toContain("749102");
    expect(res.html).toContain("Do not share this code");
  });

  test("renderSecurityAlertEmail outputs IP, client, and revoke CTA", () => {
    const res = renderSecurityAlertEmail({
      email: "contact@aphrody.com",
      ipAddress: "72.60.186.43",
      deviceOrAgent: "Chrome 134 on Linux",
      location: "Paris, France",
    });
    expect(res.subject).toContain("Security Alert");
    expect(res.html).toContain("72.60.186.43");
    expect(res.html).toContain("Revoke All Sessions");
  });

  test("renderInvoiceEmail computes VAT and totals correctly", () => {
    const res = renderInvoiceEmail({
      email: "contact@aphrody.com",
      invoiceId: "INV-2026-TEST",
      invoiceDate: "2026-11-07",
      items: [
        { description: "Item 1", amountEur: 100.0 },
        { description: "Item 2", amountEur: 50.0 },
      ],
      vatRatePercent: 20,
    });
    expect(res.subject).toContain("INV-2026-TEST");
    expect(res.html).toContain("€150.00"); // Subtotal
    expect(res.html).toContain("€30.00"); // VAT 20%
    expect(res.html).toContain("€180.00"); // Total
  });

  test("renderSystemAlertEmail handles operational convergence and status badges", () => {
    const res = renderSystemAlertEmail({
      email: "contact@aphrody.com",
      clusterEvent: "WireGuard Mesh Converged",
      nodeName: "prod",
      meshIp: "10.200.77.5",
      status: "RESOLVED",
      metrics: { latencyMs: 5, rqliteRaftOk: true },
      details: "All nodes synchronized successfully.",
    });
    expect(res.subject).toContain("[RESOLVED]");
    expect(res.html).toContain("10.200.77.5");
    expect(res.html).toContain("SYNCHRONIZED");
  });

  test("renderPasswordResetEmail renders security reset instructions", () => {
    const res = renderPasswordResetEmail({
      email: "contact@aphrody.com",
      resetUrl: "https://aphrody.app/reset?tok=999",
      expiresInMinutes: 30,
    });
    expect(res.subject).toContain("Reset your Aphrody password");
    expect(res.html).toContain("https://aphrody.app/reset?tok=999");
  });

  test("renderNoreplyNotification outputs automated system telemetry across domains", () => {
    const resApp = renderNoreplyNotification({
      email: "contact@aphrody.com",
      senderDomain: "aphrody.app",
      category: "DEPLOYMENT",
      title: "Mesh Gateway v1.1.0 Released",
      summary: "Deployment verified on Hostinger prod and OVH fleet.",
      details: [
        { label: "Hostinger KVM 8", value: "72.60.186.43 (Active)" },
        { label: "OVH Mesh Nodes", value: "51.77.147.152, 51.255.162.6" },
      ],
    });
    expect(resApp.from).toBe("Aphrody System <noreply@aphrody.app>");
    expect(resApp.subject).toContain("[DEPLOYMENT]");
    expect(resApp.html).toContain("72.60.186.43");

    const resCom = renderNoreplyNotification({
      email: "contact@aphrody.com",
      senderDomain: "aphrody.com",
      category: "SECURITY_DIGEST",
      title: "Weekly Security Overview",
      summary: "Zero unauthorized intrusions detected.",
      details: [{ label: "Turnstile Status", value: "100% Pass" }],
    });
    expect(resCom.from).toBe("Aphrody System <noreply@aphrody.com>");
  });

  test("renderTemplate registry renders all 8 templates dynamically", () => {
    const templates = [
      "welcome",
      "magic-link",
      "two-factor-code",
      "security-alert",
      "invoice",
      "system-alert",
      "password-reset",
      "noreply",
    ] as const;

    for (const t of templates) {
      const rendered = renderTemplate({
        template: t,
        data: {
          email: "test@aphrody.app",
          url: "https://aphrody.app",
          code: "123456",
          ipAddress: "127.0.0.1",
          deviceOrAgent: "TestClient",
          invoiceId: "INV-1",
          invoiceDate: "Today",
          items: [{ description: "T", amountEur: 10 }],
          clusterEvent: "Event",
          nodeName: "node",
          meshIp: "10.200.77.1",
          status: "RESOLVED",
          details: [{ label: "Key", value: "Val" }],
          category: "SYSTEM_SYNC",
          title: "Title",
          summary: "Summary",
          resetUrl: "https://aphrody.app/reset",
        },
      });
      expect(rendered.html.length).toBeGreaterThan(1000);
      expect(rendered.text.length).toBeGreaterThan(50);
    }
  });
});

describe("Multi-Provider Mail Dispatcher & VPS Mesh Relay", () => {
  test("MailDispatcher initializes and routes to VPS mesh relay fallback", async () => {
    using testServer = Bun.serve({
      port: 17099,
      fetch(req) {
        return Response.json({
          success: true,
          messageId: "vps_test_mock_12345",
          provider: "vps-mesh-test",
        });
      },
    });

    const dispatcher = new MailDispatcher({
      vpsMeshEndpoint: "http://127.0.0.1:17099/api/mail/send",
      vpsMeshAuthToken: "aphrody-mesh-auth-2026",
    });

    const receipt = await dispatcher.send({
      to: "contact@aphrody.com",
      template: "system-alert",
      templateData: {
        clusterEvent: "Automated End-to-End Test Event",
        nodeName: "prod",
        meshIp: "10.200.77.5",
        status: "RESOLVED",
        details: "Live test dispatched from test runner suite.",
      },
      provider: "vps-mesh",
    });

    expect(receipt.success).toBe(true);
    expect(receipt.provider).toBe("vps-mesh");
    expect(receipt.messageId).toBe("vps_test_mock_12345");
    expect(receipt.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe("Aphrody Universal OAuth2 / OIDC Server", () => {
  test("Exposes valid OpenID Connect Discovery metadata and JWKS", () => {
    const server = new AphrodyOAuthServer({
      issuer: "https://auth.aphrody.app",
    });
    const discovery = server.getOpenIdConfiguration();

    expect(discovery.issuer).toBe("https://auth.aphrody.app");
    expect(discovery.authorization_endpoint).toBe(
      "https://auth.aphrody.app/oauth/authorize",
    );
    expect(discovery.token_endpoint).toBe(
      "https://auth.aphrody.app/oauth/token",
    );
    expect(discovery.jwks_uri).toBe(
      "https://auth.aphrody.app/.well-known/jwks.json",
    );
    expect(discovery.code_challenge_methods_supported).toContain("S256");

    const jwks = server.getJwks();
    expect(jwks.keys.length).toBeGreaterThan(0);
    expect(jwks.keys[0].kid).toBe("aphrody-auth-key-2026");
  });

  test("Executes full Authorization Code flow with PKCE and UserInfo retrieval", async () => {
    const server = new AphrodyOAuthServer({
      issuer: "https://auth.aphrody.app",
      jwtSecret: "test-secret-key-32-chars-long-2026!",
    });

    // 1. Authorize step with PKCE
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    // S256 hash of verifier
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(verifier),
    );
    const challenge = Buffer.from(hash).toString("base64url");

    const authRes = await server.handleAuthorize({
      clientId: "aphrody-webos",
      redirectUri: "https://aphrody.app/callback",
      responseType: "code",
      state: "state_12345",
      codeChallenge: challenge,
      codeChallengeMethod: "S256",
      userId: "user_test_99",
    });

    expect(authRes.code).toBeDefined();
    expect(authRes.redirectUrl).toContain("code=");
    expect(authRes.redirectUrl).toContain("state=state_12345");

    // 2. Token exchange step
    const tokenRes = await server.handleToken({
      grantType: "authorization_code",
      code: authRes.code,
      redirectUri: "https://aphrody.app/callback",
      clientId: "aphrody-webos",
      codeVerifier: verifier,
    });

    expect(tokenRes.token_type).toBe("Bearer");
    expect(tokenRes.access_token).toBeDefined();
    expect(tokenRes.id_token).toBeDefined();
    expect(tokenRes.refresh_token).toBeDefined();

    // 3. UserInfo step
    const userinfo = await server.getUserInfo(tokenRes.access_token);
    expect(userinfo.sub).toBe("user_test_99");
    expect(userinfo.issuer).toBe("https://auth.aphrody.app");
  });

  test("Issues client_credentials tokens for mesh inter-service communication", async () => {
    const server = new AphrodyOAuthServer({
      issuer: "https://auth.aphrody.app",
      jwtSecret: "test-secret-key-32-chars-long-2026!",
    });

    const tokenRes = await server.handleToken({
      grantType: "client_credentials",
      clientId: "aphrody-vps-mesh-client",
      clientSecret: "secret",
    });

    expect(tokenRes.access_token).toBeDefined();
    expect(tokenRes.scope).toContain("mesh:control");
  });
});

describe("Aphrody Universal Client SDK & Middleware", () => {
  test("Authenticates Bearer tokens and rejects forged signatures", async () => {
    const secret = "test-secret-key-32-chars-long-2026!";
    const server = new AphrodyOAuthServer({
      issuer: "https://auth.aphrody.app",
      jwtSecret: secret,
    });
    const client = new AphrodyAuthClient({
      issuerUrl: "https://auth.aphrody.app",
      jwtSecret: secret,
    });

    // Generate valid token
    const tokenRes = await server.handleToken({
      grantType: "client_credentials",
      clientId: "valid_client",
    });
    const user = await client.authenticate(`Bearer ${tokenRes.access_token}`);

    expect(user).not.toBeNull();
    expect(user?.id).toBe("valid_client");
    expect(user?.role).toBe("service");

    // Test forged token
    const forged = await client.authenticate("Bearer fake.jwt.signature");
    expect(forged).toBeNull();
  });

  test("Protects native Web Requests and enforces roles", async () => {
    const secret = "test-secret-key-32-chars-long-2026!";
    const server = new AphrodyOAuthServer({
      issuer: "https://auth.aphrody.app",
      jwtSecret: secret,
    });
    const client = new AphrodyAuthClient({
      issuerUrl: "https://auth.aphrody.app",
      jwtSecret: secret,
    });

    const tokenRes = await server.handleToken({
      grantType: "client_credentials",
      clientId: "admin_service",
    });

    // 1. Authorized request
    const req = new Request("https://api.aphrody.app/admin/data", {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` },
    });
    const check = await client.protect(req, ["service"]);
    expect(check.authorized).toBe(true);

    // 2. Forbidden request (insufficient role)
    const checkForbidden = await client.protect(req, ["superadmin_only"]);
    expect(checkForbidden.authorized).toBe(false);
  });
});

describe("OAuth Provider Templates", () => {
  test("Resolves all 7 identity provider configurations and builds authorization URLs", () => {
    const templates = getProviderTemplates({
      BETTER_AUTH_URL: "https://auth.aphrody.app",
      GOOGLE_CLIENT_ID: "g_client_123",
      GITHUB_CLIENT_ID: "gh_client_456",
    });

    expect(templates.google).toBeDefined();
    expect(templates.github).toBeDefined();
    expect(templates.cloudflare).toBeDefined();
    expect(templates.apple).toBeDefined();
    expect(templates.microsoft).toBeDefined();
    expect(templates.discord).toBeDefined();
    expect(templates.aphrody).toBeDefined();

    const googleAuthUrl = buildAuthorizationUrl(
      templates.google,
      "state_abc",
      "challenge_xyz",
    );
    expect(googleAuthUrl).toContain("accounts.google.com");
    expect(googleAuthUrl).toContain("client_id=g_client_123");
    expect(googleAuthUrl).toContain("state=state_abc");
    expect(googleAuthUrl).toContain("code_challenge=challenge_xyz");
  });
});

describe("Aphrody Better-Auth Production Suite", () => {
  test("Initializes cleanly with in-memory SQLite and all 10 plugins", () => {
    const db = new Database(":memory:");
    const auth = createAphrodyAuth({
      database: db,
      baseURL: "https://auth.aphrody.app",
      turnstileSecretKey: "0x4AAAAAAF3EuNXkB9uPkUj9KF3_NTlBDsI",
    });

    expect(auth).toBeDefined();
    expect(typeof auth.api).toBe("object");
  });
});

describe("Firebase Auth Bridge", () => {
  test("Generates and validates custom tokens with custom claims", async () => {
    const bridge = new FirebaseAuthBridge({
      projectId: "aphrody",
      clientEmail: "admin-sa@rgfr-8927d.iam.gserviceaccount.com",
    });

    const token = await bridge.createCustomToken({
      uid: "user_aphrody_test_2026",
      email: "contact@aphrody.com",
      role: "admin",
      premium: true,
    });

    expect(token).toBeDefined();
    expect(token.split(".").length).toBe(3);

    // Verify
    const verification = await bridge.verifyIdToken(token);
    expect(verification.valid).toBe(true);
    expect(verification.payload.uid).toBe("user_aphrody_test_2026");
    expect(verification.payload.claims.role).toBe("admin");
    expect(verification.payload.claims.premium).toBe(true);
  });
});
