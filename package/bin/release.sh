#!/bin/bash
# shellcheck disable=SC2103

# Runs before releasing core package in order to also release native-package and expo-package

set -eux

PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')
PACKAGE_VERSION_WITHOUT_SHA=$(echo "$PACKAGE_VERSION" | cut -d"+" -f1)
PACKAGE_TAG=$(sed 's/.*-\(.*\)\..*/\1/' <<< "$PACKAGE_VERSION")

# Resolve the `workspace:^` protocol to the concrete published version. npm cannot understand
# Yarn's `workspace:` protocol, so the tarball must carry a real version. We do this ONLY here,
# at publish time as this runs after `semantic-release` has already committed and pushed the release
# commit (see release/prod.js), on a throwaway CI checkout, so the rewrite is never committed.
# That keeps `workspace:^` intact in git for local dev and `yarn install --immutable`, while the
# published packages still depend on a concrete `stream-chat-react-native-core` version.
resolve_workspace_dep() {
    sed -e 's|"stream-chat-react-native-core": "[^"]*"|"stream-chat-react-native-core": "'"$PACKAGE_VERSION_WITHOUT_SHA"'"|g' -i.bak package.json
    rm package.json.bak
}

# If tag === version it means that its not a prerelease and shouuld set things to latest
if [[ "${PACKAGE_TAG}" != "${PACKAGE_VERSION}" ]]; then
    cd native-package
    resolve_workspace_dep
    npm publish --no-workspaces --tag="$PACKAGE_TAG"

    cd ../expo-package
    resolve_workspace_dep
    npm publish --no-workspaces --tag="$PACKAGE_TAG"
else
    cd native-package
    resolve_workspace_dep
    npm publish --no-workspaces

    cd ../expo-package
    resolve_workspace_dep
    npm publish --no-workspaces
fi
