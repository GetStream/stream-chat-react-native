#!/bin/bash
# shellcheck disable=SC2103

# Runs before releasing core package in order to also release native-package and expo-package

set -eux

PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')
PACKAGE_TAG=$(sed 's/.*-\(.*\)\..*/\1/' <<< "$PACKAGE_VERSION")

# If tag === version it means that its not a prerelease and shouuld set things to latest
if [[ "${PACKAGE_TAG}" != "${PACKAGE_VERSION}" ]]; then
    cd native-package
    npm publish --tag="$PACKAGE_TAG"

    cd ../expo-package
    npm publish --tag="$PACKAGE_TAG"
else
    cd native-package
    npm publish

    cd ../expo-package
    npm publish
fi


