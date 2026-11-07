---
name: cluster-health
description: Inspect the health of the self-hosted yolo-cloudflare cluster (workerd, Pingora gateway, Garage S3-compatible storage, rqlite) on vps, bunos and prod. Use when asked whether the local Cloudflare-style stack is up, which node is down, or why a gateway call fails.
---

# Inspect cluster health

## One command

`deploy/health.sh` from a checkout with the SSH aliases `vps`, `bunos`, `prod`. It prints, per node, the state of the four `yolo-cf-*` units and their mesh listeners, then each gateway's view of every pool, the Garage cluster status, and the rqlite membership.

## By hand

- Units on one node: `ssh <node> systemctl status 'yolo-cf-*' --no-pager`. Logs: `ssh <node> sudo journalctl -u yolo-cf-<service> -n 50 --no-pager`.
- Gateway view (any mesh member): `curl -s http://<mesh-ip>:17081/_gateway/health`. Each backend shows `healthy: true|false`; the gateway checks TCP every second and retries a failed connect on the next backend.
- Garage: `ssh vps sudo /opt/yolo-cf/bin/yolo-cf-garage status` and `... layout show`. Replication factor 3, consistent mode: reads and writes need 2 of 3 nodes.
- rqlite: `curl -s http://<mesh-ip>:17401/readyz` (anonymous), `ssh vps 'sudo /opt/yolo-cf/bin/rqlite -H 10.200.77.1 -p 17401 ...'` needs the credentials in `/etc/yolo-cf/secrets/rqlite_password`; never print them.

## Addresses

| Node  | Mesh IP     | workerd | gateway workers / s3 / db | Garage S3 / RPC / admin | rqlite HTTP / Raft |
| ----- | ----------- | ------- | ------------------------- | ----------------------- | ------------------ |
| vps   | 10.200.77.1 | 17080   | 17081 / 17082 / 17083     | 17900 / 17901 / 17903   | 17401 / 17402      |
| bunos | 10.200.77.3 | 17080   | 17081 / 17082 / 17083     | 17900 / 17901 / 17903   | 17401 / 17402      |
| prod  | 10.200.77.5 | 17080   | 17081 / 17082 / 17083     | 17900 / 17901 / 17903   | 17401 / 17402      |

## Rules

prod is a live production host. Only touch `yolo-cf-*` units there, never other containers or services. Stopping a `yolo-cf-*` unit for a test is fine; restart it afterwards and record it. Undo everything with `deploy/uninstall.sh`.
