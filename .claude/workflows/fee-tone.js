export const meta = {
  name: 'fee-tone',
  description: 'Tone-only pass on grade-B articles: strip AI-tone patterns, preserve meaning, zh-sync',
  phases: [
    { title: 'Fix', detail: 'strip em-dash sentences, tricolons, not-X-but-Y, aphorisms' },
    { title: 'Verify', detail: 'meaning frozen, no new tone patterns, residual dashes low' },
    { title: 'Sync', detail: 'mirror tone fixes into zh-TW' },
  ],
}

const input = typeof args === 'string' ? JSON.parse(args) : (args || {})
const batch = input.batch || []
if (!batch.length) return { results: [] }

const FIX_SCHEMA = {
  type: 'object',
  required: ['changed', 'summary'],
  properties: {
    changed: { type: 'boolean' },
    dashBefore: { type: 'number' }, dashAfter: { type: 'number' },
    summary: { type: 'string' },
  },
}
const VERIFY_SCHEMA = {
  type: 'object',
  required: ['verdict', 'notes'],
  properties: {
    verdict: { type: 'string', enum: ['clean', 'issues'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['location', 'problem', 'fix'],
        properties: { location: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } },
      },
    },
    notes: { type: 'string' },
  },
}
const SYNC_SCHEMA = {
  type: 'object', required: ['zhPath'],
  properties: { zhPath: { type: 'string' }, passagesUpdated: { type: 'number' } },
}

const PATTERNS = `
AI-tone patterns to remove from PROSE (code, tables, frontmatter are exempt):
- Em-dash sentences ("X — Y", "X -- Y", zh 「X——Y」): the reflexive dash-appositive
  bolting a gloss/example/consequence onto a sentence. DENSITY RULE: reduce prose
  em-dashes to at most ~4 across the whole article. Rewrite as two sentences, a
  comma, a colon, or parentheses.
- Negation tricolons ("no X, no Y, no Z" / "does not A, does not B, does not C").
- "not X but Y" / "X is not just A, it is B" contrast scaffolds.
- Paragraph-final summary flourishes that merely restate the paragraph.
- Empty aphorisms (grand claims with no testable content). Owner's three-question
  test: what exactly is at stake? what is the payoff/cost? says who? If a sentence
  answers none, replace it with the concrete point or delete it.
- Vacuous windup phrases ("took/pushed X to its logical conclusion / logical
  extreme / logical endpoint / to the limit", "taken to the extreme"; zh
  「將X推向了邏輯的終點 / 推向極致 / 發揮到極致 / 推到極限」). These claim grandeur
  with no content of their own. A concrete claim usually follows, often after a
  colon (e.g. "took X to its logical conclusion: it drops the virtual DOM"). DELETE
  the windup and lead with that concrete claim. If nothing concrete follows, the
  sentence is empty — cut it. The article's section HEADING often already states
  the real point; use it as the lead.
- Unsourced world-superlatives ("the most significant / important / popular /
  consequential / first X in history / in the industry / ever", stated as fact
  with no citation; zh 「歷史上最… / 史上最… / 這個提案歷史上最重大的…」). Either attach a
  source or restate as a plain factual description, KEEPING the concrete residual
  ("powering millions of sites" stays; "the most popular framework in history"
  goes). CARVE-OUT — do NOT touch the author's in-topic teaching emphasis ("the
  most important property here is…", "the most consequential decision is…") when it
  ranks things WITHIN the article's own argument and is immediately justified.
  That is legitimate pedagogy, not an unsourced claim about the outside world.
Fix rule: replace each with ONE concrete statement or split into two sentences.
Rewording a pattern into a FRESH tricolon/contrast is a failed fix.`

function shortName(p) { const m = p.match(/([^/]+)\.md$/); return m ? m[1] : p }

