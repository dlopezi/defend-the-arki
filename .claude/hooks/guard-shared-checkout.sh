#!/bin/sh
# PreToolUse (Bash): several sessions share the main checkout. A git command that moves its
# branch or rewrites its files there (checkout, switch, rebase, merge, reset, pull, stash,
# cherry-pick) asks the user first. The same command inside a linked worktree runs freely.
input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')
cwd=$(printf '%s' "$input" | jq -r '.cwd // ""')

printf '%s' "$cmd" | grep -Eq '(^|[;&|(][[:space:]]*)git[[:space:]]([^;&|]*[[:space:]])?(checkout|switch|rebase|merge|reset|pull|stash|cherry-pick)([[:space:]]|$)' || exit 0

# Where the command runs: git -C <dir>, else the first cd <dir>, else the session cwd.
dir=$(printf '%s' "$cmd" | sed -nE 's/.*git[[:space:]]+-C[[:space:]]+"?([^" ]+).*/\1/p' | head -1)
[ -z "$dir" ] && dir=$(printf '%s' "$cmd" | sed -nE 's/^[[:space:]]*cd[[:space:]]+"?([^" ;&]+).*/\1/p' | head -1)
[ -z "$dir" ] && dir=$cwd
case $dir in /*) ;; *) dir="$cwd/$dir" ;; esac

gitdir=$(cd "$dir" 2>/dev/null && git rev-parse --absolute-git-dir 2>/dev/null) || exit 0
common=$(cd "$dir" && cd "$(git rev-parse --git-common-dir)" && pwd -P)
[ "$(cd "$gitdir" && pwd -P)" = "$common" ] || exit 0 # linked worktree: fine

jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "ask",
  permissionDecisionReason: "This git command changes the main checkout, which other sessions share. Use a worktree for feature work (see CLAUDE.md, Git Flow)."}}'
