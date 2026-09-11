/**
 * maestro-preflight — RED-GREEN TDD
 *
 * Two Maestro runs cannot share a simulator. Each `maestro test` starts its own
 * XCUITest driver against the device, and the second one tears down the first
 * one's driver. The symptom is not a clear error: flows die mid-subflow with no
 * assertion failure, at DIFFERENT steps each time, which reads exactly like a
 * flaky app or a degraded simulator.
 *
 * On 2026-09-11 a batch that a stop command reported as stopped kept running
 * for eight hours. A second batch was started alongside it, and every flow in
 * both failed intermittently. Hours went into chasing a nonexistent regression
 * in the resident-search code.
 *
 * So: refuse to start when another run holds the device, and say which PID.
 */
const {
  formatMetroDownMessage,
  isMetroUp,
  findConflictingMaestroRuns,
  formatConflictMessage,
} = require('@app/scripts/maestro-preflight');

// Shape of `ps -Ao pid=,command=` output.
const line = (pid, cmd) => `${String(pid).padStart(6)} ${cmd}`;

const SELF = 4242;

describe('findConflictingMaestroRuns', () => {
  // The REAL command line, copied from `ps -Ao pid=,command=` while a flow was
  // running on 2026-09-11. The first version of this guard was written against
  // an invented `maestro test ...` string and silently matched nothing, because
  // the launcher actually execs a Java class. Keep this fixture verbatim.
  const REAL_RUN =
    '/opt/homebrew/opt/openjdk/bin/java -classpath /Users/x/.maestro/lib/* '
    + 'maestro.cli.AppKt test -e PARSE_USERNAME=Test -e PARSE_PASSWORD=test .maestro/offline-sync.yaml';

  it('finds the real java-launched maestro run', () => {
    expect(findConflictingMaestroRuns(line(86160, REAL_RUN), SELF)).toEqual([86160]);
  });

  // `yarn maestro <flow>` is the wrapper that will exec the java process. It is
  // a genuine second run in flight, so it counts.
  it('finds the yarn wrapper that is launching a run', () => {
    const ps = line(86159, 'node /Users/x/.nvm/versions/node/v24.14.1/bin/yarn maestro .maestro/offline-linked-forms.yaml');

    expect(findConflictingMaestroRuns(ps, SELF)).toEqual([86159]);
  });

  it('finds another maestro test run', () => {
    const ps = [
      line(111, '/usr/bin/java -jar /Users/x/.maestro/lib/maestro.jar test .maestro/offline-sync.yaml'),
      line(222, '/sbin/launchd'),
    ].join('\n');

    expect(findConflictingMaestroRuns(ps, SELF)).toEqual([111]);
  });

  it('reports every conflicting run, not just the first', () => {
    const ps = [
      line(111, 'maestro test .maestro/a.yaml'),
      line(333, 'maestro test .maestro/b.yaml'),
    ].join('\n');

    expect(findConflictingMaestroRuns(ps, SELF)).toEqual([111, 333]);
  });

  it('ignores its own process so the preflight never blocks itself', () => {
    const ps = line(SELF, 'node scripts/maestro-preflight.js').concat(
      `\n${line(111, 'maestro test .maestro/a.yaml')}`
    );

    expect(findConflictingMaestroRuns(ps, SELF)).toEqual([111]);
  });

  // The whole point is to run BEFORE maestro starts. If the preflight counted
  // the shell that is about to exec maestro, it would refuse every single run.
  it('ignores the yarn script wrapper that is about to start maestro', () => {
    const ps = [
      line(555, '/bin/sh -c JAVA_HOME=/opt/homebrew/opt/openjdk PATH=... maestro test .maestro/x.yaml'),
      line(556, 'node /path/to/scripts/maestro-preflight.js'),
    ].join('\n');

    expect(findConflictingMaestroRuns(ps, SELF)).toEqual([]);
  });

  // Editors and agents commonly have "maestro" in an env var or a file path.
  // Matching those would block every run on this machine.
  it.each([
    ['an editor helper with maestro in its environment',
      'Cursor Helper (Plugin): extension-host MAESTRO_HOME=/Users/x/.maestro'],
    ['a grep for maestro', 'grep -lf maestro test'],
    ['an unrelated binary whose path contains maestro',
      '/Users/x/.maestro/bin/maestro --version'],
    ['the hierarchy inspector, which does not drive a flow',
      '/usr/bin/java -jar maestro.jar hierarchy'],
  ])('does not treat %s as a conflicting run', (_label, cmd) => {
    expect(findConflictingMaestroRuns(line(999, cmd), SELF)).toEqual([]);
  });

  // The preflight is launched BY `yarn maestro`, so its own parent chain always
  // contains a matching wrapper. Counting an ancestor would make the guard
  // refuse every single run -- worse than not having it.
  it('ignores its own ancestors', () => {
    const ps = [
      line(900, 'node /Users/x/.nvm/versions/node/v24.14.1/bin/yarn maestro .maestro/a.yaml'),
      line(901, 'maestro.cli.AppKt test .maestro/b.yaml'),
    ].join('\n');

    // 900 is this process's parent; 901 is a genuinely separate run.
    expect(findConflictingMaestroRuns(ps, [SELF, 900])).toEqual([901]);
  });

  it('still accepts a single pid, not only a list', () => {
    const ps = line(901, 'maestro.cli.AppKt test .maestro/b.yaml');

    expect(findConflictingMaestroRuns(ps, SELF)).toEqual([901]);
  });

  it('returns nothing when the device is free', () => {
    expect(findConflictingMaestroRuns(line(222, '/sbin/launchd'), SELF)).toEqual([]);
  });

  it('survives empty or malformed ps output rather than throwing', () => {
    expect(findConflictingMaestroRuns('', SELF)).toEqual([]);
    expect(findConflictingMaestroRuns('   \n\n', SELF)).toEqual([]);
    expect(findConflictingMaestroRuns(undefined, SELF)).toEqual([]);
  });
});

