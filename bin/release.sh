#!/bin/bash
# shellcheck disable=SC2103

set -eux

if ! git diff --exit-code || ! git diff --cached --exit-code; then
    echo "ERROR: UNCOMMITTED CHANGES"
    exit 1
fi

echo "Mention the tag. Default - latest"
read tag

if [ -z "$tag" ]
then
      tag="latest"
fi

cd package/native-package
npm version --no-git-tag-version "$1"
sed -e 's|"stream-chat-react-native-core": "[^"]*"|"stream-chat-react-native-core": "'"$1"'"|g' -i.bak package.json
rm package.json.bak

cd ../expo-package
npm version --no-git-tag-version "$1"
sed -e 's|"stream-chat-react-native-core": "[^"]*"|"stream-chat-react-native-core": "'"$1"'"|g' -i.bak package.json
rm package.json.bak
cd ..

sed -e 's|"version": "[^"]*"|"version": "'"$1"'"|g' -i.bak src/version.json
rm src/version.json.bak

git add package.json
git add {expo,native}-package/package.json
git add src/version.json

git add yarn.lock
git add expo-package/yarn.lock
git add native-package/yarn.lock

npm version --no-git-tag-version "$1"

npm publish --tag="$tag"

cd native-package
npm publish --tag="$tag"


cd ../expo-package
npm publish --tag="$tag"