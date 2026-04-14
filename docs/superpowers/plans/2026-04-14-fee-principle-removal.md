# FEE Principle Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `## Principle` section from all 84 affected FEE articles (EN + zh-TW counterparts), migrating any orphaned normative content into `## Best Practices`.

**Architecture:** Each task covers one batch of articles grouped by category. For each article: read the Principle body, check if each MUST/SHOULD/MUST NOT statement already exists as a Best Practices bullet, migrate any that don't, then delete the entire Principle section. zh-TW counterpart is processed in the same task. FEE-0 is updated in Task 1.

**Tech Stack:** Markdown files, bash (grep/wc -l for verification), git.

---

## Migration Rule (read this before every task)

For each article with `## Principle`:

1. Read the Principle body.
2. For each MUST/SHOULD/MUST NOT sentence in the body, check whether an equivalent bullet already exists in `## Best Practices`.
3. If **not covered**: add a new bullet at the end of Best Practices using the bold-prefix format: `**MUST** <statement in present tense>.`
4. If **already covered**: skip — do not duplicate.
5. Delete the entire `## Principle` section (heading + all body paragraphs up to the next `##` heading).
6. Repeat for the zh-TW counterpart, migrating into `## 最佳實踐` using: `**必須（MUST）** <statement>.` / `**應該（SHOULD）** <statement>.` / `**禁止（MUST NOT）** <statement — must contain 不得 or 禁止 in body>.`

**Verify after each file:**
```bash
grep -c "^## Principle" <file>   # must return 0
grep -c "^## 原則" <zh-tw-file>  # must return 0
wc -l <file>                     # must be 301+
wc -l <zh-tw-file>               # must be 301+
```

---

## Task 1: FEE-0 + HTML + CSS (Batch P1-A)

**Files (EN):**
- Modify: `docs/en/FEE Overall/0.md`
- Modify: `docs/en/HTML and Semantic Markup/107.md`
- Modify: `docs/en/HTML and Semantic Markup/108.md`
- Modify: `docs/en/CSS and Layout Systems/201.md`
- Modify: `docs/en/CSS and Layout Systems/202.md`
- Modify: `docs/en/CSS and Layout Systems/208.md`
- Modify: `docs/en/CSS and Layout Systems/209.md`
- Modify: `docs/en/CSS and Layout Systems/210.md`

**Files (zh-TW counterparts):**
- Modify: `docs/zh-tw/FEE Overall/0.md`
- Modify: `docs/zh-tw/HTML and Semantic Markup/107.md`
- Modify: `docs/zh-tw/HTML and Semantic Markup/108.md`
- Modify: `docs/zh-tw/CSS and Layout Systems/201.md`
- Modify: `docs/zh-tw/CSS and Layout Systems/202.md`
- Modify: `docs/zh-tw/CSS and Layout Systems/208.md`
- Modify: `docs/zh-tw/CSS and Layout Systems/209.md`
- Modify: `docs/zh-tw/CSS and Layout Systems/210.md`

- [ ] **Step 1: Update FEE-0 EN — remove Principle from documented template**

In `docs/en/FEE Overall/0.md`, find the line that mentions `Principle` in the section listing (search for "Principle"). Remove that line. The section listing should no longer reference Principle.

- [ ] **Step 2: Update FEE-0 zh-TW**

In `docs/zh-tw/FEE Overall/0.md`, find and remove the equivalent line referencing `原則`.

- [ ] **Step 3: Process HTML articles (107, 108) and CSS articles (201, 202, 208, 209, 210)**

For each of the 7 articles, follow the Migration Rule above. Read the article, scan the Principle body for normative content not in Best Practices, migrate if needed, delete the section, process the zh-TW counterpart.

- [ ] **Step 4: Verify all files**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
grep -rl "^## Principle" docs/en/HTML\ and\ Semantic\ Markup/ docs/en/CSS\ and\ Layout\ Systems/
# Expected: no output (empty)

grep -rl "^## 原則" docs/zh-tw/HTML\ and\ Semantic\ Markup/ docs/zh-tw/CSS\ and\ Layout\ Systems/
# Expected: no output (empty)

for f in docs/en/HTML\ and\ Semantic\ Markup/107.md docs/en/HTML\ and\ Semantic\ Markup/108.md \
  docs/en/CSS\ and\ Layout\ Systems/201.md docs/en/CSS\ and\ Layout\ Systems/202.md \
  docs/en/CSS\ and\ Layout\ Systems/208.md docs/en/CSS\ and\ Layout\ Systems/209.md \
  docs/en/CSS\ and\ Layout\ Systems/210.md; do
  echo "$(wc -l < "$f") $f"
