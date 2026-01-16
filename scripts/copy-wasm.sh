#!/bin/bash
set -e

SUZUME_DIR="../suzume"
DIST_DIR="$SUZUME_DIR/dist"
DEST_DIR="src/wasm"

# Required files from dist/
WASM_FILES=("suzume-wasm.wasm" "suzume.js")

echo "Copying WASM files from suzume..."

# Check if suzume directory exists
if [ ! -d "$SUZUME_DIR" ]; then
  echo "Error: suzume directory not found at $SUZUME_DIR"
  echo "   Please clone suzume in the parent directory."
  exit 1
fi

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
  echo "Error: dist directory not found at $DIST_DIR"
  echo "   Run 'yarn build' in suzume first."
  exit 1
fi

# Check WASM files
missing_wasm=()
for file in "${WASM_FILES[@]}"; do
  if [ ! -f "$DIST_DIR/$file" ]; then
    missing_wasm+=("$file")
  fi
done

if [ ${#missing_wasm[@]} -gt 0 ]; then
  echo "Error: WASM files missing in $DIST_DIR:"
  for file in "${missing_wasm[@]}"; do
    echo "   - $file"
  done
  echo ""
  echo "   Run 'yarn build:wasm' in suzume first."
  exit 1
fi

# Copy files
echo "   Copying WASM files..."
for file in "${WASM_FILES[@]}"; do
  cp "$DIST_DIR/$file" "$DEST_DIR/"
  echo "   $file"
done

# Update meta.json
echo ""
./scripts/update-wasm-meta.sh

echo ""
echo "WASM files copied successfully!"
