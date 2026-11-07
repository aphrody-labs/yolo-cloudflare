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
} from "./templates/index.js";
import { MailDispatcher } from "./dispatcher.js";
import { createAphrodyAuth } from "../auth/better-auth.js";
import { FirebaseAuthBridge } from "../auth/firebase-bridge.js";
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
    expect(res.html).toContain("viewBox=\"0 0 34 34\"");
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

  test("renderTemplate registry renders all 7 templates dynamically", () => {
    const templates = [
      "welcome",
      "magic-link",
      "two-factor-code",
      "security-alert",
      "invoice",
      "system-alert",
      "password-reset",
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
          details: "Details",
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
    // Spin up local test mesh relay
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
