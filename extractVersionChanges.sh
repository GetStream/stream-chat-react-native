#!/bin/sh

extractLastVersion () {
    PACKAGE_NAME=$(cat "$(dirname $1)/package.json" \
        | grep name \
        | head -1 \
        | awk -F: '{ print $2 }' \
        | sed 's/[",]//g')
    PACKAGE_CHANGES="$(awk '/## \[/ { if (p) { exit }; p=1 } p' "$1")"
    echo "#$PACKAGE_NAME"
    echo ""
    echo "$PACKAGE_CHANGES"
    echo ""

}

CHANGELOG_PREVIEW=$(git diff --name-only "*CHANGELOG.md" | while read file; do extractLastVersion "$file"; done)
if [[ ! -z "${CHANGELOG_PREVIEW}" ]]; then
    echo "# Change Log Preview"
    echo ""
    echo "Once this pull request gets merged the following release candidates will be created:"
    echo ""
    echo "$CHANGELOG_PREVIEW"
    echo ""
fi