done
# Expected: all 301+
```

- [ ] **Step 5: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add "docs/en/FEE Overall/0.md" "docs/zh-tw/FEE Overall/0.md" \
  "docs/en/HTML and Semantic Markup/107.md" "docs/en/HTML and Semantic Markup/108.md" \
  "docs/zh-tw/HTML and Semantic Markup/107.md" "docs/zh-tw/HTML and Semantic Markup/108.md" \
  "docs/en/CSS and Layout Systems/201.md" "docs/en/CSS and Layout Systems/202.md" \
  "docs/en/CSS and Layout Systems/208.md" "docs/en/CSS and Layout Systems/209.md" \
  "docs/en/CSS and Layout Systems/210.md" \
  "docs/zh-tw/CSS and Layout Systems/201.md" "docs/zh-tw/CSS and Layout Systems/202.md" \
  "docs/zh-tw/CSS and Layout Systems/208.md" "docs/zh-tw/CSS and Layout Systems/209.md" \
  "docs/zh-tw/CSS and Layout Systems/210.md"
git commit -m "refactor(fee): remove Principle section -- FEE-0, HTML, CSS (Batch P1-A)"
```

---

## Task 2: JavaScript Core (Batch P1-B)

**Files (EN):**
- Modify: `docs/en/JavaScript Core and Runtime/302.md`
- Modify: `docs/en/JavaScript Core and Runtime/304.md`
- Modify: `docs/en/JavaScript Core and Runtime/309.md`
- Modify: `docs/en/JavaScript Core and Runtime/310.md`
- Modify: `docs/en/JavaScript Core and Runtime/311.md`
- Modify: `docs/en/JavaScript Core and Runtime/312.md`
- Modify: `docs/en/JavaScript Core and Runtime/313.md`

**Files (zh-TW counterparts):** same 7 files under `docs/zh-tw/JavaScript Core and Runtime/`

- [ ] **Step 1: Process all 7 JavaScript Core articles**

Follow the Migration Rule for each article: 302, 304, 309, 310, 311, 312, 313. Process EN then zh-TW for each.

- [ ] **Step 2: Verify**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
grep -rl "^## Principle" "docs/en/JavaScript Core and Runtime/"
# Expected: no output

grep -rl "^## 原則" "docs/zh-tw/JavaScript Core and Runtime/"
# Expected: no output

for f in 302 304 309 310 311 312 313; do
  echo "$(wc -l < "docs/en/JavaScript Core and Runtime/${f}.md") EN ${f}"
  echo "$(wc -l < "docs/zh-tw/JavaScript Core and Runtime/${f}.md") zh-TW ${f}"
done
# Expected: all 301+
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add "docs/en/JavaScript Core and Runtime/302.md" \
  "docs/en/JavaScript Core and Runtime/304.md" \
  "docs/en/JavaScript Core and Runtime/309.md" \
  "docs/en/JavaScript Core and Runtime/310.md" \
  "docs/en/JavaScript Core and Runtime/311.md" \
  "docs/en/JavaScript Core and Runtime/312.md" \
  "docs/en/JavaScript Core and Runtime/313.md" \
  "docs/zh-tw/JavaScript Core and Runtime/302.md" \
  "docs/zh-tw/JavaScript Core and Runtime/304.md" \
  "docs/zh-tw/JavaScript Core and Runtime/309.md" \
  "docs/zh-tw/JavaScript Core and Runtime/310.md" \
  "docs/zh-tw/JavaScript Core and Runtime/311.md" \
  "docs/zh-tw/JavaScript Core and Runtime/312.md" \
  "docs/zh-tw/JavaScript Core and Runtime/313.md"
