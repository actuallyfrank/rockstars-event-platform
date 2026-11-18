#!/usr/bin/env bash
# Stop hook (demo): run the unit tests when Claude thinks it is done.
#
#   exit 0 -> tests pass: Claude may stop, the systemMessage is shown to the user.
#   exit 2 -> tests fail; everything on stderr is fed back to Claude,
#             which keeps working until the tests pass.

cd "$CLAUDE_PROJECT_DIR" || exit 0

if output=$(NO_COLOR=1 pnpm test --project node 2>&1); then
  echo '{"systemMessage": "✅ Unit tests passed"}'
  exit 0
fi

{
  echo "Unit tests fail. Fix them before you stop. Test output:"
  echo "$output" | tail -n 100
} >&2
exit 2