function fixPrompt(a) {
  return `You are doing a TONE-ONLY pass on ${a.enPath} (EN only; a later agent
syncs zh-TW). Read CLAUDE.md first for house conventions.

MEANING IS FROZEN. This is punctuation and sentence-structure surgery only. You
MUST NOT add, drop, or alter any factual claim, number, version, name, code, or
qualifier. Do NOT do web research. Do NOT restructure sections or change the
template. The article's content is already sound (it is a grade-B article); the
ONLY goal is removing AI-tone prose patterns.
${PATTERNS}
Also add a slug to frontmatter if missing (kebab-case from the title), and rename
any retired "## Scenario"/"## Internal References" heading (Scenario folds into
Context; Internal References -> Related Topics) — but do not otherwise reorder.

Edit the file with Edit/Write. Report dashBefore/dashAfter (prose em-dash counts)
and a one-line summary. Set changed:false only if the article was already clean.`
}
function verifyPrompt(a) {
  return `You are verifying a TONE-ONLY revision of ${a.enPath}. Its uncommitted
diff: run \`git diff -- "${a.enPath}"\`. Do NOT do web research. Check three things:
1. MEANING PRESERVED: no factual claim, number, version, name, code identifier, or
   qualifier changed between the two sides of the diff. Any semantic change is a
   finding (this pass is punctuation-only). EXCEPTION: deleting a vacuous windup
   phrase or an unsourced world-superlative per the patterns below is an APPROVED
   tone fix, not a meaning change, PROVIDED the concrete residual claim survives
   (e.g. dropping "the most popular framework in history" while keeping "powering
   millions of sites" is fine; dropping "millions of sites" too is a finding).
2. NO NEW TONE PATTERNS: the fix did not introduce a fresh em-dash appositive,
   tricolon, "not X but Y", or aphorism.
${PATTERNS}
3. RESIDUAL: at most ~4 prose em-dashes remain (code/table/heading dashes exempt).
Read-only: do NOT edit. Verdict "clean" only if all three hold.`
}
function fixItPrompt(a, findings) {
  return `Apply these tone fixes to ${a.enPath}, nothing else, no web research,
meaning frozen:\n${JSON.stringify(findings, null, 2)}`
}
function syncPrompt(a) {
  return `Mirror a TONE-ONLY EN revision into its zh-TW mirror ${a.zhPath}.
EN final: ${a.enPath}; its diff: \`git diff -- "${a.enPath}"\`. Read CLAUDE.md
(zh header map). Apply the same tone fixes at the corresponding zh locations, and
independently remove zh AI-tone patterns (zh carries its own 「——」 dash rhythm and
「不是X,而是Y」 scaffolds). MEANING FROZEN: no facts/numbers/code change. No web
research. Full orthographic correctness for Traditional Chinese. Confirm section
count still parallels EN. Touch only ${a.zhPath}.`
}

phase('Fix')
const results = await pipeline(
  batch,
  a => agent(fixPrompt(a), { label: `fix:${shortName(a.enPath)}`, phase: 'Fix', schema: FIX_SCHEMA, model: 'sonnet' })
        .then(f => ({ a, f })),
  async ({ a, f }) => {
    if (!f) return { enPath: a.enPath, zhPath: a.zhPath, id: a.id, status: 'failed', notes: 'fix agent failed' }
    if (!f.changed) return { enPath: a.enPath, zhPath: a.zhPath, id: a.id, status: 'clean', notes: 'already tone-clean' }
    let v = await agent(verifyPrompt(a), { label: `verify:${shortName(a.enPath)}`, phase: 'Verify', schema: VERIFY_SCHEMA })
    if (v && v.verdict === 'issues' && (v.findings || []).length) {
      const fixed = await agent(fixItPrompt(a, v.findings), { label: `refix:${shortName(a.enPath)}`, phase: 'Verify', schema: { type: 'object', required: ['applied'], properties: { applied: { type: 'string' } } }, model: 'sonnet' })
      if (fixed) v = await agent(verifyPrompt(a), { label: `reverify:${shortName(a.enPath)}`, phase: 'Verify', schema: VERIFY_SCHEMA })
    }
    if (!v) return { enPath: a.enPath, zhPath: a.zhPath, id: a.id, status: 'failed', notes: 'verify agent failed; treat as dirty' }
    if (v.verdict !== 'clean') return { enPath: a.enPath, zhPath: a.zhPath, id: a.id, status: 'reverted', notes: `tone verify unclean: ${v.notes}` }
    return { a, f, verifyNotes: v.notes, pending: 'sync' }
  },
  async (prev) => {
    if (!prev || prev.pending !== 'sync') return prev
    const { a, f } = prev
    const s = await agent(syncPrompt(a), { label: `sync:${shortName(a.enPath)}`, phase: 'Sync', schema: SYNC_SCHEMA, model: 'sonnet' })
    const zh = s ? ` | zh synced (${s.passagesUpdated || '?'} passages)` : ' | WARNING: zh sync failed'
    return { enPath: a.enPath, zhPath: a.zhPath, id: a.id, status: 'revised',
      dashBefore: f.dashBefore, dashAfter: f.dashAfter, notes: `${f.summary}${zh}` }
  }
)

return { results: results.map((r, i) => r || { enPath: batch[i].enPath, id: batch[i].id, status: 'failed', notes: 'pipeline dropped' }) }
