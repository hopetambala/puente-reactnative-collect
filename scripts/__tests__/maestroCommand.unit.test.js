const { spawnSync } = require('child_process');
const path = require('path');

const { scripts } = require('@app/package.json');

const repoRoot = path.resolve(__dirname, '../..');
const recorder = path.join(__dirname, '../test-fixtures/record-maestro-command.js');
const quote = (value) => `'${value.replace(/'/g, "'\\''")}'`;

// Shell functions intercept both commands in the canonical package script.
// The device argument is never sent to a native runner, even on a machine
// with multiple unrelated booted simulators.
function runScript(args, preflightStatus = 0) {
  const result = spawnSync('/bin/sh', ['-c', `
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
    ${scripts.maestro} "$@"
  `, 'maestro-script', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      APP_ENV: 'staging',
      EXPO_PUBLIC_APP_ENV: 'staging',
      MAESTRO_TEST_PREFLIGHT_STATUS: String(preflightStatus),
      MAESTRO_TEST_RECORD_FILE: '',
    },
  });

  return {
    status: result.status,
    events: result.stdout.trim().split('\n').filter(Boolean).map(JSON.parse),
  };
}

describe('canonical Maestro command', () => {
  const credentials = ['-e', 'PARSE_USERNAME=Test', '-e', 'PARSE_PASSWORD=test'];
  const flow = '.maestro/authenticated.yaml';

  it('forwards one exact device target and remaining CLI arguments after preflight', () => {
    const args = ['--device', 'DEDICATED-QA-UDID', '-e', 'CUSTOM_VALUE=two words', flow];
    const result = runScript(args);

    expect(result.status).toBe(0);
    expect(result.events.map(({ command }) => command)).toEqual(['preflight', 'maestro']);
    expect(result.events[1]).toMatchObject({
      args: ['test', ...credentials, ...args],
      javaHome: '/opt/homebrew/opt/openjdk',
      appEnv: 'staging',
      publicAppEnv: 'staging',
    });
  });

  it('preserves the default command when no device is supplied', () => {
    const result = runScript([flow]);

    expect(result.status).toBe(0);
    expect(result.events.map(({ command }) => command)).toEqual(['preflight', 'maestro']);
    expect(result.events[1].args).toEqual(['test', ...credentials, flow]);
  });

  it('never invokes Maestro after a failed preflight even with an explicit device', () => {
    const result = runScript(['--device', 'DEDICATED-QA-UDID', flow], 1);

    expect(result.status).toBe(1);
    expect(result.events.map(({ command }) => command)).toEqual(['preflight']);
  });
});
