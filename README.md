# My-ai-skills

내가 쓰는 AI 코딩 툴 커스텀 프롬프트/스킬 모음.

## codex-prompts/

Codex CLI 슬래시 커맨드. 파일명이 곧 커맨드 이름이다 (`eli5.md` → `/eli5`).

| 커맨드 | 하는 일 |
|---|---|
| `/eli5 <주제>` | 주제를 그림 위주 HTML 한 장으로 설명해서 브라우저로 열어준다 |

### 설치

```bash
mkdir -p ~/.codex/prompts
curl -fsSL https://raw.githubusercontent.com/arpklas123-git/My-ai-skills/main/codex-prompts/eli5.md \
  -o ~/.codex/prompts/eli5.md
```

폴더째 쓸 거면 클론해서 심볼릭 링크를 걸어도 된다.

```bash
git clone https://github.com/arpklas123-git/My-ai-skills.git
ln -s "$PWD/My-ai-skills/codex-prompts/eli5.md" ~/.codex/prompts/eli5.md
```

이미 Codex를 켜둔 상태면 재시작해야 커맨드 목록에 뜬다.
