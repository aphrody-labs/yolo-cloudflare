// SPDX-License-Identifier: Apache-2.0
/**
 * Canonical DNS & Edge Routing Manifest for the Aphrody Public Product Hierarchy.
 *
 * Defines the 18 canonical public product domains under `aphrody.com`, their DNS record
 * classification, edge routing tier, upstream workspace/service ownership, and health probe endpoints.
 * No live account tokens, IP addresses, or credentials are stored in this manifest.
 */

export type DnsRecordType = "A/AAAA" | "CNAME";

export type EdgeRoutingTier =
  "origin-direct" | "edge-worker" | "edge-proxy" | "mesh-gateway";

export type AphrodyProductCategory =
  | "apex"
  | "discovery"
  | "intelligence"
  | "workspace"
  | "communication"
  | "media"
  | "platform"
  | "infrastructure";

export interface AphrodyDomainEntry {
  /** Fully-qualified domain name in the `aphrody.com` zone. */
  readonly hostname: string;
  /** Subdomain label (`"@"`, `"search"`, `"ai"`, etc.). */
  readonly subdomain: string;
  /** Product display title. */
  readonly product: string;
  /** High-level product category. */
  readonly category: AphrodyProductCategory;
  /** DNS record type in the `aphrody.com` zone. */
  readonly dnsRecordType: DnsRecordType;
  /** Whether Cloudflare edge proxy (orange-cloud / Worker route) is active on the record. */
  readonly proxied: boolean;
  /** Edge routing architecture tier. */
  readonly routingTier: EdgeRoutingTier;
  /** Canonical path on `https://aphrody.com` when applicable, or root `"/"`. */
  readonly canonicalPath: string;
  /** Primary YOLO / Aphrody workspace repository owning the service implementation. */
  readonly ownerRepo: string;
  /** Backing runtime or service component name. */
  readonly service: string;
  /** Standard HTTP health check path on the service. */
  readonly healthPath: string;
  /** Concise description of the domain's role. */
  readonly description: string;
}

export const APHRODY_ZONE = "aphrody.com" as const;

