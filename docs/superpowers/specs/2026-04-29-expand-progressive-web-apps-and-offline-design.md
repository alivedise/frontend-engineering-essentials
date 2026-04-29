---
title: Expand Progressive Web Apps and Offline — 8 Adoptable Gap Articles
date: 2026-04-29
status: Approved for writing
category: Progressive Web Apps and Offline
id_range: 1310-1317
branch: expand/progressive-web-apps-and-offline-2026-04-29
---

# Expand Progressive Web Apps and Offline — 8 Adoptable Gap Articles

## Confirmed Topics

| ID   | Slug                              | Title                                                                                          | Anticipated topic-specific section            | Level  |
|------|-----------------------------------|------------------------------------------------------------------------------------------------|------------------------------------------------|--------|
| 1310 | `opfs`                            | Origin Private File System (OPFS) for High-Performance Local Storage                           | `## Sync vs Async API Surface`                | mid    |
| 1311 | `pwa-os-integration-manifest`     | PWA OS Integration Manifest Members (`file_handlers`, `protocol_handlers`, `share_target`, `launch_handler`) | `## Member Reference Matrix`            | mid    |
| 1312 | `window-controls-overlay`         | Window Controls Overlay & `display_override` for Desktop PWAs                                 | `## Title-bar Customization Lifecycle`        | mid    |
| 1313 | `background-fetch`                | Background Fetch API for Long-Running Downloads                                                | `## Background Fetch vs Background Sync`      | senior |
| 1314 | `web-locks-api`                   | Web Locks API for Cross-Tab and SW-to-Tab Coordination                                         | `## Lock Acquisition Modes`                   | senior |
| 1315 | `es-module-service-workers`       | ES Module Service Workers (`type: 'module'`) and Static Import Migration                       | `## Migration from importScripts`             | mid    |
| 1316 | `declarative-web-push`            | Declarative Web Push (Safari 18.4/18.5) and Cross-Browser Push Convergence                     | `## Imperative vs Declarative Decision Matrix`| senior |
| 1317 | `badging-api`                     | Badging API and Re-Engagement Surfaces for Installed PWAs                                      | `## Badge UX Patterns`                        | mid    |

## Pipeline (per topic, sequential)

1. Research subagent (PER-ARTICLE) → findings doc.
2. Writer subagent → EN article from findings + skill template.
3. Translator subagent → zh-TW counterpart.
4. **Polish — `Skill(polish-documents, ...)` on EN, then on zh-TW.**
5. Gates: validate-frontmatter (both), validate-structure (both), check-references (EN), findings URL coverage ≥3.
6. One atomic commit per article: `docs(progressive-web-apps): add <title> (FEE-<id>)`.
7. After all 8: regenerate `list.md` via `pnpm docs:build`, commit.

## Cross-Category Overlap Audit (executed in Phase 2)

The expanding-category-articles skill's repo-wide overlap guard ran during Phase 2. Notable rejections (each with the conflicting `FEE-<id>`):

- Periodic Background Sync → FEE-1306, FEE-1307
- View Transitions cross-document → FEE-11104
- Document Picture-in-Picture → FEE-12002
- Speculation Rules → FEE-12003
- IndexedDB / Dexie → FEE-617
- File System Access user-facing pickers → FEE-410
- BroadcastChannel cross-tab → FEE-414
- Persistent Storage estimate → FEE-404
- App update strategies (skipWaiting etc.) → FEE-1309 + FEE-1304
- Web App Banners / `beforeinstallprompt` UX → FEE-1301
- Web Bluetooth / USB / Serial / Wake Lock — better fit for Browser APIs 400s, not PWA category

Adjacencies to make explicit in writer prompts:

- FEE-1311 (OS integration manifest) ↔ FEE-1301 (Web App Manifest baseline). New article narrows to OS-integration members; cross-link reciprocally.
- FEE-1313 (Background Fetch) ↔ FEE-1306 (Push + one-shot Background Sync) and FEE-617 (Background Sync from IndexedDB queue angle). The topic-specific decision matrix MUST disambiguate the three APIs.
- FEE-1315 (ES Module SWs) ↔ FEE-307 (ES Modules) and FEE-1302 (Service Workers). New article is the intersection — module workers as service workers — distinct from either parent.
- FEE-1316 (Declarative Web Push) ↔ FEE-1306 (imperative Push). New article is Apple's WebKit declarative variant; cross-link reciprocally.

## Source Tier Summary

- **Tier 1-2 (Standards / specs):** WHATWG File System spec (1310), W3C Web Locks (1314), W3C Badging (1317), WICG Window Controls Overlay (1312), WICG Background Fetch (1313), IETF webpush draft (1316).
- **Tier 3 (Vendor docs by named teams):** web.dev articles by named authors (Pete LePage, Thomas Steiner, Jake Archibald), MDN, Chrome / WebKit blog posts, Mozilla docs.

## Constraints

- Topic-specific section MUST per Phase 4d-adjacent rule.
- Polish-documents invocation MUST per Phase 4d.
- Style prohibitions per user global CLAUDE.md (no contrastive negation, no em-dash filler chains, no unanchored superlatives, no puffery preambles, no 「可以 X 可以 Y 可以 Z」 stacking).
- Filenames use semantic kebab slugs.
- H1 prefix is `[FEE-<id>]` (project override).
