export const meta = {
  name: 'fee-harden',
  description: 'Reader-first audit, revise, adversarially verify, and zh-sync existing FEE articles',
  phases: [
    { title: 'Audit', detail: 'reader-first four-lens audit per article' },
    { title: 'Revise', detail: 'apply findings, lens-priority order' },
    { title: 'Verify', detail: 'independent adversarial verification, max 2 rounds' },
    { title: 'Sync', detail: 'mirror final EN state to zh-TW' },
  ],
}

// args may arrive as a JSON string depending on the invoking harness
const input = typeof args === 'string' ? JSON.parse(args) : (args || {})
const batch = input.batch || []
if (!batch.length) return { results: [] }

const AUDIT_SCHEMA = {
  type: 'object',
  required: ['findings', 'summary'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['lens', 'severity', 'location', 'statement', 'suggestedFix'],
        properties: {
          lens: { type: 'string', enum: ['tone', 'organization', 'references', 'factual', 'template'] },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          location: { type: 'string', description: 'file:line or section name' },
          statement: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
      },
    },
    summary: { type: 'string', description: 'reader verdict: would you trust this article? what does it do well?' },
  },
}

const REVISE_SCHEMA = {
  type: 'object',
  required: ['changed', 'editsSummary'],
  properties: {
    changed: { type: 'boolean' },
    editsSummary: { type: 'string' },
    declined: { type: 'string', description: 'findings you chose not to apply, with reasons' },
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
        required: ['statement', 'location', 'fix'],
        properties: {
          statement: { type: 'string' }, location: { type: 'string' }, fix: { type: 'string' },
        },
      },
    },
    notes: { type: 'string' },
  },
}

const FIX_SCHEMA = {
  type: 'object',
  required: ['applied'],
  properties: { applied: { type: 'string', description: 'what was fixed' } },
}

const SYNC_SCHEMA = {
  type: 'object',
  required: ['zhPath', 'passagesUpdated'],
  properties: { zhPath: { type: 'string' }, passagesUpdated: { type: 'number' } },
}

const TONE_BLACKLIST = `
Named AI-tone patterns to hunt (both languages):
- Negation tricolon: "buttons do not respond, forms do not validate, dynamic
  components do not update" / 「按鈕不會回應點擊、表單不會驗證、動態元件不會更新」
- "not X but Y" contrast framing: "The question is not whether to hydrate, but..."
- Em-dash appositive chains stacking three-plus glosses in one sentence
- Paragraph-final summary flourishes that restate the paragraph
Fix rule: replace the pattern with ONE concrete example or a plain statement.
Rewording the pattern into a fresh tricolon or contrast is a failed fix.`

const SCOPE_RULE = `
Scope discipline (hard rule): edit ONLY the file(s) named in this prompt.
Do not touch docs/en/list.md, docs/zh-tw/list.md, other articles, configs,
or anything else, even if you notice problems there — report them in your
notes instead.`

function auditPrompt(a) {
  return `You are auditing one documentation article, reader-first. Article:
${a.enPath} (EN) and its mirror ${a.zhPath} (zh-TW). Read CLAUDE.md first for
the canonical template and conventions.

Step 1 — READ AS A READER. Read the EN article start to finish once, as a
senior frontend engineer trying to learn from it. Record where you stumble,
every term used before it is introduced, and every question the text provokes
but does not answer. Skim the zh-TW mirror for parity and translated-AI-tone.

Step 2 — VERIFY. Go back and check load-bearing claims against the article's
own References plus official docs (WebFetch/WebSearch). Flag claims the cited
sources contradict, stale version claims (today's world, not the world at
writing time), and dead URLs. Check whether cited sources contain concepts
the body should absorb, and whether references use terms the body never defines.

Report findings in these lenses, priority order: tone (highest), organization
(dependency check / provoked-question check / framework neutrality),
references (mining + terminology alignment), factual, template (mechanical
checklist: section order vs CLAUDE.md, frontmatter, Vue template safety).
${TONE_BLACKLIST}
Read-only: do NOT edit any file. Severity: blocker = misleads the reader on
the article's core promise; major = a reader acting on it gets burned; minor
= polish.`
}

function revisePrompt(a, audit) {
  return `You are revising the article ${a.enPath} (EN ONLY — the zh-TW mirror
is synced by a later agent). Read CLAUDE.md first. Apply the audit findings
below in lens-priority order: tone, organization, references, factual,
template. Preserve what the audit praised; do not rewrite untouched sections.
${TONE_BLACKLIST}
${SCOPE_RULE}
For organization findings, answer the reader's provoked questions in place
(add the missing paragraph or gloss); introduce every proper noun at first
substantive use. For factual findings, base corrections only on the sources
the audit cites — do not add new unsourced claims. You may decline a finding
you believe is wrong; record it in "declined" with a reason.

Audit findings:
${JSON.stringify(audit.findings, null, 2)}

Audit reader summary (what to preserve):
${audit.summary}

Edit the file now with Edit/Write.`
}

