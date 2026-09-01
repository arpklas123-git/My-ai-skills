---
name: pr
description: Draft a pull request title and body from the current branch's changes. Use when the user is about to open a PR, asks for a PR description, or says the work is done and needs to be reviewed.
---

# pr

현재 브랜치의 변경을 읽고 **리뷰어가 읽을 PR 초안**을 만든다. diff를 요약하는 게 아니라, 리뷰어가 뭘 봐야 하는지 알려주는 게 목적이다.

## 먼저 실제로 읽는다

```bash
git log --oneline main..HEAD
git diff main...HEAD --stat
git diff main...HEAD
```

기본 브랜치 이름은 확인하고 쓴다 (`main` / `master` / `develop`). diff가 너무 크면 `--stat` 으로 큰 덩어리부터 잡고 중요한 파일만 본문을 읽는다.

**커밋 메시지를 그대로 베끼지 않는다.** 커밋은 작업 순서대로 쌓인 거고, PR은 결과를 설명하는 글이다. 순서가 다르다.

## 레포 규칙을 따른다

`.github/PULL_REQUEST_TEMPLATE.md` 가 있으면 그 형식을 쓴다. 최근 머지된 PR 몇 개(`gh pr list --state merged --limit 5`)를 보고 그 레포의 말투와 길이에 맞춘다. 한국어 레포면 한국어로 쓴다.

## 형식

템플릿이 없을 때의 기본형:

```markdown
<제목: 명령형 한 줄. 무엇을 했는지. 50자 안팎>

## 무엇을
<2-4줄. 이 PR이 바꾸는 것>

## 왜
<이 변경이 필요한 이유. 이슈가 있으면 링크>

## 어떻게
<구현에서 리뷰어가 알아야 할 선택. 자명하면 생략>

## 확인
<어떻게 검증했는지. 실제로 돌린 것만>
```

## 규칙

- **안 한 걸 썼다고 하지 않는다.** 테스트를 안 돌렸으면 "확인" 칸에 안 돌렸다고 쓴다. 여기 거짓말이 들어가면 리뷰어가 통과시킨다.
- 스스로 걸리는 부분(임시 방편, 놓친 케이스, 다음 PR로 미룬 것)은 본문에 적는다. 리뷰어가 찾아내는 것보다 낫다.
- 파일별 나열 금지. 리뷰어는 diff를 볼 수 있다. 왜 그렇게 했는지를 쓴다.
- 마이그레이션·설정 변경·의존성 추가처럼 **머지 후 별도 조치가 필요한 게 있으면 맨 위에 적는다.**
- 초안을 보여주고 확인받은 다음에 올린다. `gh pr create` 를 물어보지 않고 실행하지 않는다.
