const fs = require('fs');
const os = require('os');
const path = require('path');

const { lintTokens } = require('@app/scripts/lint-tokens');

// A deliberately small stand-in for the real package, so the test asserts the
// RULE rather than the current contents of style-dictionary-dlite-tokens.
const KNOWN = new Set([
  'tkDliteSemanticBorderRadiusMd',
  'tkDliteSemanticColorSurfaceBase',
  'tkDliteSemanticSpacing400',
]);

let dir;

const write = (name, body) => {
  const full = path.join(dir, name);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body);
};

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'token-lint-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const tokensFor = (findings) => findings.map((f) => f.token);

describe('lintTokens', () => {
  it('passes a file that only uses token names the package ships', () => {
    write('good.js', 'const s = { borderRadius: t.tkDliteSemanticBorderRadiusMd };');

    expect(lintTokens(dir, { known: KNOWN })).toEqual([]);
  });

  // The bug this exists for: a token name that does not resolve is `undefined`,
  // React Native drops the declaration silently, and the style just never
  // applies. The Offline Sync card had no background and no rounded corners for
  // exactly this reason, and nothing failed.
  it('flags a token name the package does not ship', () => {
    write('bad.js', 'const s = { borderRadius: t.tkDliteSemanticBorderRadiusMedium };');

    expect(tokensFor(lintTokens(dir, { known: KNOWN })))
      .toEqual(['tkDliteSemanticBorderRadiusMedium']);
  });

  it('reports the file and line so the finding is actionable', () => {
    write('bad.js', ['// header', '', 'x = t.tkDliteSemanticColorSurface;'].join('\n'));

    const [finding] = lintTokens(dir, { known: KNOWN });
    expect(finding).toMatchObject({ file: 'bad.js', line: 3 });
  });

  // These files DEFINE or stub token names; measuring them against the package
  // would flag the definitions themselves.
  it('skips the token definition and mock files', () => {
    write('modules/theme/tokens.js', 'export const x = "tkDliteSemanticMadeUpName";');
    write('__mocks__/styleDictionaryTokens.js', 'tkDliteSemanticAlsoMadeUp: 4,');

    expect(lintTokens(dir, { known: KNOWN })).toEqual([]);
  });

  // modules/theme/index.js probes a token the package does not ship yet and
  // composes a fallback when it is absent — the pattern the design-system skill
  // prescribes for a missing token. That is deliberate, so it needs a way to say
  // so; without one the linter cries wolf and gets ignored.
  it('respects an explicit dlite-optional marker on the line', () => {
    write('theme.js', 'x = t.tkDliteSemanticColorFeedbackDangerContainer || y; // dlite-optional');

    expect(lintTokens(dir, { known: KNOWN })).toEqual([]);
  });

  it('finds every offending name in one file, not just the first', () => {
    write('bad.js', [
      'a = t.tkDliteSemanticColorSurface;',
      'b = t.tkDliteSemanticBorderRadiusMedium;',
    ].join('\n'));

    expect(tokensFor(lintTokens(dir, { known: KNOWN })).sort()).toEqual([
      'tkDliteSemanticBorderRadiusMedium',
      'tkDliteSemanticColorSurface',
    ]);
  });
});
