#!/usr/bin/env bash
#
# Flakiness gate: run one Maestro flow N times and report its stability.
#
# WHY THIS EXISTS
# A flow that passes once has not been shown to be stable — it has been shown
# to pass once. Shopify rebuilt their mobile E2E framework around exactly this
# gap: their suite had decayed to 50% stability and was blocking more good PRs
# than it caught bugs, so new tests now have to survive repeated runs before
# they are allowed to block anything.
#
# Run a new or newly-edited flow through this before trusting it in the release
# gate. Anything under 100% over 5 runs is flaky; find out why before relying on
# it, because a flow that fails one run in five will eventually fail the run
# that matters and get dismissed as noise.
#
# Usage:
#   yarn maestro:stability .maestro/authenticated.yaml [runs]
#
# Prerequisites are the same as any flow: Metro running in the target
# environment, and the build under test installed on a booted simulator.
set -uo pipefail

FLOW="${1:-}"
RUNS="${2:-5}"

if [[ -z "$FLOW" ]]; then
  echo "usage: yarn maestro:stability <flow.yaml> [runs]" >&2
  exit 2
fi
if [[ ! -f "$FLOW" ]]; then
  echo "no such flow: $FLOW" >&2
  exit 2
fi

export JAVA_HOME=/opt/homebrew/opt/openjdk
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"

LOG_DIR=".maestro/.stability"
mkdir -p "$LOG_DIR"

pass=0
fail=0
failed_runs=()

echo "stability gate: $FLOW x${RUNS}"
echo

for ((i = 1; i <= RUNS; i++)); do
  log="$LOG_DIR/run-$i.log"
  printf '  run %d/%d ... ' "$i" "$RUNS"
  if maestro test -e PARSE_USERNAME="${PARSE_USERNAME:-Test}" \
                  -e PARSE_PASSWORD="${PARSE_PASSWORD:-test}" \
                  "$FLOW" >"$log" 2>&1; then
    echo "pass"
    pass=$((pass + 1))
  else
    echo "FAIL  (log: $log)"
    fail=$((fail + 1))
    failed_runs+=("$i")
  fi
done

pct=$(( pass * 100 / RUNS ))
echo
echo "  ${pass}/${RUNS} passed — ${pct}% stable"

if (( fail > 0 )); then
  echo "  failed runs: ${failed_runs[*]}"
  echo
  echo "  A flow that is not 100% stable is not ready to gate a release."
  echo "  Inspect the logs above before promoting it."
  exit 1
fi

echo "  stable — safe to use as a release gate"
