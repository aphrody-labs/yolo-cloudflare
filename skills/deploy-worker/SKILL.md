---
name: deploy-worker
description: Deploy a Worker (TypeScript or JavaScript ES module) to the self-hosted workerd cluster on the yolo mesh, with a rolling restart and automatic rollback per node. Use when asked to deploy, ship, update or roll back a Worker on our workerd, not on Cloudflare.
---

# Deploy a Worker to the mesh workerd cluster

The cluster runs upstream `workerd` on vps, bunos and prod, each bound to its WireGuard mesh address on port 17080, behind the Pingora gateway (port 17081 on each node). There is one Worker slot, `main`, per node.

## Never

- Never run `wrangler deploy`, `wrangler login`, or anything that talks to a Cloudflare account. This stack is local. The wrangler installed in `/opt/yolo-cf/bin/wrangler` uses an isolated config home and must stay logged out.
- Never bind anything to a public address or open a firewall port.

## Steps

1. Work from a checkout of `yolo-rs/yolo-cloudflare` on a machine with the SSH aliases `vps`, `bunos`, `prod`, plus Bun.
2. Write the Worker as an ES module with a `fetch(request, env)` default export. Available bindings: `env.NODE` and `env.MESH_IP` (text), `env.DB` (service binding to the local rqlite node) and `env.DB_AUTH` (its Authorization header value). See `workers/hello/src/index.ts`.
3. Deploy: `deploy/deploy-worker.sh path/to/entry.ts`. It bundles with `bun build`, then for each node in turn uploads the bundle, restarts `yolo-cf-workerd`, waits for an HTTP answer on the mesh address, and restores the previous bundle if the node does not answer.
4. Verify through every gateway: `deploy/health.sh`. To call it directly: `curl -s http://10.200.77.1:17081/` (vps), `http://10.200.77.3:17081/` (bunos), `http://10.200.77.5:17081/` (prod). The response header `x-yolo-cf-upstream` names the workerd that answered.
5. Record what you ran and its real output in `docs/receipts/` if the deploy is part of a change.

## Constraints of this runtime

workerd is the open source Workers runtime, not the Cloudflare platform: no KV, R2, D1, Queues or Durable Objects storage backed by Cloudflare, no `request.cf` data, no global network. Bindings are exactly the ones in `/opt/yolo-cf/workerd/config.capnp`, rendered by `deploy/lib/node.sh`.
