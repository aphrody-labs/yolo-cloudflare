# Upstream sources

Vendored as shallow git submodules (`git submodule add --depth 1`, `shallow = true` in `.gitmodules`) under `upstream/<name>`.
Each submodule points at `https://github.com/cloudflare/<name>` and is pinned to the commit below. Machine-readable copy: `sources.lock.json`.

Selection: Public repositories of github.com/cloudflare, sorted by stars (gh api, paginated), excluding forks; the first 40 that carry a license. NOASSERTION licenses were verified by reading the LICENSE file.

Star counts are the values the GitHub API returned on 2026-11-04. Rank is the position among all public repositories of the organisation, archived ones included.

| Rank | Repository | Stars | License | Pinned commit | Status | Retrieved |
| ---: | --- | ---: | --- | --- | --- | --- |
| 1 | [security-audit-skill](https://github.com/cloudflare/security-audit-skill) | 59163 | MIT | `c1c8a8c14710` |  | 2026-11-04 |
| 2 | [pingora](https://github.com/cloudflare/pingora) | 27778 | Apache-2.0 | `1adcb3815b70` |  | 2026-11-04 |
| 3 | [cloudflared](https://github.com/cloudflare/cloudflared) | 16438 | Apache-2.0 | `3106f9499d6a` |  | 2026-11-04 |
| 4 | [quiche](https://github.com/cloudflare/quiche) | 12845 | BSD-2-Clause | `d7387df4b92f` |  | 2026-11-04 |
| 5 | [cloudflare-os](https://github.com/cloudflare/cloudflare-os) | 11681 | Apache-2.0 | `e39537b4d878` |  | 2026-11-04 |
| 6 | [moltworker](https://github.com/cloudflare/moltworker) | 9946 | Apache-2.0 | `7b00c1d72921` |  | 2026-11-04 |
| 7 | [computer](https://github.com/cloudflare/computer) | 9816 | MIT | `b995d86503ea` |  | 2026-11-04 |
| 8 | [cfssl](https://github.com/cloudflare/cfssl) | 9496 | BSD-2-Clause | `e5d686ddb7af` |  | 2026-11-04 |
| 9 | [vinext](https://github.com/cloudflare/vinext) | 9305 | MIT | `83f19a889ae0` |  | 2026-11-04 |
| 10 | [workerd](https://github.com/cloudflare/workerd) | 9129 | Apache-2.0 | `069edaa93d2c` |  | 2026-11-04 |
| 11 | [agentic-inbox](https://github.com/cloudflare/agentic-inbox) | 8598 | Apache-2.0 | `48039bb6785a` |  | 2026-11-04 |
| 12 | [boringtun](https://github.com/cloudflare/boringtun) | 7249 | BSD-3-Clause | `6dcc889a95ad` |  | 2026-11-04 |
| 13 | [agents](https://github.com/cloudflare/agents) | 5948 | MIT | `a2f1216993aa` |  | 2026-11-04 |
| 14 | [vibesdk](https://github.com/cloudflare/vibesdk) | 5453 | MIT | `32c9e429cd27` |  | 2026-11-04 |
| 15 | [cloudflare-docs](https://github.com/cloudflare/cloudflare-docs) | 5404 | CC-BY-4.0 | `8e45d6bf221f` |  | 2026-11-04 |
| 16 | [workers-sdk](https://github.com/cloudflare/workers-sdk) | 4704 | Apache-2.0 | `b8387a50d360` |  | 2026-11-04 |
| 17 | [mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare) | 4445 | Apache-2.0 | `a21972e21928` |  | 2026-11-04 |
| 18 | [kumo](https://github.com/cloudflare/kumo) | 4179 | MIT | `9d8b6e53dfdc` |  | 2026-11-04 |
| 19 | [flan](https://github.com/cloudflare/flan) | 4155 | BSD-3-Clause | `6588b07751f1` | archived | 2026-11-04 |
| 20 | [capnweb](https://github.com/cloudflare/capnweb) | 4029 | MIT | `07032e2a7c46` |  | 2026-11-04 |
| 21 | [miniflare](https://github.com/cloudflare/miniflare) | 3925 | MIT | `b536e56ee198` | archived | 2026-11-04 |
| 22 | [workers-rs](https://github.com/cloudflare/workers-rs) | 3773 | Apache-2.0 | `eac25c105aae` |  | 2026-11-04 |
| 23 | [skills](https://github.com/cloudflare/skills) | 3279 | Apache-2.0 | `1f2cd0a19588` |  | 2026-11-04 |
| 24 | [tableflip](https://github.com/cloudflare/tableflip) | 3219 | BSD-3-Clause | `64983fb2d863` |  | 2026-11-04 |
| 25 | [wrangler-legacy](https://github.com/cloudflare/wrangler-legacy) | 3188 | Apache-2.0 | `7f900bfae2d2` | archived | 2026-11-04 |
| 26 | [ebpf_exporter](https://github.com/cloudflare/ebpf_exporter) | 2658 | MIT | `4bef30d2ec7f` |  | 2026-11-04 |
| 27 | [gokey](https://github.com/cloudflare/gokey) | 2440 | BSD-3-Clause | `a5b5ea4b9bf9` |  | 2026-11-04 |
| 28 | [meet](https://github.com/cloudflare/meet) | 2317 | Apache-2.0 (GitHub: NOASSERTION) | `314d42405e4d` |  | 2026-11-04 |
| 29 | [templates](https://github.com/cloudflare/templates) | 2164 | MIT | `b7f990ee561f` |  | 2026-11-04 |
| 30 | [wildebeest](https://github.com/cloudflare/wildebeest) | 2116 | Apache-2.0 (GitHub: NOASSERTION) | `b056670a7204` |  | 2026-11-04 |
| 31 | [cloudflare-go](https://github.com/cloudflare/cloudflare-go) | 2112 | Apache-2.0 | `91580cb481bd` |  | 2026-11-04 |
| 32 | [lol-html](https://github.com/cloudflare/lol-html) | 2090 | BSD-3-Clause | `1d5ee9e88f23` |  | 2026-11-04 |
| 33 | [wrangler-action](https://github.com/cloudflare/wrangler-action) | 2001 | Apache-2.0 | `a17640ae5ec0` |  | 2026-11-04 |
| 34 | [workers-oauth-provider](https://github.com/cloudflare/workers-oauth-provider) | 1892 | MIT | `b4cec3173079` |  | 2026-11-04 |
| 35 | [nimbus](https://github.com/cloudflare/nimbus) | 1737 | MIT | `5d217d808029` |  | 2026-11-04 |
| 36 | [circl](https://github.com/cloudflare/circl) | 1734 | BSD-3-Clause (GitHub: NOASSERTION) | `009e98e5d362` |  | 2026-11-04 |
| 37 | [foundations](https://github.com/cloudflare/foundations) | 1716 | BSD-3-Clause | `7dd40e50eeed` |  | 2026-11-04 |
| 38 | [serverless-registry](https://github.com/cloudflare/serverless-registry) | 1606 | Apache-2.0 | `a73605d6d558` |  | 2026-11-04 |
| 39 | [next-on-pages](https://github.com/cloudflare/next-on-pages) | 1492 | MIT | `e230109db9b1` | archived | 2026-11-04 |
| 40 | [cf-terraforming](https://github.com/cloudflare/cf-terraforming) | 1423 | MPL-2.0 | `f43309a44187` |  | 2026-11-04 |

## Skipped

Repositories that ranked inside the selection window but were not vendored:

- none inside the window: every repository above the cut-off carries a license and none is a fork.

The most-starred repositories for which the GitHub API reports no license at all (never vendored):

- workers-graphql-server (793 stars)
- boring (529 stars)
- lua-resty-logger-socket (491 stars)
- lua-resty-cookie (348 stars)
- cloudflare-rs (319 stars)
- turnstile-demo-workers (265 stars)
- argo-tunnel-examples (244 stars)
- worker-template-router (238 stars)
- html-rewriter-wasm (219 stars)
- worker-speedtest-template (216 stars)
- containers-demos (213 stars)
- awesome-agents (203 stars)
- moq-rs (184 stars)
- realtime-examples (160 stars)
- freighter (157 stars)

## Licenses

Each submodule keeps its own license; nothing in `upstream/` is relicensed by this repository.
`cloudflare-docs` content is CC-BY-4.0 (attribution required when reusing text).
Garage, used in `deploy/` for the S3-compatible role, is AGPL-3.0 and is downloaded as an unmodified upstream binary; it is not vendored here.
