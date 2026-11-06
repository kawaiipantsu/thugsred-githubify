#!/usr/bin/env sh
# Copy only runtime files into an existing PHP vhost; no server configuration changes.
set -eu
if [ "$#" -ne 1 ]; then
    echo 'Usage: sh scripts/deploy-webroot.sh /absolute/path/to/vhost/html' >&2
    exit 1
fi
case "$1" in /*) ;; *) echo 'The document root must be an absolute path.' >&2; exit 1 ;; esac
if [ ! -d "$1" ] || [ -L "$1" ]; then
    echo 'The document root must be an existing, real directory.' >&2
    exit 1
fi
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
webroot=$(CDPATH= cd -- "$1" && pwd)
parent=$(dirname -- "$webroot")
if [ "$webroot" = / ] || [ "$parent" = / ] || [ "$webroot" = "$root" ] || [ "$webroot" = "$root/src" ] || [ "$webroot" = "$root/src/public" ] || [ "$webroot" = "$root/src/lib" ]; then
    echo 'Choose a dedicated vhost document root outside the project source.' >&2
    exit 1
fi
if [ -L "$parent/lib" ]; then
    echo 'Refusing to deploy PHP data through a symlink.' >&2
    exit 1
fi
php "$root/scripts/lint-catalog.php"
mkdir -p "$parent/lib"
# No --delete: existing vhost files and middleware remain untouched.
rsync -rlt --chmod=D755,F644 --exclude='local.php' --exclude='.env*' --exclude='*.key' --exclude='*.pem' --exclude='*.log' "$root/src/lib/" "$parent/lib/"
rsync -rlt --chmod=D755,F644 --exclude='local.php' --exclude='.env*' --exclude='*.key' --exclude='*.pem' --exclude='*.log' "$root/src/public/" "$webroot/"
echo "Deployed public assets to $webroot; PHP configuration and catalog are outside the document root."
