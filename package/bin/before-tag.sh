#!/bin/bash
# shellcheck disable=SC2103


# Runs before semantic-release tagging in order to set correct tags for internal native-package
# and expo-package. also sets version.json. also runs before publishing a nightly release

set -eux

PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')
PACKAGE_VERSION_WITHOUT_SHA=$(echo "$PACKAGE_VERSION" | cut -d"+" -f1)

# We bump ONLY the `version` field of the internal packages here and deliberately leave their
# `stream-chat-react-native-core` dependency as `workspace:^`. This script runs during
# semantic-release's *prepare* step, before the release commit + `git push origin main` (see
# `release/prod.js`), so whatever these files look like on disk here is what gets committed.
#
# Bumping `version` is safe to commit: Yarn resolves workspace packages to a `0.0.0-use.local`
# placeholder in the lockfile and keys on the `workspace:^` descriptor, so the version field
# never affects yarn.lock. Resolving `workspace:^` to a concrete version, however, WOULD change
# the lockfile descriptor and break `yarn install --immutable` and local workspace linking.
# That resolution is therefore done only in the published npm tarball, at publish time, in
# `release.sh` (which runs after this commit) and is never committed back to git.
cd native-package
npm version --no-workspaces --allow-same-version --no-git-tag-version "$PACKAGE_VERSION_WITHOUT_SHA"

cd ../expo-package
npm version --no-workspaces --allow-same-version --no-git-tag-version "$PACKAGE_VERSION_WITHOUT_SHA"
cd ..

sed -e 's|"version": "[^"]*"|"version": "'"$PACKAGE_VERSION_WITHOUT_SHA"'"|g' -i.bak src/version.json
rm src/version.json.bak

git add {expo,native}-package/package.json
git add src/version.json
