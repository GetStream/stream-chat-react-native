#!/bin/bash -e

log() { echo "👉 ${1}" >&2; }
die() { log "${1}"; exit 1; }
[ $# -eq 1 ] || die "usage: $0 path/to/runtime.dmg"

dmg=$1
mountpoint=$(mktemp -d)
staging=$(mktemp -d)

cleanup() {
    if [ -d "$staging" ]; then
        set +e
        log "Removing $staging..."
        rm -r "$staging" || true
        log "Unmounting $mountpoint..."
        hdiutil detach "$mountpoint" >&2 || true
    fi

    if [ -d "$mountpoint" ]; then
        log "Removing $mountpoint..."
        rmdir "$mountpoint" || true
    fi
}
trap cleanup EXIT

log "Mounting $dmg on $mountpoint..."
hdiutil attach "$dmg" -mountpoint "$mountpoint" >&2

if ! ls "$mountpoint"/*.pkg >/dev/null 2>&1; then
    log "Detected a modern volume runtime; installing with simctl..."
    xcrun simctl runtime add "$1"
    exit 0
fi

log "Detected packaged runtime."

bundle=$(echo "$mountpoint"/*.pkg)
basename=$(basename "$bundle")
sdkname=${basename%.*}
log "Found package $bundle (sdk $sdkname)."

log "Expanding package $bundle to $staging/expanded..."
pkgutil --expand "$bundle" "$staging/expanded"

dest=/Library/Developer/CoreSimulator/Profiles/Runtimes/$sdkname.simruntime
log "Rewriting package install location to $dest..."
sed -I '' "s|<pkg-info|<pkg-info install-location=\"$dest\"|" "$staging/expanded/PackageInfo"

log "Re-assembling the package $staging/$basename..."
pkgutil --flatten "$staging/expanded" "$staging/$basename"

log "Installing $staging/$basename..."
sudo installer -pkg "$staging/$basename" -target /

version=$(plutil -extract CFBundleName raw "$dest/Contents/Info.plist")
log "Installed $version."
