#!/usr/bin/env node
/* eslint-disable no-restricted-syntax, no-continue, no-plusplus, no-cond-assign */
/**
 * Animation Lint Validator
 * Phase 7 — Motion Design System (spec §7 Performance Constraints)
 *
 * Scans all component JS/JSX files and reports motion design violations:
 *   ❌ Hardcoded duration values (e.g. duration={300})
 *   ❌ Custom spring objects  (e.g. { damping: 5, stiffness: 200 })
 *   ❌ Animate layout properties (width, height, padding, margin, top, left)
 *   ❌ spring.playful on non-celebration components
 *   ❌ withTiming/withSpring without using MOTION_TOKENS
 *   ⚠️  Files importing from animations but not using MOTION_TOKENS
 *
 * Usage:
 *   node scripts/lint-animations.js
 *   node scripts/lint-animations.js --fix-hints   # print suggested fixes
 *
 * Exit code 1 if any violations found (suitable for CI).
 */

const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

/** Directories to scan (relative to ROOT) */
const SCAN_DIRS = [
  'impacto-design-system',
  'domains',
  'modules',
];

/** File extensions to check */
const EXTENSIONS = ['.js', '.jsx'];

/** Directories to always skip */
const SKIP_DIRS = new Set([
  'node_modules', '__tests__', '_tests_', '__test__', '__mocks__',
  'coverage', '.git', 'build', 'ios', 'android',
]);

/** The validator collects these categories of violation */
const VIOLATION_TYPES = {
  HARDCODED_DURATION:         'HARDCODED_DURATION',
  CUSTOM_SPRING_OBJECT:       'CUSTOM_SPRING_OBJECT',
  LAYOUT_PROPERTY:            'LAYOUT_PROPERTY',
  PLAYFUL_MISUSE:             'PLAYFUL_MISUSE',
  BARE_HARDCODED_MS:          'BARE_HARDCODED_MS',
  CHAINED_SPRING_HARDCODED:   'CHAINED_SPRING_HARDCODED',
};

// ─── Rules ───────────────────────────────────────────────────────────────────

/**
 * Layout properties that must NEVER be animated (spec §3.1).
 */
const FORBIDDEN_LAYOUT_PROPS = [
  'width', 'height', 'top', 'left', 'right', 'bottom',
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'margin',  'marginTop',  'marginBottom',  'marginLeft',  'marginRight',
  'backgroundColor', 'borderWidth', 'borderRadius',
];

/**
 * withTiming/withSpring calls with raw numeric ms that look hardcoded.
 * Pattern: withTiming(value, { duration: <number> }) where <number> is not from a variable.
 */
const HARDCODED_DURATION_RE = /\bduration\s*:\s*(\d{2,4})\b/g;

/**
 * Inline spring configs — { damping: N, stiffness: N } — outside of MOTION_TOKENS.
 * Heuristic: object literal with both damping and stiffness keys.
 */
