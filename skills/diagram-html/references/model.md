# JSON 모델

최상위 `title`은 필수다. `architecture`와 `sequence` 중 하나 이상을 제공한다. 파일 경로는 문자열일 뿐 자동으로 읽거나 링크하지 않는다. `evidence`는 출처 설명 목록이며 `url`에는 https/http 링크만 허용된다. 로컬 코드는 `label`에 경로와 함수·커밋을 적는다.

```json
{
  "title": "주문 처리 시스템",
  "subtitle": "코드 기준 흐름 · 예외 경로 포함",
  "scope": "확인한 범위와 제안/추정 여부",
  "evidence": [{"label": "src/orders.ts · createOrder · commit abc123"}],
  "architecture": {
    "layers": [
      {"title": "사용자", "nodes": [{"id": "user", "title": "웹 클라이언트", "detail": "주문 요청을 보낸다."}]},
      {"title": "서비스", "nodes": [{"id": "api", "title": "주문 API", "detail": "검증 후 주문을 저장한다."}]}
    ],
    "edges": [{"from": "user", "to": "api", "label": "주문 요청", "detail": "POST /orders", "kind": "call"}]
  },
  "sequence": {
    "participants": [{"id": "user", "title": "사용자"}, {"id": "api", "title": "주문 API"}],
    "events": [
      {"section": "성공 경로"},
      {"from": "user", "to": "api", "label": "주문 요청", "detail": "수량과 상품 ID를 검증한다.", "kind": "call"},
      {"from": "api", "to": "user", "label": "주문 결과", "kind": "return"},
      {"note": "검증 실패 시 저장하지 않고 여기서 종료한다."}
    ]
  }
}
```

- ID는 다이어그램 내부에서 고유한 영문·숫자·밑줄·하이픈이다. `from/to`는 존재하는 ID를 사용한다.
- `kind`: `call`(실선·채운 화살표), `return`(점선), `async`(실선·열린 화살표). 기본값은 call이다.
- 아키텍처 노드의 `title`은 짧게, 상세는 `detail`에 적는다. layer 안 노드는 왼쪽부터 배치한다. 연결선 label은 짧게 쓴다. 연결이 많으면 동일 구간에서 label이 겹치지 않는지 스크린샷으로 확인한다.
- 시퀀스 이벤트는 message(`from/to/label`), `section`, `note` 중 한 종류다. 자기 자신에게 보내는 메시지도 지원한다. section은 시각적 구분일 뿐 UML 실행 분기 연산자는 아니다. 대안 경로를 여러 section으로 표현하면 **서로 배타적인 경로**임을 제목·note로 명시한다.
- 축소 화면의 도표는 가로 스크롤을 허용한다. 노드/메시지를 클릭하거나 Tab/Enter로 선택하면 상세 패널에서 전체 텍스트를 볼 수 있다.
- 과도한 DOM/파일 생성을 막기 위해 전체 모델 1MB, 계층 8개·계층별 노드 6개, 참여자 10개, 이벤트 100개, 아키텍처 연결 80개로 제한한다. 읽기 좋은 권장 범위는 SKILL.md를 따른다.

동봉 예제는 [examples/review-publishing.json](../examples/review-publishing.json)이다. 저장소 `code-review` 게시 도우미를 근거로 그린 논리 구조이며 별도 서버나 CI 배치 구조를 주장하지 않는다.