git commit -m "refactor(fee): remove Principle section -- JavaScript Core (Batch P1-B)"
```

---

## Task 3: Browser APIs (Batch P1-C)

**Files (EN):** `docs/en/Browser APIs and Web Platform/` — 407, 408, 409, 410, 411, 412, 413, 414, 415, 416

**Files (zh-TW):** same 10 files under `docs/zh-tw/Browser APIs and Web Platform/`

- [ ] **Step 1: Process all 10 Browser APIs articles**

Follow the Migration Rule for each: 407, 408, 409, 410, 411, 412, 413, 414, 415, 416. EN then zh-TW for each.

- [ ] **Step 2: Verify**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
grep -rl "^## Principle" "docs/en/Browser APIs and Web Platform/"
# Expected: no output

grep -rl "^## 原則" "docs/zh-tw/Browser APIs and Web Platform/"
# Expected: no output

for f in 407 408 409 410 411 412 413 414 415 416; do
  echo "$(wc -l < "docs/en/Browser APIs and Web Platform/${f}.md") EN ${f}"
  echo "$(wc -l < "docs/zh-tw/Browser APIs and Web Platform/${f}.md") zh-TW ${f}"
done
# Expected: all 301+
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add \
  "docs/en/Browser APIs and Web Platform/407.md" \
  "docs/en/Browser APIs and Web Platform/408.md" \
  "docs/en/Browser APIs and Web Platform/409.md" \
  "docs/en/Browser APIs and Web Platform/410.md" \
  "docs/en/Browser APIs and Web Platform/411.md" \
  "docs/en/Browser APIs and Web Platform/412.md" \
  "docs/en/Browser APIs and Web Platform/413.md" \
  "docs/en/Browser APIs and Web Platform/414.md" \
  "docs/en/Browser APIs and Web Platform/415.md" \
  "docs/en/Browser APIs and Web Platform/416.md" \
  "docs/zh-tw/Browser APIs and Web Platform/407.md" \
  "docs/zh-tw/Browser APIs and Web Platform/408.md" \
  "docs/zh-tw/Browser APIs and Web Platform/409.md" \
  "docs/zh-tw/Browser APIs and Web Platform/410.md" \
  "docs/zh-tw/Browser APIs and Web Platform/411.md" \
  "docs/zh-tw/Browser APIs and Web Platform/412.md" \
  "docs/zh-tw/Browser APIs and Web Platform/413.md" \
  "docs/zh-tw/Browser APIs and Web Platform/414.md" \
  "docs/zh-tw/Browser APIs and Web Platform/415.md" \
  "docs/zh-tw/Browser APIs and Web Platform/416.md"
git commit -m "refactor(fee): remove Principle section -- Browser APIs (Batch P1-C)"
```

---

## Task 4: Component Architecture (Batch P1-D)

**Files (EN):** `docs/en/Component Architecture and Design Patterns/` — 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513

**Files (zh-TW):** same 12 files under `docs/zh-tw/Component Architecture and Design Patterns/`

- [ ] **Step 1: Process all 12 Component Architecture articles**

Follow the Migration Rule for each: 502 through 513. EN then zh-TW for each.

- [ ] **Step 2: Verify**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
grep -rl "^## Principle" "docs/en/Component Architecture and Design Patterns/"
# Expected: no output

grep -rl "^## 原則" "docs/zh-tw/Component Architecture and Design Patterns/"
# Expected: no output

for f in 502 503 504 505 506 507 508 509 510 511 512 513; do
  echo "$(wc -l < "docs/en/Component Architecture and Design Patterns/${f}.md") EN ${f}"
  echo "$(wc -l < "docs/zh-tw/Component Architecture and Design Patterns/${f}.md") zh-TW ${f}"
done
# Expected: all 301+
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add \
  "docs/en/Component Architecture and Design Patterns/502.md" \
  "docs/en/Component Architecture and Design Patterns/503.md" \
  "docs/en/Component Architecture and Design Patterns/504.md" \
  "docs/en/Component Architecture and Design Patterns/505.md" \
  "docs/en/Component Architecture and Design Patterns/506.md" \
  "docs/en/Component Architecture and Design Patterns/507.md" \
  "docs/en/Component Architecture and Design Patterns/508.md" \
  "docs/en/Component Architecture and Design Patterns/509.md" \
  "docs/en/Component Architecture and Design Patterns/510.md" \
  "docs/en/Component Architecture and Design Patterns/511.md" \
  "docs/en/Component Architecture and Design Patterns/512.md" \
  "docs/en/Component Architecture and Design Patterns/513.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/502.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/503.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/504.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/505.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/506.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/507.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/508.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/509.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/510.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/511.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/512.md" \
  "docs/zh-tw/Component Architecture and Design Patterns/513.md"
