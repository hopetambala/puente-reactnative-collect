#!/usr/bin/env node
/**
 * Refuse to start a Maestro run while another one holds the simulator.
 *
 * Two `maestro test` processes cannot share a device: each starts its own
 * XCUITest driver, and the second tears down the first one's. The symptom is
 * not an error that names the cause -- flows die mid-subflow with no assertion
 * failure, at a DIFFERENT step each time, which reads exactly like a flaky app
 * or a degraded simulator.
 *
 * On 2026-09-11 a batch that a stop command reported as stopped kept running
 * for eight hours; a second batch was started alongside it, and hours went into
 * chasing a regression that did not exist. This is the guard for that.
 *
 * Wired into the `maestro` yarn script, so it runs before every flow.
 */

/**
 * A run that is (or is about to be) driving the device.
 *
 * Matches what `ps` ACTUALLY shows, which is not "maestro test":
 *
 *   java -classpath ~/.maestro/lib/* maestro.cli.AppKt test -e ... flow.yaml
 *   node .../bin/yarn maestro .maestro/offline-sync.yaml
 *
 * The first version of this guard matched an invented "maestro test" string and
 * silently found nothing. Both real shapes are covered by tests.
 */
const MAESTRO_RUN = /(^|[/\s])maestro(\.jar|\.cli\.AppKt)?['"]?\s+test(\s|$)/;
const YARN_MAESTRO = /\byarn\s+maestro(\s|$)/;

/**
 * PIDs of other Maestro runs. Deliberately narrow: matching "maestro" anywhere
 * would flag editor helpers that merely carry MAESTRO_HOME in their
 * environment, and `maestro hierarchy`, which inspects without driving a flow.
 */
function findConflictingMaestroRuns(psOutput, excludePids) {
  if (!psOutput || typeof psOutput !== "string") return [];

  // Accepts a single pid or a list. The list form carries this process's whole
  // ancestor chain: the preflight is launched BY `yarn maestro`, so its parent
  // always matches, and counting it would refuse every run.
  const excluded = new Set(
    (Array.isArray(excludePids) ? excludePids : [excludePids]).map(Number)
  );

  return psOutput
    .split("\n")
    .map((raw) => {
      const line = raw.trim();
      const match = line.match(/^(\d+)\s+(.*)$/);
      if (!match) return null;
      return { pid: Number(match[1]), command: match[2] };
    })
    .filter(Boolean)
    .filter(({ pid, command }) => {
      if (excluded.has(pid)) return false;
      // The shell that is about to exec maestro, and this preflight itself,
      // are not conflicts -- counting them would refuse every run.
      if (command.includes("maestro-preflight")) return false;
      if (/^\/bin\/(sh|zsh|bash)\s+-c\s/.test(command)) return false;
      if (/\bgrep\b/.test(command)) return false;
      return MAESTRO_RUN.test(command) || YARN_MAESTRO.test(command);
    })
    .map(({ pid }) => pid);
}

function formatConflictMessage(pids) {
  return [
    "",
    "  Another Maestro run already holds the simulator.",
    "",
    `  PID(s): ${pids.join(", ")}`,
    "",
    "  Two runs cannot share a device: each starts its own XCUITest driver and",
    "  the second tears down the first. Flows then die mid-subflow with no",
    "  assertion failure, at a different step each time, which looks like app",
    "  flakiness and is not.",
    "",
    "  Wait for it to finish, or stop it by PID:",
    "",
    `      kill -9 ${pids.join(" ")}`,
    "",
    "  Do NOT `pkill -f maestro` -- that also kills the run you want to keep.",
    "",
  ].join("\n");
}

module.exports = { findConflictingMaestroRuns, formatConflictMessage, MAESTRO_RUN };

if (require.main === module) {
  const { execSync } = require("child_process"); // eslint-disable-line global-require
  let ps = "";
  try {
    ps = execSync("ps -Ao pid=,command=", { encoding: "utf8" });
  } catch (error) {
    // Never block a run because the check itself failed.
    process.exit(0);
  }
  // Walk up the parent chain so the `yarn maestro` wrapper that launched this
  // preflight is not mistaken for a competing run.
  const ancestors = [process.pid];
  try {
    let pid = process.ppid;
    for (let depth = 0; pid && pid > 1 && depth < 12; depth += 1) {
      ancestors.push(pid);
      const parent = execSync(`ps -o ppid= -p ${pid}`, { encoding: "utf8" }).trim();
      pid = Number(parent);
    }
  } catch (error) {
    // A truncated chain only makes the guard stricter, never wrong-headed.
  }

  const conflicts = findConflictingMaestroRuns(ps, ancestors);
  if (conflicts.length) {
    process.stderr.write(formatConflictMessage(conflicts));
    process.exit(1);
  }
  process.exit(0);
}
