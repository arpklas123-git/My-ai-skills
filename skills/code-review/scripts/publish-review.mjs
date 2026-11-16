import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdtempSync, unlinkSync, rmdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const severity = { critical: '🔴', major: '🟠', minor: '🟡' }
const verdictLabels = { ok: '✅ ok', concerns: '⚠️ concerns', blocking: '⛔ blocking' }
const quiet = (text) => text.replace(/@(?=[\w-])/g, '@\u200b')
const code = (text) => text.replaceAll('`', '\\`')

function globRegex(glob) {
  if (typeof glob !== 'string' || !glob) throw new Error('문서 경로는 비어 있지 않은 glob 문자열이어야 합니다.')
  return new RegExp('^' + glob.split(/(\*\*\/|\*\*|\*|\?)/).map((part) => {
    if (part === '**/') return '(?:.*/)?'
    if (part === '**') return '.*'
    if (part === '*') return '[^/]*'
    if (part === '?') return '[^/]'
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }).join('') + '$')
}

export function normalizeReview(raw, docsPaths = ['docs/**', '**/*.md']) {
  const text = (value, label) => {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}: 비어 있지 않은 문자열이 필요합니다.`)
    return quiet(value.trim())
  }
  if (!raw || !Array.isArray(raw.findings) || !Array.isArray(raw.good)) throw new Error('findings와 good 배열이 필요합니다.')
  if (raw.findings.length > 15 || raw.good.length > 3) throw new Error('지적은 최대 15개, 좋았던 점은 최대 3개입니다.')
  if (!Array.isArray(docsPaths)) throw new Error('docs-paths는 JSON 배열이어야 합니다.')
  const patterns = docsPaths.map(globRegex)
  const findings = raw.findings.map((f) => {
    if (!f || !Object.hasOwn(severity, f.severity)) throw new Error('알 수 없는 심각도입니다.')
    if (typeof f.path !== 'string' || !f.path || /[\\\r\n`]/.test(f.path) || f.path.startsWith('/') || /^[A-Za-z]:/.test(f.path) || f.path.split('/').some((s) => !s || s === '.' || s === '..')) throw new Error('저장소 상대 POSIX 경로가 필요합니다.')
    if (!Number.isSafeInteger(f.line) || f.line < 1) throw new Error('양의 정수 줄 번호가 필요합니다.')
    const capped = f.severity === 'major' && patterns.some((re) => re.test(f.path))
    return { severity: capped ? 'minor' : f.severity, path: f.path, line: f.line,
      title: text(f.title, 'title').replace(/[\r\n]+/g, ' '), body: text(f.body, 'body'), capped }
  }).sort((a, b) => ['critical', 'major', 'minor'].indexOf(a.severity) - ['critical', 'major', 'minor'].indexOf(b.severity))
  return { summary: text(raw.summary, 'summary'), findings, good: raw.good.map((g) => text(g, 'good')),
    verdict: findings.some((f) => f.severity === 'critical') ? 'blocking' : findings.some((f) => f.severity === 'major') ? 'concerns' : 'ok' }
}

// GitHub RIGHT-side positions include context and added lines, never removed lines.
export function rightLines(patch) {
  const lines = new Set()
  let current = null
  for (const line of (patch ?? '').split('\n')) {
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line)
    if (hunk) { current = Number(hunk[1]); continue }
    if (current === null) continue
    if (line.startsWith('+') || line.startsWith(' ')) { lines.add(current); current++ }
    else if (!line.startsWith('-') && !line.startsWith('\\')) current = null
  }
  return lines
}

