#!/usr/bin/env sh
# Export a buildless static copy. The generated dist/ directory is not versioned.
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
php "$root/scripts/lint-catalog.php"
if [ -L "$root/dist" ]; then echo 'Refusing to write through a dist symlink.' >&2; exit 1; fi
mkdir -p "$root/dist"
php "$root/src/public/index.php" > "$root/dist/index.html"
rsync -rlt "$root/src/public/assets/" "$root/dist/assets/"
rsync -rlt "$root/src/public/fonts/" "$root/dist/fonts/"
cp "$root/src/public/favicon.svg" "$root/src/public/robots.txt" "$root/dist/"
echo "Static site exported to $root/dist"
