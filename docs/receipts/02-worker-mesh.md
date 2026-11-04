# Worker on workerd, called across the mesh through each gateway (2026-11-04T22:30:19Z)
$ ssh vps 'curl -s -m 3 http://10.200.77.1:17080/direct'
{"worker":"hello","runtime":"workerd","node":"vps","mesh_ip":"10.200.77.1","method":"GET","path":"/direct","time":"2026-11-04T22:30:19.768Z"}
$ ssh bunos 'curl -s -m 3 http://10.200.77.3:17080/direct'
{"worker":"hello","runtime":"workerd","node":"bunos","mesh_ip":"10.200.77.3","method":"GET","path":"/direct","time":"2026-11-04T22:30:20.689Z"}
$ ssh prod 'curl -s -m 3 http://10.200.77.5:17080/direct'
{"worker":"hello","runtime":"workerd","node":"prod","mesh_ip":"10.200.77.5","method":"GET","path":"/direct","time":"2026-11-04T22:30:21.299Z"}
$ ssh vps 'curl -s -m 3 -D - http://10.200.77.1:17081/via-gateway | grep -iE "^(HTTP|x-yolo|x-served)|worker"'
HTTP/1.1 200 OK
x-served-by: vps
x-yolo-cf-gateway: vps
x-yolo-cf-upstream: 10.200.77.1:17080
{"worker":"hello","runtime":"workerd","node":"vps","mesh_ip":"10.200.77.1","method":"GET","path":"/via-gateway","time":"2026-11-04T22:30:21.838Z"}

$ ssh vps 'curl -s -m 3 -D - http://10.200.77.3:17081/via-gateway | grep -iE "^(HTTP|x-yolo|x-served)|worker"'
HTTP/1.1 200 OK
x-served-by: vps
x-yolo-cf-gateway: bunos
x-yolo-cf-upstream: 10.200.77.1:17080
{"worker":"hello","runtime":"workerd","node":"vps","mesh_ip":"10.200.77.1","method":"GET","path":"/via-gateway","time":"2026-11-04T22:30:22.412Z"}

$ ssh vps 'curl -s -m 3 -D - http://10.200.77.5:17081/via-gateway | grep -iE "^(HTTP|x-yolo|x-served)|worker"'
HTTP/1.1 200 OK
x-served-by: vps
x-yolo-cf-gateway: prod
x-yolo-cf-upstream: 10.200.77.1:17080
{"worker":"hello","runtime":"workerd","node":"vps","mesh_ip":"10.200.77.1","method":"GET","path":"/via-gateway","time":"2026-11-04T22:30:23.014Z"}

$ ssh bunos 'curl -s -m 3 -D - http://10.200.77.1:17081/via-gateway | grep -iE "^(HTTP|x-yolo|x-served)|worker"'
HTTP/1.1 200 OK
x-served-by: bunos
x-yolo-cf-gateway: vps
x-yolo-cf-upstream: 10.200.77.3:17080
{"worker":"hello","runtime":"workerd","node":"bunos","mesh_ip":"10.200.77.3","method":"GET","path":"/via-gateway","time":"2026-11-04T22:30:24.177Z"}

$ ssh bunos 'curl -s -m 3 -D - http://10.200.77.3:17081/via-gateway | grep -iE "^(HTTP|x-yolo|x-served)|worker"'
HTTP/1.1 200 OK
x-served-by: bunos
x-yolo-cf-gateway: bunos
x-yolo-cf-upstream: 10.200.77.3:17080
{"worker":"hello","runtime":"workerd","node":"bunos","mesh_ip":"10.200.77.3","method":"GET","path":"/via-gateway","time":"2026-11-04T22:30:25.080Z"}

$ ssh bunos 'curl -s -m 3 -D - http://10.200.77.5:17081/via-gateway | grep -iE "^(HTTP|x-yolo|x-served)|worker"'
HTTP/1.1 200 OK
x-served-by: bunos
x-yolo-cf-gateway: prod
x-yolo-cf-upstream: 10.200.77.3:17080
{"worker":"hello","runtime":"workerd","node":"bunos","mesh_ip":"10.200.77.3","method":"GET","path":"/via-gateway","time":"2026-11-04T22:30:26.032Z"}

$ ssh prod 'curl -s -m 3 -D - http://10.200.77.1:17081/via-gateway | grep -iE "^(HTTP|x-yolo|x-served)|worker"'
HTTP/1.1 200 OK
x-served-by: prod
x-yolo-cf-gateway: vps
x-yolo-cf-upstream: 10.200.77.5:17080
{"worker":"hello","runtime":"workerd","node":"prod","mesh_ip":"10.200.77.5","method":"GET","path":"/via-gateway","time":"2026-11-04T22:30:26.685Z"}

$ ssh prod 'curl -s -m 3 -D - http://10.200.77.3:17081/via-gateway | grep -iE "^(HTTP|x-yolo|x-served)|worker"'
HTTP/1.1 200 OK
x-served-by: prod
x-yolo-cf-gateway: bunos
x-yolo-cf-upstream: 10.200.77.5:17080
{"worker":"hello","runtime":"workerd","node":"prod","mesh_ip":"10.200.77.5","method":"GET","path":"/via-gateway","time":"2026-11-04T22:30:27.336Z"}

$ ssh prod 'curl -s -m 3 -D - http://10.200.77.5:17081/via-gateway | grep -iE "^(HTTP|x-yolo|x-served)|worker"'
HTTP/1.1 200 OK
x-served-by: prod
x-yolo-cf-gateway: prod
x-yolo-cf-upstream: 10.200.77.5:17080
{"worker":"hello","runtime":"workerd","node":"prod","mesh_ip":"10.200.77.5","method":"GET","path":"/via-gateway","time":"2026-11-04T22:30:27.926Z"}

$ ssh vps 'for i in 1 2 3 4 5 6; do curl -s -m 3 http://10.200.77.5:17081/ | grep -o "\"node\":\"[a-z]*\""; done'
"node":"vps"
"node":"bunos"
"node":"prod"
"node":"vps"
"node":"bunos"
"node":"prod"

$ ssh bunos 'curl -s -m 5 -X POST http://10.200.77.3:17081/db; echo; curl -s -m 5 -X POST http://10.200.77.1:17081/db; echo; curl -s -m 5 http://10.200.77.5:17081/db'
{"node":"vps","visits":{"results":[{"columns":["node","COUNT(*)"],"types":["text","integer"],"values":[["vps",1]]}]}}
{"node":"vps","visits":{"results":[{"columns":["node","COUNT(*)"],"types":["text","integer"],"values":[["vps",2]]}]}}
{"node":"vps","visits":{"results":[{"columns":["node","COUNT(*)"],"types":["text","integer"],"values":[["vps",2]]}]}}
