---
name: eli5
description: Explain a topic as a picture-first HTML page for someone who knows nothing about it. Use when the user types /eli5 <topic>, asks for a dead-simple explainer of how something works, or says they want it explained like they're five.
---

# eli5

아무것도 모르는 사람에게 **그림 위주 HTML 한 장**으로 설명한다. 글로 길게 쓰는 게 아니라 그림이 설명하게 만든다.

## 만드는 것

- **인라인 SVG만.** 외부 이미지, CDN, JS 라이브러리 없음. 파일 하나로 완결.
- **패널 4-7개.** 위에서 아래로, 실제로 일이 벌어지는 순서대로.
- **글자는 라벨이지 문장이 아니다.** 다섯 살이 아는 단어로.
- **진짜 구조를 그린다.** 두루뭉술한 비유 말고, 부품과 부품 사이 화살표를. 화살표에는 무엇이 오가는지 적는다 ("내 요청", "주소", "답").
- CSS는 `<style>` 안에, 색은 CSS 변수로. `@media (prefers-color-scheme: dark)` 로 다크도 읽히게.

## 어디에 내보내나

**Artifact 도구를 쓸 수 있으면** (Claude Code) — 그걸로 발행하고 링크를 준다. 발행 전에 `artifact-design` 을 읽는다.

**없으면** (Codex CLI 등) — 자체 완결 HTML 파일로 저장하고 브라우저로 연다.

1. `./eli5-<짧은-슬러그>.html` (사용자가 경로를 말했으면 그 경로)
2. 열기: Windows `start`, macOS `open`, Linux `xdg-open`
3. 파일 경로와 이 페이지가 보여주는 것 한 줄만 답한다

## 규칙

- 사용자가 이미 아는 걸 되풀이하지 않는다. 모르는 사람 기준이라는 게 곧 지루하게 쓰라는 뜻은 아니다.
- 정확도를 위해 단순화를 포기하지 않는다. 다만 **일부러 생략한 게 있으면 페이지 맨 아래 한 줄로 밝힌다.**
- 채팅 답변에 설명을 다시 풀어쓰지 않는다. 페이지가 설명이다.
