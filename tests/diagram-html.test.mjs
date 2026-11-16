import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { render, validate } from '../skills/diagram-html/scripts/render.mjs'
import { readFileSync } from 'node:fs'

const fixture = JSON.parse(readFileSync(new URL('../skills/diagram-html/examples/review-publishing.json', import.meta.url), 'utf8'))

test('복잡한 실제 예제를 독립 SVG HTML로 렌더링하고 클라이언트 JS를 파싱한다', () => {
  const html = render(fixture)
  assert.equal((html.match(/<svg xmlns=/g) || []).length, 2)
  assert.ok(!/<script[^>]+src=|<link[^>]+href=|\bfetch\(/.test(html))
  new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1])
})

test('HTML·SVG·속성의 사용자 텍스트와 URL을 실행 코드로 만들지 않는다', () => {
  const attack = '</script><img src=x onerror="globalThis.pwn=1">'
  const f = structuredClone(fixture)
  f.title = attack
  f.architecture.layers[0].nodes[0].title = attack
  f.architecture.layers[0].nodes[0].detail = attack
  f.sequence.events[0].section = attack
  f.evidence = [{ label: attack, url: 'https://example.com/?q=" onclick="bad' }]
  const html = render(f)
  assert.ok(!html.includes(attack))
  assert.ok(html.includes('&lt;/script&gt;'))
  assert.equal((html.match(/<script>/g) || []).length, 1)
  assert.throws(() => render({ ...f, evidence: [{ label: 'x', url: 'javascript:alert(1)' }] }))
})

test('중복 ID와 없는 대상·모호한 이벤트·과도한 크기를 거절한다', () => {
  const duplicate = structuredClone(fixture)
  duplicate.architecture.layers[0].nodes[1].id = 'request'
  assert.throws(() => validate(duplicate))
  const missing = structuredClone(fixture)
  missing.architecture.edges[0].to = 'missing'
  assert.throws(() => validate(missing))
  const mixed = structuredClone(fixture)
  mixed.sequence.events.push({ section: 'x', from: 'user', to: 'agent', label: 'x' })
  assert.throws(() => validate(mixed))
  assert.throws(() => validate({ ...fixture, sequence: { ...fixture.sequence, events: Array(101).fill({ note: 'x' }) } }))
})

test('한 종류만 요청해도 탭과 export 대상이 일치한다', () => {
  const html = render({ title: '시퀀스만', sequence: fixture.sequence })
  assert.ok(!html.includes('id="pane-arch"'))
  assert.ok(html.includes('id="pane-seq"'))
  assert.ok(html.includes('let active="seq"'))
})