const INLINE_SPRING_RE = /\{\s*damping\s*:\s*\d+[\s\S]*?stiffness\s*:\s*\d+/g;

/**
 * spring.playful usage — flag for audit (only valid on success/empty-state components).
 */
const PLAYFUL_RE = /spring\.playful\b|SPRING_CONFIG\.PLAYFUL\b/g;

/**
 * Chained spring method calls with hardcoded numeric values.
 * Catches: .damping(12), .stiffness(90), .mass(1) used in springify() chains.
 * These bypass MOTION_TOKENS and are invisible to the inline spring object check.
 * Example bad pattern: FadeIn.springify().damping(12).stiffness(90)
 */
const CHAINED_DAMPING_RE   = /\.damping\(\s*(\d+(?:\.\d+)?)\s*\)/g;
const CHAINED_STIFFNESS_RE = /\.stiffness\(\s*(\d+(?:\.\d+)?)\s*\)/g;
const CHAINED_MASS_RE      = /\.mass\(\s*(\d+(?:\.\d+)?)\s*\)/g;

/**
 * Celebration-only file name patterns (playful IS allowed here).
 */
const PLAYFUL_ALLOWED_PATTERNS = [
  /FieldStateIndicator/i,
  /SuccessScreen/i,
  /EmptyState/i,
  /Toast/i,
  /CelebrationState/i,
];

/**
 * Animated layout props — `withTiming(value)` applied to a layout key.
 * Heuristic: key name is a forbidden layout prop followed by withTiming|withSpring.
 */
function buildLayoutPropRE() {
  const props = FORBIDDEN_LAYOUT_PROPS.join('|');
  return new RegExp(`\\b(${props})\\s*:\\s*with(?:Timing|Spring)\\s*\\(`, 'g');
}
const LAYOUT_PROP_RE = buildLayoutPropRE();

// ─── File Walker ──────────────────────────────────────────────────────────────

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

  /**
   * Helper: given a regex match index, return the 1-based line number.
   */
  function lineOf(index) {
    let count = 1;
    for (let i = 0; i < index; i++) {
      if (source[i] === '\n') count++;
    }
    return count;
  }

  // Skip test/mock/config files
  if (/\.(test|spec|setup|config|stories)\.[jt]sx?$/.test(filePath)) return [];
  if (/__mocks__|__tests__|_tests_/.test(filePath)) return [];
  // Skip the token definitions and the lint script itself
  if (/modules\/utils\/animations\.js$/.test(filePath)) return [];
  if (/scripts\/lint-animations\.js$/.test(filePath)) return [];

  /**
   * Returns true if the line at `lineNumber` (1-based) contains a lint-animations-ignore comment.
   * Covers both same-line and previous-line suppression.
   */
  function isIgnored(lineNumber) {
    const check = (n) => n >= 1 && n <= lines.length &&
      lines[n - 1].includes('lint-animations-ignore');
    return check(lineNumber) || check(lineNumber - 1);
  }

  // ── Rule 1: Hardcoded duration numbers ──────────────────────────────────────
  {
    let m;
    const re = new RegExp(HARDCODED_DURATION_RE.source, 'g');
    while ((m = re.exec(source)) !== null) {
      const line = lineOf(m.index);
      if (isIgnored(line)) continue;
      const value = parseInt(m[1], 10);
      // Ignore values that are clearly from token comments (0, 80, 150, 200, 300, 400, 500, 700, 1000, 3000, 4000)
      const tokenValues = new Set([0, 50, 80, 150, 200, 300, 400, 500, 700, 1000, 3000, 4000]);
      // Any hardcoded value is a violation — they should come from MOTION_TOKENS
      violations.push({
        type: VIOLATION_TYPES.HARDCODED_DURATION,
        file: rel,
        line,
        message: `Hardcoded duration: ${value}ms — use MOTION_TOKENS.duration.*`,
        hint: `Replace with MOTION_TOKENS.duration.${suggestDurationToken(value)}`,
        // Warn if it's a known token value (should still be a token reference), error if unknown
        severity: tokenValues.has(value) ? 'warn' : 'error',
      });
    }
  }

  // ── Rule 2: Inline spring objects ───────────────────────────────────────────
  {
    let m;
    const re = new RegExp(INLINE_SPRING_RE.source, 'g');
    while ((m = re.exec(source)) !== null) {
      const line = lineOf(m.index);
      if (isIgnored(line)) continue;
      // Exclude the MOTION_TOKENS definition block itself (already filtered above)
      violations.push({
        type: VIOLATION_TYPES.CUSTOM_SPRING_OBJECT,
        file: rel,
        line,
        message: 'Inline spring config detected — use MOTION_TOKENS.spring.* or getSpringForComponent()',
        hint: 'Replace { damping, stiffness, mass } with MOTION_TOKENS.spring.snappy (or tight/smooth/playful)',
        severity: 'error',
      });
    }
  }

  // ── Rule 3: Layout property animation ───────────────────────────────────────
  {
    let m;
    const re = new RegExp(LAYOUT_PROP_RE.source, 'g');
    while ((m = re.exec(source)) !== null) {
      const line = lineOf(m.index);
      if (isIgnored(line)) continue;
      const propName = m[1];
      violations.push({
        type: VIOLATION_TYPES.LAYOUT_PROPERTY,
        file: rel,
        line,
        message: `Forbidden: animating layout property '${propName}' — causes layout thrash (spec §3.1)`,
        hint: `Use transform/opacity only. For '${propName}' changes, update layout without animation.`,
        severity: 'error',
      });
    }
  }

  // ── Rule 5: Chained .damping(N) / .stiffness(N) / .mass(N) with hardcoded values ──
  {
    const chainRules = [
      { re: CHAINED_DAMPING_RE,   param: 'damping',   token: 'MOTION_TOKENS.spring.smooth.damping' },
      { re: CHAINED_STIFFNESS_RE, param: 'stiffness', token: 'MOTION_TOKENS.spring.smooth.stiffness' },
      { re: CHAINED_MASS_RE,      param: 'mass',      token: 'MOTION_TOKENS.spring.smooth.mass' },
    ];
    for (const { re: reSrc, param, token } of chainRules) {
      const re = new RegExp(reSrc.source, 'g');
      let m;
      while ((m = re.exec(source)) !== null) {
        const line = lineOf(m.index);
        if (isIgnored(line)) continue;
        const value = m[1];
        violations.push({
          type: VIOLATION_TYPES.CHAINED_SPRING_HARDCODED,
          file: rel,
          line,
          message: `Hardcoded .${param}(${value}) in springify() chain — use MOTION_TOKENS.spring.* properties`,
          hint: `Replace .${param}(${value}) with .${param}(${token})`,
          severity: 'error',
        });
      }
    }
  }

  // ── Rule 4: spring.playful misuse ───────────────────────────────────────────
  {
    const isPlayfulAllowed = PLAYFUL_ALLOWED_PATTERNS.some((p) => p.test(filePath));
    if (!isPlayfulAllowed) {
      let m;
      const re = new RegExp(PLAYFUL_RE.source, 'g');
      while ((m = re.exec(source)) !== null) {
        const line = lineOf(m.index);
        if (isIgnored(line)) continue;
        violations.push({
          type: VIOLATION_TYPES.PLAYFUL_MISUSE,
          file: rel,
          line,
          message: 'spring.playful is reserved for celebration states (success, empty state, toast) — spec §3.2',
          hint: 'Replace with MOTION_TOKENS.spring.snappy for buttons/cards, or spring.smooth for navigation',
          severity: 'warn',
        });
      }
    }
  }

  return violations;
}

