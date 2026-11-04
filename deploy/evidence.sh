#!/usr/bin/env bash
# Produces the receipts in docs/receipts/: every command is echoed with "$ " before its real output.
# Runs from an operator machine with the SSH aliases; HTTP calls are made from a node over the mesh.
set -uo pipefail
cd "$(dirname "$0")/.."
. deploy/cluster.env
out=${1:-docs/receipts}
mkdir -p "$out"
run() { echo "\$ $*"; eval "$@" 2>&1; echo; }

{
  echo "# Versions and install receipts ($(date -u +%FT%TZ))"
  for n in $NODES; do
    run "ssh $n '/opt/yolo-cf/bin/workerd --version; /opt/yolo-cf/bin/garage --version | head -1; /opt/yolo-cf/bin/rqlited -version 2>&1 | head -1; /opt/yolo-cf/bin/cloudflared --version; /opt/yolo-cf/bin/wrangler --version 2>&1 | tail -1; sha256sum /opt/yolo-cf/bin/yolo-cf-gateway'"
  done
  for n in $NODES; do
    run "ssh $n \"systemctl is-active yolo-cf-workerd yolo-cf-gateway yolo-cf-garage yolo-cf-rqlite | tr '\\n' ' '; echo; sudo ss -ltnpH | grep -E ':(1708[0-3]|1740[12]|1790[013]) ' | awk '{print \\\$4, \\\$6}' | sed -E 's/,fd=[0-9]+//' | sort\""
  done
  run "ssh prod \"systemctl show yolo-cf-stack.slice -p MemoryMax -p CPUQuotaPerSecUSec; systemctl show yolo-cf-workerd -p MemoryMax -p CPUQuotaPerSecUSec -p DynamicUser\""
} > "$out/01-install.md"

{
  echo "# Worker on workerd, called across the mesh through each gateway ($(date -u +%FT%TZ))"
  for n in $NODES; do
    ip=$(eval "echo \${MESH_IP_$n}")
    run "ssh $n 'curl -s -m 3 http://$ip:$PORT_WORKERD/direct'"
  done
  for from in $NODES; do
    for to in $NODES; do
      ip=$(eval "echo \${MESH_IP_$to}")
      run "ssh $from 'curl -s -m 3 -D - http://$ip:$PORT_GW_WORKERS/via-gateway | grep -iE \"^(HTTP|x-yolo|x-served)|worker\"'"
    done
  done
  run "ssh vps 'for i in 1 2 3 4 5 6; do curl -s -m 3 http://10.200.77.5:$PORT_GW_WORKERS/ | grep -o \"\\\"node\\\":\\\"[a-z]*\\\"\"; done'"
  run "ssh bunos 'curl -s -m 5 -X POST http://10.200.77.3:$PORT_GW_WORKERS/db; echo; curl -s -m 5 -X POST http://10.200.77.1:$PORT_GW_WORKERS/db; echo; curl -s -m 5 http://10.200.77.5:$PORT_GW_WORKERS/db'"
} > "$out/02-worker-mesh.md"