export const APHRODY_PUBLIC_DOMAINS: readonly AphrodyDomainEntry[] = [
  {
    hostname: "aphrody.com",
    subdomain: "@",
    product: "Aphrody Hub & WebOS Apex",
    category: "apex",
    dnsRecordType: "A/AAAA",
    proxied: false,
    routingTier: "origin-direct",
    canonicalPath: "/",
    ownerRepo: "yolo-hub",
    service: "aphrody-webos-apex",
    healthPath: "/api/health",
    description:
      "Canonical product origin, WebOS shell, and localized hub directory.",
  },
  {
    hostname: "search.aphrody.com",
    subdomain: "search",
    product: "Aphrody Search",
    category: "discovery",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-proxy",
    canonicalPath: "/search",
    ownerRepo: "yolo-ai",
    service: "aphrody-search",
    healthPath: "/api/search/health",
    description:
      "Hybrid BM25, vector, and open-web search index and query engine.",
  },
  {
    hostname: "ai.aphrody.com",
    subdomain: "ai",
    product: "Aphrody AI",
    category: "intelligence",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-proxy",
    canonicalPath: "/ai",
    ownerRepo: "yolo-ai",
    service: "yolo-agent-engine",
    healthPath: "/v1/health",
    description:
      "Multi-model AI assistant, agent runtime, and tool-calling workbench.",
  },
  {
    hostname: "drive.aphrody.com",
    subdomain: "drive",
    product: "Aphrody Drive",
    category: "workspace",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-proxy",
    canonicalPath: "/files",
    ownerRepo: "yolo-os",
    service: "aphrody-drive",
    healthPath: "/api/drive/health",
    description:
      "Cloud VFS, S3/Garage-backed object storage, and workspace file sync.",
  },
  {
    hostname: "docs.aphrody.com",
    subdomain: "docs",
    product: "Aphrody Docs",
    category: "workspace",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-worker",
    canonicalPath: "/word",
    ownerRepo: "yolo-ui",
    service: "craft-word",
    healthPath: "/health",
    description:
      "Collaborative rich-text and structured document authoring studio (WordCraft).",
  },
  {
    hostname: "sheets.aphrody.com",
    subdomain: "sheets",
    product: "Aphrody Sheets",
    category: "workspace",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-worker",
    canonicalPath: "/grid",
    ownerRepo: "yolo-ui",
    service: "craft-grid",
    healthPath: "/health",
    description:
      "Reactive spreadsheet, formula engine, and tabular data studio (GridCraft).",
  },
  {
    hostname: "slides.aphrody.com",
    subdomain: "slides",
    product: "Aphrody Slides",
    category: "workspace",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-worker",
    canonicalPath: "/deck",
    ownerRepo: "yolo-ui",
    service: "craft-deck",
    healthPath: "/health",
    description:
      "Presentation deck authoring and interactive canvas studio (DeckCraft).",
  },
  {
    hostname: "mail.aphrody.com",
    subdomain: "mail",
    product: "Aphrody Mail",
    category: "communication",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-worker",
    canonicalPath: "/mail",
    ownerRepo: "yolo-cloudflare",
    service: "agentic-inbox",
    healthPath: "/health",
    description: "Agentic email client and inbound/outbound message routing.",
  },
  {
    hostname: "meet.aphrody.com",
    subdomain: "meet",
    product: "Aphrody Meet",
    category: "communication",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-worker",
    canonicalPath: "/meet",
    ownerRepo: "yolo-cloudflare",
    service: "cloudflare-meet",
    healthPath: "/health",
    description:
      "Real-time WebRTC audio/video conferencing and screen sharing.",
  },
  {
    hostname: "calendar.aphrody.com",
    subdomain: "calendar",
    product: "Aphrody Calendar",
    category: "workspace",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-worker",
    canonicalPath: "/calendar",
    ownerRepo: "yolo-ui",
    service: "aphrody-calendar",
    healthPath: "/health",
    description: "Time management, scheduling, and event synchronization.",
  },
  {
    hostname: "photos.aphrody.com",
    subdomain: "photos",
    product: "Aphrody Photos",
    category: "media",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-worker",
    canonicalPath: "/photo",
    ownerRepo: "yolo-ui",
    service: "craft-photo",
    healthPath: "/health",
    description:
      "Photo library, RAW processing (LightCraft), and image editing (PhotoCraft).",
  },
  {
    hostname: "translate.aphrody.com",
    subdomain: "translate",
    product: "Aphrody Translate",
    category: "intelligence",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-proxy",
    canonicalPath: "/translate",
    ownerRepo: "yolo-ai",
    service: "aphrody-translate",
    healthPath: "/api/translate/health",
    description:
      "Neural machine translation and document localization service.",
  },
  {
    hostname: "maps.aphrody.com",
    subdomain: "maps",
    product: "Aphrody Maps",
    category: "discovery",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-worker",
    canonicalPath: "/maps",
    ownerRepo: "yolo-web",
    service: "aphrody-maps",
    healthPath: "/health",
    description: "Vector tile rendering, geospatial search, and navigation.",
  },
  {
    hostname: "play.aphrody.com",
    subdomain: "play",
    product: "Aphrody Play",
    category: "media",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-proxy",
    canonicalPath: "/play",
    ownerRepo: "yolo-os",
    service: "aphrody-play",
    healthPath: "/api/play/health",
    description:
      "Application store, WebRTC cloud gaming sessions, and WebAssembly arcade.",
  },
  {
    hostname: "os.aphrody.com",
    subdomain: "os",
    product: "Aphrody OS",
    category: "platform",
    dnsRecordType: "A/AAAA",
    proxied: false,
    routingTier: "origin-direct",
    canonicalPath: "/os",
    ownerRepo: "yolo-os",
    service: "bunos-webos",
    healthPath: "/api/health",
    description:
      "BunOS distribution portal, system images, package repositories, and remote desktop.",
  },
  {
    hostname: "console.aphrody.com",
    subdomain: "console",
    product: "Aphrody Console",
    category: "infrastructure",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-proxy",
    canonicalPath: "/console",
    ownerRepo: "yolo-vps",
    service: "aphrody-console",
    healthPath: "/api/console/health",
    description:
      "Cloud control plane, fleet observability, identity, and tenant administration.",
  },
  {
    hostname: "api.aphrody.com",
    subdomain: "api",
    product: "Aphrody API Gateway",
    category: "infrastructure",
    dnsRecordType: "A/AAAA",
    proxied: true,
    routingTier: "mesh-gateway",
    canonicalPath: "/api",
    ownerRepo: "yolo-cloudflare",
    service: "yolo-cf-gateway",
    healthPath: "/_gateway/health",
    description:
      "Unified Pingora/Axum API gateway for `/v1/*` product, AI, and store endpoints.",
  },
  {
    hostname: "yolo.aphrody.com",
    subdomain: "yolo",
    product: "YOLO Ecosystem Hub",
    category: "platform",
    dnsRecordType: "CNAME",
    proxied: true,
    routingTier: "edge-worker",
    canonicalPath: "/yolo",
    ownerRepo: "yolo-hub",
    service: "yolo-hub",
    healthPath: "/fr/",
    description:
      "Leptos/Axum SSR and static edge export for the open-source YOLO meta-platform.",
  },
] as const;

