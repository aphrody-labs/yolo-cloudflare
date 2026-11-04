# Per-node actions, executed as root on one host. Sent over SSH by deploy/install.sh after
# deploy/cluster.env, so every variable of cluster.env is defined. Expects NODE and ACTION.
# Touches only: /opt/yolo-cf, /etc/yolo-cf, /etc/systemd/system/yolo-cf-*, /var/lib/yolo-cf-*,
# /var/lib/private/yolo-cf-*. Creates no user (DynamicUser), opens no public port.
set -euo pipefail

ip_of() { eval "echo \${MESH_IP_$1}"; }
MESH_IP=$(ip_of "$NODE")
UNITS="yolo-cf-rqlite yolo-cf-garage yolo-cf-workerd yolo-cf-gateway"
OPT=/opt/yolo-cf
ETC=/etc/yolo-cf
SEC=$ETC/secrets

log() { printf '[%s] %s\n' "$NODE" "$*"; }

preflight() {
  ip -4 -o addr show | grep -q " $MESH_IP/" || { log "mesh address $MESH_IP not present"; exit 1; }
  for p in $PORT_WORKERD $PORT_GW_WORKERS $PORT_GW_S3 $PORT_GW_DB $PORT_RQLITE_HTTP $PORT_RQLITE_RAFT $PORT_S3 $PORT_GARAGE_RPC $PORT_GARAGE_ADMIN; do
    owner=$(ss -ltnpH "sport = :$p" | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2 || true)
    [ -z "$owner" ] && continue
    unit=$(ps -o unit= -p "$owner" 2>/dev/null | tr -d ' ' || true)
    case "$unit" in yolo-cf-*) ;; *) log "port $p already used by pid $owner ($unit), refusing"; exit 1 ;; esac
  done
  log "preflight ok: $MESH_IP, ports free or ours"
}

fetch() { # name url sha256 -> $OPT/cache/name (verified)
  local f=$OPT/cache/$1
  if [ ! -f "$f" ] || ! echo "$3  $f" | sha256sum -c --status; then
    curl -fsSL --retry 3 -o "$f.part" "$2"
    echo "$3  $f.part" | sha256sum -c --status || { log "checksum mismatch for $1"; rm -f "$f.part"; exit 1; }
    mv "$f.part" "$f"
  fi
  log "verified $1 sha256=$3"
}

install_binaries() {
  install -d -m 755 $OPT $OPT/bin $OPT/cache $OPT/workerd $OPT/wrangler
  install -d -m 755 $ETC $ETC/garage $ETC/gateway
  install -d -m 700 $SEC
  fetch workerd-linux-64.gz "$WORKERD_URL" "$WORKERD_SHA256"
  gunzip -c $OPT/cache/workerd-linux-64.gz > $OPT/bin/workerd.new && chmod 755 $OPT/bin/workerd.new && mv $OPT/bin/workerd.new $OPT/bin/workerd
  fetch cloudflared "$CLOUDFLARED_URL" "$CLOUDFLARED_SHA256"
  install -m 755 $OPT/cache/cloudflared $OPT/bin/cloudflared
  fetch rqlite.tar.gz "$RQLITE_URL" "$RQLITE_SHA256"
  tar -xzf $OPT/cache/rqlite.tar.gz -C $OPT/cache
  install -m 755 $OPT/cache/rqlite-"$RQLITE_VERSION"-linux-amd64/rqlited $OPT/bin/rqlited
  install -m 755 $OPT/cache/rqlite-"$RQLITE_VERSION"-linux-amd64/rqlite $OPT/bin/rqlite
  fetch garage "$GARAGE_URL" "$GARAGE_SHA256"
  install -m 755 $OPT/cache/garage $OPT/bin/garage
  if [ -f $OPT/cache/yolo-cf-gateway.upload ]; then
    install -m 755 $OPT/cache/yolo-cf-gateway.upload $OPT/bin/yolo-cf-gateway
  fi
  [ -x $OPT/bin/yolo-cf-gateway ] || { log "gateway binary missing"; exit 1; }
}

install_wrangler() {
  local bun
  bun=$(command -v bun || true)
  [ -z "$bun" ] && for c in /usr/local/bin/bun /home/*/.local/bin/bun /home/*/.bun/bin/bun; do [ -x "$c" ] && bun=$c && break; done
  [ -n "$bun" ] || { log "bun not found, wrangler skipped"; return 0; }
  install -m 755 "$bun" $OPT/bin/bun
  if [ "$(cat $OPT/wrangler/.version 2>/dev/null)" != "$WRANGLER_VERSION" ]; then
    printf '{"name":"yolo-cf-wrangler","private":true}\n' > $OPT/wrangler/package.json
    (cd $OPT/wrangler && HOME=$OPT/wrangler BUN_INSTALL_CACHE_DIR=$OPT/cache/bun $OPT/bin/bun add --exact "wrangler@$WRANGLER_VERSION" >/dev/null)
    echo "$WRANGLER_VERSION" > $OPT/wrangler/.version
  fi
  # Isolated config home: wrangler here never sees an existing login, and never sends metrics.
  cat > $OPT/bin/wrangler <<EOF
#!/bin/sh
export XDG_CONFIG_HOME="\${TMPDIR:-/tmp}/yolo-cf-wrangler-\$(id -u)" WRANGLER_SEND_METRICS=false
exec $OPT/bin/bun --bun $OPT/wrangler/node_modules/wrangler/bin/wrangler.js "\$@"
EOF
  chmod 755 $OPT/bin/wrangler
  log "wrangler $WRANGLER_VERSION installed with Bun $($OPT/bin/bun --version)"
}

