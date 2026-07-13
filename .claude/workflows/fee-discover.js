export const meta = {
  name: 'fee-discover',
  description: 'Sweep external sources, rank candidate topics, draft verified new FEE articles',
  phases: [
    { title: 'Sweep', detail: 'corpus inventory + one scout per source group' },
    { title: 'Classify', detail: 'dedup and gap-match candidates against corpus' },
    { title: 'Rank', detail: 'score candidates and select top N' },
    { title: 'Produce', detail: 'research, write, verify, translate per topic' },
  ],
}

// args may arrive as a JSON string depending on the invoking harness
const input = typeof args === 'string' ? JSON.parse(args) : (args || {})
const maxTopics = input.maxTopics || 4
const sources = input.sources || {}
const knownTopics = ((input.discoveryLog || {}).topics || [])
  .map(t => `- ${t.title} (${t.disposition})`)
  .join('\n') || '(none yet)'

const CORPUS_SCHEMA = {
  type: 'object',
  required: ['categories'],
  properties: {
    categories: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'dir', 'maxId'],
        properties: {
          name: { type: 'string', description: 'exact directory name under docs/en/' },
          dir: { type: 'string', description: 'path relative to repo root, e.g. docs/en/Security' },
          maxId: { type: 'number', description: 'highest frontmatter id among .md files in this dir' },
        },
      },
    },
  },
}

const CANDIDATES_SCHEMA = {
  type: 'object',
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'sourceUrls', 'rationale', 'suggestedCategory'],
        properties: {
          title: { type: 'string' },
          sourceUrls: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' },
          suggestedCategory: { type: 'string', description: 'exact directory name under docs/en/' },
        },
      },
    },
  },
}

const CLASSIFIED_SCHEMA = {
  type: 'object',
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'sourceUrls', 'category', 'kind', 'reason'],
        properties: {
          title: { type: 'string' },
          sourceUrls: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' },
          kind: { type: 'string', enum: ['new-article', 'append', 'skip'] },
          targetArticle: { type: 'string', description: 'for kind=append: repo-relative EN path of the article to extend' },
          reason: { type: 'string' },
        },
      },
    },
  },
}

const RANKED_SCHEMA = {
  type: 'object',
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'sourceUrls', 'category', 'kind', 'disposition', 'reason', 'slug'],
        properties: {
          title: { type: 'string' },
          sourceUrls: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' },
          kind: { type: 'string', enum: ['new-article', 'append'] },
          targetArticle: { type: 'string' },
          disposition: { type: 'string', enum: ['accepted', 'deferred', 'rejected'] },
          reason: { type: 'string' },
          slug: { type: 'string', description: 'kebab-case slug; empty string for kind=append' },
        },
      },
    },
  },
}

const FACTS_SCHEMA = {
  type: 'object',
  required: ['summary', 'facts', 'references'],
  properties: {
    summary: { type: 'string' },
    facts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'sourceUrl'],
        properties: { claim: { type: 'string' }, sourceUrl: { type: 'string' } },
      },
    },
    references: {
      type: 'array',
      items: {
        type: 'object',
        required: ['url', 'title', 'venue', 'year'],
        properties: {
          url: { type: 'string' }, title: { type: 'string' },
          author: { type: 'string' }, venue: { type: 'string' }, year: { type: 'string' },
        },
      },
    },
  },
}

const WRITE_SCHEMA = {
  type: 'object',
  required: ['enPath'],
  properties: { enPath: { type: 'string' }, notes: { type: 'string' } },
}

const VERIFY_SCHEMA = {
  type: 'object',
  required: ['verdict', 'notes'],
  properties: {
    verdict: { type: 'string', enum: ['clean', 'fixed', 'failed'] },
    notes: { type: 'string', description: 'what was checked, what was corrected, anything unresolved' },
  },
}

const TRANSLATE_SCHEMA = {
  type: 'object',
  required: ['zhPath'],
  properties: { zhPath: { type: 'string' } },
}

const CONVENTIONS = `
Repo conventions (all paths relative to the repo root):
- Read CLAUDE.md first: it contains the canonical FEE article template, the
  zh-TW section-header map, Vue template safety rules, and content-neutrality rules.
- Read docs/en/Design Systems and UI Libraries/interaction-state-rosetta.md
  as the reference example of a finished post-slug-era article.
- New EN articles go to docs/en/<Category>/<slug>.md with frontmatter
  id/title/state: draft/slug. zh-TW mirror at docs/zh-tw/<Category>/<slug>.md.
- Vendor-neutral: no company-specific references or product pitches.
- References section: 3+ real URLs you actually fetched, format
  '- <Author>, "<Title>," <Venue> (<year>). <URL>'.
`

