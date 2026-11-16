# 결과 데이터와 GitHub 게시

리뷰 결과 JSON은 다음 형태다. `line`은 PR head 파일의 1부터 시작하는 단일 줄 번호다. 출력 파일은 검토 대상 저장소의 변경에 섞지 말고 임시 위치에 둔다.

```json
{
  "summary": "변경과 판정 근거를 한두 문장으로 설명합니다.",
  "verdict": "concerns",
  "findings": [
    {
      "severity": "major",
      "path": "src/example.ts",
      "line": 42,
      "title": "문제가 발생하는 동작을 구체적으로 씁니다",
      "body": "입력·호출 경로 → 실제 결과 → 영향과 수정 방향."
    }
  ],
  "good": ["실제 경로·함수에 근거한 좋았던 점, 최대 3개"]
}
```

CI와 같은 `summary / verdict / findings / good` 필드를 쓴다. 게시 도우미는 verdict를 신뢰하지 않고 지적 등급으로 다시 계산하며, `docs/**`와 `.md`의 major는 minor로 낮춘다. 저장소 CI의 문서 경로가 다르면 `--docs-paths paths.json`에 JSON glob 배열을 넘긴다. 지원 glob은 `**/`, `**`, `*`, `?`다. 빈 배열은 경로 제한을 끈다.

요약은 다음 형식을 사용한다. 지적이 없으면 지적 절을 생략한다.

```markdown
### 🤖 Codex 리뷰 · `deep` · ⚠️ concerns · 지적 1

**🔴 critical 0 · 🟠 major 1 · 🟡 minor 0**

변경 내용과 판정 근거.

#### 지적
- 🟠 **major** [src/example.ts:42](커밋으로 고정한 코드 링크) — **지적 제목**
  재현 조건, 영향과 수정 방향.

#### 좋았던 점
- 실제 코드에 근거한 내용.

기준 커밋, 검토 범위·미검토 범위, CI 상태, 직접 실행한 검사와 미실행 검사를 명시한다.
```

## 게시 도우미

```sh
# 사전 미리보기: 쓰기 API를 호출하지 않는다.
node /path/to/code-review/scripts/publish-review.mjs \
  --repo owner/repository --pr 123 --head FULL_HEAD_SHA --level deep \
  --input /tmp/review.json --notes-file /tmp/review-notes.txt

# 사용자가 게시를 요청한 경우에만 같은 명령에 --post를 붙인다.
```

`--notes-file`에는 실제 CI 결과와 검증 한계를 기록한다. 토큰·DSN·비밀값을 넣지 않는다. 기본 미리보기는 최종 요약과 인라인으로 붙을 위치, 요약에만 남길 위치를 JSON으로 출력한다. 게시 전에 직접 읽어 등급·경로·줄 번호·미검증 설명을 확인한다.

인라인 코멘트는 `🟠 **major** · **제목**` 다음에 본문과 커밋 고정 코드 링크를 담는다. GitHub의 해당 diff 줄에서 펼쳐 볼 수 있다. 요약에도 모든 지적을 보존한다. 유효한 인라인 위치가 없더라도 지적을 숨기지 않는다.

head가 바뀌면 게시를 중단한다. 새 head로 재검토한 뒤 결과와 `--head`를 함께 갱신한다. 리뷰에는 결과 식별 마커를 붙여 같은 계정·같은 커밋·같은 내용의 완료된 리뷰를 중복 게시하지 않는다. 자동 CI 봇의 기존 댓글은 수정하지 않는다.
