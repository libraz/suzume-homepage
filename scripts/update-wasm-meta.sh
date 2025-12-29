#!/bin/bash
# Generate WASM metadata (size info)

WASM_FILE="src/.vitepress/theme/wasm/suzume-wasm.wasm"
META_FILE="src/.vitepress/theme/wasm/meta.json"

if [ -f "$WASM_FILE" ]; then
  SIZE=$(wc -c < "$WASM_FILE")
  SIZE_KB=$((SIZE / 1024))
  GZIP_SIZE=$(gzip -9 -c "$WASM_FILE" | wc -c)
  GZIP_KB=$((GZIP_SIZE / 1024))

  echo "{" > "$META_FILE"
  echo "  \"size\": $SIZE," >> "$META_FILE"
  echo "  \"sizeKB\": $SIZE_KB," >> "$META_FILE"
  echo "  \"gzipSize\": $GZIP_SIZE," >> "$META_FILE"
  echo "  \"gzipKB\": $GZIP_KB" >> "$META_FILE"
  echo "}" >> "$META_FILE"

  echo "WASM metadata updated: ${SIZE_KB}KB (${GZIP_KB}KB gzip)"
else
  echo "WASM file not found: $WASM_FILE"
  exit 1
fi