function scoutPrompt(group, entries) {
  const list = entries
    .map(e => `- ${e.name}: ${e.url}${e.status ? ` [${e.status}]` : ''}`)
    .join('\n')
  return `You are a topic scout for the Frontend Engineering Essentials (FEE)
documentation corpus. Source group: "${group}".

Sources to sweep (use WebFetch/WebSearch; skip entries marked [covered]):
${list}

Read docs/en/list.md to see the ~280 existing article titles.
Topics already proposed in past runs (do NOT re-propose):
${knownTopics}

Find up to 6 candidate topics that would make durable, teachable FEE
articles (evergreen mechanics over news; must have primary sources).
For group "codebases", a candidate is an architecture/pattern tour of one
[candidate] repo, suited to the Codebase Studies category.
For suggestedCategory use the EXACT directory name under docs/en/.
Return only genuinely new material not covered by an existing article title.`
}

phase('Sweep')
const groups = ['platform', 'codebases', 'digests']
const sweep = await parallel([
  () => agent(
    `For each category directory under docs/en/ in this repo (skip list.md,
faq.md, index.md), report: name (exact dir name), dir (repo-relative path),
maxId (the highest numeric "id" frontmatter value among its .md files).
Use Glob/Grep/Read. Be exact — these ids seed new article numbering.`,
    { label: 'corpus', schema: CORPUS_SCHEMA }
  ),
  ...groups.map(g => () =>
    agent(scoutPrompt(g, sources[g] || []), { label: `scout:${g}`, schema: CANDIDATES_SCHEMA })
  ),
])
const corpus = sweep[0]
if (!corpus) throw new Error('corpus inventory agent failed; aborting run')
const uncovered = groups.filter((_, i) => !sweep[i + 1])
uncovered.forEach(g => log(`scout group "${g}" returned nothing — not covered this run`))
const candidates = sweep.slice(1).filter(Boolean).flatMap(r => r.candidates)
log(`${candidates.length} raw candidates from ${3 - uncovered.length}/3 scout groups`)
if (candidates.length === 0) {
  return { produced: [], dispositions: [], uncovered }
}

phase('Classify')
const classified = await agent(
  `Classify each candidate topic against the existing FEE corpus.
Read docs/en/list.md (full inventory) and spot-check any article whose title
looks close to a candidate. For each candidate decide:
- "new-article": genuinely uncovered, deserves its own article
- "append": materially updates ONE existing article (set targetArticle to its
  repo-relative EN path) — e.g. a spec change worth a Changelog entry or new section
- "skip": already covered or too thin/newsy to teach
Keep category as an EXACT directory name under docs/en/ (fix wrong guesses).

Candidates:
${JSON.stringify(candidates, null, 2)}`,
  { label: 'classify', schema: CLASSIFIED_SCHEMA }
)
if (!classified) throw new Error('classify agent failed; aborting run')
const viable = classified.candidates.filter(c => c.kind !== 'skip')
const skipped = classified.candidates.filter(c => c.kind === 'skip')
log(`${viable.length} viable after classify (${skipped.length} skipped)`)

phase('Rank')
let accepted = []
let dispositions = skipped.map(c => ({
  title: c.title, disposition: 'rejected', reason: c.reason, feeId: null,
}))
if (viable.length > 0) {
  const ranked = await agent(
    `Rank these FEE article candidates. Score each on: source tier (specs and
platform-official beat aggregators), category fit, durability (evergreen
mechanics over release news), and teachability (has a core mechanic you can
visualize and demonstrate with real code). Mark the best ${maxTopics} at most
as "accepted"; mark near-misses "deferred" and poor fits "rejected", each
with a concrete reason. Give every candidate a kebab-case slug (empty string
for kind=append). Preserve kind, category, sourceUrls, targetArticle as given.

Candidates:
${JSON.stringify(viable, null, 2)}`,
    { label: 'rank', schema: RANKED_SCHEMA }
  )
  if (!ranked) throw new Error('rank agent failed; aborting run')
  accepted = ranked.candidates.filter(c => c.disposition === 'accepted').slice(0, maxTopics)
  dispositions = dispositions.concat(
    ranked.candidates
      .filter(c => c.disposition !== 'accepted')
      .map(c => ({ title: c.title, disposition: c.disposition, reason: c.reason, feeId: null }))
  )
}
log(`${accepted.length} topics accepted for production`)

