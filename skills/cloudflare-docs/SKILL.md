---
name: cloudflare-docs
description: Read the Cloudflare documentation vendored as the upstream/cloudflare-docs submodule, offline and pinned to a known commit. Use when a question about a Cloudflare product (Workers, R2, D1, Pingora, Tunnel and others) should be answered from the pinned docs, or when checking what the self-hosted stack does not reproduce.
---

# Read the vendored Cloudflare docs

The docs are the `upstream/cloudflare-docs` submodule (CC-BY-4.0), pinned in `sources.lock.json`. Fetch it once with `git submodule update --init --depth 1 upstream/cloudflare-docs`.

## Find a page

1. `docs/INDEX.md` maps each product to its directory, for example Workers to `upstream/cloudflare-docs/src/content/docs/workers/`.
2. Search inside one product: `grep -rl "binding" upstream/cloudflare-docs/src/content/docs/r2/ | head`.
3. Pages are `.mdx`; read them directly. Shared fragments live in `src/content/partials/`, changelogs in `src/content/changelog/`.
4. Quote the file path and the pinned commit when you answer, so the reader knows which version of the docs you used.

## Mind the gap

The docs describe Cloudflare's hosted platform. Before you apply a page to the self-hosted stack, check the service mapping in `README.md`: Garage is S3-compatible but it is not R2, rqlite plays the D1 role but it is not D1, and workerd has no Cloudflare account services. For the current published docs, prefer the Cloudflare docs MCP or https://developers.cloudflare.com.
