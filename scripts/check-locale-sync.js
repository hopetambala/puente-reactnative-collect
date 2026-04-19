#!/usr/bin/env node
/* eslint-disable no-restricted-syntax, no-plusplus, no-var, prefer-template, prefer-arrow-callback, vars-on-top, no-param-reassign, consistent-return */
/**
 * Locale Sync Checker
 *
 * Compares all locale files against the English master (en.json) and reports:
 *   ❌ Keys present in en.json but missing from a locale file
 *   ⚠️  Keys present in a locale file but not in en.json (stale/orphaned)
 *   ⚠️  Keys whose translated value is identical to the English value (verbatim)
 *
 * Usage:
 *   node scripts/check-locale-sync.js
 *   node scripts/check-locale-sync.js --orphans    # also show orphaned keys
 *   node scripts/check-locale-sync.js --verbatim   # also show verbatim-English values
 *
 * Exit code 1 if any locale is missing keys (CI-compatible).
 */

const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const ROOT      = path.resolve(__dirname, '..');
const I18N_DIR  = path.join(ROOT, 'modules', 'i18n');
const EN_FILE   = path.join(I18N_DIR, 'english', 'en.json');

/** Additional locale files to check against en.json */
const LOCALES = [
  { code: 'es', file: path.join(I18N_DIR, 'spanish',  'es.json'), name: 'Spanish' },
  { code: 'hk', file: path.join(I18N_DIR, 'kreyol',   'hk.json'), name: 'Haitian Creole' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Recursively flatten a nested object into dot-notation key→value pairs.
 */
function flatPairs(obj, prefix) {
  prefix = prefix || '';
  return Object.keys(obj).reduce(function(acc, k) {
    var full = prefix ? prefix + '.' + k : k;
    var v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return acc.concat(flatPairs(v, full));
    }
    return acc.concat([[full, v]]);
  }, []);
}

/**
 * Recursively flatten a nested object into dot-notation keys only.
 */
function flatKeys(obj, prefix) {
  return flatPairs(obj, prefix).map(function(p) { return p[0]; });
}

/**
 * Values that are intentionally the same across all locales:
 * units, numeric ranges, proper nouns, phone formats, hex colors, etc.
 */
var INTENTIONALLY_SAME = [
  /^\d/,                          // starts with digit (phone formats, ranges)
  /^[°]|mm\s?Hg|mg\/dL|g\/dL/,  // medical units
  /^#[0-9a-fA-F]{3,6}$/,         // hex colors
  /^https?:\/\//,                 // URLs
  /^[A-Z]{1,5}$/,                 // acronyms (SMS, PIN, GPS, PDF)
  /^(Puente|Zinc|Hospital|Cinderblock|Marketplace|Workflows|Plan|Error)$/i,
  /^Puente\s+\d+/,              // branding with year e.g. "Puente 2020 |"
  /^(English|Spanish|Haitian Creole)$/i, // language names
  /^(---|\s*)$/,                  // separators / empty
];

function isIntentionallySame(value) {
  if (typeof value !== 'string' || value.length <= 3) return true;
  return INTENTIONALLY_SAME.some(function(p) { return p.test(value); });
}

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error('Failed to parse ' + filePath + ': ' + e.message);
    process.exit(1);
  }
}

/**
 * Recursively collect all .js/.jsx files under a directory.
 */
function collectSourceFiles(dir) {
  var results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach(function(entry) {
    var full = path.join(dir, entry);
    var stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) results = results.concat(collectSourceFiles(full));
    } else if (/\.(js|jsx)$/.test(entry)) {
      results.push(full);
    }
  });
  return results;
}

var SKIP_DIRS = new Set([
  'node_modules', '__tests__', '_tests_', '__test__', '__mocks__',
  'coverage', '.git', 'build', 'ios', 'android', 'scripts',
]);

var SOURCE_DIRS = ['domains', 'impacto-design-system', 'modules', 'context'];

/**
 * Scan source files for I18n.t("key") calls and return keys not in en.json.
 */