git commit -m "refactor(fee): remove Principle section -- Component Architecture (Batch P1-D)"
```

---

## Task 5: Build Tooling + Design Systems + State Management (Batch P1-E)

**Files (EN):**
- `docs/en/Build Tooling and Module Systems/` — 808, 809, 810
- `docs/en/Design Systems and UI Libraries/` — 903, 905, 906, 908, 909
- `docs/en/State Management/` — 608, 609, 610

**Files (zh-TW):** same 11 files in corresponding zh-TW directories

- [ ] **Step 1: Process all 11 articles**

Follow the Migration Rule for each. Group: Build Tooling (808, 809, 810), then Design Systems (903, 905, 906, 908, 909), then State Management (608, 609, 610). EN then zh-TW for each.

- [ ] **Step 2: Verify**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
grep -rl "^## Principle" \
  "docs/en/Build Tooling and Module Systems/" \
  "docs/en/Design Systems and UI Libraries/" \
  "docs/en/State Management/"
# Expected: no output

grep -rl "^## 原則" \
  "docs/zh-tw/Build Tooling and Module Systems/" \
  "docs/zh-tw/Design Systems and UI Libraries/" \
  "docs/zh-tw/State Management/"
# Expected: no output

for f in \
  "docs/en/Build Tooling and Module Systems/808.md" \
  "docs/en/Build Tooling and Module Systems/809.md" \
  "docs/en/Build Tooling and Module Systems/810.md" \
  "docs/en/Design Systems and UI Libraries/903.md" \
  "docs/en/Design Systems and UI Libraries/905.md" \
  "docs/en/Design Systems and UI Libraries/906.md" \
  "docs/en/Design Systems and UI Libraries/908.md" \
  "docs/en/Design Systems and UI Libraries/909.md" \
  "docs/en/State Management/608.md" \
  "docs/en/State Management/609.md" \
  "docs/en/State Management/610.md"; do
  echo "$(wc -l < "$f") $f"
done
# Expected: all 301+
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add \
  "docs/en/Build Tooling and Module Systems/808.md" \
  "docs/en/Build Tooling and Module Systems/809.md" \
  "docs/en/Build Tooling and Module Systems/810.md" \
  "docs/zh-tw/Build Tooling and Module Systems/808.md" \
  "docs/zh-tw/Build Tooling and Module Systems/809.md" \
  "docs/zh-tw/Build Tooling and Module Systems/810.md" \
  "docs/en/Design Systems and UI Libraries/903.md" \
  "docs/en/Design Systems and UI Libraries/905.md" \
  "docs/en/Design Systems and UI Libraries/906.md" \
  "docs/en/Design Systems and UI Libraries/908.md" \
  "docs/en/Design Systems and UI Libraries/909.md" \
  "docs/zh-tw/Design Systems and UI Libraries/903.md" \
  "docs/zh-tw/Design Systems and UI Libraries/905.md" \
  "docs/zh-tw/Design Systems and UI Libraries/906.md" \
  "docs/zh-tw/Design Systems and UI Libraries/908.md" \
  "docs/zh-tw/Design Systems and UI Libraries/909.md" \
  "docs/en/State Management/608.md" \
  "docs/en/State Management/609.md" \
  "docs/en/State Management/610.md" \
  "docs/zh-tw/State Management/608.md" \
  "docs/zh-tw/State Management/609.md" \
  "docs/zh-tw/State Management/610.md"
git commit -m "refactor(fee): remove Principle section -- Build Tooling, Design Systems, State Mgmt (Batch P1-E)"
```

---

## Task 6: Rendering + TypeScript + Testing (Batch P1-F)

**Files (EN):**
- `docs/en/Rendering and Performance/` — 708, 709, 710, 711, 712
- `docs/en/TypeScript/` — 1705, 1706, 1707, 1708
- `docs/en/Testing Strategies/` — 1108, 1109, 1110, 1111

**Files (zh-TW):** same 13 files in corresponding zh-TW directories

- [ ] **Step 1: Process all 13 articles**

Follow the Migration Rule for each. Group: Rendering (708–712), TypeScript (1705–1708), Testing (1108–1111). EN then zh-TW for each.

- [ ] **Step 2: Verify**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
grep -rl "^## Principle" \
  "docs/en/Rendering and Performance/" \
  "docs/en/TypeScript/" \
  "docs/en/Testing Strategies/"
# Expected: no output

grep -rl "^## 原則" \
  "docs/zh-tw/Rendering and Performance/" \
  "docs/zh-tw/TypeScript/" \
  "docs/zh-tw/Testing Strategies/"
# Expected: no output

for f in 708 709 710 711 712; do
  echo "$(wc -l < "docs/en/Rendering and Performance/${f}.md") EN ${f}"
