#!/usr/bin/env bash

set -e

if ! yarn run lint; then
    yarn run lint-fix
    echo "some files were not formatted correctly (prettier/eslint) commit aborted!"
    echo "your changes are still staged, you can accept formatting changes with git add or ignore them by adding --no-verify to git commit"
    exit 1
fi
