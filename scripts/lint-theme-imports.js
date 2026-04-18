#!/usr/bin/env node
/* eslint-disable no-restricted-syntax, no-continue, no-plusplus */
/**
 * Theme Import Linter — Prevent Dark Mode Bugs
 *
 * Scans all component files and reports violations:
 *   ❌ Static theme imports: import { theme } from "@modules/theme"
 *
 * Why this matters:
 * Static theme exports are frozen at bundle time. In production builds,
 * colors imported from @modules/theme won't update when dark mode is toggled.
 *
 * Fix: Always use useTheme() hook from react-native-paper for dynamic theme support.
 *
 * Usage:
 *   node scripts/lint-theme-imports.js
 *
 * Exit code 1 if violations found (suitable for CI/CD).
 */

const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

/** Directories to scan */
const SCAN_DIRS = [
  'impacto-design-system',
  'domains',
  'modules',
];

/** File extensions to check */
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

/** Directories to skip */
const SKIP_DIRS = new Set([
  'node_modules', '__tests__', '_tests_', '__test__', '__mocks__',
  'coverage', '.git', 'build', 'ios', 'android',
]);

// ─── Rules ───────────────────────────────────────────────────────────────────

/**
 * Pattern: import { theme } from "@modules/theme"
 * Matches single-line and multi-line named imports that include `theme`.
 * The `s` flag makes `.` match newlines so multi-line imports are caught.
 */
const STATIC_THEME_IMPORT_RE = /import\s*\{[^}]*\btheme\b[^}]*\}\s*from\s+["']@modules\/theme["']/gs;

// ─── Utilities ───────────────────────────────────────────────────────────────

function walkDir(dir) {
  let files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(walkDir(fullPath));
      } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Silently skip unreadable directories
  }
  return files;
}

/**
 * Check a file for theme import violations.
 * Matches against full file content so multi-line imports are caught.
 */
function lintFile(filePath) {
  const violations = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    STATIC_THEME_IMPORT_RE.lastIndex = 0;
    let match = STATIC_THEME_IMPORT_RE.exec(content);
    while (match !== null) {
      // Compute line number from the match start index
      const lineNumber = content.slice(0, match.index).split('\n').length;
      violations.push({
        line: lineNumber,
        file: filePath,
        message: 'Static theme import detected. This is frozen at bundle time and won\'t update in production dark mode. Use useTheme() hook from react-native-paper instead.',
      });
      match = STATIC_THEME_IMPORT_RE.exec(content);
    }
  } catch (err) {
    // Silently skip unreadable files
  }

  return violations;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n🎨 Theme Import Linter — Checking for static theme imports...\n');

  const filesToCheck = [];
  for (const dir of SCAN_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (fs.existsSync(fullDir)) {
      filesToCheck.push(...walkDir(fullDir));
    }
  }

  let allViolations = [];
  for (const file of filesToCheck) {
    const violations = lintFile(file);
    allViolations = allViolations.concat(violations);
  }

  if (allViolations.length === 0) {
    console.log('✅ No theme import violations found!\n');
    process.exit(0);
  }

  // Group by file
  const byFile = {};
  allViolations.forEach((v) => {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  });

  // Print violations
  console.log(`❌ Found ${allViolations.length} violation(s):\n`);
  Object.entries(byFile).forEach(([file, violations]) => {
    const relFile = path.relative(ROOT, file);
    console.log(`${relFile}`);
    violations.forEach((v) => {
      console.log(`  Line ${v.line}: ${v.message}`);
    });
    console.log('');
  });

  console.log('Fix: Replace static theme imports with useTheme() hook from react-native-paper\n');
  process.exit(1);
}

main();