function verifyPrompt(a) {
  return `You are an adversarial verifier with no stake in the revision. The
article ${a.enPath} was just revised by another agent (its uncommitted diff:
run \`git diff -- "${a.enPath}"\`). Your job is to REFUTE the revision:
assume every ADDED claim is wrong until a primary source proves otherwise
(WebFetch/WebSearch official docs — never blogs echoing each other), and
check whether the edits introduced NEW tone violations or reader-model
regressions (a term now used before introduction, a new unanswered question).
${TONE_BLACKLIST}
Also check internal consistency: does any unedited sentence now contradict an
edited one? Read-only: do NOT edit any file. Verdict "clean" only if no
finding survives your honest effort to refute.`
}

function fixPrompt(a, findings) {
  return `You are fixing verified defects in ${a.enPath}. Apply EXACTLY these
fixes, nothing else. Read the file, make the edits with Edit, confirm each.
${SCOPE_RULE}

Defects:
${JSON.stringify(findings, null, 2)}`
}

function syncPrompt(a) {
  return `You are syncing a revised EN article into its zh-TW mirror.
EN (final state): ${a.enPath}. Its uncommitted changes: run
\`git diff -- "${a.enPath}"\`. zh-TW mirror to update: ${a.zhPath}.
Read CLAUDE.md first (zh-TW section-header map, Vue template safety).
Apply every EN change at the corresponding location in the zh file,
translated naturally into Traditional Chinese (Taiwan). Match the zh file's
existing terminology and punctuation conventions. Do NOT reintroduce AI-tone
patterns the EN edits removed (no negation tricolons, no 「不是X,而是Y」).
${SCOPE_RULE.replace('file(s) named in this prompt', `zh-TW file ${a.zhPath} only`)}
After editing, re-read the changed zh sections once and confirm section count
and order still parallel the EN file. Full orthographic correctness for
Traditional Chinese is required.`
}

function shortName(p) {
  const m = p.match(/([^/]+)\.md$/)
  return m ? m[1] : p
}

phase('Audit')
const results = await pipeline(
  batch,
  a => agent(auditPrompt(a), { label: `audit:${shortName(a.enPath)}`, phase: 'Audit', schema: AUDIT_SCHEMA }),
  async (audit, a) => {
    if (!audit) return { status: 'failed', notes: 'audit agent failed' }
    const counts = { tone: 0, organization: 0, references: 0, factual: 0, template: 0 }
    for (const f of audit.findings) counts[f.lens] = (counts[f.lens] || 0) + 1
    if (!audit.findings.length) {
      return { status: 'clean', findings: counts, notes: audit.summary }
    }
    const revised = await agent(revisePrompt(a, audit), {
      label: `revise:${shortName(a.enPath)}`, phase: 'Revise', schema: REVISE_SCHEMA,
    })
    if (!revised) return { status: 'failed', findings: counts, notes: 'revise agent failed after audit found issues' }
    if (!revised.changed) {
      return { status: 'clean', findings: counts, notes: `audit findings all declined: ${revised.declined || 'no reason given'}` }
    }
    return { status: 'revised-unverified', findings: counts, audit, revised }
  },
  async (prev, a) => {
    if (!prev || prev.status !== 'revised-unverified') return prev
    let verdict = await agent(verifyPrompt(a), {
      label: `verify:${shortName(a.enPath)}`, phase: 'Verify', schema: VERIFY_SCHEMA,
    })
    if (!verdict) return { ...prev, status: 'failed', notes: 'verify agent failed; treat article as dirty' }
    if (verdict.verdict === 'issues' && (verdict.findings || []).length) {
      const fixed = await agent(fixPrompt(a, verdict.findings), {
        label: `fix:${shortName(a.enPath)}`, phase: 'Verify', schema: FIX_SCHEMA,
      })
      if (!fixed) return { ...prev, status: 'failed', notes: 'fix agent failed mid-verify; treat article as dirty' }
      verdict = await agent(verifyPrompt(a), {
        label: `reverify:${shortName(a.enPath)}`, phase: 'Verify', schema: VERIFY_SCHEMA,
      })
      if (!verdict) return { ...prev, status: 'failed', notes: 'reverify agent failed; treat article as dirty' }
    }
    if (verdict.verdict !== 'clean') {
      log(`${a.enPath}: verify still unclean after fix round — marking for revert`)
      return { ...prev, status: 'reverted', notes: `unresolved after 2 verify rounds: ${verdict.notes}` }
    }
    return { ...prev, status: 'verified', verifyNotes: verdict.notes }
  },
  async (prev, a) => {
    if (!prev || prev.status !== 'verified') return prev
    const synced = await agent(syncPrompt(a), {
      label: `sync:${shortName(a.enPath)}`, phase: 'Sync', schema: SYNC_SCHEMA,
    })
    if (!synced) {
      log(`${a.enPath}: zh sync failed — EN revision stands, zh needs manual sync`)
      return { ...prev, status: 'revised', notes: `${prev.verifyNotes} | WARNING: zh-TW sync agent failed, mirror not updated` }
    }
    return { ...prev, status: 'revised', notes: `${prev.verifyNotes} | zh synced (${synced.passagesUpdated} passages)` }
  }
)

return {
  results: batch.map((a, i) => {
    const r = results[i] || { status: 'failed', notes: 'pipeline dropped this article' }
    return {
      enPath: a.enPath, zhPath: a.zhPath, id: a.id || null,
      status: r.status, findings: r.findings || null, notes: r.notes || '',
    }
  }),
}
