const fs = require('fs');
const os = require('os');
const path = require('path');

const { lintFlows } = require('@app/scripts/lint-maestro');

const HEADER = 'appId: io.ionic.starter1270348\n---\n';

let dir;

const writeFlow = (name, body) => {
  const full = path.join(dir, name);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, HEADER + body);
};

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'maestro-lint-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const rulesFor = (file, findings) =>
  findings.filter((f) => f.file === file).map((f) => f.rule);

describe('lintFlows', () => {
  it('passes a flow that navigates by id and asserts its destination', () => {
    writeFlow('good.yaml', [
      '- tapOn:',
      '    id: "tab-offline"',
      '- assertVisible: "Offline Sync"',
    ].join('\n'));

    expect(lintFlows(dir)).toEqual([]);
  });

  // The rule that would have caught the Assets/Offline mislabel.
  it('flags a tab-bar tap done by screen coordinate', () => {
    writeFlow('bad.yaml', [
      '- tapOn:',
      '    point: "70%, 94%"',
      '- assertVisible: "Offline Sync"',
    ].join('\n'));

    expect(rulesFor('bad.yaml', lintFlows(dir))).toContain('tab-coordinate-tap');
  });

  it('flags a flow that taps and screenshots without ever asserting', () => {
    writeFlow('silent.yaml', [
      '- tapOn: "Skip"',
      '- takeScreenshot: shot',
    ].join('\n'));

    expect(rulesFor('silent.yaml', lintFlows(dir))).toContain('no-assertion');
  });

  it('flags a runFlow pointing at a subflow that does not exist', () => {
    writeFlow('dangling.yaml', [
      '- runFlow: subflows/nope.yaml',
      '- assertVisible: "Home"',
    ].join('\n'));

    expect(rulesFor('dangling.yaml', lintFlows(dir))).toContain('missing-subflow');
  });

  it('resolves a runFlow whose subflow exists', () => {
    writeFlow('subflows/real.yaml', '- assertVisible: "Home"');
    writeFlow('caller.yaml', [
      '- runFlow: subflows/real.yaml',
      '- assertVisible: "Home"',
    ].join('\n'));

    expect(rulesFor('caller.yaml', lintFlows(dir))).not.toContain('missing-subflow');
  });

  it('flags a flow whose appId is not the app under test', () => {
    fs.writeFileSync(
      path.join(dir, 'wrong-app.yaml'),
      'appId: com.example.other\n---\n- assertVisible: "Home"\n'
    );

    expect(rulesFor('wrong-app.yaml', lintFlows(dir))).toContain('wrong-app-id');
  });

  // authenticated.yaml delegates every assertion to open-tab.yaml. A flow whose
  // checks all live one level down is asserted, not silent.
  it('counts assertions inherited from a called subflow', () => {
    writeFlow('subflows/asserts.yaml', '- assertVisible: "Home"');
    writeFlow('delegating.yaml', [
      '- runFlow:',
      '    file: subflows/asserts.yaml',
      '- takeScreenshot: shot',
    ].join('\n'));

    expect(rulesFor('delegating.yaml', lintFlows(dir))).not.toContain('no-assertion');
  });

  it('still flags a flow whose called subflow asserts nothing either', () => {
    writeFlow('subflows/silent-sub.yaml', '- tapOn: "Got it"');
    writeFlow('delegating-silent.yaml', [
      '- runFlow:',
      '    file: subflows/silent-sub.yaml',
      '- takeScreenshot: shot',
    ].join('\n'));

    expect(rulesFor('delegating-silent.yaml', lintFlows(dir))).toContain('no-assertion');
  });

  it('exempts subflows from the assertion rule', () => {
    // A subflow may legitimately be pure setup (dismiss-coachmarks.yaml is).
    writeFlow('subflows/setup.yaml', [
      '- runFlow:',
      '    when:',
      '      visible: "Got it"',
      '    commands:',
      '      - tapOn: "Got it"',
    ].join('\n'));

    expect(rulesFor('subflows/setup.yaml', lintFlows(dir))).not.toContain('no-assertion');
  });
});
