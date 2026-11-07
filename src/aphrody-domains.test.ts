// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "bun:test";
import {
  APHRODY_PUBLIC_DOMAINS,
  APHRODY_ZONE,
  getAphrodyDomain,
  getAphrodySubdomain,
  listDomainsByCategory,
  listDomainsByOwner,
  validateDomainManifest,
} from "./aphrody-domains";

const EXPECTED_HOSTNAMES = [
  "aphrody.com",
  "search.aphrody.com",
  "ai.aphrody.com",
  "drive.aphrody.com",
  "docs.aphrody.com",
  "sheets.aphrody.com",
  "slides.aphrody.com",
  "mail.aphrody.com",
  "meet.aphrody.com",
  "calendar.aphrody.com",
  "photos.aphrody.com",
  "translate.aphrody.com",
  "maps.aphrody.com",
  "play.aphrody.com",
  "os.aphrody.com",
  "console.aphrody.com",
  "api.aphrody.com",
  "yolo.aphrody.com",
] as const;

describe("Aphrody public domain hierarchy manifest", () => {
  test("contains all 18 canonical public domains in exact order", () => {
    expect(APHRODY_ZONE).toBe("aphrody.com");
    expect(APHRODY_PUBLIC_DOMAINS.map((d) => d.hostname)).toEqual([
      ...EXPECTED_HOSTNAMES,
    ]);
    expect(APHRODY_PUBLIC_DOMAINS.length).toBe(18);
  });

  test("passes internal structural validation", () => {
    const result = validateDomainManifest();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("resolves domains by hostname and subdomain", () => {
    const apex = getAphrodyDomain("APHRODY.COM.");
    expect(apex?.subdomain).toBe("@");
    expect(apex?.routingTier).toBe("origin-direct");

    const api = getAphrodySubdomain("api");
    expect(api?.hostname).toBe("api.aphrody.com");
    expect(api?.service).toBe("yolo-cf-gateway");
    expect(api?.healthPath).toBe("/_gateway/health");

    const yolo = getAphrodyDomain("yolo.aphrody.com");
    expect(yolo?.ownerRepo).toBe("yolo-hub");
    expect(yolo?.routingTier).toBe("edge-worker");

    expect(getAphrodyDomain("unknown.aphrody.com")).toBeUndefined();
  });

  test("filters domains by category and owner repository", () => {
    const workspaceDomains = listDomainsByCategory("workspace").map(
      (d) => d.hostname,
    );
    expect(workspaceDomains).toEqual([
      "drive.aphrody.com",
      "docs.aphrody.com",
      "sheets.aphrody.com",
      "slides.aphrody.com",
      "calendar.aphrody.com",
    ]);

    const cfOwned = listDomainsByOwner("yolo-cloudflare").map(
      (d) => d.hostname,
    );
    expect(cfOwned).toEqual([
      "mail.aphrody.com",
      "meet.aphrody.com",
      "api.aphrody.com",
    ]);
  });
});