describe('formatConflictMessage', () => {
  it('names the PIDs and how to clear them', () => {
    const msg = formatConflictMessage([111, 333]);

    expect(msg).toContain('111');
    expect(msg).toContain('333');
    // A message that says "conflict" without the recovery command sends the
    // reader hunting; the whole failure mode is that it looks like flakiness.
    expect(msg).toMatch(/kill/i);
  });
});

/**
 * Metro readiness.
 *
 * With the packager down, the dev client launches to a red screen reading
 * "No script URL provided". Maestro sees no crash — the app is up — so the run
 * proceeds and dies 60 seconds later on
 *
 *     Assert that "Skip|Log-In|Last 7 Days" is visible... FAILED
 *
 * which points at the sign-in screen: a wrong password, a slow backend, a
 * broken login flow. Anything but the packager. Cost a capture run on
 * 2026-09-11, immediately after a simulator reboot.
 *
 * The check is a plain HTTP probe, and it must never block a run because the
 * probe itself failed — same rule the conflicting-run check already follows.
 */
describe('Metro readiness', () => {
  it('is satisfied when the packager answers', async () => {
    const fetcher = jest.fn().mockResolvedValue({ ok: true });

    await expect(isMetroUp(fetcher)).resolves.toBe(true);
  });

  it('is not satisfied when nothing is listening', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(isMetroUp(fetcher)).resolves.toBe(false);
  });

  it('is not satisfied when something answers but not with a 200', async () => {
    const fetcher = jest.fn().mockResolvedValue({ ok: false, status: 502 });

    await expect(isMetroUp(fetcher)).resolves.toBe(false);
  });

  it('treats a probe that throws synchronously as "cannot tell", not "down"', async () => {
    // Never block a run because the CHECK broke.
    const fetcher = () => { throw new Error('fetch is not defined'); };

    await expect(isMetroUp(fetcher)).resolves.toBe(true);
  });

  it('names the packager and the command that starts it', () => {
    const message = formatMetroDownMessage();

    expect(message).toMatch(/No script URL provided/);
    expect(message).toMatch(/yarn start:staging/);
  });
});
