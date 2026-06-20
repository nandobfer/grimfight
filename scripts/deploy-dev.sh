#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
GRIMFIGHT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$GRIMFIGHT_DIR/dist"
TARGET_PARENT="/home/burgos/www"
TARGET_DIR="$TARGET_PARENT/dev.grimfight.com.br"
BACKUP_DIR="$TARGET_PARENT/dev.grimfight.com.br.bak"

if [[ ! -d "$DIST_DIR" ]]; then
    echo "dist not found. Running pnpm run build..."
    (cd "$GRIMFIGHT_DIR" && pnpm run build)
fi

if [[ ! -d "$DIST_DIR" ]]; then
    echo "Build finished, but dist was not created at: $DIST_DIR" >&2
    exit 1
fi

mkdir -p "$TARGET_PARENT"
rm -rf "$BACKUP_DIR"

if [[ -e "$TARGET_DIR" || -L "$TARGET_DIR" ]]; then
    mv "$TARGET_DIR" "$BACKUP_DIR"
fi

mv "$DIST_DIR" "$TARGET_DIR"
chmod o+x /home/burgos "$TARGET_PARENT"
chmod -R o+rX "$TARGET_DIR"

echo "Deploy finished: $TARGET_DIR"