export function planReview({ repo, pr, head, level, review, files, notes = '' }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !Number.isSafeInteger(pr) || pr < 1 || !/^[a-f0-9]{40}$/i.test(head)) throw new Error('repo, PR 번호와 전체 head SHA를 확인하세요.')
  if (!['light', 'standard', 'deep'].includes(level)) throw new Error('레벨은 light, standard, deep 중 하나입니다.')
  const max = { light: 3, standard: 10, deep: 15 }[level]
  if (review.findings.length > max || (level === 'light' && review.findings.some((f) => f.severity !== 'critical'))) throw new Error('리뷰 레벨의 지적 범위를 초과했습니다.')
  const positions = new Map(files.filter((f) => f.status !== 'removed').map((f) => [f.filename, rightLines(f.patch)]))
  const link = (f) => `https://github.com/${repo}/blob/${head}/${f.path.split('/').map(encodeURIComponent).join('/')}#L${f.line}`
  const comments = [], summaryOnly = []
  const rows = review.findings.map((f) => {
    const capped = f.capped ? ' _(문서라 minor)_' : ''
    const title = `${severity[f.severity]} **${f.severity}** · **${f.title}**${capped}`
    if (positions.get(f.path)?.has(f.line)) comments.push({ path: f.path, line: f.line, side: 'RIGHT', body: `${title}\n\n${f.body}\n\n[코드 보기](${link(f)})` })
    else summaryOnly.push({ path: f.path, line: f.line })
    return `- ${severity[f.severity]} **${f.severity}** [${code(f.path)}:${f.line}](${link(f)}) — **${f.title}**${capped}\n  ${f.body.replaceAll('\n', '\n  ')}`
  })
  const counts = Object.keys(severity).map((s) => `${severity[s]} ${s} ${review.findings.filter((f) => f.severity === s).length}`).join(' · ')
  let body = `### 🤖 Codex 리뷰 · \`${level}\` · ${verdictLabels[review.verdict]} · 지적 ${rows.length}\n\n**${counts}**\n\n${review.summary}\n`
  if (rows.length) body += `\n#### 지적\n${rows.join('\n\n')}\n`
  if (review.good.length) body += `\n#### 좋았던 점\n${review.good.map((g) => `- ${g}`).join('\n')}\n`
  body += `\n기준 커밋: \`${head}\`. 수동 읽기 전용 리뷰. 승인·머지·체크 상태를 변경하지 않습니다.\n`
  if (notes.trim()) body += `\n${quiet(notes.trim())}\n`
  const marker = `<!-- local-code-review:${head}:${createHash('sha256').update(JSON.stringify({ body, comments })).digest('hex').slice(0, 20)} -->`
  body += `\n${marker}\n`
  if (body.length > 60000 || comments.some((c) => c.body.length > 60000)) throw new Error('댓글이 너무 깁니다. 지적을 간결하게 작성하세요.')
  return { payload: { commit_id: head, event: 'COMMENT', body, comments }, summaryOnly, marker }
}

export async function publishPlan(plan, { repo, pr, head, api, viewer }) {
  // Read immediately before writing; commit_id pins even if a push races the POST.
  const current = await api(`repos/${repo}/pulls/${pr}`)
  if (current.head.sha !== head) throw new Error('PR head가 변경됐습니다. 새 커밋을 리뷰한 뒤 게시하세요.')
  const pages = await api(`repos/${repo}/pulls/${pr}/reviews`, { paginate: true })
  const existing = pages.flat().find((r) => r.user?.login === viewer && r.commit_id === head && r.body?.includes(plan.marker))
  if (existing) return { url: existing.html_url, duplicate: true }
  const result = await api(`repos/${repo}/pulls/${pr}/reviews`, { payload: plan.payload })
  return { url: result.html_url, duplicate: false }
}

function gh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, shell: false, windowsHide: true })
  if (r.error || r.status !== 0) throw new Error('gh 호출 실패. 인증·권한·네트워크와 게시 여부를 확인하세요. 자동 재시도하지 않습니다.')
  return r.stdout
}

function api(endpoint, { paginate = false, payload } = {}) {
  if (!payload) return JSON.parse(gh(['api', endpoint, ...(paginate ? ['--paginate', '--slurp'] : [])]))
  const dir = mkdtempSync(join(tmpdir(), 'local-code-review-'))
  const file = join(dir, 'payload.json')
  try {
    writeFileSync(file, JSON.stringify(payload), { encoding: 'utf8', mode: 0o600 })
    return JSON.parse(gh(['api', '--method', 'POST', endpoint, '--input', file]))
  } finally { unlinkSync(file); rmdirSync(dir) }
}

async function main() {
  const args = process.argv.slice(2), opts = {}
  for (let i = 0; i < args.length; i++) {
    const name = args[i]
    if (name === '--post') { opts.post = true; continue }
    if (!['--repo', '--pr', '--head', '--level', '--input', '--notes-file', '--docs-paths'].includes(name) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`알 수 없거나 값이 없는 옵션: ${name}`)
    opts[name.slice(2)] = args[++i]
  }
  if (!opts.input || !opts.repo || !opts.pr || !opts.head) throw new Error('--repo --pr --head --input이 필요합니다. 기본은 미리보기이며 게시하려면 --post를 지정하세요.')
  const review = normalizeReview(JSON.parse(readFileSync(opts.input, 'utf8').replace(/^\uFEFF/, '')), opts['docs-paths'] ? JSON.parse(readFileSync(opts['docs-paths'], 'utf8')) : undefined)
  // Validate metadata before interpolating it into any API endpoint.
  const params = { repo: opts.repo, pr: Number(opts.pr), head: opts.head, level: opts.level ?? 'standard', review, notes: opts['notes-file'] ? readFileSync(opts['notes-file'], 'utf8') : '' }
  planReview({ ...params, files: [] })
  const files = api(`repos/${opts.repo}/pulls/${params.pr}/files`, { paginate: true }).flat()
  const plan = planReview({ ...params, files })
  if (!opts.post) { console.log(JSON.stringify({ mode: 'preview', ...plan }, null, 2)); return }
  const viewer = api('user').login
  console.log(JSON.stringify(await publishPlan(plan, { ...params, api, viewer })))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
