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

cd native-package
npm version --no-git-tag-version "$1"
sed -e 's|"stream-chat-react-native-core": "[^"]*"|"stream-chat-react-native-core": "'"$1"'"|g' -i.bak package.json
rm package.json.bak

cd ../expo-package
npm version --no-git-tag-version "$1"
sed -e 's|"stream-chat-react-native-core": "[^"]*"|"stream-chat-react-native-core": "'"$1"'"|g' -i.bak package.json
rm package.json.bak
cd ..
git add {expo,native}-package/package.json
#yarn docs
#git add docs
git add expo-package/yarn.lock
git add native-package/yarn.lock

npm version "$1" --force

npm publish --tag="$tag"

cd native-package
npm publish --tag="$tag"


cd ../expo-package
npm publish --tag="$tag"

git push --follow-tags