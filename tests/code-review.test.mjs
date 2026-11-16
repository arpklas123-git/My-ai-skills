import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeReview, rightLines, planReview, publishPlan } from '../skills/code-review/scripts/publish-review.mjs'

const head = 'a'.repeat(40)
const finding = (extra = {}) => ({ severity: 'major', path: 'src/a.ts', line: 11, title: '입력 누락', body: '정상 입력에서 누락됩니다.', ...extra })
const review = (findings = [finding()]) => normalizeReview({ summary: '검토 결과', verdict: 'ok', findings, good: [] })
const params = (extra = {}) => ({ repo: 'owner/repo', pr: 1, head, level: 'deep', review: review(), files: [{ filename: 'src/a.ts', status: 'modified', patch: '@@ -10,2 +10,3 @@\n same\n-old\n+new\n+extra' }], ...extra })

test('문서 major만 낮추고 verdict는 등급으로 다시 계산한다', () => {
  assert.equal(review([finding({ path: 'docs/a.md' })]).verdict, 'ok')
  assert.equal(review([finding({ path: 'README.md', severity: 'critical' })]).verdict, 'blocking')
  assert.equal(review().verdict, 'concerns')
  assert.equal(normalizeReview({ summary: '검토', findings: [finding({ path: 'docs/a.md' })], good: [] }, []).verdict, 'concerns')
})

test('RIGHT 줄은 context와 추가 줄만 계산하고 여러 hunk와 삭제 전용 hunk를 처리한다', () => {
  assert.deepEqual([...rightLines('@@ -10,2 +10,3 @@\n same\n-old\n+new\n+extra\n@@ -30 +31,0 @@\n-gone\n@@ -40 +41 @@\n-last\n+next')], [10, 11, 12, 41])
})

test('diff 밖·삭제·patch 누락 지적도 요약에 보존한다', () => {
  const r = review([finding(), finding({ line: 90 }), finding({ path: 'gone.ts' }), finding({ path: 'binary.ts' })])
  const plan = planReview(params({ review: r, files: [...params().files, { filename: 'gone.ts', status: 'removed', patch: '@@ -0 +1 @@\n+x' }, { filename: 'binary.ts', status: 'modified' }] }))
  assert.equal(plan.payload.comments.length, 1)
  assert.equal(plan.summaryOnly.length, 3)
  assert.match(plan.payload.body, /#L90/)
  assert.equal(plan.payload.event, 'COMMENT')
  assert.equal(plan.payload.commit_id, head)
})

test('잘못된 경로·줄·레벨 범위를 API 사용 전에 거절한다', () => {
  for (const path of ['../x', '/x', 'a/../x', 'C:/x', 'a\\x']) assert.throws(() => review([finding({ path })]))
  assert.throws(() => review([finding({ line: 0 })]))
  assert.throws(() => planReview(params({ level: 'light' })))
  assert.throws(() => planReview(params({ repo: 'owner/repo/extra' })))
})

test('head 변경 시 POST 없이 중단한다', async () => {
  const calls = []
  await assert.rejects(publishPlan(planReview(params()), { ...params(), viewer: 'me', api: async (endpoint, options) => { calls.push(options); return { head: { sha: 'b'.repeat(40) } } } }), /head/)
  assert.equal(calls.length, 1)
  assert.ok(calls.every((x) => !x?.payload))
})

test('게시에는 COMMENT payload만 보내고 동일 완료 리뷰는 중복 게시하지 않는다', async () => {
  const plan = planReview(params()), calls = []
  const api = async (endpoint, options) => {
    calls.push({ endpoint, options })
    if (endpoint.endsWith('/pulls/1')) return { head: { sha: head } }
    if (options?.payload) return { html_url: 'https://github.com/owner/repo/pull/1#review' }
    return [[]]
  }
  await publishPlan(plan, { ...params(), api, viewer: 'me' })
  assert.equal(calls.filter((c) => c.options?.payload).length, 1)
  assert.equal(calls.at(-1).options.payload.event, 'COMMENT')
  let writes = 0
  const duplicate = await publishPlan(plan, { ...params(), viewer: 'me', api: async (endpoint, options) => {
    if (options?.payload) writes++
    return endpoint.endsWith('/pulls/1') ? { head: { sha: head } } : [[{ user: { login: 'me' }, commit_id: head, body: plan.marker, html_url: 'existing' }]]
  } })
  assert.equal(writes, 0)
  assert.equal(duplicate.duplicate, true)
})
