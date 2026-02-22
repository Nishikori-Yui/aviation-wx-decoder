#!/usr/bin/env bash
set -euo pipefail

missing=0

while IFS= read -r file; do
  if [[ "$file" == *.zh-CN.md ]]; then
    continue
  fi

  target="${file%.md}.zh-CN.md"
  if [[ ! -f "$target" ]]; then
    echo "missing: $target (for $file)"
    missing=1
  fi
done < <(git ls-files '*.md')

if [[ "$missing" -ne 0 ]]; then
  echo "doc i18n check failed"
  exit 1
fi

echo "doc i18n check passed"