function findUndefinedI18nKeys(enKeys) {
  var I18N_CALL = /I18n\.t\(\s*["']([^"']+)["']/g;
  var missing = {};

  SOURCE_DIRS.forEach(function(dir) {
    collectSourceFiles(path.join(ROOT, dir)).forEach(function(file) {
      var src = fs.readFileSync(file, 'utf8');
      I18N_CALL.lastIndex = 0;
      var match = I18N_CALL.exec(src);
      while (match !== null) {
        var key = match[1];
        if (!enKeys.has(key)) {
          if (!missing[key]) missing[key] = [];
          missing[key].push(path.relative(ROOT, file));
        }
        match = I18N_CALL.exec(src);
      }
    });
  });

  return missing;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

function run() {
  var args        = process.argv.slice(2);
  var showOrphans = args.includes('--orphans');
  var showVerbatim = args.includes('--verbatim');

  console.log('\n\uD83C\uDF10  Locale Sync Checker\n');

  var en      = loadJson(EN_FILE);
  var enKeys  = new Set(flatKeys(en));
  var enPairs = Object.fromEntries(flatPairs(en));

  var totalMissing = 0;
  var totalOrphans = 0;
  var totalVerbatim = 0;

  LOCALES.forEach(function(locale) {
    var data       = loadJson(locale.file);
    var localePairs = Object.fromEntries(flatPairs(data));
    var localeKeys  = new Set(Object.keys(localePairs));

    var missing = [...enKeys].filter(function(k) { return !localeKeys.has(k); });
    var orphans = showOrphans
      ? [...localeKeys].filter(function(k) { return !enKeys.has(k); })
      : [];
    var verbatim = showVerbatim
      ? [...enKeys].filter(function(k) {
          return localeKeys.has(k) &&
            localePairs[k] === enPairs[k] &&
            !isIntentionallySame(enPairs[k]);
        })
      : [];

    totalMissing  += missing.length;
    totalOrphans  += orphans.length;
    totalVerbatim += verbatim.length;

    var rel    = path.relative(ROOT, locale.file);
    var status = missing.length === 0 ? '\u2705' : '\u274C';
    var counts = 'Missing: ' + missing.length;
    if (showOrphans)  counts += ' | Orphaned: ' + orphans.length;
    if (showVerbatim) counts += ' | Verbatim: ' + verbatim.length;

    console.log(status + '  ' + locale.name + ' (' + rel + ')');
    console.log('     ' + counts);

    if (missing.length > 0) {
      missing.forEach(function(k) {
        console.log('     \x1b[31m\u274C missing:\x1b[0m ' + k);
      });
    }
    if (showOrphans && orphans.length > 0) {
      orphans.forEach(function(k) {
        console.log('     \x1b[33m\u26A0\uFE0F  orphan:\x1b[0m  ' + k);
      });
    }
    if (showVerbatim && verbatim.length > 0) {
      verbatim.forEach(function(k) {
        console.log('     \x1b[33m\u26A0\uFE0F  verbatim:\x1b[0m ' + k + ' = "' + String(enPairs[k]).slice(0, 50) + '"');
      });
    }

    console.log();
  });

  console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log('  Total missing keys:  ' + totalMissing);
  if (showOrphans)  console.log('  Total orphaned keys: ' + totalOrphans);
  if (showVerbatim) console.log('  Total verbatim:      ' + totalVerbatim);
  console.log();

  var hasFailures = totalMissing > 0 || (showVerbatim && totalVerbatim > 0);

  // ── Code scan: I18n.t() keys not defined in en.json ──────────────────────
  console.log('\uD83D\uDD0D  Scanning source files for undefined I18n.t() keys...\n');
  var undefinedKeys = findUndefinedI18nKeys(enKeys);
  var undefinedCount = Object.keys(undefinedKeys).length;

  if (undefinedCount === 0) {
    console.log('\u2705  All I18n.t() keys are defined in en.json.\n');
  } else {
    hasFailures = true;
    console.log('\u274C  ' + undefinedCount + ' key(s) used in code but missing from en.json:\n');
    Object.keys(undefinedKeys).sort().forEach(function(key) {
      console.log('     \x1b[31m\u274C undefined:\x1b[0m ' + key);
      undefinedKeys[key].slice(0, 3).forEach(function(f) {
        console.log('        \u2514 ' + f);
      });
    });
    console.log();
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (!hasFailures) {
    var tips = [];
    if (!showOrphans)  tips.push('--orphans');
    if (!showVerbatim) tips.push('--verbatim');
    console.log('\u2705  All locale files are in sync with en.json.\n');
    if (tips.length) console.log('  Tip: run with ' + tips.join(' ') + ' for additional checks\n');
    process.exit(0);
  } else {
    if (!showOrphans || !showVerbatim) {
      var hints = [];
      if (!showOrphans)  hints.push('--orphans');
      if (!showVerbatim) hints.push('--verbatim');
      console.log('  Tip: run with ' + hints.join(' ') + ' for additional checks\n');
    }
    process.exit(1);
  }
}

run();
