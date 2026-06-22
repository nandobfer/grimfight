#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
GRIMFIGHT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$GRIMFIGHT_DIR/dist"
DEV_DIR="/home/burgos/www/dev.grimfight.com.br"
SOURCE_DIR="$DIST_DIR"
DEPLOY_MODE="dist"

usage() {
    echo "Usage: $0 [--from-dev]" >&2
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --from-dev)
            SOURCE_DIR="$DEV_DIR"
            DEPLOY_MODE="dev"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            usage
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

if [[ "$DEPLOY_MODE" == "dist" && ! -d "$DIST_DIR" ]]; then
    echo "dist not found. Running pnpm run build..."
    (cd "$GRIMFIGHT_DIR" && pnpm run build)
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
    if [[ "$DEPLOY_MODE" == "dist" ]]; then
        echo "Build finished, but dist was not created at: $DIST_DIR" >&2
    else
        echo "Dev deploy source not found at: $DEV_DIR" >&2
    fi
    exit 1
fi

if [[ "$DEPLOY_MODE" == "dev" ]]; then
    echo "Deploying production from dev directory: $DEV_DIR"
else
    echo "Deploying production from build directory: $DIST_DIR"
fi

echo "Requesting sudo permission for deploy to /var/www..."
sudo -v

sudo bash -euo pipefail -c '
    cd /var/www
    rm -rf grimfight.com.br.bak

    if [[ -e grimfight.com.br || -L grimfight.com.br ]]; then
        mv grimfight.com.br grimfight.com.br.bak
    fi

    if [[ "$2" == "dev" ]]; then
        cp -a "$1" grimfight.com.br
    else
        mv "$1" grimfight.com.br
    fi
' _ "$SOURCE_DIR" "$DEPLOY_MODE"

echo "Deploy finished: /var/www/grimfight.com.br"
