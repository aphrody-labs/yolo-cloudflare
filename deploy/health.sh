#!/usr/bin/env bash
# Read-only health report of the yolo-cloudflare cluster: units and listeners per node, each
# gateway's view of every pool, Garage cluster status and rqlite membership.
set -euo pipefail
cd "$(dirname "$0")/.."
. deploy/cluster.env
for n in $NODES; do
  echo "== $n units and mesh listeners"
  { printf 'NODE=%q\nACTION=status\n' "$n"; cat deploy/cluster.env deploy/lib/node.sh; } | ssh -o BatchMode=yes "$n" 'sudo bash -s'
done
echo "== gateway pool views (from $FIRST_NODE over the mesh)"
for n in $NODES; do
  ip=$(eval "echo \${MESH_IP_$n}")
  ssh -o BatchMode=yes "$FIRST_NODE" "curl -s -m 3 http://$ip:$PORT_GW_WORKERS/_gateway/health || echo '{\"node\":\"$n\",\"error\":\"gateway unreachable\"}'"
done
echo "== garage status"
ssh -o BatchMode=yes "$FIRST_NODE" "sudo /opt/yolo-cf/bin/yolo-cf-garage status" | sed -n '1,12p'
echo "== rqlite readiness"
for n in $NODES; do
  ip=$(eval "echo \${MESH_IP_$n}")
  printf '%s ' "$n"; ssh -o BatchMode=yes "$FIRST_NODE" "curl -s -m 3 http://$ip:$PORT_RQLITE_HTTP/readyz || echo unreachable"
done
