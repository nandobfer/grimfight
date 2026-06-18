#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
GRIMFIGHT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$GRIMFIGHT_DIR/dist"

if [[ ! -d "$DIST_DIR" ]]; then
    echo "dist not found. Running pnpm run build..."
    (cd "$GRIMFIGHT_DIR" && pnpm run build)
fi

if [[ ! -d "$DIST_DIR" ]]; then
    echo "Build finished, but dist was not created at: $DIST_DIR" >&2
    exit 1
fi

echo "Requesting sudo permission for deploy to /var/www..."
sudo -v

sudo bash -euo pipefail -c '
    cd /var/www
    rm -rf grimfight.com.br.bak

    if [[ -e grimfight.com.br || -L grimfight.com.br ]]; then
        mv grimfight.com.br grimfight.com.br.bak
    fi

    mv "$1" grimfight.com.br
' _ "$DIST_DIR"

echo "Deploy finished: /var/www/grimfight.com.br"
