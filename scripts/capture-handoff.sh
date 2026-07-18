#!/usr/bin/env bash
set -u

MODE="${1:-manual}"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

TZ_NAME="${TZ:-America/Fortaleza}"
STAMP="$(TZ="$TZ_NAME" date +%Y%m%d-%H%M%S)"
ISO_NOW="$(TZ="$TZ_NAME" date --iso-8601=seconds 2>/dev/null || date)"
OUT_DIR="$ROOT/continuity/snapshots"
OUT="$OUT_DIR/${STAMP}-${MODE}.md"
mkdir -p "$OUT_DIR"

safe_cmd() {
  local title="$1"
  shift
  printf '\n## %s\n\n```text\n' "$title" >> "$OUT"
  "$@" >> "$OUT" 2>&1 || true
  printf '\n```\n' >> "$OUT"
}

cat > "$OUT" <<EOF
# Snapshot de handoff — $ISO_NOW

- Modo: $MODE
- Diretório: $ROOT
- Gerado automaticamente: sim
- Observação: este snapshot não substitui CURRENT_HANDOFF.md.
EOF

safe_cmd "Git — branch e status" git status --short --branch
safe_cmd "Git — HEAD" git rev-parse HEAD
safe_cmd "Git — commits recentes" git log --oneline --decorate -20
safe_cmd "Git — diff stat" git diff --stat
safe_cmd "Git — diff staged stat" git diff --cached --stat
safe_cmd "Git — arquivos não rastreados" git ls-files --others --exclude-standard

if [ -f package.json ]; then
  safe_cmd "Package scripts" node -e 'const p=require("./package.json"); console.log(JSON.stringify(p.scripts||{}, null, 2))'
fi

if [ -d src/server/db/migrations ]; then
  safe_cmd "Migrations em src/server/db/migrations" find src/server/db/migrations -maxdepth 2 -type f -printf '%TY-%Tm-%Td %TH:%TM %p\n'
elif [ -d migrations ]; then
  safe_cmd "Migrations em migrations" find migrations -maxdepth 2 -type f -printf '%TY-%Tm-%Td %TH:%TM %p\n'
elif [ -d drizzle ]; then
  safe_cmd "Migrations em drizzle" find drizzle -maxdepth 2 -type f -printf '%TY-%Tm-%Td %TH:%TM %p\n'
fi

safe_cmd "TODO e FIXME nos arquivos modificados" bash -lc '
  files=$(git diff --name-only; git diff --cached --name-only; git ls-files --others --exclude-standard) || true
  [ -z "$files" ] && exit 0
  printf "%s\n" "$files" | sort -u | while read -r f; do
    [ -f "$f" ] && grep -nE "TODO|FIXME|HACK|XXX" "$f" 2>/dev/null | sed "s#^#$f:#" || true
  done
'

cat >> "$OUT" <<'EOF'

## Preenchimento manual obrigatório

- Objetivo da sessão:
- Fase/módulo:
- Comandos de validação e resultados:
- Banco/produção consultados:
- Decisões:
- Bloqueios:
- Próxima ação exata:
EOF

printf '%s\n' "$OUT"
