# Object stored on one host, read from the others (Garage, S3 API, replication factor 3) (2026-11-04T22:30:32Z)

Credentials are loaded from /etc/yolo-cf/secrets/s3.env (0600) on each host and are not shown.

$ ssh vps 'sudo env $(cat /etc/yolo-cf/secrets/s3.env) /opt/yolo-cf/bin/bun /tmp/yolo-cf-s3.ts put http://10.200.77.1:17900 receipts/hello.txt "written-on-vps-2026-11-04T22:30:32Z"'
put receipts/hello.txt via http://10.200.77.1:17900: 35 bytes

$ ssh bunos 'sudo env $(cat /etc/yolo-cf/secrets/s3.env) /opt/yolo-cf/bin/bun /tmp/yolo-cf-s3.ts get http://10.200.77.3:17900 receipts/hello.txt'
get receipts/hello.txt via http://10.200.77.3:17900: written-on-vps-2026-11-04T22:30:32Z

$ ssh prod 'sudo env $(cat /etc/yolo-cf/secrets/s3.env) /opt/yolo-cf/bin/bun /tmp/yolo-cf-s3.ts get http://10.200.77.5:17900 receipts/hello.txt'
get receipts/hello.txt via http://10.200.77.5:17900: written-on-vps-2026-11-04T22:30:32Z

Through the gateways (S3 pool, port 17082):

$ ssh prod 'sudo env $(cat /etc/yolo-cf/secrets/s3.env) /opt/yolo-cf/bin/bun /tmp/yolo-cf-s3.ts put http://10.200.77.5:17082 receipts/via-gateway.txt "written-via-prod-gateway-2026-11-04T22:30:32Z"'
put receipts/via-gateway.txt via http://10.200.77.5:17082: 45 bytes

$ ssh bunos 'sudo env $(cat /etc/yolo-cf/secrets/s3.env) /opt/yolo-cf/bin/bun /tmp/yolo-cf-s3.ts get http://10.200.77.3:17082 receipts/via-gateway.txt'
get receipts/via-gateway.txt via http://10.200.77.3:17082: written-via-prod-gateway-2026-11-04T22:30:32Z

$ ssh vps 'sudo /opt/yolo-cf/bin/yolo-cf-garage status | sed -n 1,8p; sudo /opt/yolo-cf/bin/yolo-cf-garage bucket info yolo-cf-test | grep -iE "objects|size|quota"'
==== HEALTHY NODES ====
ID Hostname Address Tags Zone Capacity DataAvail ResyncQueue Version
072270cb701eedf7 vps-203bea89 10.200.77.1:17901 [vps] vps 18.6 GiB 88.5 GiB (30.5%) 0 v2.5.0
37c189728b602ce9 bunos 10.200.77.3:17901 [bunos] bunos 4.7 GiB 74.9 GiB (78.2%) 0 v2.5.0
78b2f523c87895fc srv2116886 10.200.77.5:17901 [prod] prod 18.6 GiB 298.1 GiB (74.6%) 0 v2.5.0
Size: 80 B (80 B)
Objects: 2
Quotas: enabled
maximum size: 5.4 GB (5.0 GiB)