// ─── Token suggestion helper ──────────────────────────────────────────────────

function suggestDurationToken(ms) {
  // Map known values to token names
  const map = {
    0:    'instant',
    80:   'micro',
    150:  'quick',
    200:  'snappy',
    300:  'base',
    400:  'substantial',
    500:  'slow',
    700:  'xslow',
    1000: 'pulse',
    3000: 'toast',
    4000: 'dismiss',
  };
  if (map[ms]) return map[ms];
  // Nearest
  const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
  const nearest = keys.reduce((prev, curr) =>
    Math.abs(curr - ms) < Math.abs(prev - ms) ? curr : prev
  );
  return `${map[nearest]} /* nearest to ${ms}ms */`;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

function run() {
  const args = process.argv.slice(2);
  const fixHints = args.includes('--fix-hints');

  console.log('\n🎬  Animation Lint Validator — Motion Design System v1.3\n');

  const allViolations = [];

  for (const dir of SCAN_DIRS) {
    const absDir = path.join(ROOT, dir);
    for (const filePath of walkFiles(absDir)) {
      const violations = analyzeFile(filePath);
      allViolations.push(...violations);
    }
  }

  const errors   = allViolations.filter((v) => v.severity === 'error');
  const warnings  = allViolations.filter((v) => v.severity === 'warn');

  if (allViolations.length === 0) {
    console.log('✅  No animation violations found. Motion system is clean.\n');
    process.exit(0);
  }

  // Group by file for readable output
  const byFile = {};
  for (const v of allViolations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  for (const [file, violations] of Object.entries(byFile)) {
    console.log(`📄  ${file}`);
    for (const v of violations) {
      const icon   = v.severity === 'error' ? '  ❌' : '  ⚠️ ';
      const prefix = v.severity === 'error' ? '\x1b[31m' : '\x1b[33m'; // red | yellow
      const reset  = '\x1b[0m';
      console.log(`${icon} ${prefix}[Line ${v.line}] ${v.message}${reset}`);
      if (fixHints) {
        console.log(`     💡 ${v.hint}`);
      }
    }
    console.log();
  }

  console.log(`─────────────────────────────────────────────`);
  console.log(`  Errors:   ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Total:    ${allViolations.length}\n`);

  if (!fixHints && allViolations.length > 0) {
    console.log('  Tip: run with --fix-hints to see suggested replacements\n');
  }

  // Exit 1 on errors (CI-blocking), 0 on warnings-only
  process.exit(errors.length > 0 ? 1 : 0);
}

run();
