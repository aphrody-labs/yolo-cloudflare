# Failure test: stop one instance of our own services and observe (2026-11-04T22:30:37Z)

Only yolo-cf-* units on bunos are stopped, then restarted.

## workerd on bunos stopped

$ ssh bunos 'sudo systemctl stop yolo-cf-workerd; systemctl is-active yolo-cf-workerd'
inactive

$ ssh vps 'sleep 2; curl -s http://10.200.77.1:17081/_gateway/health'
{"node":"vps","listener":"workers","pools":{"db":[{"addr":"10.200.77.1:17401","healthy":true},{"addr":"10.200.77.3:17401","healthy":true},{"addr":"10.200.77.5:17401","healthy":true}],"s3":[{"addr":"10.200.77.1:17900","healthy":true},{"addr":"10.200.77.3:17900","healthy":true},{"addr":"10.200.77.5:17900","healthy":true}],"workers":[{"addr":"10.200.77.1:17080","healthy":true},{"addr":"10.200.77.3:17080","healthy":false},{"addr":"10.200.77.5:17080","healthy":true}]}}

$ ssh vps 'ok=0; fail=0; for i in $(seq 1 30); do if curl -sf -m 3 -o /dev/null http://10.200.77.1:17081/; then ok=$((ok+1)); else fail=$((fail+1)); fi; done; echo "30 requests through the vps gateway: ok=$ok failed=$fail"; for i in 1 2 3 4 5 6; do curl -s -m 3 http://10.200.77.1:17081/ | grep -o "\"node\":\"[a-z]*\""; done'
30 requests through the vps gateway: ok=30 failed=0
"node":"prod"
"node":"vps"
"node":"prod"
"node":"vps"
"node":"prod"
"node":"vps"

$ ssh vps 'curl -s -m 2 -o /dev/null -w "direct call to the stopped workerd: http=%{http_code}\n" http://10.200.77.3:17080/ || true'
direct call to the stopped workerd: http=000

## Garage on bunos stopped (2 of 3 replicas left)

$ ssh bunos 'sudo systemctl stop yolo-cf-garage; systemctl is-active yolo-cf-garage'
inactive

$ ssh vps 'sudo env $(cat /etc/yolo-cf/secrets/s3.env) /opt/yolo-cf/bin/bun /tmp/yolo-cf-s3.ts put http://10.200.77.1:17900 receipts/during-outage.txt "written-while-bunos-garage-down"'
put receipts/during-outage.txt via http://10.200.77.1:17900: 31 bytes

$ ssh prod 'sudo env $(cat /etc/yolo-cf/secrets/s3.env) /opt/yolo-cf/bin/bun /tmp/yolo-cf-s3.ts get http://10.200.77.5:17900 receipts/during-outage.txt'
get receipts/during-outage.txt via http://10.200.77.5:17900: written-while-bunos-garage-down

$ ssh vps 'sleep 1; sudo /opt/yolo-cf/bin/yolo-cf-garage status 2>&1 | sed -n 1,14p'
==== HEALTHY NODES ====
ID Hostname Address Tags Zone Capacity DataAvail ResyncQueue Version
072270cb701eedf7 vps-203bea89 10.200.77.1:17901 [vps] vps 18.6 GiB 88.5 GiB (30.5%) 0 v2.5.0
78b2f523c87895fc srv2116886 10.200.77.5:17901 [prod] prod 18.6 GiB 298.1 GiB (74.6%) 0 v2.5.0

==== FAILED NODES ====
ID Hostname Tags Zone Capacity Last seen
37c189728b602ce9 bunos [bunos] bunos 4.7 GiB 13 seconds ago

## rqlite on bunos stopped

$ ssh bunos 'sudo systemctl stop yolo-cf-rqlite; systemctl is-active yolo-cf-rqlite'
inactive

$ ssh vps 'curl -s -m 8 -X POST http://10.200.77.1:17081/db'
{"node":"prod","visits":{"results":[{"columns":["node","COUNT(*)"],"types":["text","integer"],"values":[["prod",1],["vps",2]]}]}}

## restart everything on bunos

$ ssh bunos 'sudo systemctl start yolo-cf-rqlite yolo-cf-garage yolo-cf-workerd; sleep 4; systemctl is-active yolo-cf-workerd yolo-cf-garage yolo-cf-rqlite | tr "\n" " "'
active active active
$ ssh bunos 'sudo env $(cat /etc/yolo-cf/secrets/s3.env) /opt/yolo-cf/bin/bun /tmp/yolo-cf-s3.ts get http://10.200.77.3:17900 receipts/during-outage.txt'
get receipts/during-outage.txt via http://10.200.77.3:17900: written-while-bunos-garage-down

$ ssh vps 'sleep 2; curl -s http://10.200.77.1:17081/_gateway/health'
{"node":"vps","listener":"workers","pools":{"db":[{"addr":"10.200.77.1:17401","healthy":true},{"addr":"10.200.77.3:17401","healthy":true},{"addr":"10.200.77.5:17401","healthy":true}],"s3":[{"addr":"10.200.77.1:17900","healthy":true},{"addr":"10.200.77.3:17900","healthy":true},{"addr":"10.200.77.5:17900","healthy":true}],"workers":[{"addr":"10.200.77.1:17080","healthy":true},{"addr":"10.200.77.3:17080","healthy":true},{"addr":"10.200.77.5:17080","healthy":true}]}}