done
for f in 1705 1706 1707 1708; do
  echo "$(wc -l < "docs/en/TypeScript/${f}.md") EN ${f}"
done
for f in 1108 1109 1110 1111; do
  echo "$(wc -l < "docs/en/Testing Strategies/${f}.md") EN ${f}"
done
# Expected: all 301+
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add \
  "docs/en/Rendering and Performance/708.md" \
  "docs/en/Rendering and Performance/709.md" \
  "docs/en/Rendering and Performance/710.md" \
  "docs/en/Rendering and Performance/711.md" \
  "docs/en/Rendering and Performance/712.md" \
  "docs/zh-tw/Rendering and Performance/708.md" \
  "docs/zh-tw/Rendering and Performance/709.md" \
  "docs/zh-tw/Rendering and Performance/710.md" \
  "docs/zh-tw/Rendering and Performance/711.md" \
  "docs/zh-tw/Rendering and Performance/712.md" \
  "docs/en/TypeScript/1705.md" \
  "docs/en/TypeScript/1706.md" \
  "docs/en/TypeScript/1707.md" \
  "docs/en/TypeScript/1708.md" \
  "docs/zh-tw/TypeScript/1705.md" \
  "docs/zh-tw/TypeScript/1706.md" \
  "docs/zh-tw/TypeScript/1707.md" \
  "docs/zh-tw/TypeScript/1708.md" \
  "docs/en/Testing Strategies/1108.md" \
  "docs/en/Testing Strategies/1109.md" \
  "docs/en/Testing Strategies/1110.md" \
  "docs/en/Testing Strategies/1111.md" \
  "docs/zh-tw/Testing Strategies/1108.md" \
  "docs/zh-tw/Testing Strategies/1109.md" \
  "docs/zh-tw/Testing Strategies/1110.md" \
  "docs/zh-tw/Testing Strategies/1111.md"
git commit -m "refactor(fee): remove Principle section -- Rendering, TypeScript, Testing (Batch P1-F)"
```

---

## Task 7: Security + PWA + Observability (Batch P1-G)

**Files (EN):**
- `docs/en/Security/` — 1208, 1209, 1210
- `docs/en/Progressive Web Apps and Offline/` — 1302, 1303, 1305, 1306, 1308, 1309
- `docs/en/Observability and Error Tracking/` — 1401, 1403, 1404, 1407, 1408, 1409, 1410

**Files (zh-TW):** same 16 files in corresponding zh-TW directories

- [ ] **Step 1: Process all 16 articles**

Follow the Migration Rule for each. Group: Security (1208, 1209, 1210), PWA (1302, 1303, 1305, 1306, 1308, 1309), Observability (1401, 1403, 1404, 1407, 1408, 1409, 1410). EN then zh-TW for each.

- [ ] **Step 2: Verify**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
grep -rl "^## Principle" \
  "docs/en/Security/" \
  "docs/en/Progressive Web Apps and Offline/" \
  "docs/en/Observability and Error Tracking/"
# Expected: no output

grep -rl "^## 原則" \
  "docs/zh-tw/Security/" \
  "docs/zh-tw/Progressive Web Apps and Offline/" \
  "docs/zh-tw/Observability and Error Tracking/"
# Expected: no output

for f in 1208 1209 1210; do
  echo "$(wc -l < "docs/en/Security/${f}.md") EN ${f}"
done
for f in 1302 1303 1305 1306 1308 1309; do
  echo "$(wc -l < "docs/en/Progressive Web Apps and Offline/${f}.md") EN ${f}"
done
for f in 1401 1403 1404 1407 1408 1409 1410; do
  echo "$(wc -l < "docs/en/Observability and Error Tracking/${f}.md") EN ${f}"
done
# Expected: all 301+
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add \
  "docs/en/Security/1208.md" "docs/en/Security/1209.md" "docs/en/Security/1210.md" \
  "docs/zh-tw/Security/1208.md" "docs/zh-tw/Security/1209.md" "docs/zh-tw/Security/1210.md" \
  "docs/en/Progressive Web Apps and Offline/1302.md" \
  "docs/en/Progressive Web Apps and Offline/1303.md" \
  "docs/en/Progressive Web Apps and Offline/1305.md" \
  "docs/en/Progressive Web Apps and Offline/1306.md" \
  "docs/en/Progressive Web Apps and Offline/1308.md" \
  "docs/en/Progressive Web Apps and Offline/1309.md" \
  "docs/zh-tw/Progressive Web Apps and Offline/1302.md" \
  "docs/zh-tw/Progressive Web Apps and Offline/1303.md" \
  "docs/zh-tw/Progressive Web Apps and Offline/1305.md" \
  "docs/zh-tw/Progressive Web Apps and Offline/1306.md" \
  "docs/zh-tw/Progressive Web Apps and Offline/1308.md" \
  "docs/zh-tw/Progressive Web Apps and Offline/1309.md" \
  "docs/en/Observability and Error Tracking/1401.md" \
  "docs/en/Observability and Error Tracking/1403.md" \
  "docs/en/Observability and Error Tracking/1404.md" \
  "docs/en/Observability and Error Tracking/1407.md" \
  "docs/en/Observability and Error Tracking/1408.md" \
  "docs/en/Observability and Error Tracking/1409.md" \
  "docs/en/Observability and Error Tracking/1410.md" \
  "docs/zh-tw/Observability and Error Tracking/1401.md" \
  "docs/zh-tw/Observability and Error Tracking/1403.md" \
  "docs/zh-tw/Observability and Error Tracking/1404.md" \
  "docs/zh-tw/Observability and Error Tracking/1407.md" \
  "docs/zh-tw/Observability and Error Tracking/1408.md" \
  "docs/zh-tw/Observability and Error Tracking/1409.md" \
  "docs/zh-tw/Observability and Error Tracking/1410.md"
git commit -m "refactor(fee): remove Principle section -- Security, PWA, Observability (Batch P1-G)"
```

