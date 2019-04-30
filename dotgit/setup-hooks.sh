#!/usr/bin/env bash
# based on http://stackoverflow.com/a/3464399/1383268
# assumes that the hooks-wrapper script is located at <repo-root>/bin/git/hooks-wrapper

HOOK_NAMES="applypatch-msg pre-applypatch post-applypatch pre-commit prepare-commit-msg commit-msg post-commit pre-rebase post-checkout post-merge pre-receive update post-receive post-update pre-auto-gc pre-push"
# find gits native hooks folder
HOOKS_DIR=$(git rev-parse --show-toplevel)/.git/hooks

for hook in $HOOK_NAMES; do
    # If the hook already exists, is a file, and is not a symlink
    if [ ! -h $HOOKS_DIR/$hook ] && [ -f $HOOKS_DIR/$hook ]; then
        mv $HOOKS_DIR/$hook $HOOKS_DIR/$hook.local
    fi
    # create the symlink, overwriting the file if it exists
    # probably the only way this would happen is if you're using an old version of git
    # -- back when the sample hooks were not executable, instead of being named ____.sample
    ln -s -f ../../dotgit/hooks-wrapper $HOOKS_DIR/$hook
done