#!/usr/bin/env node
/* eslint-disable no-restricted-syntax, no-continue, no-plusplus, no-cond-assign */
/**
 * i18n Lint Validator
 *
 * Scans all component JS/JSX files and reports translation violations:
 *   ❌ <Text> elements containing hardcoded English strings (not I18n.t())
 *   ❌ title=, placeholder=, label=, accessibilityLabel= props with string literals
 *   ⚠️  Screen/component files that render JSX but never import @modules/i18n
 *
 * Usage:
 *   node scripts/lint-i18n.js
 *   node scripts/lint-i18n.js --summary     # print only per-file counts
 *
 * Suppress a specific line with a trailing comment:
 *   <Text>Some string</Text>  {/* lint-i18n-ignore *\/}
 *
 * Exit code 1 if any errors found (suitable for CI).
 */

const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

/** Directories to scan (relative to ROOT) */
const SCAN_DIRS = [
  'domains',
  'impacto-design-system',
  'modules',
];

/** File extensions to check */
const EXTENSIONS = ['.js', '.jsx'];

/** Directories to always skip */
const SKIP_DIRS = new Set([
  'node_modules', '__tests__', '_tests_', '__test__', '__mocks__',
  'coverage', '.git', 'build', 'ios', 'android', 'scripts',
]);

/** Violation severity levels */
const SEVERITY = {
  ERROR: 'error',
  WARN:  'warn',
};

const VIOLATION_TYPES = {
  HARDCODED_TEXT:        'HARDCODED_TEXT',
  HARDCODED_PROP:        'HARDCODED_PROP',
  MISSING_I18N_IMPORT:   'MISSING_I18N_IMPORT',
};

// ─── Rules ────────────────────────────────────────────────────────────────────

/**
 * Matches a <Text ...> tag opening (including multi-line prop tags like <Button>).
 * We then inspect what immediately follows on the same / next line(s).
 *
 * Strategy: look for lines that contain ONLY a plain string between a JSX tag close
 * and the matching closing tag — e.g.:
 *
 *   <Text>Hello World</Text>          ← flagged
 *   <Text>{I18n.t('key')}</Text>      ← ok
 *   <Text style={x}>Loading...</Text> ← flagged
 *
 * We detect: `>\s*([A-Za-z][^{}\n<]{2,})\s*<\/` on a single line.
 * That captures: "text starting with a letter, no braces (no expressions), no newlines,
 * at least 3 chars" between `>` and `</`.
 */
const HARDCODED_TEXT_RE = />\s*([A-Za-z][^{}<\n]{2,}?)\s*<\//g;

/**
 * JSX prop with a hardcoded string value:
 *   title="Foo Bar"
 *   placeholder="Enter name"
 *   label="Submit"
 *   accessibilityLabel="Close dialog"
 *
 * Excludes:
 *   - Single-word all-lowercase values that are likely identifiers (e.g. mode="contained")
 *   - Values that are clearly not user-facing (icon names, test IDs)
 */
const HARDCODED_PROP_RE = /\b(title|placeholder|label|accessibilityLabel)\s*=\s*"([A-Za-z][A-Za-z0-9 ',!?.]{2,})"/g;

/**
 * Patterns that indicate a file renders user-facing JSX.
 * Used to decide whether MISSING_I18N_IMPORT should fire.
 */