cat > /tmp/yolo-cf-s3.ts <<'TS'
// Usage: bun s3.ts put|get <endpoint> <key> [body]
const [op, endpoint, key, body] = process.argv.slice(2);
const s3 = new Bun.S3Client({
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  endpoint, bucket: "yolo-cf-test", region: "garage",
});
if (op === "put") { await s3.write(key, body ?? ""); console.log(`put ${key} via ${endpoint}: ${(body ?? "").length} bytes`); }
else { console.log(`get ${key} via ${endpoint}: ${await s3.file(key).text()}`); }
TS
for n in $NODES; do scp -q /tmp/yolo-cf-s3.ts "$n:/tmp/yolo-cf-s3.ts"; done
s3() { # node args...
  local n=$1; shift
  echo "\$ ssh $n 'sudo env \$(cat /etc/yolo-cf/secrets/s3.env) /opt/yolo-cf/bin/bun /tmp/yolo-cf-s3.ts $*'"
  ssh "$n" "sudo bash -c 'set -a; . /etc/yolo-cf/secrets/s3.env; set +a; /opt/yolo-cf/bin/bun /tmp/yolo-cf-s3.ts $*'" 2>&1; echo
}
stamp=$(date -u +%FT%TZ)
{
  echo "# Object stored on one host, read from the others (Garage, S3 API, replication factor 3) ($stamp)"
  echo "Credentials are loaded from /etc/yolo-cf/secrets/s3.env (0600) on each host and are not shown."
  echo
  s3 vps put http://10.200.77.1:$PORT_S3 receipts/hello.txt "\"written-on-vps-$stamp\""
  s3 bunos get http://10.200.77.3:$PORT_S3 receipts/hello.txt
  s3 prod get http://10.200.77.5:$PORT_S3 receipts/hello.txt
  echo "Through the gateways (S3 pool, port $PORT_GW_S3):"
  echo
  s3 prod put http://10.200.77.5:$PORT_GW_S3 receipts/via-gateway.txt "\"written-via-prod-gateway-$stamp\""
  s3 bunos get http://10.200.77.3:$PORT_GW_S3 receipts/via-gateway.txt
  run "ssh vps 'sudo /opt/yolo-cf/bin/yolo-cf-garage status | sed -n 1,8p; sudo /opt/yolo-cf/bin/yolo-cf-garage bucket info yolo-cf-test | grep -iE \"objects|size|quota\"'"
} > "$out/03-object-storage.md"

{
  echo "# Failure test: stop one instance of our own services and observe ($(date -u +%FT%TZ))"
  echo "Only yolo-cf-* units on bunos are stopped, then restarted."
  echo
  echo "## workerd on bunos stopped"
  run "ssh bunos 'sudo systemctl stop yolo-cf-workerd; systemctl is-active yolo-cf-workerd'"
  run "ssh vps 'sleep 2; curl -s http://10.200.77.1:$PORT_GW_WORKERS/_gateway/health'"
  run "ssh vps 'ok=0; fail=0; for i in \$(seq 1 30); do if curl -sf -m 3 -o /dev/null http://10.200.77.1:$PORT_GW_WORKERS/; then ok=\$((ok+1)); else fail=\$((fail+1)); fi; done; echo \"30 requests through the vps gateway: ok=\$ok failed=\$fail\"; for i in 1 2 3 4 5 6; do curl -s -m 3 http://10.200.77.1:$PORT_GW_WORKERS/ | grep -o \"\\\"node\\\":\\\"[a-z]*\\\"\"; done'"
  run "ssh vps 'curl -s -m 2 -o /dev/null -w \"direct call to the stopped workerd: http=%{http_code}\\n\" http://10.200.77.3:$PORT_WORKERD/ || true'"
  echo "## Garage on bunos stopped (2 of 3 replicas left)"
  run "ssh bunos 'sudo systemctl stop yolo-cf-garage; systemctl is-active yolo-cf-garage'"
} > "$out/04-failure.md"
{
  s3 vps put http://10.200.77.1:$PORT_S3 receipts/during-outage.txt "\"written-while-bunos-garage-down\""
  s3 prod get http://10.200.77.5:$PORT_S3 receipts/during-outage.txt
  run "ssh vps 'sleep 1; sudo /opt/yolo-cf/bin/yolo-cf-garage status 2>&1 | sed -n 1,14p'"
  echo "## rqlite on bunos stopped"
  run "ssh bunos 'sudo systemctl stop yolo-cf-rqlite; systemctl is-active yolo-cf-rqlite'"
  run "ssh vps 'curl -s -m 8 -X POST http://10.200.77.1:$PORT_GW_WORKERS/db'"
  echo "## restart everything on bunos"
  run "ssh bunos 'sudo systemctl start yolo-cf-rqlite yolo-cf-garage yolo-cf-workerd; sleep 4; systemctl is-active yolo-cf-workerd yolo-cf-garage yolo-cf-rqlite | tr \"\\n\" \" \"'"
  s3 bunos get http://10.200.77.3:$PORT_S3 receipts/during-outage.txt
  run "ssh vps 'sleep 2; curl -s http://10.200.77.1:$PORT_GW_WORKERS/_gateway/health'"
} >> "$out/04-failure.md"
for n in $NODES; do ssh "$n" "rm -f /tmp/yolo-cf-s3.ts"; done
echo "receipts written to $out"