---

## Task 8: CI/CD + Developer Experience + Accessibility (Batch P1-H)

**Files (EN):**
- `docs/en/CI CD and Deployment/` — 1506, 1507, 1508, 1509, 1510
- `docs/en/Developer Experience and Tooling/` — 1608, 1609
- `docs/en/Accessibility/` — 1008, 1009, 1010

**Files (zh-TW):** same 10 files in corresponding zh-TW directories

- [ ] **Step 1: Process all 10 articles**

Follow the Migration Rule for each. Group: CI/CD (1506–1510), Developer Experience (1608, 1609), Accessibility (1008, 1009, 1010). EN then zh-TW for each.

- [ ] **Step 2: Verify — final clean sweep across entire project**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
grep -rl "^## Principle" docs/en/ docs/zh-tw/
# Expected: no output — zero files should have ## Principle remaining

grep -rl "^## 原則" docs/en/ docs/zh-tw/
# Expected: no output

for f in 1506 1507 1508 1509 1510; do
  echo "$(wc -l < "docs/en/CI CD and Deployment/${f}.md") EN ${f}"
done
for f in 1608 1609; do
  echo "$(wc -l < "docs/en/Developer Experience and Tooling/${f}.md") EN ${f}"
done
for f in 1008 1009 1010; do
  echo "$(wc -l < "docs/en/Accessibility/${f}.md") EN ${f}"
done
# Expected: all 301+
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alive/Projects/frontend-engineering-essentials
git add \
  "docs/en/CI CD and Deployment/1506.md" \
  "docs/en/CI CD and Deployment/1507.md" \
  "docs/en/CI CD and Deployment/1508.md" \
  "docs/en/CI CD and Deployment/1509.md" \
  "docs/en/CI CD and Deployment/1510.md" \
  "docs/zh-tw/CI CD and Deployment/1506.md" \
  "docs/zh-tw/CI CD and Deployment/1507.md" \
  "docs/zh-tw/CI CD and Deployment/1508.md" \
  "docs/zh-tw/CI CD and Deployment/1509.md" \
  "docs/zh-tw/CI CD and Deployment/1510.md" \
  "docs/en/Developer Experience and Tooling/1608.md" \
  "docs/en/Developer Experience and Tooling/1609.md" \
  "docs/zh-tw/Developer Experience and Tooling/1608.md" \
  "docs/zh-tw/Developer Experience and Tooling/1609.md" \
  "docs/en/Accessibility/1008.md" \
  "docs/en/Accessibility/1009.md" \
  "docs/en/Accessibility/1010.md" \
  "docs/zh-tw/Accessibility/1008.md" \
  "docs/zh-tw/Accessibility/1009.md" \
  "docs/zh-tw/Accessibility/1010.md"
git commit -m "refactor(fee): remove Principle section -- CI/CD, DX, Accessibility (Batch P1-H)"
```
