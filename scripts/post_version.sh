cd $(dirname "${BASH_SOURCE[0]}")

PACKAGE_VERSION=`awk -F \" '/"version": ".+"/ { print $4; exit; }' ../package.json`

echo "{\n  \"version\": \"$PACKAGE_VERSION\"\n}" > ../src/version.json