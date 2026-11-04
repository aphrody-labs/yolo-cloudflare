#!/usr/bin/env bash
# Rolling deploy of one Worker (ES module, TypeScript or JavaScript) to the "main" slot of workerd
# on every node: bundle with `bun build`, then node by node upload, restart, probe, roll back on failure.
# Usage: deploy/deploy-worker.sh workers/hello/src/index.ts
set -euo pipefail
cd "$(dirname "$0")/.."
. deploy/cluster.env
entry=${1:?usage: deploy/deploy-worker.sh <entry.ts>}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
bun build "$entry" --target=browser --format=esm --outfile "$tmp/worker.js" >/dev/null
echo "bundle $(sha256sum "$tmp/worker.js" | cut -d' ' -f1)  $entry"
for n in $NODES; do
  ip=$(eval "echo \${MESH_IP_$n}")
  ssh -o BatchMode=yes "$n" "sudo install -m 644 /dev/stdin /opt/yolo-cf/workerd/worker.js.new" < "$tmp/worker.js"
  ssh -o BatchMode=yes "$n" "sudo bash -s" <<EOF
set -e
cd /opt/yolo-cf/workerd
cp -f worker.js worker.js.prev
mv -f worker.js.new worker.js
systemctl restart yolo-cf-workerd
for i in \$(seq 1 40); do
  code=\$(curl -s -o /dev/null -w '%{http_code}' -m 2 http://$ip:$PORT_WORKERD/ || true)
  case "\$code" in [234]??) echo "[$n] deployed, http://$ip:$PORT_WORKERD/ answers \$code"; exit 0 ;; esac
  sleep 0.5
done
echo "[$n] no answer after restart, rolling back"
mv -f worker.js.prev worker.js
systemctl restart yolo-cf-workerd
exit 1
EOF
done
