#!/usr/bin/env bash
# Idempotent installer for the yolo-cloudflare stack. Run from an operator machine that has the
# SSH aliases of deploy/cluster.env (vps, bunos, prod). Safe to re-run: binaries are re-verified,
# secrets are kept, units are rewritten from cluster.env and restarted.
#   deploy/install.sh              install or update every node, then bootstrap the cluster
#   deploy/install.sh status       show units and mesh listeners on every node
#   deploy/install.sh bootstrap    only (re)run the Garage layout, bucket and key steps
# Reverse with deploy/uninstall.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
. deploy/cluster.env
ACTION=${1:-install}
SEC=/etc/yolo-cf/secrets
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

remote() { # node action
  { printf 'NODE=%q\nACTION=%q\n' "$1" "$2"; cat deploy/cluster.env deploy/lib/node.sh; } | ssh -o BatchMode=yes "$1" 'sudo bash -s'
}
push_file() { # node local-path remote-path
  ssh -o BatchMode=yes "$1" "sudo install -D -m 600 /dev/stdin $3" < "$2"
}
copy_secret() { # name: generate once on FIRST_NODE, stream to the others without printing it
  ssh "$FIRST_NODE" "sudo bash -c 'umask 077; mkdir -p $SEC; chmod 700 $SEC; [ -s $SEC/$1 ] || head -c 32 /dev/urandom | od -An -tx1 | tr -d \" \\n\" > $SEC/$1'"
  for n in $NODES; do
    [ "$n" = "$FIRST_NODE" ] && continue
    if ! ssh "$n" "sudo test -s $SEC/$1"; then
      ssh "$FIRST_NODE" "sudo cat $SEC/$1" | ssh "$n" "sudo bash -c 'umask 077; mkdir -p $SEC; chmod 700 $SEC; cat > $SEC/$1'"
    fi
  done
}

if [ "$ACTION" = status ]; then
  for n in $NODES; do echo "== $n"; remote "$n" status; done
  exit 0
fi

if [ "$ACTION" != bootstrap ]; then
echo "== preflight"
for n in $NODES; do remote "$n" preflight; done

echo "== gateway build on $BUILD_HOST (Pingora)"
# Rebuild only when the sources are newer than the binary (cargo's package lock is shared with other jobs).
ssh "$BUILD_HOST" "cd $BUILD_CHECKOUT/gateway && bin=\$HOME/src/yolo-work/target-gw/release/yolo-cf-gateway && if [ ! -x \$bin ] || [ -n \"\$(find src Cargo.toml -newer \$bin)\" ]; then CARGO_TARGET_DIR=\$HOME/src/yolo-work/target-gw \$HOME/.cargo/bin/cargo build --release -q -j 8; fi"
ssh "$BUILD_HOST" "cat \$HOME/src/yolo-work/target-gw/release/yolo-cf-gateway" > "$tmp/yolo-cf-gateway"
sha256sum "$tmp/yolo-cf-gateway"

echo "== test Worker bundle (bun build)"
bun build workers/hello/src/index.ts --target=browser --format=esm --outfile "$tmp/worker.js" >/dev/null
sha256sum "$tmp/worker.js"

echo "== shared secrets"
copy_secret garage_rpc_secret
copy_secret rqlite_password

for n in $NODES; do
  echo "== install $n"
  push_file "$n" "$tmp/yolo-cf-gateway" /opt/yolo-cf/cache/yolo-cf-gateway.upload
  push_file "$n" "$tmp/worker.js" /opt/yolo-cf/cache/worker.js.upload
  remote "$n" install
done
fi

echo "== garage cluster bootstrap"
g() { ssh "$1" "sudo /opt/yolo-cf/bin/yolo-cf-garage $2"; }
for n in $NODES; do
  for i in $(seq 1 20); do g "$n" "node id -q" > "$tmp/id.$n" 2>/dev/null && break; sleep 1; done
done
for n in $NODES; do [ "$n" = "$FIRST_NODE" ] || g "$FIRST_NODE" "node connect $(cat "$tmp/id.$n")" >/dev/null; done
if g "$FIRST_NODE" "layout show" | grep -qE "No nodes currently have a role|layout version: 0"; then
  for n in $NODES; do
    cap=$(eval "echo \${GARAGE_CAPACITY_$n}")
    # Node id first: --tag takes several values and would swallow a trailing id.
    g "$FIRST_NODE" "layout assign $(cut -d@ -f1 "$tmp/id.$n") -z $n -c $cap -t $n" >/dev/null
  done
  g "$FIRST_NODE" "layout apply --version 1" >/dev/null
fi
g "$FIRST_NODE" "bucket info $S3_BUCKET" >/dev/null 2>&1 || g "$FIRST_NODE" "bucket create $S3_BUCKET" >/dev/null
g "$FIRST_NODE" "key info $S3_KEY_NAME" >/dev/null 2>&1 || g "$FIRST_NODE" "key create $S3_KEY_NAME" >/dev/null
g "$FIRST_NODE" "bucket allow --read --write --owner $S3_BUCKET --key $S3_KEY_NAME" >/dev/null
g "$FIRST_NODE" "bucket set-quotas --max-size $S3_BUCKET_QUOTA $S3_BUCKET" >/dev/null
# S3 credentials for the test key: written 0600 on every node, never printed.
ssh "$FIRST_NODE" "sudo bash -s" <<EOF
umask 077
/opt/yolo-cf/bin/yolo-cf-garage key info --show-secret $S3_KEY_NAME | awk -F': *' '/^Key ID/{print "S3_ACCESS_KEY_ID="\$2} /^Secret key/{print "S3_SECRET_ACCESS_KEY="\$2}' > $SEC/s3.env
EOF
for n in $NODES; do
  [ "$n" = "$FIRST_NODE" ] && continue
  ssh "$FIRST_NODE" "sudo cat $SEC/s3.env" | ssh "$n" "sudo bash -c 'umask 077; cat > $SEC/s3.env'"
done
g "$FIRST_NODE" "status" | sed -n '1,12p'

echo "== status"
for n in $NODES; do echo "-- $n"; remote "$n" status; done
