#!/usr/bin/env bun
// Regenerates sources.lock.json and UPSTREAM.md from the submodules and the GitHub API.
// Usage: bun scripts/lock-sources.ts   (needs `gh` authenticated, run from the repo root)
import { $ } from "bun";

type Repo = {
  name: string;
  stargazers_count: number;
  license: { spdx_id: string } | null;
  fork: boolean;
  archived: boolean;
  default_branch: string;
  description: string | null;
};

// GitHub reports NOASSERTION when it cannot classify a LICENSE file. These were read by hand on 2026-11-04.
const VERIFIED: Record<string, string> = {
  meet: "Apache-2.0",
  wildebeest: "Apache-2.0",
  circl: "BSD-3-Clause",
};

const retrieved = new Date().toISOString().slice(0, 10);
const raw =
  await $`gh api --paginate ${"orgs/cloudflare/repos?per_page=100&type=public"} --jq ${".[]"}`.text();
const repos: Repo[] = raw
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l))
  .sort((a: Repo, b: Repo) => b.stargazers_count - a.stargazers_count);

const paths = (
  await $`git config -f .gitmodules --get-regexp ${"^submodule\\..*\\.path$"}`.text()
)
  .trim()
  .split("\n")
  .map((l) => l.split(" ")[1]);
const vendored = new Map<string, string>();
for (const p of paths) {
  const sha = (await $`git ls-files -s ${p}`.text()).split(" ")[1];
  vendored.set(p.replace(/^upstream\//, ""), sha);
}

const sources = [];
const skipped = [];
let lastStars = Infinity;
for (const [i, r] of repos.entries()) {
  const spdx = r.license?.spdx_id ?? "NONE";
  if (vendored.has(r.name)) {
    lastStars = r.stargazers_count;
    sources.push({
      name: r.name,
      rank: i + 1,
      url: `https://github.com/cloudflare/${r.name}`,
      path: `upstream/${r.name}`,
      stars: r.stargazers_count,
      license: VERIFIED[r.name] ?? spdx,
      license_github: spdx,
      archived: r.archived,
      default_branch: r.default_branch,
      commit: vendored.get(r.name),
      retrieved,
      description: r.description,
    });
  }
}
for (const [i, r] of repos.entries()) {
  if (r.stargazers_count < lastStars || vendored.has(r.name)) continue;
  const spdx = r.license?.spdx_id ?? "NONE";
  skipped.push({
    name: r.name,
    rank: i + 1,
    stars: r.stargazers_count,
    reason: r.fork
      ? "fork of another project"
      : spdx === "NONE"
        ? "no license"
        : `license ${spdx} not verified`,
  });
}
const lockedStars = new Set(sources.map((s) => s.name));
const noLicense = repos
  .filter((r) => !r.license && !r.fork && !lockedStars.has(r.name))
  .slice(0, 15);

const lock = {
  schema: 1,
  generated: retrieved,
  selection:
    "Public repositories of github.com/cloudflare, sorted by stars (gh api, paginated), excluding forks; the first 40 that carry a license. NOASSERTION licenses were verified by reading the LICENSE file.",
  sources,
  skipped,
  unlicensed_top: noLicense.map((r) => ({
    name: r.name,
    stars: r.stargazers_count,
  })),
};
await Bun.write("sources.lock.json", JSON.stringify(lock, null, 2) + "\n");

const rows = sources
  .map(
    (s) =>
      `| ${s.rank} | [${s.name}](${s.url}) | ${s.stars} | ${s.license}${s.license !== s.license_github ? ` (GitHub: ${s.license_github})` : ""} | \`${s.commit?.slice(0, 12)}\` | ${s.archived ? "archived" : ""} | ${s.retrieved} |`,
  )
  .join("\n");
const md = `# Upstream sources

Vendored as shallow git submodules (\`git submodule add --depth 1\`, \`shallow = true\` in \`.gitmodules\`) under \`upstream/<name>\`.
Each submodule points at \`https://github.com/cloudflare/<name>\` and is pinned to the commit below. Machine-readable copy: \`sources.lock.json\`.

Selection: ${lock.selection}

Star counts are the values the GitHub API returned on ${retrieved}. Rank is the position among all public repositories of the organisation, archived ones included.

| Rank | Repository | Stars | License | Pinned commit | Status | Retrieved |
| ---: | --- | ---: | --- | --- | --- | --- |
${rows}

## Skipped

Repositories that ranked inside the selection window but were not vendored:

${skipped.length ? skipped.map((s) => `- ${s.name} (rank ${s.rank}, ${s.stars} stars): ${s.reason}`).join("\n") : "- none inside the window: every repository above the cut-off carries a license and none is a fork."}

The most-starred repositories for which the GitHub API reports no license at all (never vendored):

${noLicense.map((r) => `- ${r.name} (${r.stargazers_count} stars)`).join("\n")}

## Licenses

Each submodule keeps its own license; nothing in \`upstream/\` is relicensed by this repository.
\`cloudflare-docs\` content is CC-BY-4.0 (attribution required when reusing text).
Garage, used in \`deploy/\` for the S3-compatible role, is AGPL-3.0 and is downloaded as an unmodified upstream binary; it is not vendored here.
`;
await Bun.write("UPSTREAM.md", md);
console.log(`locked ${sources.length} sources, ${skipped.length} skipped`);
