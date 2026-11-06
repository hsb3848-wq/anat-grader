#!/usr/bin/env bash
# 아티팩트용 HTML(doctype/head/body 없음)을 독립 실행 index.html + vercel.json 으로 감싼다.
# 사용법: build_standalone.sh <artifact.html> <out_dir> [--body-marker '<header']
set -euo pipefail
src="$1"; out="$2"; marker="<header"
if [ "${3:-}" = "--body-marker" ]; then marker="$4"; fi
[ -f "$src" ] || { echo "입력 파일 없음: $src" >&2; exit 1; }
grep -q -- "$marker" "$src" || { echo "본문 시작 표식 '$marker' 를 찾지 못함. --body-marker 로 지정하세요." >&2; exit 1; }
mkdir -p "$out"
{
  printf '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style>\n'
  awk -v m="$marker" 'index($0,m)==1 && !done {print "</head>\n<body>"; done=1} {print}' "$src"
  printf '</body>\n</html>\n'
} > "$out/index.html"
cat > "$out/vercel.json" <<'J'
{ "cleanUrls": true, "headers": [{ "source": "/(.*)", "headers": [{ "key": "X-Content-Type-Options", "value": "nosniff" }] }] }
J
echo "생성: $out/index.html, $out/vercel.json"
