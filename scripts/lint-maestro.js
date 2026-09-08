#!/usr/bin/env node
/**
 * Lint the Maestro E2E flows in `.maestro/`.
 *
 * WHY THIS EXISTS
 * The suite drifted into 731 steps that tapped the tab bar by screen
 * percentage and almost never asserted anything. The visible cost:
 * `authenticated.yaml` tapped "70%, 94%" believing it was the Assets tab,
 * screenshotted the Offline sync screen as `07-assets.png`, and passed green
 * on every run for the life of the flow. A coordinate tap cannot fail, and a
 * screenshot never fails, so nothing in the suite was in a position to notice.
 *
 * These rules keep that from growing back.
 */
const fs = require("fs");
const path = require("path");

const APP_ID = "io.ionic.starter1270348";

// Only the tab bar sits in the bottom ~10% of the screen. Coordinate taps
// higher up are still targeting in-form controls that have no stable id yet,
// so they are out of scope for this rule.
const TAB_BAR_TAP = /point:\s*"\d+%,\s*9\d(?:\.\d+)?%"/;

const ASSERTION = /(assertVisible|assertNotVisible|assertTrue|extendedWaitUntil)/;
const RUN_FLOW_INLINE = /^\s*-\s*runFlow:\s*(\S+\.yaml)\s*$/gm;
const RUN_FLOW_FILE = /^\s*file:\s*(\S+\.yaml)\s*$/gm;

const listFlows = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFlows(full);
      return entry.name.endsWith(".yaml") ? [full] : [];
    })
    .sort();

// matchAll works from a fresh internal cursor, so the module-level /g regexes
// need no lastIndex bookkeeping here.
const subflowRefs = (src) =>
  [RUN_FLOW_INLINE, RUN_FLOW_FILE].flatMap((re) =>
    Array.from(src.matchAll(re), (m) => m[1])
  );

/**
 * True if the flow asserts, or if any subflow it calls does.
 * `authenticated.yaml` delegates every check to `subflows/open-tab.yaml`; that
 * is asserted behavior, not a silent flow.
 */
const assertsAnywhere = (full, seen = new Set()) => {
  const key = path.resolve(full);
  if (seen.has(key) || !fs.existsSync(key)) return false;
  seen.add(key);

  const src = fs.readFileSync(key, "utf8");
  if (ASSERTION.test(src)) return true;

  return subflowRefs(src).some((ref) =>
    assertsAnywhere(path.resolve(path.dirname(key), ref), seen)
  );
};

const lintFlow = (dir, full) => {
  const file = path.relative(dir, full).split(path.sep).join("/");
  const src = fs.readFileSync(full, "utf8");
  const findings = [];
  const add = (rule, message) => findings.push({ file, rule, message });

  // A subflow is a reusable fragment; it is allowed to be pure setup.
  const isSubflow = file.startsWith("subflows/");

  const appIdMatch = src.match(/^appId:\s*(\S+)/m);
  if (!appIdMatch) {
    add("wrong-app-id", "no appId header");
  } else if (appIdMatch[1] !== APP_ID) {
    add("wrong-app-id", `appId is "${appIdMatch[1]}", expected "${APP_ID}"`);
  }

  src.split("\n").forEach((line, i) => {
    if (TAB_BAR_TAP.test(line)) {
      add(
        "tab-coordinate-tap",
        `line ${i + 1}: tab bar tapped by coordinate — use subflows/open-tab.yaml, ` +
          "which taps by testID and asserts the destination"
      );
    }
  });

  if (!isSubflow && !assertsAnywhere(full)) {
    add(
      "no-assertion",
      "flow never asserts, directly or via a subflow — a run that navigates " +
        "nowhere would still pass"
    );
  }

  // runFlow paths resolve relative to the referencing file's directory.
  new Set(subflowRefs(src)).forEach((ref) => {
    if (!fs.existsSync(path.resolve(path.dirname(full), ref))) {
      add("missing-subflow", `runFlow references "${ref}", which does not exist`);
    }
  });

  return findings;
};

function lintFlows(dir) {
  if (!fs.existsSync(dir)) return [];
  return listFlows(dir).flatMap((full) => lintFlow(dir, full));
}

module.exports = { lintFlows, APP_ID };

if (require.main === module) {
  const target = process.argv[2] || path.join(__dirname, "..", ".maestro");
  const findings = lintFlows(target);

  if (findings.length === 0) {
    console.log(`maestro lint: ${listFlows(target).length} flow(s) clean`);
  } else {
    let current = null;
    findings.forEach((f) => {
      if (f.file !== current) {
        current = f.file;
        console.error(`\n  ${current}`);
      }
      console.error(`    [${f.rule}] ${f.message}`);
    });
    console.error(`\nmaestro lint: ${findings.length} finding(s)\n`);
    process.exitCode = 1;
  }
}
