#!/bin/bash
# shellcheck disable=SC2103

# Runs before releasing core package in order to also release native-package and expo-package

set -eux

PACKAGE_VERSION=$(npm --loglevel silent run get-version)

cd native-package
npm publish --tag="$PACKAGE_VERSION"


cd ../expo-package
npm publish --tag="$PACKAGE_VERSION"

git push --follow-tags