export type AphrodyHostname =
  (typeof APHRODY_PUBLIC_DOMAINS)[number]["hostname"];

const BY_HOSTNAME = new Map<string, AphrodyDomainEntry>(
  APHRODY_PUBLIC_DOMAINS.map((entry) => [entry.hostname, entry]),
);

const BY_SUBDOMAIN = new Map<string, AphrodyDomainEntry>(
  APHRODY_PUBLIC_DOMAINS.map((entry) => [entry.subdomain, entry]),
);

/** Look up a canonical domain entry by full hostname (case-insensitive, trailing dot stripped). */
export function getAphrodyDomain(
  hostname: string,
): AphrodyDomainEntry | undefined {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
  return BY_HOSTNAME.get(normalized);
}

/** Look up a canonical domain entry by subdomain label (`"@"` for apex). */
export function getAphrodySubdomain(
  subdomain: string,
): AphrodyDomainEntry | undefined {
  const normalized = subdomain.trim().toLowerCase();
  return BY_SUBDOMAIN.get(normalized === "" ? "@" : normalized);
}

/** Return all domains belonging to a given category. */
export function listDomainsByCategory(
  category: AphrodyProductCategory,
): AphrodyDomainEntry[] {
  return APHRODY_PUBLIC_DOMAINS.filter((d) => d.category === category);
}

/** Return all domains owned by a specific repository. */
export function listDomainsByOwner(ownerRepo: string): AphrodyDomainEntry[] {
  return APHRODY_PUBLIC_DOMAINS.filter((d) => d.ownerRepo === ownerRepo);
}

/** Validate that the manifest is internally consistent and complete. */
export function validateDomainManifest(
  entries: readonly AphrodyDomainEntry[] = APHRODY_PUBLIC_DOMAINS,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenHosts = new Set<string>();
  const seenSubdomains = new Set<string>();

  for (const entry of entries) {
    if (seenHosts.has(entry.hostname)) {
      errors.push(`duplicate hostname: ${entry.hostname}`);
    }
    seenHosts.add(entry.hostname);

    if (seenSubdomains.has(entry.subdomain)) {
      errors.push(`duplicate subdomain: ${entry.subdomain}`);
    }
    seenSubdomains.add(entry.subdomain);

    const expectedHost =
      entry.subdomain === "@"
        ? APHRODY_ZONE
        : `${entry.subdomain}.${APHRODY_ZONE}`;
    if (entry.hostname !== expectedHost) {
      errors.push(
        `hostname ${entry.hostname} does not match subdomain ${entry.subdomain}`,
      );
    }

    if (!entry.canonicalPath.startsWith("/")) {
      errors.push(`canonicalPath for ${entry.hostname} must start with '/'`);
    }

    if (!entry.healthPath.startsWith("/")) {
      errors.push(`healthPath for ${entry.hostname} must start with '/'`);
    }
  }

  return { valid: errors.length === 0, errors };
}

if (import.meta.main) {
  for (const d of APHRODY_PUBLIC_DOMAINS) {
    console.log(
      `${d.hostname.padEnd(22)} ${d.category.padEnd(15)} ${d.dnsRecordType.padEnd(7)} ${String(d.proxied).padEnd(6)} ${d.routingTier.padEnd(14)} ${d.canonicalPath.padEnd(11)} ${d.ownerRepo.padEnd(16)} ${d.service}`,
    );
  }
}
