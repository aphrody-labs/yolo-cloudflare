# Versions and install receipts (2026-11-04T22:29:56Z)
$ ssh vps '/opt/yolo-cf/bin/workerd --version; /opt/yolo-cf/bin/garage --version | head -1; /opt/yolo-cf/bin/rqlited -version 2>&1 | head -1; /opt/yolo-cf/bin/cloudflared --version; /opt/yolo-cf/bin/wrangler --version 2>&1 | tail -1; sha256sum /opt/yolo-cf/bin/yolo-cf-gateway'
workerd 2026-11-04
garage v2.5.0 [features: bundled-libs, consul-discovery, fjall, journald, k2v, kubernetes-discovery, lmdb, metrics, sqlite, syslog, telemetry-otlp]
rqlited v10.6.6 linux amd64 go1.27.3 sqlite3.53.4 (commit ce2152610ad76b7371e459931c7663e0176092d2, compiler gc)
cloudflared version 2026.10.7 (built 2026-10-30-17:05 UTC)

8cb76b82d9a05df482e7ad3196f0b87e844a2c6aa6c99eabdadaf9c47130ab1f  /opt/yolo-cf/bin/yolo-cf-gateway

$ ssh bunos '/opt/yolo-cf/bin/workerd --version; /opt/yolo-cf/bin/garage --version | head -1; /opt/yolo-cf/bin/rqlited -version 2>&1 | head -1; /opt/yolo-cf/bin/cloudflared --version; /opt/yolo-cf/bin/wrangler --version 2>&1 | tail -1; sha256sum /opt/yolo-cf/bin/yolo-cf-gateway'
workerd 2026-11-04
garage v2.5.0 [features: bundled-libs, consul-discovery, fjall, journald, k2v, kubernetes-discovery, lmdb, metrics, sqlite, syslog, telemetry-otlp]
rqlited v10.6.6 linux amd64 go1.27.3 sqlite3.53.4 (commit ce2152610ad76b7371e459931c7663e0176092d2, compiler gc)
cloudflared version 2026.10.7 (built 2026-10-30-17:05 UTC)

8cb76b82d9a05df482e7ad3196f0b87e844a2c6aa6c99eabdadaf9c47130ab1f  /opt/yolo-cf/bin/yolo-cf-gateway

$ ssh prod '/opt/yolo-cf/bin/workerd --version; /opt/yolo-cf/bin/garage --version | head -1; /opt/yolo-cf/bin/rqlited -version 2>&1 | head -1; /opt/yolo-cf/bin/cloudflared --version; /opt/yolo-cf/bin/wrangler --version 2>&1 | tail -1; sha256sum /opt/yolo-cf/bin/yolo-cf-gateway'
workerd 2026-11-04
garage v2.5.0 [features: bundled-libs, consul-discovery, fjall, journald, k2v, kubernetes-discovery, lmdb, metrics, sqlite, syslog, telemetry-otlp]
rqlited v10.6.6 linux amd64 go1.27.3 sqlite3.53.4 (commit ce2152610ad76b7371e459931c7663e0176092d2, compiler gc)
cloudflared version 2026.10.7 (built 2026-10-30-17:05 UTC)
4.157.0
8cb76b82d9a05df482e7ad3196f0b87e844a2c6aa6c99eabdadaf9c47130ab1f  /opt/yolo-cf/bin/yolo-cf-gateway

$ ssh vps "systemctl is-active yolo-cf-workerd yolo-cf-gateway yolo-cf-garage yolo-cf-rqlite | tr '\n' ' '; echo; sudo ss -ltnpH | grep -E ':(1708[0-3]|1740[12]|1790[013]) ' | awk '{print \$4, \$6}' | sed -E 's/,fd=[0-9]+//' | sort"
active active active active 
10.200.77.1:17080 users:(("workerd",pid=434975))
10.200.77.1:17081 users:(("yolo-cf-gateway",pid=435191))
10.200.77.1:17082 users:(("yolo-cf-gateway",pid=435191))
10.200.77.1:17083 users:(("yolo-cf-gateway",pid=435191))
10.200.77.1:17401 users:(("rqlited",pid=434587))
10.200.77.1:17402 users:(("rqlited",pid=434587))
10.200.77.1:17900 users:(("garage",pid=434787))
10.200.77.1:17901 users:(("garage",pid=434787))
10.200.77.1:17903 users:(("garage",pid=434787))

$ ssh bunos "systemctl is-active yolo-cf-workerd yolo-cf-gateway yolo-cf-garage yolo-cf-rqlite | tr '\n' ' '; echo; sudo ss -ltnpH | grep -E ':(1708[0-3]|1740[12]|1790[013]) ' | awk '{print \$4, \$6}' | sed -E 's/,fd=[0-9]+//' | sort"
active active active active 
10.200.77.3:17080 users:(("workerd",pid=269215))
10.200.77.3:17081 users:(("yolo-cf-gateway",pid=269302))
10.200.77.3:17082 users:(("yolo-cf-gateway",pid=269302))
10.200.77.3:17083 users:(("yolo-cf-gateway",pid=269302))
10.200.77.3:17401 users:(("rqlited",pid=269050))
10.200.77.3:17402 users:(("rqlited",pid=269050))
10.200.77.3:17900 users:(("garage",pid=269138))
10.200.77.3:17901 users:(("garage",pid=269138))
10.200.77.3:17903 users:(("garage",pid=269138))

$ ssh prod "systemctl is-active yolo-cf-workerd yolo-cf-gateway yolo-cf-garage yolo-cf-rqlite | tr '\n' ' '; echo; sudo ss -ltnpH | grep -E ':(1708[0-3]|1740[12]|1790[013]) ' | awk '{print \$4, \$6}' | sed -E 's/,fd=[0-9]+//' | sort"
active active active active 
10.200.77.5:17080 users:(("workerd",pid=3420350))
10.200.77.5:17081 users:(("yolo-cf-gateway",pid=3420424))
10.200.77.5:17082 users:(("yolo-cf-gateway",pid=3420424))
10.200.77.5:17083 users:(("yolo-cf-gateway",pid=3420424))
10.200.77.5:17401 users:(("rqlited",pid=3420182))
10.200.77.5:17402 users:(("rqlited",pid=3420182))
10.200.77.5:17900 users:(("garage",pid=3420275))
10.200.77.5:17901 users:(("garage",pid=3420275))
10.200.77.5:17903 users:(("garage",pid=3420275))

$ ssh prod "systemctl show yolo-cf-stack.slice -p MemoryMax -p CPUQuotaPerSecUSec; systemctl show yolo-cf-workerd -p MemoryMax -p CPUQuotaPerSecUSec -p DynamicUser"
CPUQuotaPerSecUSec=1s
MemoryMax=2147483648
CPUQuotaPerSecUSec=1s
MemoryMax=2147483648
DynamicUser=yes


## wrangler wrapper fix (22:32:41 UTC)
The first wrapper put wrangler's config home under root-owned /opt, so non-root runs logged EACCES. It now uses a per-user temp dir, still isolated from any real login:

$ ssh vps /opt/yolo-cf/bin/wrangler --version
4.157.0

$ ssh bunos /opt/yolo-cf/bin/wrangler --version
4.157.0

$ ssh prod /opt/yolo-cf/bin/wrangler --version
4.157.0

