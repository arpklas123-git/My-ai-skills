#!/usr/bin/env bash
# Link (or copy) skills and prompts into Claude Code and Codex.
#
#   ./install.sh           심볼릭 링크. 레포를 pull 하면 바로 반영된다.
#   ./install.sh --copy    복사. 링크가 안 되는 환경(권한 없는 Windows 등)용.
#
# 이미 있는 항목은 건드리지 않고 건너뛴다. 덮어쓰려면 --force.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE=link
FORCE=0
for arg in "$@"; do
  case "$arg" in
    --copy)  MODE=copy ;;
    --force) FORCE=1 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

install_one() {  # $1=source path  $2=destination path
  local src=$1 dst=$2 name; name=$(basename "$dst")
  if [ -e "$dst" ] || [ -L "$dst" ]; then
    if [ "$FORCE" = 1 ]; then rm -rf "$dst"
    else echo "  skip    $name (이미 있음)"; return; fi
  fi
  mkdir -p "$(dirname "$dst")"
  if [ "$MODE" = link ] && ln -s "$src" "$dst" 2>/dev/null; then
    echo "  link    $name"
  else
    cp -r "$src" "$dst"
    echo "  copy    $name"
  fi
}

echo "Claude Code skills  -> ~/.claude/skills"
for d in "$SRC"/skills/*/; do
  [ -f "$d/SKILL.md" ] || continue
  install_one "${d%/}" "$HOME/.claude/skills/$(basename "$d")"
done

echo "Codex skills        -> ~/.codex/skills"
for d in "$SRC"/skills/*/; do
  [ -f "$d/SKILL.md" ] || continue
  install_one "${d%/}" "$HOME/.codex/skills/$(basename "$d")"
done

echo "Codex prompts       -> ~/.codex/prompts"
for f in "$SRC"/codex-prompts/*.md; do
  [ -f "$f" ] || continue
  install_one "$f" "$HOME/.codex/prompts/$(basename "$f")"
done

echo
echo "완료. 실행 중인 Claude Code / Codex 는 재시작해야 목록에 뜬다."
