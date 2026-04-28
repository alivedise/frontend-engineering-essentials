---
title: Expand Developer Experience and Tooling — 8 Adoptable Gap Articles
date: 2026-04-28
status: Approved for writing
category: Developer Experience and Tooling
id_range: 1610-1617
branch: expand/developer-experience-and-tooling-2026-04-28
---

# Expand Developer Experience and Tooling — 8 Adoptable Gap Articles

## Confirmed Topics

| ID   | Slug                          | Title                                                                            | Level  |
|------|-------------------------------|----------------------------------------------------------------------------------|--------|
| 1610 | `oxlint`                      | Oxlint — Rust-based ESLint Successor and Migration Path                          | senior |
| 1611 | `biome-v2`                    | Biome v2 — Type-Aware Linting + Formatting + Assists Toolchain                   | senior |
| 1612 | `devcontainers`               | Development Containers (`devcontainer.json`) for Reproducible Environments       | mid    |
| 1613 | `mise`                        | mise (and asdf) for Polyglot Tool and Env Version Management                     | mid    |
| 1614 | `corepack-package-manager`    | Corepack and the `packageManager` Field for Toolchain Pinning                    | mid    |
| 1615 | `knip`                        | Knip — Unused Files, Exports, and Dependency Detection                           | mid    |
| 1616 | `renovate`                    | Renovate Configuration for Frontend Repositories                                 | mid    |
| 1617 | `vscode-workspace`            | Shared VS Code Workspace Settings and `extensions.json` Recommendations          | mid    |

## Pipeline (per topic, sequential)

1. Research subagent (PER-ARTICLE) → findings doc.
2. Writer subagent → EN article from findings + skill template.
3. Translator subagent → zh-TW counterpart.
4. **Polish — `Skill(polish-documents, ...)` on EN, then on zh-TW.** Per
   the post-Phase-4d-tightening rule, this MUST be the full skill
   invocation; inline grep-and-edit substitution is forbidden.
5. Gates: validate-frontmatter (both), validate-structure (both),
   check-references (EN), findings URL coverage ≥3.
6. One atomic commit per article: `docs(developer-experience): add <title> (FEE-<id>)`.
7. After all 8: regenerate `list.md` via `pnpm docs:build`, commit.

## Anticipated Topic-Specific Sections

Each article needs at least one custom `##` section. Likely choices:

- 1610 oxlint → `## Migration from ESLint`
- 1611 biome-v2 → `## v1 → v2 Upgrade Path`
- 1612 devcontainers → `## CI Integration`
- 1613 mise → `## mise vs asdf vs nvm/fnm`
- 1614 corepack-package-manager → `## packageManager Field Semantics`
- 1615 knip → `## Configuration Anatomy`
- 1616 renovate → `## Renovate vs Dependabot`
- 1617 vscode-workspace → `## .vscode/ File Reference`

These are seeds; each writer subagent picks the strongest angle from
its findings doc.

## Cross-Category Overlap Audit

The expanding-category-articles skill was tightened on 2026-04-28
(after the FEE-611/612 vs FEE-10005 incident) to consume
`docs/en/list.md` as a repo-wide overlap guard. The Phase 2 sweep on
this run confirmed:

- Linting/formatting space: oxlint and Biome v2 are net-new vs FEE-1601.
- Monorepo space: Turborepo / Nx / pnpm workspaces / changesets all
  rejected — owned by FEE-805 (Monorepos & Workspaces) and FEE-1507
  (Release Automation).
- TypeScript space: tsconfig deep dives rejected — owned by FEE-1605 /
  FEE-1706 / FEE-1716.
- Testing space: Vitest / Storybook rejected — owned by FEE-1101 and
  FEE-904 / FEE-912.
- AI-IDE space: dropped because primary sources are vendor blogs only;
  tier 1-3 source bar not met.

Adjacencies to make explicit in writer prompts:

- Knip (1615) ↔ FEE-705 Tree Shaking. Project-graph dead-export
  detection is distinct from bundler tree-shaking.
- VS Code workspace (1617) ↔ FEE-1606 Editor & IDE Integration. The
  angle is the committed `.vscode/` repo contract, not LSP/extension
  surface in general.
- Devcontainers (1612) ↔ FEE-1609 Local Development Environment Setup.
  1609 covers Docker Compose for services; 1612 is `devcontainer.json`
  itself plus the CI integration.

## Source Tier Summary

- **Tier 2 (Standards / open spec):** devcontainers.dev open spec
  (1612), `packageManager` field semantics in Node corepack docs
  (1614).
- **Tier 3 (Vendor docs by named teams):** oxc-project (1610),
  biomejs.dev (1611), VS Code official docs (1617), mise.jdx.dev
  (1613), pnpm.io / nodejs/corepack (1614), knip.dev (1615),
  docs.renovatebot.com (1616).
- **Tier 3-4 (Editorial):** InfoQ on Oxlint v1.0 release (1610) — used
  for release-date corroboration only.

## Constraints

- Topic-specific section MUST per Phase 4d-adjacent rule.
- Polish-documents invocation MUST per Phase 4d.
- Style prohibitions per user global CLAUDE.md (no contrastive
  negation, no em-dash filler chains, no unanchored superlatives, no
  puffery preambles, no 「可以 X 可以 Y 可以 Z」 stacking).
- Filenames use semantic kebab slugs.
- H1 prefix is `[FEE-<id>]` (project override of the BEE-prefixed
  template).