rand_hex() { head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'; }

secrets() {
  umask 077
  [ -s $SEC/garage_admin_token ] || rand_hex > $SEC/garage_admin_token
  [ -s $SEC/garage_metrics_token ] || rand_hex > $SEC/garage_metrics_token
  # Shared secrets are copied here by install.sh before this step.
  for s in garage_rpc_secret rqlite_password; do [ -s $SEC/$s ] || { log "missing shared secret $s"; exit 1; }; done
  local pw
  pw=$(cat $SEC/rqlite_password)
  printf '[{"username":"yolo-cf","password":"%s","perms":["all"]},{"username":"*","perms":["ready","status"]}]\n' "$pw" > $SEC/rqlite_auth.json
  printf 'YOLO_CF_RQLITE_AUTH=Basic %s\n' "$(printf 'yolo-cf:%s' "$pw" | base64 -w0)" > $SEC/workerd.env
  chmod 600 $SEC/*
}

configs() {
  umask 022
  local peers="" n
  for n in $NODES; do peers="$peers${peers:+,}$(ip_of "$n"):$PORT_RQLITE_RAFT"; done
  cat > $ETC/garage/garage.toml <<EOF
# Garage node $NODE. Secrets come from systemd credentials (see yolo-cf-garage.service).
metadata_dir = "/var/lib/yolo-cf-garage/meta"
data_dir = "/var/lib/yolo-cf-garage/data"
db_engine = "sqlite"
replication_factor = 3
consistency_mode = "consistent"
rpc_bind_addr = "$MESH_IP:$PORT_GARAGE_RPC"
rpc_public_addr = "$MESH_IP:$PORT_GARAGE_RPC"

[s3_api]
s3_region = "garage"
api_bind_addr = "$MESH_IP:$PORT_S3"

[admin]
api_bind_addr = "$MESH_IP:$PORT_GARAGE_ADMIN"
EOF
  cat > $OPT/bin/yolo-cf-garage <<EOF
#!/bin/sh
# Garage CLI for this node, run as root.
export GARAGE_RPC_SECRET_FILE=$SEC/garage_rpc_secret
exec $OPT/bin/garage -c $ETC/garage/garage.toml "\$@"
EOF
  chmod 755 $OPT/bin/yolo-cf-garage

  [ -f $OPT/workerd/worker.js ] || cp $OPT/cache/worker.js.upload $OPT/workerd/worker.js
  cat > $OPT/workerd/config.capnp <<EOF
# workerd on $NODE: one Worker slot ("main") served on the mesh address only.
using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (name = "main", worker = .mainWorker),
    (name = "rqlite", external = (address = "$MESH_IP:$PORT_RQLITE_HTTP", http = ())),
  ],
  sockets = [ (name = "http", address = "$MESH_IP:$PORT_WORKERD", http = (), service = "main") ],
);

const mainWorker :Workerd.Worker = (
  modules = [ (name = "worker.js", esModule = embed "worker.js") ],
  compatibilityDate = "$WORKER_COMPAT_DATE",
  bindings = [
    (name = "NODE", text = "$NODE"),
    (name = "MESH_IP", text = "$MESH_IP"),
    (name = "DB", service = "rqlite"),
    (name = "DB_AUTH", fromEnvironment = "YOLO_CF_RQLITE_AUTH"),
  ],
);
EOF

  local pools="" pool port svc
  for pool in workers:$PORT_GW_WORKERS:$PORT_WORKERD s3:$PORT_GW_S3:$PORT_S3 db:$PORT_GW_DB:$PORT_RQLITE_HTTP; do
    IFS=: read -r name port svc <<<"$pool"
    local ups=""
    for n in $NODES; do ups="$ups${ups:+,}$(ip_of "$n"):$svc"; done
    pools="$pools${pools:+;}$name=$MESH_IP:$port=$ups"
  done
  cat > $ETC/gateway/gateway.env <<EOF
YOLO_CF_NODE=$NODE
YOLO_CF_POOLS=$pools
RUST_LOG=warn
EOF
  cat > $ETC/gateway/pingora.yaml <<EOF
---
version: 1
threads: 2
pid_file: /run/yolo-cf-gateway/pingora.pid
upgrade_sock: /run/yolo-cf-gateway/upgrade.sock
grace_period_seconds: 1
graceful_shutdown_timeout_seconds: 1
EOF
  echo "$peers" > $ETC/rqlite.peers
  chmod 644 $ETC/garage/garage.toml $ETC/gateway/gateway.env $ETC/gateway/pingora.yaml $OPT/workerd/config.capnp $OPT/workerd/worker.js $ETC/rqlite.peers
}

unit_common() {
  cat <<EOF
Slice=yolo-cf-stack.slice
DynamicUser=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
PrivateDevices=yes
NoNewPrivileges=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX AF_NETLINK
LockPersonality=yes
MemoryMax=2G
CPUQuota=100%
TasksMax=512
LimitNOFILE=65536
Restart=always
RestartSec=3
EOF
}

units() {
  local d=/etc/systemd/system
  cat > $d/yolo-cf-stack.slice <<EOF
[Unit]
Description=yolo-cloudflare stack: one resource ceiling for every yolo-cf unit

[Slice]
MemoryMax=2G
CPUQuota=100%
EOF
  local head="[Unit]
After=network-online.target
Wants=network-online.target"
  cat > $d/yolo-cf-rqlite.service <<EOF
$head
Description=yolo-cf rqlite node $NODE (replicated SQLite, D1 role)

[Service]
$(unit_common)
StateDirectory=yolo-cf-rqlite
LoadCredential=auth:$SEC/rqlite_auth.json
ExecStart=$OPT/bin/rqlited -node-id=$NODE -http-addr=$MESH_IP:$PORT_RQLITE_HTTP -http-adv-addr=$MESH_IP:$PORT_RQLITE_HTTP -raft-addr=$MESH_IP:$PORT_RQLITE_RAFT -raft-adv-addr=$MESH_IP:$PORT_RQLITE_RAFT -bootstrap-expect=3 -join=$(cat $ETC/rqlite.peers) -auth=%d/auth -join-as=yolo-cf /var/lib/yolo-cf-rqlite/data

[Install]
WantedBy=multi-user.target
EOF
  cat > $d/yolo-cf-garage.service <<EOF
$head
Description=yolo-cf Garage node $NODE (S3-compatible object storage, R2 role)

[Service]
$(unit_common)
StateDirectory=yolo-cf-garage
LoadCredential=rpc_secret:$SEC/garage_rpc_secret
LoadCredential=admin_token:$SEC/garage_admin_token
LoadCredential=metrics_token:$SEC/garage_metrics_token
# systemd exposes credentials as 0440 on a mount readable only by this unit's dynamic user; Garage
# rejects any group bit, hence the override. The source files in /etc/yolo-cf/secrets are 0600 root.
Environment=GARAGE_RPC_SECRET_FILE=%d/rpc_secret GARAGE_ADMIN_TOKEN_FILE=%d/admin_token GARAGE_METRICS_TOKEN_FILE=%d/metrics_token GARAGE_ALLOW_WORLD_READABLE_SECRETS=true
ExecStart=$OPT/bin/garage -c $ETC/garage/garage.toml server

[Install]
WantedBy=multi-user.target
EOF
  cat > $d/yolo-cf-workerd.service <<EOF
$head
Description=yolo-cf workerd node $NODE (Workers runtime)

[Service]
$(unit_common)
EnvironmentFile=$SEC/workerd.env
ExecStart=$OPT/bin/workerd serve $OPT/workerd/config.capnp

[Install]
WantedBy=multi-user.target
EOF
  cat > $d/yolo-cf-gateway.service <<EOF
$head
Description=yolo-cf Pingora gateway node $NODE

[Service]
$(unit_common)
RuntimeDirectory=yolo-cf-gateway
EnvironmentFile=$ETC/gateway/gateway.env
ExecStart=$OPT/bin/yolo-cf-gateway -c $ETC/gateway/pingora.yaml

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
}

start() {
  local u
  for u in $UNITS; do systemctl enable --quiet "$u"; systemctl restart "$u"; done
  sleep 2
  for u in $UNITS; do printf '[%s] %s %s\n' "$NODE" "$u" "$(systemctl is-active "$u")"; done
}

uninstall() {
  local u
  for u in $UNITS; do systemctl disable --now --quiet "$u" 2>/dev/null || true; done
  rm -f /etc/systemd/system/yolo-cf-*.service /etc/systemd/system/yolo-cf-stack.slice
  systemctl daemon-reload
  for u in $UNITS; do systemctl reset-failed "$u" 2>/dev/null || true; done
  rm -rf $OPT $ETC /var/lib/yolo-cf-garage /var/lib/yolo-cf-rqlite /var/lib/private/yolo-cf-garage /var/lib/private/yolo-cf-rqlite
  log "removed units, $OPT, $ETC and yolo-cf state directories"
}

status() {
  local u
  for u in $UNITS; do printf '%-16s %s\n' "$u" "$(systemctl is-active "$u" 2>/dev/null)"; done
  ss -ltnH | awk '{print $4}' | grep -E "^$MESH_IP:(17080|1708[1-3]|1740[12]|1790[013])$" | sort | tr '\n' ' '; echo
}

case "$ACTION" in
  preflight) preflight ;;
  install) preflight; install_binaries; install_wrangler; secrets; configs; units; start ;;
  configure) secrets; configs; units; start ;;
  uninstall) uninstall ;;
  status) status ;;
  *) echo "unknown action $ACTION"; exit 2 ;;
esac
