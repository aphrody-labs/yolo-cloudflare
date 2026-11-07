# Receipts (2026-11-04)

Produced by `deploy/evidence.sh` from the operator workstation over SSH; HTTP and S3 calls run on the hosts against mesh addresses. Every command is printed with `$ ` before its real output.

| File                    | What it shows                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `01-install.md`         | Versions on each host (workerd v1.20261104.1, Garage v2.5.0, rqlite v10.6.6, cloudflared 2026.10.7, wrangler 4.157.0 under Bun), gateway binary hash, units active, listeners bound to mesh addresses only, slice and unit limits on prod.                                                                                                                                                 |
| `02-worker-mesh.md`     | The test Worker answering on each workerd directly, then through every gateway from every host (9 cross-host calls; `x-yolo-cf-upstream` shows round robin over the 3 workerd), and the Worker writing and reading rqlite.                                                                                                                                                                 |
| `03-object-storage.md`  | Object written through Garage on vps, read on bunos and prod; written through the prod gateway, read through the bunos gateway.                                                                                                                                                                                                                                                            |
| `04-failure.md`         | workerd on bunos stopped: the gateway marks it unhealthy, 30 of 30 requests through the vps gateway succeed, served by vps and prod. Garage on bunos stopped: writes and reads continue (2 of 3 replicas), and the object written during the outage is readable on bunos after restart. rqlite on bunos stopped: the Worker still writes through the rqlite cluster. Everything restarted. |
| `05-plugin-validate.md` | `claude plugin validate .` passed.                                                                                                                                                                                                                                                                                                                                                         |

## Run, and not run

- Run: workerd, the Pingora gateway, Garage and rqlite on vps, bunos and prod.
- Installed only, not run: `cloudflared` (no tunnel by design) and `wrangler` (version check only; never logged in, never used to deploy to Cloudflare).
- Not tested: stopping a gateway (there is no shared virtual IP, so a client must switch to another node's gateway itself), stopping the rqlite leader, stopping a whole host, and load or latency measurements.
- Not equivalent to Cloudflare: no global anycast, no DDoS protection, no public edge network, no account-level services (DNS, certificates, WAF, Access, analytics), no R2, D1, KV, Durable Objects storage or Queues. Garage is S3-compatible but is not R2; rqlite plays the D1 role but is not D1. Three hosts on a private mesh cannot reproduce Cloudflare's network.

## Changes on each host (all reversible with `deploy/uninstall.sh`)

Same on vps, bunos and prod:

- Units `/etc/systemd/system/yolo-cf-{rqlite,garage,workerd,gateway}.service` (enabled) and `yolo-cf-stack.slice` (MemoryMax=2G, CPUQuota=100%), `DynamicUser=yes`, so no user was added.
- `/opt/yolo-cf` (binaries, a copy of Bun, wrangler under `/opt/yolo-cf/wrangler`, download cache, Worker bundle and workerd config).
- `/etc/yolo-cf` (Garage and gateway config, `secrets/` 0700 with 0600 files generated on the hosts).
- State: `/var/lib/private/yolo-cf-garage`, `/var/lib/private/yolo-cf-rqlite` (symlinked from `/var/lib`).
- Listeners on the mesh address only: 17080, 17081-17083, 17401-17402, 17900, 17901, 17903.
- Nothing else: no firewall, WireGuard, nginx, Docker, DNS, cron or user change; on bunos nothing under `/srv`, and Docker was left stopped.

On vps only: the repository checkout `~/src/yolo-work/yolo-cloudflare`, the gateway build dir `~/src/yolo-work/target-gw`, logs and a staging copy of the Garage binary under `~/src/yolo-work/`. The `dxflrs/garage:v2.5.0` image was pulled to cross-check the binary hash, then removed.
