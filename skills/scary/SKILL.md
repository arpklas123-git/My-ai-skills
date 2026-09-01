---
name: scary
description: Pre-flight checklist before a hard-to-undo command — DB migrations, force push, rm -rf, DROP/TRUNCATE, prod deploys, mass rename, history rewrite. Use when the user is about to run something destructive or asks "이거 돌려도 돼?".
---

# scary

되돌리기 어려운 작업 **직전에** 멈춰서 확인한다. 겁주는 게 목적이 아니라, 30초 확인으로 막을 수 있는 사고를 막는 것이다.

## 대상

- `rm -rf`, 와일드카드 삭제, 대량 파일 이동·이름변경
- `git push --force`, `git reset --hard`, `git clean -fd`, rebase로 히스토리 재작성, 브랜치·태그 삭제
- `DROP` / `TRUNCATE` / `WHERE` 없는 `UPDATE`·`DELETE`, 마이그레이션 적용
- 운영 배포, 인프라 apply/destroy, 시크릿·키 교체
- 되돌리는 절차가 없는 모든 것

## 물어볼 것

**1. 지금 어디인가.** 이게 제일 많이 틀린다.

```bash
pwd && git rev-parse --abbrev-ref HEAD    # 어느 폴더, 어느 브랜치
echo "$DATABASE_URL" | sed 's/:[^:@]*@/:***@/'   # 어느 DB (비밀번호는 가림)
kubectl config current-context            # 어느 클러스터
```

로컬인 줄 알고 운영에 친 경우가 대부분이다.

**2. 정확히 몇 개가 사라지나.** 세는 명령을 먼저 돌린다.

- 삭제 → `ls` 나 `find` 로 목록을 눈으로 본다. `rm` 은 그 다음.
- `UPDATE`/`DELETE` → 같은 `WHERE` 로 `SELECT COUNT(*)`. 예상과 다르면 멈춘다.
- force push → `git log --oneline origin/<branch>..HEAD` 와 반대 방향 둘 다.

**3. 되돌릴 수 있나.** 방법을 구체적으로 말할 수 있어야 한다.

- 되돌아옴: 커밋된 파일, reflog에 남은 브랜치, 백업 있는 DB
- 안 돌아옴: 커밋 안 한 작업, 푸시로 덮인 남의 커밋, 백업 없는 DB, 이미 나간 메일·메시지
- **DB는 백업이 있는지 확인 자체를 해야 한다.** "있겠지"는 확인이 아니다.

**4. 남한테 영향 가나.** 공유 브랜치, 공유 DB, 운영 서비스면 사람에게 먼저 말한다.

## 어떻게 답하나

```
바꾸는 것: <무엇이 몇 개>
어디서:    <브랜치 / DB / 환경>
되돌리기:  <구체적 방법, 또는 "불가">
먼저 할 것: <백업·확인 명령>

[걸리는 게 있으면] 잠깐: <무엇이 이상한지>
```

문제가 없으면 짧게 "괜찮다"고 하고 넘어간다. 안전한 작업에 경고 다섯 줄을 붙이면 다음부터 안 읽는다.

## 규칙

- **확인 중에 파괴적 명령을 대신 실행하지 않는다.** 세고 보여주는 것까지가 이 스킬의 일이다. 실행은 사용자가 한다.
- 사용자가 확인을 듣고도 하겠다고 하면 한다. 두 번 말리지 않는다. 판단은 사용자 몫이다.
- 이미 사고가 난 뒤라면 이 스킬이 아니라 복구가 먼저다. `git reflog` 부터 본다.
