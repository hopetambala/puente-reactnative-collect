const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { scripts } = require('@app/package.json');

const repoRoot = path.resolve(__dirname, '../..');
const recorder = path.join(__dirname, '../test-fixtures/record-maestro-command.js');
const quote = (value) => `'${value.replace(/'/g, "'\\''")}'`;
const credentials = ['-e', 'PARSE_USERNAME=Test', '-e', 'PARSE_PASSWORD=test'];

describe('Maestro stability device routing', () => {
  let workingDir;
  let flow;
  let recordFile;

  beforeEach(() => {
    workingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maestro-stability-test-'));
    flow = path.join(workingDir, 'authenticated.yaml');
    recordFile = path.join(workingDir, 'commands.jsonl');
    fs.copyFileSync(path.join(repoRoot, '.maestro/authenticated.yaml'), flow);
  });

  afterEach(() => fs.rmSync(workingDir, { recursive: true, force: true }));

  function runStability(extraArgs = [], preflightStatus = 0) {
    // Exported Bash functions catch both the existing raw command and the
    // canonical Yarn command. Every native runner is replaced by a recorder.
    const result = spawnSync('/bin/bash', ['-c', `
      node() {
        if [ "$1" = "scripts/maestro-preflight.js" ]; then
          ${quote(process.execPath)} ${quote(recorder)} preflight "$@"
        else
          ${quote(process.execPath)} "$@"
        fi
      }
      maestro() {
        ${quote(process.execPath)} ${quote(recorder)} maestro "$@"
      }
      yarn() {
        ${quote(process.execPath)} ${quote(recorder)} yarn "$@"
        if [ "$1" != "maestro" ]; then return 2; fi
        shift
        ${scripts.maestro} "$@"
      }
      export -f node maestro yarn
      bash ${quote(path.join(repoRoot, 'scripts/maestro-stability.sh'))} "$@"
    `, 'maestro-stability-test', flow, '3', ...extraArgs], {
      cwd: workingDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        APP_ENV: 'staging',
        EXPO_PUBLIC_APP_ENV: 'staging',
        PARSE_USERNAME: '',
        PARSE_PASSWORD: '',
        MAESTRO_TEST_PREFLIGHT_STATUS: String(preflightStatus),
        MAESTRO_TEST_RECORD_FILE: recordFile,
      },
    });

    return {
      status: result.status,
      events: fs.readFileSync(recordFile, 'utf8').trim().split('\n').map(JSON.parse),
    };
  }

  it('runs each repetition through canonical preflight and forwards the exact device and CLI arguments', () => {
    const extraArgs = ['--device', 'DEDICATED-QA-UDID', '-e', 'CUSTOM_VALUE=two words'];
    const result = runStability(extraArgs);

    expect(result.status).toBe(0);
    expect(result.events.map(({ command, args }) => ({ command, args }))).toEqual(
      Array.from({ length: 3 }, () => [
        { command: 'yarn', args: ['maestro', flow, ...extraArgs] },
        { command: 'preflight', args: ['scripts/maestro-preflight.js'] },
        { command: 'maestro', args: ['test', ...credentials, flow, ...extraArgs] },
      ]).flat()
    );
  });

  it('retains the default no-device credentials and environment across repetitions', () => {
    const result = runStability();
    const runs = result.events.filter(({ command }) => command === 'maestro');

    expect(result.status).toBe(0);
    expect(runs).toHaveLength(3);
    runs.forEach((run) => expect(run).toMatchObject({
      args: ['test', ...credentials, flow],
      javaHome: '/opt/homebrew/opt/openjdk',
      appEnv: 'staging',
      publicAppEnv: 'staging',
    }));
  });

  it('fails the stability gate without driving any device when preflight refuses a run', () => {
    const result = runStability(['--device', 'DEDICATED-QA-UDID'], 1);

    expect(result.status).toBe(1);
    expect(result.events.filter(({ command }) => command === 'maestro')).toEqual([]);
  });
});
