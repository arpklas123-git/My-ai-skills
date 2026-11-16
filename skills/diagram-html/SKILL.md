---
name: diagram-html
description: Create sequence and architecture diagrams as a standalone interactive HTML file from a system description or repository code. Use when the user wants an HTML diagram, call flow, component architecture, or a shareable visual of how code works.
---

# diagram-html

설명이나 실제 코드를 **브라우저에서 바로 여는 시퀀스·아키텍처 HTML**로 만든다. 기본은 한국어, 오프라인 단일 HTML이며 외부 CDN·폰트·네트워크 연결을 요구하지 않는다. 사용자가 한 종류만 요청하면 그 다이어그램만 만든다.

## 코드에서 근거를 잡는다

사용자가 지정한 저장소·범위의 지침과 진입점, 주요 호출부·설정을 읽는다. 서비스 경계, 데이터 저장소, 외부 의존성과 요청/실패 흐름을 구분한다. 운영 배치 구조를 코드만 보고 추측하지 않는다. 없는 구성요소는 추가하지 않고 설계 제안·추정은 명시한다. PR/코드를 설명할 때는 기준 커밋과 실제 파일·함수를 근거에 기록한다. 토큰·DSN·개인정보는 도표나 모델에 넣지 않는다.

코드 변경·실제 API 호출·배포·GitHub 게시 없이 도표만 생성한다. 저장소 코드를 이해하는 데 외부 문서가 꼭 필요하면 공식 자료를 확인하고 출처를 넣는다.

## 한 장에 설명할 범위를 정한다

- 아키텍처는 3~5개 계층과 핵심 컴포넌트 6~16개를 중심으로 잡는다. 계층은 책임 경계이며 실제 프로세스/호스트 경계가 아니라면 설명에 표시한다.
- 시퀀스는 참여자 4~8개와 주요 메시지 10~30개가 읽기 쉽다. 요청·반환·비동기, 조건별 경로와 실패 시 중단을 구분한다. 모든 에러를 한 실행에서 순서대로 겪는 것처럼 그리지 않는다. section 제목에 `대안: ...` 또는 `성공 경로: ...`를 명시하고 note로 종료/재진입 조건을 적는다.
- 관계가 많으면 단계/도표를 나누거나 덜 중요한 연결을 설명으로 옮긴다. 원하는 범위를 잘라 놓고 전체 시스템이라고 부르지 않는다.

## 모델을 쓰고 HTML을 만든다

[references/model.md](references/model.md)의 JSON 모델을 작성한다. [scripts/render.mjs](scripts/render.mjs)는 Node.js 22+ 표준 라이브러리만 사용해 인라인 SVG와 UI를 렌더링한다.

```sh
node /path/to/diagram-html/scripts/render.mjs /tmp/system-diagrams.json /tmp/system-diagrams.html
```

문자열은 데이터로 처리한다. HTML/JavaScript 조각을 모델 값에 넣어 동작을 확장하지 않는다. 기본 렌더러는 계층형 아키텍처와 메시지 기반 시퀀스용이다. 실제 병렬 실행, UML activation/loop/alt 프레임처럼 더 엄밀한 표기나 복잡한 자동 레이아웃이 필요하면 모델을 억지로 맞추지 말고 적합한 렌더러로 SVG를 생성해 오프라인 HTML에 삽입한다. 표현 한계는 사용자에게 설명한다.

## 브라우저에서 확인한다

HTML을 열어 두 탭, 확대/축소, 컴포넌트·메시지 설명 패널, SVG 다운로드와 인쇄 구성을 확인한다. 넓은 화면과 좁은 화면에서 텍스트 잘림·연결선 겹침·스크롤·선택 표시를 살핀다. 긴 문구는 축약하되 상세 설명을 보존한다. 도표의 화살표 방향·반환 종류·조건 표시가 실제 호출부와 맞는지 마지막으로 대조한다.

확인용 브라우저 자동화가 가능하면 스크린샷을 보고 고친다. 사용할 수 없으면 브라우저 검증을 했다고 쓰지 않는다. 완성 HTML의 클릭 가능한 로컬 링크와 무엇을 그렸는지, 근거/추정 범위를 짧게 전달한다. 모델 파일도 함께 제공하면 나중에 수정하기 쉽다.