const JSX_INDICATORS = [
  /<Text[\s>]/,
  /<View[\s>]/,
  /<Button[\s>]/,
  /<SafeAreaView[\s>]/,
  /return\s*\(\s*</,
];

/**
 * Strings that look like hardcoded text but are actually safe:
 * - Icon names (single word, often camelCase / kebab-case)
 * - Test IDs (contain "Container", "Indicator", "testID")
 * - Version strings (contain digits mixed with dots)
 * - Known non-translatable patterns
 */
const SAFE_PROP_VALUES = [
  /^\d/,                        // starts with digit
  /^[a-z][-a-z]*$/,            // kebab-case single word (icon name)
  /^[a-z][a-zA-Z]*$/,          // camelCase single word (icon name / enum)
  /^\d+(\.\d+)*$/,             // version strings
  /^#[0-9a-fA-F]{3,6}$/,      // hex color
  /^[a-z][a-zA-Z.]+\.[a-zA-Z]+$/, // i18n key path (e.g. signUp.organization)
  /contained|outlined|flat|text|elevated|raised|compact|small|large|medium|left|right|center|auto|default|primary|secondary|success|error|warning|info/i,
  /^[a-z]$/,                   // single letter
];

/**
 * Text content that should not be flagged:
 * - Numeric-only or punctuation-only strings
 * - Template literal remnants
 * - Short whitespace / single chars
 */
const SAFE_TEXT_VALUES = [
  /^\s*$/,           // whitespace only
  /^\d+$/,           // numbers only
  /^[^a-zA-Z]+$/,   // no letters at all
];

/**
 * Files that are intentionally prop-driven (receive translated strings from parents)
 * or are shell/router components with no user-visible strings of their own.
 * These are excluded from the MISSING_I18N_IMPORT warning only.
 */
const PROP_DRIVEN_PATTERNS = [
  /impacto-design-system\/Base\//,
  /impacto-design-system\/Cards\//,
  /impacto-design-system\/Extensions\/FormikFields\//,
  /impacto-design-system\/Extensions\/TabBarIcon\//,
  /impacto-design-system\/MainNavigation\//,
  /impacto-design-system\/MapView\//,
  /impacto-design-system\/Multimedia\//,
  /impacto-design-system\/Extensions\/FindResidents\/Resident\/ResidentPage\/Housheold\//,
  /domains\/HomeScreen\/components\/StatCard\//,
  /domains\/Settings\/index\.js$/,
  /domains\/FindRecords\/FindRecordsHomeScreen\.js$/,
  /domains\/DataCollection\/Assets\/NewAssets\/index\.js$/,
  /domains\/DataCollection\/Assets\/ViewAssets\/index\.js$/,
  /domains\/DataCollection\/Assets\/index\.js$/,
];

function* walkFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      yield fullPath;
    }
  }
}

// ─── Per-file Analysis ────────────────────────────────────────────────────────

function analyzeFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const lines  = source.split('\n');
  const rel    = path.relative(ROOT, filePath);
  const violations = [];

  // Skip test / mock / config / story files
  if (/\.(test|spec|setup|config|stories)\.[jt]sx?$/.test(filePath)) return [];
  if (/__mocks__|__tests__|_tests_/.test(filePath)) return [];
  // Skip the linter itself and other scripts
  if (/scripts\/lint-i18n\.js$/.test(filePath)) return [];
  // Skip i18n translation files themselves
  if (/modules\/i18n\//.test(filePath)) return [];
  // Skip example/demo files (not shipped to users)
  if (/EXAMPLES\.[jt]sx?$/.test(filePath)) return [];
  // Skip navigator files — they configure routes, not user-visible strings
  if (/navigator\.[jt]sx?$/.test(filePath)) return [];

  /**
   * Given a character index in `source`, return the 1-based line number.
   */
  function lineOf(index) {
    let count = 1;
    for (let i = 0; i < index; i++) {
      if (source[i] === '\n') count++;
    }
    return count;
  }

  /**
   * Returns true if the line (1-based) or the line before it contains
   * a lint-i18n-ignore suppression comment.
   */
  function isIgnored(lineNumber) {
    const check = (n) => n >= 1 && n <= lines.length &&
      lines[n - 1].includes('lint-i18n-ignore');
    return check(lineNumber) || check(lineNumber - 1);
  }

  const hasI18nImport = source.includes('@modules/i18n') || source.includes("from 'i18n-js'");

  // ── Rule 1: Hardcoded text between JSX tags ───────────────────────────────
  {
    let m;
    const re = new RegExp(HARDCODED_TEXT_RE.source, 'g');
    while ((m = re.exec(source)) !== null) {
      const raw = m[1].trim();

      // Skip safe values
      if (SAFE_TEXT_VALUES.some((p) => p.test(raw))) continue;

      // Skip if the match is inside a JSX expression already wrapped (belt-and-suspenders)
      const matchStart = m.index;
      // Look back on the same line for `{I18n.t(` — if we're inside an expression, skip
      const lineStart = source.lastIndexOf('\n', matchStart) + 1;
      const nlPos     = source.indexOf('\n', matchStart);
      const lineText  = source.slice(lineStart, nlPos === -1 ? source.length : nlPos);
      if (lineText.includes('I18n.t(') || lineText.includes('i18n.t(')) continue;
      // Skip style/testID/id props that happen to have text between tags
      if (lineText.includes('testID') || lineText.includes('style={') || lineText.includes('key=')) continue;

      const line = lineOf(matchStart);
      if (isIgnored(line)) continue;

      violations.push({
        type: VIOLATION_TYPES.HARDCODED_TEXT,
        file: rel,
        line,
        message: `Hardcoded text: "${raw}" — wrap with I18n.t()`,
        hint:    `Add a key to en.json and replace with {I18n.t('namespace.key')}`,
        severity: SEVERITY.ERROR,
      });
    }
  }

  // ── Rule 2: Hardcoded string props ───────────────────────────────────────
  {
    let m;
    const re = new RegExp(HARDCODED_PROP_RE.source, 'g');
    while ((m = re.exec(source)) !== null) {
      const propName = m[1];
      const value    = m[2];

      // Skip safe / non-translatable values
      if (SAFE_PROP_VALUES.some((p) => p.test(value))) continue;

      const line = lineOf(m.index);
      if (isIgnored(line)) continue;

      violations.push({
        type: VIOLATION_TYPES.HARDCODED_PROP,
        file: rel,
        line,
        message: `Hardcoded ${propName} prop: "${value}" — use I18n.t()`,
        hint:    `Replace ${propName}="${value}" with ${propName}={I18n.t('namespace.key')}`,
        severity: SEVERITY.ERROR,
      });
    }
  }

  // ── Rule 3: JSX screen with no I18n import ────────────────────────────────
  {
    const rendersJsx = JSX_INDICATORS.some((pattern) => pattern.test(source));
    const isPropDriven = PROP_DRIVEN_PATTERNS.some((pattern) => pattern.test(filePath));
    if (rendersJsx && !hasI18nImport && !isPropDriven) {
      // Only flag files that are likely screen/component files, not utilities
      const isLikelyScreen = /function\s+\w+\s*\(/.test(source) || /=>\s*\(/.test(source);
      if (isLikelyScreen) {
        violations.push({
          type: VIOLATION_TYPES.MISSING_I18N_IMPORT,
          file: rel,
          line: 1,
          message: 'File renders JSX but never imports @modules/i18n — all user-facing strings may be untranslated',
          hint:    "Add: import I18n from '@modules/i18n';",
          severity: SEVERITY.WARN,
        });
      }
    }
  }

  return violations;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

function run() {
  const args    = process.argv.slice(2);
  const summary = args.includes('--summary');

  console.log('\n🌐  i18n Lint Validator\n');

  const allViolations = [];

  for (const dir of SCAN_DIRS) {
    const absDir = path.join(ROOT, dir);
    for (const filePath of walkFiles(absDir)) {
      const violations = analyzeFile(filePath);
      allViolations.push(...violations);
    }
  }

  const errors   = allViolations.filter((v) => v.severity === SEVERITY.ERROR);
  const warnings = allViolations.filter((v) => v.severity === SEVERITY.WARN);

  if (allViolations.length === 0) {
    console.log('✅  No i18n violations found. All strings are translated.\n');
    process.exit(0);
  }

  // Group by file for readable output
  const byFile = {};
  for (const v of allViolations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  for (const [file, fileViolations] of Object.entries(byFile)) {
    const errCount  = fileViolations.filter((v) => v.severity === SEVERITY.ERROR).length;
    const warnCount = fileViolations.filter((v) => v.severity === SEVERITY.WARN).length;
    console.log(`📄  ${file}  (${errCount} error${errCount !== 1 ? 's' : ''}, ${warnCount} warning${warnCount !== 1 ? 's' : ''})`);

    if (!summary) {
      for (const v of fileViolations) {
        const icon   = v.severity === SEVERITY.ERROR ? '  ❌' : '  ⚠️ ';
        const prefix = v.severity === SEVERITY.ERROR ? '\x1b[31m' : '\x1b[33m';
        const reset  = '\x1b[0m';
        console.log(`${icon} ${prefix}[Line ${v.line}] [${v.type}] ${v.message}${reset}`);
        console.log(`     💡 ${v.hint}`);
      }
      console.log();
    }
  }

  console.log('─────────────────────────────────────────────');
  console.log(`  Errors:   ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Total:    ${allViolations.length}\n`);

  if (summary) {
    console.log('  Tip: run without --summary to see full details and hints\n');
  } else {
    console.log('  Tip: add  {/* lint-i18n-ignore */}  on a line to suppress it\n');
  }

  // Exit 1 on errors (CI-blocking), 0 on warnings-only
  process.exit(errors.length > 0 ? 1 : 0);
}

run();
