'use strict';
// classify-levels.js
// One-shot script to assign `level` frontmatter to all unclassified FEE articles.
//
// Usage:
//   node scripts/classify-levels.js --dry-run            # parse and group without API calls
//   node scripts/classify-levels.js --category "HTML and Semantic Markup"  # single category
//   ANTHROPIC_API_KEY=sk-... node scripts/classify-levels.js               # full run

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const Anthropic = require('@anthropic-ai/sdk');

const ROOT = path.join(__dirname, '..');
const EN_DOCS = path.join(ROOT, 'docs', 'en');
const ZHTW_DOCS = path.join(ROOT, 'docs', 'zh-tw');

const DRY_RUN = process.argv.includes('--dry-run');
const CATEGORY_FILTER = (() => {
  const idx = process.argv.indexOf('--category');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

// Recursively collect all .md files under a directory
function collectMdFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMdFiles(full));
    } else if (entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

// Extract the first non-empty non-heading non-admonition paragraph after frontmatter
function extractIntro(content) {
  const lines = content.split('\n');
  let fmCount = 0;
  let frontmatterDone = false;
  const paragraphLines = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      fmCount++;
      if (fmCount === 2) frontmatterDone = true;
      continue;
    }
    if (!frontmatterDone) continue;
    if (line.startsWith('#')) continue;
    if (line.startsWith(':::')) continue;
    if (line.trim() === '') {
      if (paragraphLines.length > 0) break;
      continue;
    }
    paragraphLines.push(line.trim());
  }
  return paragraphLines.join(' ').slice(0, 400);
}

// Get category name from relative path under docs/en/
function getCategory(filePath) {
  const rel = path.relative(EN_DOCS, filePath);
  const parts = rel.split(path.sep);
  return parts.length > 1 ? parts[0] : 'FEE Overall';
}

// Determine the zh-TW counterpart of an EN file
function getZhTwPath(enPath) {
  const rel = path.relative(EN_DOCS, enPath);
  return path.join(ZHTW_DOCS, rel);
}

// Serialize level value safely for YAML (??? must be quoted)
function levelToYaml(level) {
  return level === '???' ? '"???"' : level;
}

// Patch or insert the level field in a file's frontmatter without reformatting
function patchLevel(filePath, level) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);

  if (parsed.data.level === level) return;

  const yamlValue = levelToYaml(level);

  if (parsed.data.level != null) {
    // Replace existing level line
    const updated = raw.replace(/^level:.*$/m, `level: ${yamlValue}`);
    fs.writeFileSync(filePath, updated, 'utf8');
  } else {
    // Insert level after the second --- (closing frontmatter delimiter)
    const updated = raw.replace(
      /^(---\n[\s\S]*?)\n---/,
      `$1\nlevel: ${yamlValue}\n---`
    );
    fs.writeFileSync(filePath, updated, 'utf8');
  }
}

const AnthropicClient = Anthropic.default ?? Anthropic;
const client = DRY_RUN ? null : new AnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY });

async function classifyCategory(categoryName, articles) {
  const articleList = articles.map(a => ({ id: a.id, title: a.title, intro: a.intro }));

  const prompt = `You are classifying FEE (Frontend Engineering Essentials) articles by audience difficulty level.

Category: "${categoryName}"

Calibration within this category:
- "entry": foundational concept a junior developer would encounter first; minimal prerequisites
- "mid": assumes solid fundamentals; targets engineers with 2–4 years experience
- "senior": advanced depth; requires prior mastery of most other articles in this category

Articles to classify:
${JSON.stringify(articleList, null, 2)}

Respond with ONLY a JSON array — no prose, no markdown fences:
[{ "id": <number>, "level": "entry"|"mid"|"senior", "confidence": <0.0-1.0>, "reason": "<one sentence>" }]`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would call API for ${articles.length} articles`);
    return articles.map(a => ({ id: a.id, level: 'entry', confidence: 0.5, reason: 'dry run placeholder' }));
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  return JSON.parse(text);
}

async function main() {
  const allFiles = collectMdFiles(EN_DOCS);

  const articlesByCategory = new Map();
  let skippedCount = 0;
  let hardcodedCount = 0;

  for (const filePath of allFiles) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);

    // Skip overview articles
    if (data.overview) { skippedCount++; continue; }
    // Skip already classified
    if (data.level != null) { skippedCount++; continue; }

    const id = Number(data.id);
    if (isNaN(id)) { skippedCount++; continue; }

    // Web Platform Proposals: hardcode senior
    if (id >= 10000) {
      console.log(`Hardcoding senior: FEE-${id} — ${data.title}`);
      if (!DRY_RUN) {
        patchLevel(filePath, 'senior');
        try { patchLevel(getZhTwPath(filePath), 'senior'); } catch (e) {
          console.warn(`  Warning: zh-TW patch failed for FEE-${id}: ${e.message}`);
        }
      }
      hardcodedCount++;
      continue;
    }

    const category = getCategory(filePath);
    const intro = extractIntro(content);

    if (!articlesByCategory.has(category)) articlesByCategory.set(category, []);
    articlesByCategory.get(category).push({ filePath, id, title: data.title, intro });
  }

  const totalToClassify = [...articlesByCategory.values()].reduce((s, a) => s + a.length, 0);
  console.log(`Skipped: ${skippedCount}  |  Hardcoded senior: ${hardcodedCount}  |  To classify: ${totalToClassify} in ${articlesByCategory.size} categories`);

  const uncertainArticles = [];

  for (const [category, articles] of articlesByCategory) {
    if (CATEGORY_FILTER && category !== CATEGORY_FILTER) continue;

    console.log(`\nClassifying "${category}" (${articles.length} articles)...`);

    let results;
    try {
      results = await classifyCategory(category, articles);
    } catch (err) {
      console.error(`  Error for "${category}": ${err.message}`);
      continue;
    }

    for (const result of results) {
      const article = articles.find(a => a.id === result.id);
      if (!article) { console.warn(`  Unknown id ${result.id} in response`); continue; }

      const level = result.confidence < 0.7 ? '???' : result.level;
      const flag = level === '???' ? ' [UNCERTAIN]' : '';
      console.log(`  FEE-${result.id}: ${level} (conf: ${result.confidence})${flag} — ${result.reason}`);

      if (level === '???') {
        uncertainArticles.push({ id: result.id, title: article.title, category, reason: result.reason, confidence: result.confidence });
      }

      if (!DRY_RUN) {
        patchLevel(article.filePath, level);
        try { patchLevel(getZhTwPath(article.filePath), level); } catch (e) {
          console.warn(`  Warning: zh-TW patch failed for FEE-${result.id}: ${e.message}`);
        }
      }
    }
  }

  // Write report for uncertain articles
  if (!DRY_RUN && uncertainArticles.length > 0) {
    const lines = [
      '# Level Classification Report — Needs Manual Review',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      `${uncertainArticles.length} articles assigned \`level: "???"\` due to confidence < 0.7:`,
      '',
    ];
    for (const a of uncertainArticles) {
      lines.push(`## FEE-${a.id}: ${a.title}`);
      lines.push(`- **Category:** ${a.category}`);
      lines.push(`- **Confidence:** ${a.confidence}`);
      lines.push(`- **Reason:** ${a.reason}`);
      lines.push('');
    }
    const reportPath = path.join(ROOT, 'scripts', 'classify-report.md');
    fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
    console.log(`\nReport written to scripts/classify-report.md`);
  }

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
