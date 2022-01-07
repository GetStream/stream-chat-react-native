#!/bin/bash
# shellcheck disable=SC2103


# Runs before semantic-release tagging in order to set correct tags for internal native-package
# and expo-package. also sets version.json. also runs before publishing a nightly release

set -eux

PACKAGE_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')
PACKAGE_VERSION_WITHOUT_SHA=$(echo "$PACKAGE_VERSION" | cut -d"+" -f1)

cd native-package
npm version --allow-same-version --no-git-tag-version "$PACKAGE_VERSION_WITHOUT_SHA"
sed -e 's|"stream-chat-react-native-core": "[^"]*"|"stream-chat-react-native-core": "'"$PACKAGE_VERSION_WITHOUT_SHA"'"|g' -i.bak package.json
rm package.json.bak

cd ../expo-package
npm version --allow-same-version --no-git-tag-version "$PACKAGE_VERSION_WITHOUT_SHA"
sed -e 's|"stream-chat-react-native-core": "[^"]*"|"stream-chat-react-native-core": "'"$PACKAGE_VERSION_WITHOUT_SHA"'"|g' -i.bak package.json
rm package.json.bak
cd ..

sed -e 's|"version": "[^"]*"|"version": "'"$PACKAGE_VERSION_WITHOUT_SHA"'"|g' -i.bak src/version.json
rm src/version.json.bak

git add {expo,native}-package/package.json
git add src/version.json

git add expo-package/yarn.lock
git add native-package/yarn.lock
