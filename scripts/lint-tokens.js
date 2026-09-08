#!/usr/bin/env node
/**
 * lint-tokens — catch dlite token names the package does not ship.
 *
 * WHY THIS EXISTS
 * A token name that does not resolve is `undefined`, and React Native drops an
 * `undefined` style declaration SILENTLY. Nothing throws, nothing warns, and
 * the style simply never applies.
 *
 * `domains/Offline/index.js` styled its card with
 * `tkDliteSemanticColorSurface` and `tkDliteSemanticBorderRadiusMedium`.
 * Neither exists — the real names are `...SurfaceBase` and `...RadiusMd` — so
 * the card had no background and no rounded corners for as long as the screen
 * had existed, and the unit tests were green the whole time. They pass because
 * `__mocks__/styleDictionaryTokens.js` ships names the real package does not.
 *
 * A green test is therefore not proof a token exists. This is.
 */
const fs = require("fs");
const path = require("path");

// These files DEFINE or stub token names. Measuring them against the package
// would flag the definitions themselves.
const SKIP_FILES = [
  "modules/theme/tokens.js",
  "__mocks__/styleDictionaryTokens.js",
  // This linter's own test fixtures are deliberately invalid names.
  "scripts/__tests__/lint-tokens.test.js",
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "coverage",
  "ios",
  "android",
  ".expo",
]);

const DEFAULT_ROOTS = ["domains", "modules", "impacto-design-system", "context"];

const loadKnownTokens = () => {
  // eslint-disable-next-line global-require, import/no-unresolved
  const pkg = require("style-dictionary-dlite-tokens/rn/puente/default");
  return new Set(Object.keys(pkg.light));
};

const jsFilesIn = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return SKIP_DIRS.has(entry.name) ? [] : jsFilesIn(full);
    }
    return entry.name.endsWith(".js") ? [full] : [];
  });

const lintTokens = (dir, { known } = {}) => {
  const names = known || loadKnownTokens();
  return jsFilesIn(dir).flatMap((full) => {
    const rel = path.relative(dir, full);
    if (SKIP_FILES.some((skip) => rel === skip || rel.endsWith(skip))) return [];
    return fs
      .readFileSync(full, "utf8")
      .split("\n")
      .flatMap((line, i) =>
        // A line may deliberately PROBE a name the package does not ship and
        // compose a fallback when it is absent (see modules/theme/index.js).
        // That is the prescribed way to cope with a missing token, so it opts
        // out explicitly rather than being guessed at.
        line.includes("dlite-optional")
          ? []
          : [...line.matchAll(/tkDlite[A-Za-z0-9]*/g)]
          .map((match) => match[0])
          .filter((token) => !names.has(token))
          .map((token) => ({ file: rel, line: i + 1, token }))
      );
  });
};

const main = () => {
  const root = process.cwd();
  const known = loadKnownTokens();
  const findings = DEFAULT_ROOTS.filter((d) =>
    fs.existsSync(path.join(root, d))
  ).flatMap((d) =>
    lintTokens(path.join(root, d), { known }).map((f) => ({
      ...f,
      file: path.join(d, f.file),
    }))
  );

  if (!findings.length) {
    console.log("token lint: all dlite token names resolve");
    return 0;
  }
  console.log(`token lint: ${findings.length} unresolvable token name(s)\n`);
  findings.forEach((f) => {
    console.log(`  ${f.file}:${f.line} — ${f.token}`);
  });
  console.log(
    "\nThese resolve to undefined and the style is dropped silently." +
      "\nCheck the real package, not __mocks__/styleDictionaryTokens.js."
  );
  return 1;
};

module.exports = { lintTokens, loadKnownTokens };

if (require.main === module) process.exit(main());
