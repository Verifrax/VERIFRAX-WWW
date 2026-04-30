#!/usr/bin/env bash
set -euo pipefail

need() {
  local file="$1"
  local needle="$2"
  if ! grep -Fq "$needle" "$file"; then
    echo "sync-surface locked-live failure: missing [$needle] in $file" >&2
    exit 1
  fi
}

need index.html 'id="observatory-webgl-runtime"'
need 404.html 'id="observatory-webgl-runtime"'
need index.html 'assets/observatory-webgl-runtime.js'
need 404.html 'assets/observatory-webgl-runtime.js'
need index.html 'FULL_OBSERVATORY'
need 404.html 'FULL_OBSERVATORY'
need assets/surface.css 'VCO REAL3D VIEWPORT HARDENING'
need assets/surface.css 'height:100svh'
need assets/surface.css 'overflow:hidden'
need assets/observatory-webgl-runtime.js 'VCO REAL3D ANTI TOY RUNTIME AUTHORITY'
need assets/observatory-webgl-runtime.js 'VCO_REAL3D_ANTI_TOY_RUNTIME_API'

echo "ok: www"
