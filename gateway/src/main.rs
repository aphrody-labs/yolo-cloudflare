//! Mesh-only gateway for the yolo-cloudflare stack, built on Pingora.
//!
//! One listener per pool. Each pool balances round robin over the same service
//! on every host, with a TCP health check every second and a retry on connect
//! failure, so a stopped instance is skipped instead of failing the request.
//!
//! Plain HTTP only: traffic stays inside the WireGuard mesh, and every listener
//! is configured with a mesh address.

use std::collections::BTreeMap;
use std::env;
use std::sync::Arc;
use std::time::Duration;

use async_trait::async_trait;
use log::info;
use pingora::http::ResponseHeader;
use pingora::lb::selection::RoundRobin;
use pingora::lb::{health_check, LoadBalancer};
use pingora::prelude::{HttpPeer, Opt};
use pingora::proxy::{http_proxy_service, ProxyHttp, Session};
use pingora::server::Server;
use pingora::services::background::background_service;
use pingora::{Error, ErrorType, Result};

/// Connect attempts per request, each on the next backend in round robin order.
const MAX_CONNECT_ATTEMPTS: usize = 3;

type Pool = Arc<LoadBalancer<RoundRobin>>;

struct Gateway {
    node: String,
    name: String,
    pool: Pool,
    /// Every pool of this gateway, for the status endpoint.
    pools: Arc<BTreeMap<String, Pool>>,
}

#[derive(Default)]
struct Ctx {
    attempts: usize,
    upstream: String,
}

fn pool_status(pools: &BTreeMap<String, Pool>) -> String {
    let body: Vec<String> = pools
        .iter()
        .map(|(name, pool)| {
            let backends = pool.backends();
            let entries: Vec<String> = backends
                .get_backend()
                .iter()
                .map(|b| format!("{{\"addr\":\"{}\",\"healthy\":{}}}", b.addr, backends.ready(b)))
                .collect();
            format!("\"{}\":[{}]", name, entries.join(","))
        })
        .collect();
    format!("{{{}}}", body.join(","))
}

#[async_trait]
impl ProxyHttp for Gateway {
    type CTX = Ctx;

    fn new_ctx(&self) -> Self::CTX {
        Ctx::default()
    }

    async fn request_filter(&self, session: &mut Session, _ctx: &mut Self::CTX) -> Result<bool> {
        if session.req_header().uri.path() != "/_gateway/health" {
            return Ok(false);
        }
        let body = format!(
            "{{\"node\":\"{}\",\"listener\":\"{}\",\"pools\":{}}}\n",
            self.node,
            self.name,
            pool_status(&self.pools)
        );
        let mut header = ResponseHeader::build(200, None)?;
        header.insert_header("content-type", "application/json")?;
        header.insert_header("content-length", body.len().to_string())?;
        session.write_response_header(Box::new(header), false).await?;
        session.write_response_body(Some(body.into()), true).await?;
        Ok(true)
    }

    async fn upstream_peer(
        &self,
        _session: &mut Session,
        ctx: &mut Self::CTX,
    ) -> Result<Box<HttpPeer>> {
        ctx.attempts += 1;
        let backend = self.pool.select(b"", 256).ok_or_else(|| {
            Error::explain(
                ErrorType::ConnectNoRoute,
                format!("pool {}: no healthy backend", self.name),
            )
        })?;
        ctx.upstream = backend.addr.to_string();
        info!("{} -> {} (attempt {})", self.name, ctx.upstream, ctx.attempts);
        let mut peer = HttpPeer::new(backend, false, String::new());
        peer.options.connection_timeout = Some(Duration::from_secs(1));
        Ok(Box::new(peer))
    }

    fn fail_to_connect(
        &self,
        _session: &mut Session,
        _peer: &HttpPeer,
        ctx: &mut Self::CTX,
        mut e: Box<Error>,
    ) -> Box<Error> {
        if ctx.attempts < MAX_CONNECT_ATTEMPTS {
            e.set_retry(true);
        }
        e
    }

    async fn response_filter(
        &self,
        _session: &mut Session,
        upstream_response: &mut ResponseHeader,
        ctx: &mut Self::CTX,
    ) -> Result<()> {
        upstream_response.insert_header("x-yolo-cf-gateway", self.node.as_str())?;
        upstream_response.insert_header("x-yolo-cf-upstream", ctx.upstream.as_str())?;
        Ok(())
    }
}

fn env_required(key: &str) -> String {
    env::var(key).unwrap_or_else(|_| panic!("{key} is required"))
}

fn main() {
    env_logger::init();

    let node = env_required("YOLO_CF_NODE");
    // Format: name=listen_addr=upstream1,upstream2;name2=listen_addr=...
    let spec = env_required("YOLO_CF_POOLS");

    let mut server = Server::new(Some(Opt::parse_args())).expect("server");
    server.bootstrap();

    let mut pools = BTreeMap::new();
    let mut listeners = Vec::new();
    for entry in spec.split(';').filter(|s| !s.is_empty()) {
        let mut parts = entry.splitn(3, '=');
        let (name, listen, upstreams) = match (parts.next(), parts.next(), parts.next()) {
            (Some(n), Some(l), Some(u)) => (n.to_string(), l.to_string(), u.to_string()),
            _ => panic!("bad pool entry: {entry}"),
        };
        let mut lb = LoadBalancer::try_from_iter(upstreams.split(',')).expect("upstreams");
        lb.set_health_check(health_check::TcpHealthCheck::new());
        lb.health_check_frequency = Some(Duration::from_secs(1));
        lb.parallel_health_check = true;
        let background = background_service(&format!("health {name}"), lb);
        pools.insert(name.clone(), background.task());
        server.add_service(background);
        listeners.push((name, listen));
    }

    let pools = Arc::new(pools);
    for (name, listen) in listeners {
        let gateway = Gateway {
            node: node.clone(),
            pool: pools[&name].clone(),
            pools: pools.clone(),
            name: name.clone(),
        };
        let mut service = http_proxy_service(&server.configuration, gateway);
        service.add_tcp(&listen);
        server.add_service(service);
    }

    server.run_forever();
}
