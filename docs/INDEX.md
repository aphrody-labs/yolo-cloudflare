# Cloudflare docs index

Map of Cloudflare products to their directories in the vendored docs submodule `upstream/cloudflare-docs` (CC-BY-4.0), pinned at `8e45d6bf221f5676c96b0ce411cb5c3812bdaa45`. Fetch it with `git submodule update --init --depth 1 upstream/cloudflare-docs`. Pages are MDX. Shared fragments: `src/content/partials/<product>/`; changelogs: `src/content/changelog/`.

Products used by the self-hosted stack: [Workers](../upstream/cloudflare-docs/src/content/docs/workers/) (workerd runtime), [R2](../upstream/cloudflare-docs/src/content/docs/r2/) (role played by Garage, which is not R2), [D1](../upstream/cloudflare-docs/src/content/docs/d1/) (role played by rqlite, which is not D1), [Tunnel](../upstream/cloudflare-docs/src/content/docs/tunnel/) (cloudflared, installed but not run).

| Product | Title in the docs | Path | Pages |
| --- | --- | --- | ---: |
| 1.1.1.1 | 1.1.1.1 (DNS Resolver) | `upstream/cloudflare-docs/src/content/docs/1.1.1.1/` | 40 |
| agent-lee | Agent Lee | `upstream/cloudflare-docs/src/content/docs/agent-lee/` | 3 |
| agent-memory | Agent Memory | `upstream/cloudflare-docs/src/content/docs/agent-memory/` | 11 |
| agents | Build Agents on Cloudflare | `upstream/cloudflare-docs/src/content/docs/agents/` | 149 |
| agent-setup |  | `upstream/cloudflare-docs/src/content/docs/agent-setup/` | 13 |
| ai | AI | `upstream/cloudflare-docs/src/content/docs/ai/` | 13 |
| ai-crawl-control | AI Crawl Control | `upstream/cloudflare-docs/src/content/docs/ai-crawl-control/` | 34 |
| ai-gateway | Cloudflare AI Gateway | `upstream/cloudflare-docs/src/content/docs/ai-gateway/` | 109 |
| ai-search | Overview | `upstream/cloudflare-docs/src/content/docs/ai-search/` | 86 |
| analytics | Analytics | `upstream/cloudflare-docs/src/content/docs/analytics/` | 117 |
| api-shield | Cloudflare API Shield | `upstream/cloudflare-docs/src/content/docs/api-shield/` | 38 |
| argo-smart-routing | Argo Smart Routing | `upstream/cloudflare-docs/src/content/docs/argo-smart-routing/` | 4 |
| artifacts | Artifacts | `upstream/cloudflare-docs/src/content/docs/artifacts/` | 32 |
| automatic-platform-optimization | Automatic Platform Optimization | `upstream/cloudflare-docs/src/content/docs/automatic-platform-optimization/` | 16 |
| basin | Basin | `upstream/cloudflare-docs/src/content/docs/basin/` | 10 |
| basin-catalog | Basin Catalog | `upstream/cloudflare-docs/src/content/docs/basin-catalog/` | 17 |
| basin-pipelines | Basin Pipelines | `upstream/cloudflare-docs/src/content/docs/basin-pipelines/` | 40 |
| basin-sql | Basin SQL | `upstream/cloudflare-docs/src/content/docs/basin-sql/` | 15 |
| billing | Billing | `upstream/cloudflare-docs/src/content/docs/billing/` | 33 |
| bots | Cloudflare bot solutions | `upstream/cloudflare-docs/src/content/docs/bots/` | 51 |
| browser-run | Browser Run | `upstream/cloudflare-docs/src/content/docs/browser-run/` | 56 |
| byoip | Cloudflare BYOIP | `upstream/cloudflare-docs/src/content/docs/byoip/` | 21 |
| cache | Cloudflare Cache | `upstream/cloudflare-docs/src/content/docs/cache/` | 92 |
| cf | Cloudflare CLI | `upstream/cloudflare-docs/src/content/docs/cf/` | 13 |
| china-network | Cloudflare China Network | `upstream/cloudflare-docs/src/content/docs/china-network/` | 11 |
| client-ip-geolocation | Overview | `upstream/cloudflare-docs/src/content/docs/client-ip-geolocation/` | 4 |
| client-side-security | Client-side security | `upstream/cloudflare-docs/src/content/docs/client-side-security/` | 29 |
| cloudflare-challenges | Challenges | `upstream/cloudflare-docs/src/content/docs/cloudflare-challenges/` | 21 |
| cloudflare-for-platforms | Cloudflare for Platforms | `upstream/cloudflare-docs/src/content/docs/cloudflare-for-platforms/` | 104 |
| cloudflare-network-firewall | Cloudflare Network Firewall | `upstream/cloudflare-docs/src/content/docs/cloudflare-network-firewall/` | 35 |
| cloudflare-one | Cloudflare One | `upstream/cloudflare-docs/src/content/docs/cloudflare-one/` | 795 |
| cloudflare-wan | Cloudflare WAN | `upstream/cloudflare-docs/src/content/docs/cloudflare-wan/` | 113 |
| constellation | Overview | `upstream/cloudflare-docs/src/content/docs/constellation/` | 3 |
| containers | Containers | `upstream/cloudflare-docs/src/content/docs/containers/` | 41 |
| d1 | Cloudflare D1 | `upstream/cloudflare-docs/src/content/docs/d1/` | 59 |
| data-localization | Data Localization Suite | `upstream/cloudflare-docs/src/content/docs/data-localization/` | 27 |
| ddos-protection | Cloudflare DDoS Protection | `upstream/cloudflare-docs/src/content/docs/ddos-protection/` | 155 |
| dmarc-management | Cloudflare DMARC Management | `upstream/cloudflare-docs/src/content/docs/dmarc-management/` | 5 |
| dns | Cloudflare DNS | `upstream/cloudflare-docs/src/content/docs/dns/` | 140 |
| docs-for-agents | Docs for agents | `upstream/cloudflare-docs/src/content/docs/docs-for-agents/` | 1 |
| durable-objects | Cloudflare Durable Objects | `upstream/cloudflare-docs/src/content/docs/durable-objects/` | 62 |
| dynamic-workers | Dynamic Workers | `upstream/cloudflare-docs/src/content/docs/dynamic-workers/` | 20 |
| email-security | Overview | `upstream/cloudflare-docs/src/content/docs/email-security/` | 88 |
| email-service | Cloudflare Email Service | `upstream/cloudflare-docs/src/content/docs/email-service/` | 54 |
| firewall | Cloudflare Firewall Rules | `upstream/cloudflare-docs/src/content/docs/firewall/` | 28 |
| flagship | Cloudflare Flagship | `upstream/cloudflare-docs/src/content/docs/flagship/` | 23 |
| fundamentals | Cloudflare Fundamentals | `upstream/cloudflare-docs/src/content/docs/fundamentals/` | 143 |
| google-tag-gateway | Google tag gateway for advertisers | `upstream/cloudflare-docs/src/content/docs/google-tag-gateway/` | 1 |
| health-checks | Health Checks | `upstream/cloudflare-docs/src/content/docs/health-checks/` | 8 |
| hyperdrive | Hyperdrive (Postgres & MySQL) | `upstream/cloudflare-docs/src/content/docs/hyperdrive/` | 67 |
| images | Images | `upstream/cloudflare-docs/src/content/docs/images/` | 66 |
| k2 | K2 | `upstream/cloudflare-docs/src/content/docs/k2/` | 13 |
| key-transparency | Key Transparency Auditor | `upstream/cloudflare-docs/src/content/docs/key-transparency/` | 6 |
| kv | Cloudflare Workers KV | `upstream/cloudflare-docs/src/content/docs/kv/` | 35 |
| learning-paths |  | `upstream/cloudflare-docs/src/content/docs/learning-paths/` | 323 |
| load-balancing | Cloudflare Load Balancing | `upstream/cloudflare-docs/src/content/docs/load-balancing/` | 67 |
| logs | Cloudflare Logs | `upstream/cloudflare-docs/src/content/docs/logs/` | 76 |
| magic-transit | Cloudflare Magic Transit | `upstream/cloudflare-docs/src/content/docs/magic-transit/` | 48 |
| mesh | Cloudflare Mesh | `upstream/cloudflare-docs/src/content/docs/mesh/` | 15 |
| migration-guides | Migration guides | `upstream/cloudflare-docs/src/content/docs/migration-guides/` | 1 |
| monetization-gateway | Monetization Gateway | `upstream/cloudflare-docs/src/content/docs/monetization-gateway/` | 7 |
| moq | Media over QUIC at Cloudflare | `upstream/cloudflare-docs/src/content/docs/moq/` | 4 |
| multi-cloud-networking | Cloudflare One Multi-Cloud Networking (beta) | `upstream/cloudflare-docs/src/content/docs/multi-cloud-networking/` | 6 |
| network | Network settings | `upstream/cloudflare-docs/src/content/docs/network/` | 9 |
| network-error-logging | Network Error Logging | `upstream/cloudflare-docs/src/content/docs/network-error-logging/` | 4 |
| network-flow | Network Flow | `upstream/cloudflare-docs/src/content/docs/network-flow/` | 23 |
| network-interconnect | Cloudflare Network Interconnect | `upstream/cloudflare-docs/src/content/docs/network-interconnect/` | 7 |
| notifications | Alerts | `upstream/cloudflare-docs/src/content/docs/notifications/` | 12 |
| observability | Cloudflare Observability | `upstream/cloudflare-docs/src/content/docs/observability/` | 26 |
| ohttp-relay | Cloudflare OHTTP Relay | `upstream/cloudflare-docs/src/content/docs/ohttp-relay/` | 7 |
| pages | Cloudflare Pages | `upstream/cloudflare-docs/src/content/docs/pages/` | 124 |
| privacy-pass | Privacy Pass | `upstream/cloudflare-docs/src/content/docs/privacy-pass/` | 7 |
| privacy-proxy | Privacy Proxy | `upstream/cloudflare-docs/src/content/docs/privacy-proxy/` | 14 |
| pulumi | Pulumi | `upstream/cloudflare-docs/src/content/docs/pulumi/` | 7 |
| queues | Cloudflare Queues | `upstream/cloudflare-docs/src/content/docs/queues/` | 43 |
| r2 | Cloudflare R2 | `upstream/cloudflare-docs/src/content/docs/r2/` | 88 |
| radar | Cloudflare Radar | `upstream/cloudflare-docs/src/content/docs/radar/` | 28 |
| randomness-beacon | Cloudflare Randomness Beacon | `upstream/cloudflare-docs/src/content/docs/randomness-beacon/` | 9 |
| realtime | Cloudflare Realtime | `upstream/cloudflare-docs/src/content/docs/realtime/` | 708 |
| reference-architecture | Reference Architectures | `upstream/cloudflare-docs/src/content/docs/reference-architecture/` | 86 |
| registrar | Cloudflare Registrar | `upstream/cloudflare-docs/src/content/docs/registrar/` | 24 |
| resource-tagging | Resource Tagging | `upstream/cloudflare-docs/src/content/docs/resource-tagging/` | 9 |
| rules | Cloudflare Rules | `upstream/cloudflare-docs/src/content/docs/rules/` | 193 |
| ruleset-engine | Cloudflare Ruleset Engine | `upstream/cloudflare-docs/src/content/docs/ruleset-engine/` | 46 |
| sandbox | Sandboxes on Cloudflare | `upstream/cloudflare-docs/src/content/docs/sandbox/` | 121 |
| secrets-store | Cloudflare Secrets Store | `upstream/cloudflare-docs/src/content/docs/secrets-store/` | 9 |
| security | Application security dashboard | `upstream/cloudflare-docs/src/content/docs/security/` | 15 |
| security-center | Cloudflare Security Center | `upstream/cloudflare-docs/src/content/docs/security-center/` | 17 |
| smart-shield | Cloudflare Smart Shield | `upstream/cloudflare-docs/src/content/docs/smart-shield/` | 23 |
| spectrum | Cloudflare Spectrum | `upstream/cloudflare-docs/src/content/docs/spectrum/` | 22 |
| speed | Speed | `upstream/cloudflare-docs/src/content/docs/speed/` | 50 |
| ssl | Cloudflare SSL/TLS | `upstream/cloudflare-docs/src/content/docs/ssl/` | 139 |
| stream | Cloudflare Stream | `upstream/cloudflare-docs/src/content/docs/stream/` | 67 |
| style-guide | Style Guide | `upstream/cloudflare-docs/src/content/docs/style-guide/` | 163 |
| support | Support | `upstream/cloudflare-docs/src/content/docs/support/` | 120 |
| tenant | Cloudflare Tenant | `upstream/cloudflare-docs/src/content/docs/tenant/` | 11 |
| terraform | Cloudflare Terraform provider | `upstream/cloudflare-docs/src/content/docs/terraform/` | 33 |
| time-services | Cloudflare Time Services | `upstream/cloudflare-docs/src/content/docs/time-services/` | 9 |
| tunnel | Cloudflare Tunnel | `upstream/cloudflare-docs/src/content/docs/tunnel/` | 41 |
| turnstile | Cloudflare Turnstile | `upstream/cloudflare-docs/src/content/docs/turnstile/` | 52 |
| use-cases | Use cases | `upstream/cloudflare-docs/src/content/docs/use-cases/` | 59 |
| vectorize | Cloudflare Vectorize | `upstream/cloudflare-docs/src/content/docs/vectorize/` | 28 |
| version-management | Cloudflare Version Management | `upstream/cloudflare-docs/src/content/docs/version-management/` | 14 |
| waf | Cloudflare Web Application Firewall | `upstream/cloudflare-docs/src/content/docs/waf/` | 180 |
| waiting-room | Cloudflare Waiting Room | `upstream/cloudflare-docs/src/content/docs/waiting-room/` | 31 |
| wallets | Cloudflare Wallets | `upstream/cloudflare-docs/src/content/docs/wallets/` | 2 |
| warp-client | Cloudflare WARP client | `upstream/cloudflare-docs/src/content/docs/warp-client/` | 12 |
| web3 | Web3 | `upstream/cloudflare-docs/src/content/docs/web3/` | 35 |
| web-analytics | Cloudflare Web Analytics | `upstream/cloudflare-docs/src/content/docs/web-analytics/` | 18 |
| web-search | Cloudflare Web Search API | `upstream/cloudflare-docs/src/content/docs/web-search/` | 4 |
| workers | Cloudflare Workers | `upstream/cloudflare-docs/src/content/docs/workers/` | 476 |
| workers-ai | Cloudflare Workers AI | `upstream/cloudflare-docs/src/content/docs/workers-ai/` | 71 |
| workers-vpc | Cloudflare Workers VPC | `upstream/cloudflare-docs/src/content/docs/workers-vpc/` | 21 |
| workflows | Cloudflare Workflows | `upstream/cloudflare-docs/src/content/docs/workflows/` | 39 |
| zaraz | Cloudflare Zaraz | `upstream/cloudflare-docs/src/content/docs/zaraz/` | 50 |
