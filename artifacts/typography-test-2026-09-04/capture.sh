#!/usr/bin/env bash
set -euo pipefail

session_name="keepinghaus-type-test"
base_url="http://127.0.0.1:4179"
output_dir="artifacts/typography-test-2026-09-04/screenshots"

if (( $# > 0 )); then
  conditions=("$@")
else
  conditions=(charter untitled-serif untitled-sans browser-serif)
fi
pages=(index personal-folklore look-at-this links now)
paths=("" personal-folklore.html look-at-this.html links.html now.html)

mkdir -p "$output_dir"

capture_set() {
  local viewport_name="$1"
  local viewport_width="$2"
  local viewport_height="$3"
  local condition page path output

  agent-browser --session "$session_name" set viewport "$viewport_width" "$viewport_height" >/dev/null

  for condition in "${conditions[@]}"; do
    for index in "${!pages[@]}"; do
      page="${pages[$index]}"
      path="${paths[$index]}"
      output="$output_dir/${condition}-${page}-${viewport_name}.png"
      agent-browser --session "$session_name" open "$base_url/$condition/$path" >/dev/null
      agent-browser --session "$session_name" wait 1000 >/dev/null
      agent-browser --session "$session_name" screenshot --full "$output" >/dev/null
      printf 'captured %s\n' "$output"
    done
  done
}

capture_set desktop 1280 800
capture_set mobile 390 844

agent-browser --session "$session_name" close >/dev/null