const nextId = {}
for (const cat of corpus.categories) nextId[cat.name] = cat.maxId + 1
const dirByName = {}
for (const cat of corpus.categories) dirByName[cat.name] = cat.dir
for (const t of accepted) {
  if (t.kind === 'new-article') {
    if (nextId[t.category] === undefined) {
      log(`no id range for category "${t.category}" — dropping "${t.title}"`)
      t.dropped = true
      dispositions.push({ title: t.title, disposition: 'deferred', reason: `unknown category ${t.category}`, feeId: null })
    } else {
      t.feeId = nextId[t.category]++
      t.dir = dirByName[t.category]
    }
  } else if (!t.targetArticle) {
    log(`append candidate "${t.title}" lacks targetArticle — dropping`)
    t.dropped = true
    dispositions.push({ title: t.title, disposition: 'deferred', reason: 'append without targetArticle', feeId: null })
  }
}
const toProduce = accepted.filter(t => !t.dropped)

phase('Produce')
const produced = await pipeline(
  toProduce,
  t => agent(
    `Research the topic "${t.title}" for a FEE article. Deep-read these
sources with WebFetch (follow links to primary specs/docs where relevant):
${t.sourceUrls.join('\n')}
Return a fact sheet: every load-bearing claim paired with the URL that
supports it, plus a references list of the sources you actually read.
Only include claims you verified in a fetched source.`,
    { label: `research:${t.slug || t.title.slice(0, 30)}`, phase: 'Produce', schema: FACTS_SCHEMA }
  ),
  (facts, t) => {
    if (!facts) return null
    const target = t.kind === 'new-article'
      ? `Write a NEW article at "${t.dir}/${t.slug}.md" with frontmatter
id: ${t.feeId}, title, state: draft, slug: ${t.slug}, and H1 "# [FEE-${t.feeId}] <title>".
Follow the canonical template in CLAUDE.md (every section, including the
REQUIRED topic-specific section with a topic-named heading).`
      : `EXTEND the existing article ${t.targetArticle}: add the new material
as a new section or Changelog entry per the canonical template in CLAUDE.md.
Do not rewrite unrelated sections.`
    return agent(
      `${CONVENTIONS}
${target}

Topic: ${t.title}
Base every claim on this verified fact sheet (do not add claims beyond it):
${JSON.stringify(facts, null, 2)}

Write the EN file now with the Write/Edit tool. Real code in Example, no
pseudocode. References come from the fact sheet's references list.`,
      { label: `write:${t.slug || 'append'}`, phase: 'Produce', schema: WRITE_SCHEMA }
    ).then(w => (w ? { facts, enPath: w.enPath } : null))
  },
  (prev, t) => {
    if (!prev) return null
    return agent(
      `Adversarially fact-check the article file ${prev.enPath} (only the newly
added content for an append). For each factual claim, verify it against the
fact sheet below; re-fetch the cited URL when in doubt. FIX factual errors
directly in the file with Edit. Also check CLAUDE.md Vue template safety
rules and template compliance; fix violations. Verdict "failed" only if the
article's core premise is unsupported by sources.

Fact sheet:
${JSON.stringify(prev.facts, null, 2)}`,
      { label: `verify:${t.slug || 'append'}`, phase: 'Produce', schema: VERIFY_SCHEMA }
    ).then(v => (v && v.verdict !== 'failed' ? { ...prev, verifierNotes: v.notes } : null))
  },
  (prev, t) => {
    if (!prev) return null
    const zhTarget = t.kind === 'new-article'
      ? `Create the zh-TW mirror at the same path with docs/en/ replaced by docs/zh-tw/.`
      : `Mirror the newly added EN section into the zh-TW counterpart of ${t.targetArticle} (same path under docs/zh-tw/).`
    return agent(
      `${CONVENTIONS}
Translate the EN content of ${prev.enPath} into Traditional Chinese (zh-TW).
${zhTarget}
Use the zh-TW section-header map in CLAUDE.md. Keep code blocks, URLs, and
technical identifiers untranslated. Translate the topic-specific section
heading naturally. Keep frontmatter ids/slug identical; translate title.
Write the file with the Write tool.`,
      { label: `translate:${t.slug || 'append'}`, phase: 'Produce', schema: TRANSLATE_SCHEMA }
    ).then(z => (z ? { ...prev, zhPath: z.zhPath } : null))
  }
)

const results = []
toProduce.forEach((t, i) => {
  const r = produced[i]
  if (r) {
    results.push({
      feeId: t.feeId || null, kind: t.kind, title: t.title, category: t.category,
      slug: t.slug || null, targetArticle: t.targetArticle || null,
      enPath: r.enPath, zhPath: r.zhPath, verifierNotes: r.verifierNotes,
    })
    dispositions.push({ title: t.title, disposition: 'accepted', reason: t.reason, feeId: t.feeId || null })
  } else {
    log(`production failed for "${t.title}" — deferred`)
    dispositions.push({ title: t.title, disposition: 'deferred', reason: 'production pipeline failed this run', feeId: null })
  }
})

return { produced: results, dispositions, uncovered }
