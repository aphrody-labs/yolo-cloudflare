# yolo-cloudflare

Cloudflare's open source code and documentation, vendored as pinned git submodules, plus a small self-hosted stack built from that open source and run as one cluster on three of our hosts over the WireGuard mesh, and a Claude Code plugin to operate it.

**Not affiliated with or endorsed by Cloudflare, Inc.** "Cloudflare", "Workers", "R2", "D1" and other product names are trademarks of Cloudflare, Inc. and are used here only to describe what upstream code does and which role a self-hosted component plays. Nothing here is a Cloudflare service, and nothing here talks to a Cloudflare account.

## Contents

| Path                         | What it is                                                                                                                                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `upstream/<name>`            | 40 shallow submodules of `https://github.com/cloudflare/<name>`, the most-starred licensed repositories of the organisation. Pins, stars, licenses: `UPSTREAM.md`, `sources.lock.json` (regenerate with `bun scripts/lock-sources.ts`). |
| `upstream/cloudflare-docs`   | The Cloudflare documentation source (CC-BY-4.0). Product map: `docs/INDEX.md`.                                                                                                                                                          |
| `src/aphrody-domains.ts`     | Canonical DNS and edge routing manifest for the 18 public Aphrody product domains (`aphrody.com` hierarchy), with unit tests in `src/aphrody-domains.test.ts`.                                                                          |
| `gateway/`                   | `yolo-cf-gateway`, an HTTP gateway written on the Pingora framework (crates.io `pingora`, Apache-2.0).                                                                                                                                  |
| `workers/hello/`             | Test Worker (TypeScript, bundled with `bun build`).                                                                                                                                                                                     |
| `deploy/`                    | Declarative cluster definition (`cluster.env`), idempotent `install.sh`, `uninstall.sh`, `deploy-worker.sh`, `health.sh`.                                                                                                               |
| `.claude-plugin/`, `skills/` | Claude Code plugin `yolo-cloudflare`: skills `deploy-worker`, `cluster-health`, `cloudflare-docs`.                                                                                                                                      |
| `docs/receipts/`             | Commands and real output proving what runs.                                                                                                                                                                                             |

Clone with `git clone https://github.com/yolo-rs/yolo-cloudflare && git submodule update --init --depth 1` (about 2 GB with every submodule; pass a path to fetch only one).

## Service mapping: what is really self-hosted here

Strict naming: a component that implements a similar API is not the Cloudflare product.

| Cloudflare service                                                                                                | What runs here instead                                                                                             | Same thing?                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers (runtime)                                                                                                 | Upstream `workerd` v1.20261104.1 (Apache-2.0), the open source runtime Cloudflare publishes, one instance per host | Same runtime code for the JavaScript/Wasm APIs it implements. Not the Workers platform: no global deployment, no `request.cf`, no account bindings, one Worker slot per host, deploys by SSH. |
| Workers deploy tooling (Wrangler)                                                                                 | `wrangler` 4.157.0 installed with Bun in `/opt/yolo-cf`, isolated config, never logged in                          | Installed for local use only (`wrangler --version` receipt). It is not used to deploy here; `deploy/deploy-worker.sh` bundles with `bun build`.                                               |
| Cloudflare's edge proxy / load balancing                                                                          | `yolo-cf-gateway`, our code on the open source Pingora framework, one per host                                     | Not Cloudflare's proxy, not Load Balancing. Round robin over the three workerd instances, TCP health check each second, retry on connect failure, plain HTTP inside WireGuard.                |
| R2                                                                                                                | Garage v2.5.0 (AGPL-3.0, Deuxfleurs), unmodified upstream binary, 3 nodes, replication factor 3                    | **Not R2.** An S3-compatible object store. No R2 Workers binding, no R2-specific APIs, no public buckets, no Cloudflare egress pricing model.                                                 |
| D1                                                                                                                | rqlite v10.6.6 (MIT), 3-node Raft cluster of SQLite                                                                | **Not D1.** A replicated SQLite with an HTTP API. The test Worker reaches it through a service binding, not the D1 binding API.                                                               |
| Cloudflare Tunnel (cloudflared)                                                                                   | `cloudflared` 2026.10.7 binary installed in `/opt/yolo-cf/bin`                                                     | Installed only; not run. No tunnel exists, by design: nothing here is exposed to the internet.                                                                                                |
| KV, Durable Objects storage, Queues, Workers AI, Vectorize, Images, Stream, DNS, WAF, DDoS protection, Zero Trust | Nothing                                                                                                            | Not provided.                                                                                                                                                                                 |

### What three hosts cannot reproduce

Cloudflare's global anycast network, DDoS absorption, the public edge in hundreds of cities, the account-level services (DNS zones, certificates, WAF, Access, analytics, billing), and the managed storage products are not reproduced and cannot be by three servers on a private mesh. This stack is reachable only from inside the WireGuard mesh; it has no public endpoint, no CDN and no TLS of its own (WireGuard encrypts the transport).

## Cluster

| Node  | Mesh IP     | workerd | Gateway (workers / s3 / db) | Garage (S3 / RPC / admin) | rqlite (HTTP / Raft) |
| ----- | ----------- | ------- | --------------------------- | ------------------------- | -------------------- |
| vps   | 10.200.77.1 | 17080   | 17081 / 17082 / 17083       | 17900 / 17901 / 17903     | 17401 / 17402        |
| bunos | 10.200.77.3 | 17080   | 17081 / 17082 / 17083       | 17900 / 17901 / 17903     | 17401 / 17402        |
| prod  | 10.200.77.5 | 17080   | 17081 / 17082 / 17083       | 17900 / 17901 / 17903     | 17401 / 17402        |

