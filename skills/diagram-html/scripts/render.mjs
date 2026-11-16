import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
const idPattern = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/
const kinds = ['call', 'return', 'async']
const short = (value, max = 26) => { const chars = Array.from(value); return chars.length > max ? chars.slice(0, max - 1).join('') + '…' : value }

export function validate(model) {
  const text = (value, label, required = false) => {
    if (value === undefined && !required) return
    if (typeof value !== 'string' || (required && !value.trim()) || value.length > 8000) throw new Error(`${label}: 문자열 형식을 확인하세요.`)
  }
  if (!model || typeof model !== 'object') throw new Error('모델 객체가 필요합니다.')
  text(model.title, 'title', true); text(model.subtitle, 'subtitle'); text(model.scope, 'scope')
  if (!model.architecture && !model.sequence) throw new Error('architecture 또는 sequence가 필요합니다.')
  const checkNodes = (nodes) => {
    const seen = new Set()
    for (const node of nodes) {
      if (!node || !idPattern.test(node.id) || seen.has(node.id)) throw new Error('노드 ID가 잘못됐거나 중복됐습니다.')
      seen.add(node.id); text(node.title, 'node.title', true); text(node.detail, 'node.detail')
    }
    return seen
  }
  const checkEdge = (e, ids) => {
    if (!e || !ids.has(e.from) || !ids.has(e.to)) throw new Error('연결 대상 ID가 없습니다.')
    text(e.label, 'label', true); text(e.detail, 'detail')
    if (e.kind !== undefined && !kinds.includes(e.kind)) throw new Error('지원하지 않는 메시지 종류입니다.')
  }
  const a = model.architecture
  if (a) {
    if (!Array.isArray(a.layers) || !a.layers.length || a.layers.length > 8 || !Array.isArray(a.edges) || a.edges.length > 80) throw new Error('아키텍처 크기/형식이 잘못됐습니다.')
    for (const layer of a.layers) {
      text(layer.title, 'layer.title', true)
      if (!Array.isArray(layer.nodes) || !layer.nodes.length || layer.nodes.length > 6) throw new Error('계층별 노드는 1~6개입니다.')
    }
    const ids = checkNodes(a.layers.flatMap((l) => l.nodes)); a.edges.forEach((e) => checkEdge(e, ids))
  }
  const s = model.sequence
  if (s) {
    if (!Array.isArray(s.participants) || s.participants.length < 2 || s.participants.length > 10 || !Array.isArray(s.events) || !s.events.length || s.events.length > 100) throw new Error('시퀀스 크기/형식이 잘못됐습니다.')
    const ids = checkNodes(s.participants)
    for (const e of s.events) {
      if (!e || [e.section !== undefined, e.note !== undefined, e.from !== undefined || e.to !== undefined].filter(Boolean).length !== 1) throw new Error('이벤트는 section, note, message 중 하나여야 합니다.')
      if (e.section !== undefined) text(e.section, 'section', true)
      else if (e.note !== undefined) text(e.note, 'note', true)
      else checkEdge(e, ids)
    }
  }
  if (model.evidence !== undefined) {
    if (!Array.isArray(model.evidence) || model.evidence.length > 40) throw new Error('evidence 목록이 잘못됐습니다.')
    for (const e of model.evidence) {
      text(e.label, 'evidence.label', true)
      if (e.url !== undefined && (typeof e.url !== 'string' || !/^https?:\/\//i.test(e.url))) throw new Error('출처 URL은 http/https만 허용합니다.')
    }
  }
  return model
}

function definitions(prefix) {
  return `<defs><marker id="${prefix}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#62748e"/></marker><marker id="${prefix}-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#62748e" stroke-width="1.6"/></marker></defs>`
}
function svgStart(w, h, prefix, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}" style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f8fafc" data-diagram="${prefix}">${definitions(prefix)}`
}
function interactive(inner, title, detail, ids = '') {
  return `<g class="inspect" tabindex="0" role="button" aria-label="${esc(title)}" data-title="${esc(title)}" data-detail="${esc(detail || title)}" data-nodes="${esc(ids)}" style="cursor:pointer"><title>${esc(title)}</title>${inner}</g>`
}
function stroke(kind, prefix) {
  return `fill="none" stroke="#62748e" stroke-width="1.8" ${kind === 'return' ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#${prefix}-${kind === 'async' ? 'open' : 'arrow'})"`
}

function architecture(a) {
  const cols = Math.max(...a.layers.map((l) => l.nodes.length)), w = Math.max(940, 100 + cols * 310), h = 70 + a.layers.length * 220
  const positions = new Map(), lines = [], nodes = []
  a.layers.forEach((l, row) => {
    const y = 72 + row * 220, spacing = (w - 80) / l.nodes.length
    nodes.push(`<rect x="24" y="${y - 42}" width="${w - 48}" height="166" rx="16" fill="${row % 2 ? '#edf3fa' : '#fff'}" stroke="#e2e8f0"/><text x="42" y="${y - 17}" font-size="12" font-weight="650" fill="#64748b">${esc(l.title)}</text>`)
    l.nodes.forEach((n, col) => {
      const x = 40 + spacing * (col + .5), width = Math.min(258, spacing - 30)
      positions.set(n.id, { x, y, width, row })
      const inner = `<rect x="${x - width / 2}" y="${y}" width="${width}" height="82" rx="12" fill="white" stroke="#b5c7de" stroke-width="1.4"/><rect x="${x - width / 2}" y="${y + 17}" width="4" height="47" rx="2" fill="#577ee9"/><text x="${x - width / 2 + 19}" y="${y + 30}" font-size="15" font-weight="650" fill="#172b4d">${esc(short(n.title, 23))}</text><text x="${x - width / 2 + 19}" y="${y + 55}" font-size="11" fill="#6c7d95">${esc(short(n.detail || n.id, 30))}</text>`
      nodes.push(interactive(inner, n.title, n.detail, n.id))
    })
  })
  a.edges.forEach((e, index) => {
    const p = positions.get(e.from), q = positions.get(e.to), forward = q.row > p.row
    let d, lx, ly
    if (p.row === q.row) {
      const mid = p.y + 108 + (index % 2) * 16
      d = `M ${p.x + p.width / 2} ${p.y + 41} C ${p.x + p.width / 2 + 30} ${mid}, ${q.x - q.width / 2 - 30} ${mid}, ${q.x - q.width / 2} ${q.y + 41}`
      lx = (p.x + q.x) / 2; ly = mid - 8
    } else {
      const sy = p.y + (forward ? 82 : 0), ty = q.y + (forward ? 0 : 82), mid = (sy + ty) / 2 + ((index % 3) - 1) * 12
      d = `M ${p.x} ${sy} L ${p.x} ${mid} L ${q.x} ${mid} L ${q.x} ${ty}`
      lx = (p.x + q.x) / 2; ly = mid - 8
    }
    const lw = Math.min(202, Array.from(e.label).length * 10 + 18)
    lines.push(interactive(`<path d="${d}" ${stroke(e.kind, 'arch')}/><rect x="${lx - lw / 2}" y="${ly - 13}" width="${lw}" height="20" rx="5" fill="#f8fafc"/><text x="${lx}" y="${ly + 1}" text-anchor="middle" font-size="11" fill="#51647e">${esc(short(e.label, 18))}</text>`, e.label, e.detail, `${e.from} ${e.to}`))
  })
  // Layer backgrounds must sit behind edges; component rectangles sit in front.
  const backgrounds = nodes.filter((n) => n.startsWith('<rect')), foreground = nodes.filter((n) => !n.startsWith('<rect'))
  return svgStart(w, h, 'arch', '아키텍처 다이어그램') + backgrounds.join('') + lines.join('') + foreground.join('') + '</svg>'
}

function sequence(s) {
  const w = Math.max(940, s.participants.length * 180 + 120), step = (w - 160) / (s.participants.length - 1)
  const x = new Map(s.participants.map((p, i) => [p.id, 80 + i * step]))
  const h = 165 + s.events.reduce((sum, e) => sum + (e.section ? 54 : e.note ? 58 : e.from === e.to ? 96 : 76), 0)
  let out = svgStart(w, h, 'seq', '시퀀스 다이어그램'), y = 123, number = 0
  for (const p of s.participants) {
    const cx = x.get(p.id)
    out += `<path d="M ${cx} 78 V ${h - 30}" fill="none" stroke="#d3ddea" stroke-dasharray="5 6"/>`
    out += interactive(`<rect x="${cx - 72}" y="25" width="144" height="53" rx="10" fill="white" stroke="#b5c7de"/><text x="${cx}" y="57" text-anchor="middle" fill="#172b4d" font-size="13" font-weight="650">${esc(short(p.title, 16))}</text>`, p.title, p.detail, p.id)
  }
  for (const e of s.events) {
    if (e.section) {
      out += `<rect x="23" y="${y - 22}" width="${w - 46}" height="33" rx="7" fill="#e6edff"/><text x="42" y="${y}" font-size="12" font-weight="650" fill="#3856a5">${esc(short(e.section, Math.floor(w / 12)))}</text>`; y += 54
    } else if (e.note) {
      out += interactive(`<rect x="40" y="${y - 24}" width="${w - 80}" height="36" rx="7" fill="#fff5d7" stroke="#efd994"/><text x="56" y="${y - 1}" font-size="11" fill="#80621b">${esc(short(e.note, Math.floor((w - 100) / 11)))}</text>`, '설명', e.note); y += 58
    } else {
      number++
      const sx = x.get(e.from), tx = x.get(e.to), self = sx === tx
      const d = self ? `M ${sx} ${y} H ${sx + 52} V ${y + 28} H ${sx}` : `M ${sx} ${y} H ${tx}`
      const lx = self ? sx + 8 : Math.min(sx, tx) + 10, available = self ? 145 : Math.abs(tx - sx) - 12
      out += interactive(`<path d="${d}" ${stroke(e.kind, 'seq')}/><text x="${lx}" y="${y - 12}" font-size="11" fill="#243957" paint-order="stroke" stroke="#f8fafc" stroke-width="5" stroke-linejoin="round">${number}. ${esc(short(e.label, Math.max(10, Math.floor(available / 9))))}</text>`, `${number}. ${e.label}`, e.detail, `${e.from} ${e.to}`)
      y += self ? 96 : 76
    }
  }
  return out + '</svg>'
}

export function render(model) {
  validate(model)
  const tabs = [], diagrams = []
  if (model.architecture) { tabs.push(['arch', '아키텍처']); diagrams.push(['arch', architecture(model.architecture)]) }
  if (model.sequence) { tabs.push(['seq', '시퀀스']); diagrams.push(['seq', sequence(model.sequence)]) }
  const initial = tabs[0][0]
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(model.title)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#eef2f8;color:#182b49;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}button{font:inherit;cursor:pointer}header{padding:34px 40px 24px;background:#102342;color:#fff}.eyebrow{font-size:11px;letter-spacing:3px;color:#a9c1fa}h1{font-size:29px;margin:10px 0;font-weight:650;letter-spacing:-1px}header p{color:#b8c9df;font-size:13px;margin:8px 0}.shell{max-width:1600px;margin:auto;padding:22px 28px}nav{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}.tab,.tool{border:1px solid #d4deed;border-radius:8px;padding:9px 14px;background:white;color:#51647e}.tab[aria-selected=true]{background:#305ed1;border-color:#305ed1;color:white}.spacer{flex:1}.tool{padding:8px 11px;font-size:12px}.layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:18px}.canvas-wrap{background:white;border:1px solid #dbe3ef;border-radius:14px;overflow:hidden}.canvas-head{padding:15px 18px;border-bottom:1px solid #e4eaf3;font-size:12px;color:#6c7d95;display:flex;justify-content:space-between}.stage{overflow:auto;max-height:76vh;min-height:380px;background:#f8fafc;padding:12px}.stage svg{display:block;width:100%;min-width:0;height:auto}.pane[hidden]{display:none}aside{background:white;border:1px solid #dbe3ef;border-radius:14px;padding:21px;align-self:start;position:sticky;top:16px}aside h2{font-size:14px;margin-top:0}#detail-title{font-size:16px;color:#254ca2;line-height:1.5}#detail-text{font-size:13px;line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere;color:#62748e}.legend{border-top:1px solid #e3eaf3;padding-top:16px;margin-top:22px;font-size:11px;line-height:2;color:#7a8aa1}.scope,.sources{font-size:12px;line-height:1.8;color:#62748e}.scope{padding:15px 18px;border-top:1px solid #e4eaf3}.sources{margin:22px 0}.sources a{color:#305ed1}.inspect:focus{outline:none}.inspect:focus>rect,.inspect.active>rect{stroke:#305ed1;stroke-width:3}.inspect.active>path{stroke:#305ed1;stroke-width:3}.inspect.dim{opacity:.25}button:focus-visible,a:focus-visible{outline:3px solid #f4b943;outline-offset:3px}footer{font-size:11px;color:#8391a6;padding:16px 0}#status{font-size:11px;color:#73839b;min-height:18px}
@media(max-width:850px){header{padding:25px 20px}h1{font-size:24px}.shell{padding:15px}.layout{grid-template-columns:1fr}aside{position:static}.stage{max-height:64vh}.spacer{display:none}.canvas-head{gap:10px}}
@media print{body,header{background:white;color:#182b49}header{padding:10px}header p{color:#62748e}.shell{padding:0;max-width:none}nav,aside,footer,#status{display:none}.layout{display:block}.canvas-head{display:none}.canvas-wrap{border:0;overflow:visible}.stage{max-height:none;min-height:0;overflow:visible;padding:0}.stage svg{min-width:0!important;width:100%!important}.pane[hidden]{display:block}.pane{break-before:page}.pane:first-child{break-before:auto}.scope{padding:10px 0}.sources{font-size:10px}}
</style></head><body><header><div class="eyebrow">SYSTEM ATLAS / OFFLINE HTML</div><h1>${esc(model.title)}</h1><p>${esc(model.subtitle || '구조와 호출 흐름을 한눈에 살펴보세요.')}</p></header><main class="shell"><nav role="tablist" aria-label="다이어그램 종류">${tabs.map(([id, label]) => `<button class="tab" id="tab-${id}" role="tab" aria-controls="pane-${id}" aria-selected="${id === initial}">${label}</button>`).join('')}<span class="spacer"></span><button class="tool" id="zoom-out" aria-label="축소">−</button><button class="tool" id="zoom-reset">100%</button><button class="tool" id="zoom-in" aria-label="확대">＋</button><button class="tool" id="export-svg">SVG 저장</button><button class="tool" id="print">인쇄 / PDF</button></nav><div class="layout"><div class="canvas-wrap"><div class="canvas-head"><span>컴포넌트·메시지를 선택하면 전체 설명이 표시됩니다</span><span>OFFLINE · SVG</span></div>${diagrams.map(([id, svg]) => `<section class="pane" id="pane-${id}" role="tabpanel" aria-labelledby="tab-${id}" ${id === initial ? '' : 'hidden'}><div class="stage">${svg}</div></section>`).join('')}<div class="scope">${esc(model.scope || '입력 모델을 기반으로 작성한 다이어그램입니다.')}</div></div><aside aria-label="선택 상세"><h2>INSPECTOR</h2><div aria-live="polite"><h3 id="detail-title">흐름을 선택하세요</h3><p id="detail-text">컴포넌트나 메시지를 누르면 전체 이름과 설명을 볼 수 있습니다. 강조를 해제하려면 빈 배경을 누르세요.</p></div><div class="legend">→ 요청 / 호출<br>⇢ 점선: 반환<br>열린 화살표: 비동기<br>노란 상자: 조건·주의·해설<br>길게 이어지는 다이어그램은 스크롤</div></aside></div><div id="status" role="status"></div><section class="sources"><strong>근거와 범위</strong><ul>${(model.evidence || []).map((e) => `<li>${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.label)}</a>` : esc(e.label)}</li>`).join('')}</ul></section><footer>diagram-html · 외부 라이브러리·추적·네트워크 요청 없음 · 단일 파일</footer></main><script>
(()=>{let active=${JSON.stringify(initial)},zoom=1;const tabs=[...document.querySelectorAll('.tab')];const pane=()=>document.getElementById('pane-'+active);const status=document.getElementById('status');function clear(){document.querySelectorAll('.inspect').forEach(g=>g.classList.remove('active','dim'))}function select(g){clear();g.classList.add('active');const ids=(g.dataset.nodes||'').split(' ');pane().querySelectorAll('.inspect').forEach(other=>{if(other!==g&&!ids.some(id=>(other.dataset.nodes||'').split(' ').includes(id)))other.classList.add('dim')});document.getElementById('detail-title').textContent=g.dataset.title;document.getElementById('detail-text').textContent=g.dataset.detail}function resize(){const svg=pane().querySelector('svg'),stage=pane().querySelector('.stage');svg.style.width=(Math.max(Number(svg.getAttribute('width')),stage.clientWidth-24)*zoom)+'px';document.getElementById('zoom-reset').textContent=Math.round(zoom*100)+'%'}tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>{active=tab.id.slice(4);tabs.forEach(t=>{const on=t===tab;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!on});clear();resize()});tab.tabIndex=tab.getAttribute('aria-selected')==='true'?0:-1;tab.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];next.click();next.focus()}})});document.querySelectorAll('.inspect').forEach(g=>{g.addEventListener('click',()=>select(g));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(g)}})});document.querySelectorAll('.stage').forEach(stage=>stage.addEventListener('click',e=>{if(!e.target.closest('.inspect'))clear()}));document.getElementById('zoom-in').onclick=()=>{zoom=Math.min(3,zoom+.25);resize()};document.getElementById('zoom-out').onclick=()=>{zoom=Math.max(.5,zoom-.25);resize()};document.getElementById('zoom-reset').onclick=()=>{zoom=1;resize()};document.getElementById('print').onclick=()=>window.print();document.getElementById('export-svg').onclick=()=>{const clone=pane().querySelector('svg').cloneNode(true);clone.querySelectorAll('.inspect').forEach(g=>{g.classList.remove('active','dim');g.removeAttribute('tabindex');g.removeAttribute('role')});clone.style.width='';const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='diagram-'+active+'.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='현재 다이어그램 SVG를 저장했습니다.'}})();
</script></body></html>`
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [input, output] = process.argv.slice(2)
    if (!input || !output) throw new Error('사용법: node render.mjs model.json output.html')
    const data = readFileSync(input, 'utf8')
    if (Buffer.byteLength(data, 'utf8') > 1024 * 1024) throw new Error('모델은 1MB 이하여야 합니다.')
    const html = render(JSON.parse(data.replace(/^\uFEFF/, '')))
    writeFileSync(output, html, 'utf8')
    console.log(`HTML 생성 완료: ${resolve(output)}`)
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
