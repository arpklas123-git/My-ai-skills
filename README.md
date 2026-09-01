# My-ai-skills

내가 쓰는 AI 코딩 툴(Claude Code / Codex CLI) 커스텀 스킬·프롬프트 모음.

## 뭐가 있나

### skills/ — Claude Code + Codex 공용

두 툴이 `SKILL.md` 포맷을 같이 쓰기 때문에 하나로 관리한다. 슬래시로 직접 부를 수도 있고, 상황이 맞으면 모델이 알아서 집어든다.

| 스킬 | 하는 일 |
|---|---|
| `wtf` | 에러·스택트레이스·실패한 테스트 → 진짜 원인, 재현, 고칠 파일:줄 |
| `repo` | 처음 보는 레포 파악: 구조, 진입점, 빌드·테스트 명령, 데이터 흐름 하나 |
| `duck` | 러버덕. 코드 안 고치고 질문만 던져서 생각 정리 |

### codex-prompts/ — Codex 전용 슬래시 커맨드

파일명이 곧 커맨드 이름이다 (`eli5.md` → `/eli5`).

| 커맨드 | 하는 일 |
|---|---|
| `/eli5 <주제>` | 주제를 그림 위주 HTML 한 장으로 설명해서 브라우저로 열어준다 |

## 설치

```bash
git clone https://github.com/arpklas123-git/My-ai-skills.git
cd My-ai-skills
./install.sh
```

심볼릭 링크로 걸리니까 나중에 `git pull` 만 하면 반영된다.

링크가 안 되는 환경이면 `./install.sh --copy`, 이미 같은 이름이 있어서 덮어써야 하면 `--force`. 이미 있는 항목은 기본적으로 건너뛴다.

하나만 필요하면 그냥 복사해도 된다.

```bash
mkdir -p ~/.claude/skills && cp -r skills/wtf ~/.claude/skills/
```

실행 중인 Claude Code / Codex 는 재시작해야 목록에 뜬다.

## 어디에 깔리나

| | Claude Code | Codex CLI |
|---|---|---|
| 스킬 | `~/.claude/skills/<name>/SKILL.md` | `~/.codex/skills/<name>/SKILL.md` |
| 슬래시 커맨드 | `~/.claude/commands/<name>.md` | `~/.codex/prompts/<name>.md` |