Every service binds to the mesh address only. Units are `yolo-cf-{workerd,gateway,garage,rqlite}.service` in `yolo-cf-stack.slice` (MemoryMax=2G and CPUQuota=100% for the whole stack, and again per unit), with `DynamicUser=yes` (no system user is created), `ProtectSystem=strict` and secrets passed as systemd credentials from `/etc/yolo-cf/secrets` (mode 0600, generated on the hosts, never in git).

```sh
deploy/install.sh                 # install or update all nodes, idempotent
deploy/install.sh status          # units and listeners
deploy/health.sh                  # full health report
deploy/deploy-worker.sh workers/hello/src/index.ts
deploy/uninstall.sh               # remove everything install.sh created
```

The scripts run from any operator machine with the SSH aliases `vps`, `bunos`, `prod` and Bun. The gateway is built on `vps` with Cargo.

## Aphrody Public Domain Hierarchy & Edge Routing Manifest

`src/aphrody-domains.ts` codifies the canonical DNS and edge routing manifest for the 18 public product domains in the `aphrody.com` zone (verified with `bun test`):

| Hostname                | Category       | DNS    | Proxied | Routing Tier    | Canonical Path | Owner Repo        | Backing Service      | Health Path             |
| ----------------------- | -------------- | ------ | ------- | --------------- | -------------- | ----------------- | -------------------- | ----------------------- |
| `aphrody.com`           | apex           | A/AAAA | no      | `origin-direct` | `/`            | `yolo-hub`        | `aphrody-webos-apex` | `/api/health`           |
| `search.aphrody.com`    | discovery      | CNAME  | yes     | `edge-proxy`    | `/search`      | `yolo-ai`         | `aphrody-search`     | `/api/search/health`    |
| `ai.aphrody.com`        | intelligence   | CNAME  | yes     | `edge-proxy`    | `/ai`          | `yolo-ai`         | `yolo-agent-engine`  | `/v1/health`            |
| `drive.aphrody.com`     | workspace      | CNAME  | yes     | `edge-proxy`    | `/files`       | `yolo-os`         | `aphrody-drive`      | `/api/drive/health`     |
| `docs.aphrody.com`      | workspace      | CNAME  | yes     | `edge-worker`   | `/word`        | `yolo-ui`         | `craft-word`         | `/health`               |
| `sheets.aphrody.com`    | workspace      | CNAME  | yes     | `edge-worker`   | `/grid`        | `yolo-ui`         | `craft-grid`         | `/health`               |
| `slides.aphrody.com`    | workspace      | CNAME  | yes     | `edge-worker`   | `/deck`        | `yolo-ui`         | `craft-deck`         | `/health`               |
| `mail.aphrody.com`      | communication  | CNAME  | yes     | `edge-worker`   | `/mail`        | `yolo-cloudflare` | `agentic-inbox`      | `/health`               |
| `meet.aphrody.com`      | communication  | CNAME  | yes     | `edge-worker`   | `/meet`        | `yolo-cloudflare` | `cloudflare-meet`    | `/health`               |
| `calendar.aphrody.com`  | workspace      | CNAME  | yes     | `edge-worker`   | `/calendar`    | `yolo-ui`         | `aphrody-calendar`   | `/health`               |
| `photos.aphrody.com`    | media          | CNAME  | yes     | `edge-worker`   | `/photo`       | `yolo-ui`         | `craft-photo`        | `/health`               |
| `translate.aphrody.com` | intelligence   | CNAME  | yes     | `edge-proxy`    | `/translate`   | `yolo-ai`         | `aphrody-translate`  | `/api/translate/health` |
| `maps.aphrody.com`      | discovery      | CNAME  | yes     | `edge-worker`   | `/maps`        | `yolo-web`        | `aphrody-maps`       | `/health`               |
| `play.aphrody.com`      | media          | CNAME  | yes     | `edge-proxy`    | `/play`        | `yolo-os`         | `aphrody-play`       | `/api/play/health`      |
| `os.aphrody.com`        | platform       | A/AAAA | no      | `origin-direct` | `/os`          | `yolo-os`         | `bunos-webos`        | `/api/health`           |
| `console.aphrody.com`   | infrastructure | CNAME  | yes     | `edge-proxy`    | `/console`     | `yolo-vps`        | `aphrody-console`    | `/api/console/health`   |
| `api.aphrody.com`       | infrastructure | A/AAAA | yes     | `mesh-gateway`  | `/api`         | `yolo-cloudflare` | `yolo-cf-gateway`    | `/_gateway/health`      |
| `yolo.aphrody.com`      | platform       | CNAME  | yes     | `edge-worker`   | `/yolo`        | `yolo-hub`        | `yolo-hub`           | `/fr/`                  |

## Claude Code plugin

`claude plugin validate .` checks `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` (receipt: `docs/receipts/05-plugin-validate.md`). The plugin is not enabled anywhere by this repository. To install it yourself:

```
/plugin install yolo-cloudflare --marketplace yolo-rs/yolo-cloudflare
```

## Licenses

Code written here (gateway, scripts, skills) is Apache-2.0. Each submodule keeps its own license (see `UPSTREAM.md`). Garage is AGPL-3.0 and rqlite MIT; both are downloaded as upstream binaries, verified by SHA-256, and not modified.
