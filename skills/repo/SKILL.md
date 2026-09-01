---
name: repo
description: Get oriented in an unfamiliar codebase — structure, entry points, how to build/test/run it, and how data flows through it. Use when the user just cloned something, joined a project, asks "what is this repo" / "어디서부터 봐야 해", or needs a map before touching code.
---

# repo

처음 보는 레포를 **5분 안에 손댈 수 있는 상태**로 만든다. 파일 목록을 나열하는 게 아니라, 다음 작업을 시작할 수 있게 하는 게 목적이다.

## 볼 것

순서대로, 있는 것만.

1. **README / CONTRIBUTING / docs** — 만든 사람이 뭐라고 설명했는지 먼저. 단, 오래돼서 틀린 경우가 많으니 명령어는 나중에 실제 파일로 검증한다.
2. **패키지 매니페스트** — `package.json`, `pyproject.toml`, `go.mod`, `build.gradle`, `Cargo.toml`, `*.csproj`. 여기서 언어·프레임워크·스크립트·의존성을 한 번에 얻는다.
3. **진입점** — `main`, `app`, `index`, `cmd/`, `server.*`, `__main__.py`. 실행이 어디서 시작되는지.
4. **최상위 디렉터리** — 폴더 이름만 훑어서 레이어 구조를 잡는다. 깊이 들어가지 않는다.
5. **설정과 환경** — `.env.example`, `docker-compose.yml`, `Makefile`, CI 워크플로. CI가 돌리는 명령이 곧 "진짜 빌드/테스트 방법"이다. README보다 믿을 만하다.
6. **git 히스토리** — `git log --oneline -20` 로 요즘 뭘 하고 있는지, `git log --format= --name-only -100 | sort | uniq -c | sort -rn | head` 로 실제로 뜨거운 파일이 어딘지.

## 데이터 흐름

가장 대표적인 요청/작업 하나를 골라서 입구부터 출구까지 따라간다. 라우트 → 핸들러 → 서비스 → 저장소 처럼. 전부 다 하지 말고 **하나만** 제대로. 이게 폴더 구조 설명보다 훨씬 유용하다.

## 이렇게 답한다

```
무엇: <한 줄. 이 레포가 하는 일>
스택: <언어/프레임워크/DB>

구조:
  dir/        <한 줄 설명>
  dir/        <한 줄 설명>
  (5-8개. 의미 있는 것만)

돌리는 법:
  설치   <명령>
  실행   <명령>
  테스트 <명령>
  (검증한 건지 문서에서 베낀 건지 표시)

흐름 예시 — <요청 이름>:
  file.ts:12 → file.ts:45 → file.ts:88

지금 뜨거운 곳:
  <최근 커밋이 몰린 영역 1-2개>

주의:
  <함정, 죽은 코드, 문서와 실제가 다른 지점>
```

## 규칙

- 파일 트리를 통째로 붙여넣지 않는다. 사용자는 `ls` 를 칠 줄 안다.
- 실행 명령은 가능하면 실제로 확인한다 (`--help`, 스크립트 존재 여부). 확인 못 했으면 그렇게 적는다.
- **의존성 설치나 빌드를 마음대로 실행하지 않는다.** 시간이 오래 걸리고 환경을 바꾼다. 명령만 알려주고 돌릴지는 물어본다.
- 모노레포면 먼저 패키지 목록부터 보여주고 어디를 볼지 정한다. 전부 훑지 않는다.
- 안 읽은 걸 읽은 척하지 않는다. 큰 레포는 다 못 본다 — 뭘 봤는지 범위를 밝힌다.
