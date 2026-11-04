#!/usr/bin/env bash
# Removes everything deploy/install.sh created, on every node: the yolo-cf-* units and slice,
# /opt/yolo-cf, /etc/yolo-cf (secrets included) and the yolo-cf state directories.
# Nothing else on the hosts is read or changed.
set -euo pipefail
cd "$(dirname "$0")/.."
. deploy/cluster.env
for n in ${1:-$NODES}; do
  echo "== uninstall $n"
  { printf 'NODE=%q\nACTION=uninstall\n' "$n"; cat deploy/cluster.env deploy/lib/node.sh; } | ssh -o BatchMode=yes "$n" 'sudo bash -s'
done
