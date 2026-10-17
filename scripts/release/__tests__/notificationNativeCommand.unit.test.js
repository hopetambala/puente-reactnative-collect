const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");
const { scripts } = require("@app/package.json");

const repoRoot = path.resolve(__dirname, "../../..");
const runner = path.join(repoRoot, "scripts/native-notification-images.js");
const notificationsRoot = path.dirname(require.resolve("expo-notifications/package.json"));
const nativeTestClass = "expo.modules.notifications.notifications.presentation.builders.DownloadImageNativeTest";
const qaAvd = "NOTIFICATION_IMAGE_QA";

// These are transport fixtures for runner selection/planning, never native
// bitmap evidence. Gradle, installation, launch, and storage commands are
// deliberately unavailable. The real Kotlin suite must run independently.
function runCli(args, devices = [{ serial: "emulator-5554", state: "device", avd: qaAvd }]) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "notification-image-command-"));
  const platformTools = path.join(fixtureRoot, "platform-tools");
  const eventsFile = path.join(fixtureRoot, "events.jsonl");
  fs.mkdirSync(platformTools);
  const fakeAdb = path.join(platformTools, "adb");
  fs.writeFileSync(fakeAdb, `#!${process.execPath}
const fs = require("fs");
const args = process.argv.slice(2);
const devices = JSON.parse(process.env.NOTIFICATION_COMMAND_TEST_DEVICES);
fs.appendFileSync(process.env.NOTIFICATION_COMMAND_TEST_EVENTS, JSON.stringify(args) + "\\n");
if (args[0] === "devices") {
  console.log("List of devices attached\\n" + devices.map(d => d.serial + "\\t" + d.state + " model:QA").join("\\n"));
} else if (args[0] === "-s") {
  const device = devices.find(d => d.serial === args[1]);
  if (!device) process.exit(1);
  const command = args.slice(2);
  if (command.join(" ") === "emu avd name") console.log(device.avd + "\\nOK");
  else if (command.join(" ") === "get-state") console.log(device.state);
  else if (command.join(" ") === "shell getprop ro.kernel.qemu" || command.join(" ") === "shell getprop ro.boot.qemu") console.log(device.serial.startsWith("emulator-") ? "1" : "0");
  else if (command.join(" ") === "shell getprop sys.boot_completed") console.log("1");
  else { console.error("Native mutation is forbidden in command planning tests: " + command.join(" ")); process.exit(73); }
} else {
  console.error("Unsupported adb command in planning fixture"); process.exit(73);
}
`, { mode: 0o755 });
  try {
    // Missing behavior must be an assertion failure, not NODE's module-loader
    // error. A missing runner has no behavior and produces this empty result.
    const result = fs.existsSync(runner) ? spawnSync(process.execPath, [runner, ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        PATH: `${platformTools}:${path.dirname(process.execPath)}:/usr/bin:/bin`,
        ANDROID_HOME: fixtureRoot,
        ANDROID_SDK_ROOT: fixtureRoot,
        ANDROID_SERIAL: "UNRELATED-DEVICE-MUST-NOT-BE-USED",
        NOTIFICATION_COMMAND_TEST_DEVICES: JSON.stringify(devices),
        NOTIFICATION_COMMAND_TEST_EVENTS: eventsFile,
      },
    }) : { status: 0, stdout: "", stderr: "" };
    return {
      ...result,
      events: fs.existsSync(eventsFile) ? fs.readFileSync(eventsFile, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [],
    };
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function protectedFileHashes() {
  const paths = ["package.json", "app.json", "app.config.js", "environment.js", "android/app", "context", "modules/offline", "domains/Auth"];
  const hashes = {};
  function readEntry(relativePath) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath)) return;
    if (fs.statSync(absolutePath).isDirectory()) {
      // Build outputs are independent of application source and may be changing
      // concurrently while another QA operation builds Android.
      fs.readdirSync(absolutePath).filter(name => name !== "build" && name !== ".gradle")
        .forEach(name => readEntry(path.join(relativePath, name)));
    } else {
      hashes[relativePath] = crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
    }
  }
  paths.forEach(readEntry);
  return hashes;
}

function expectOnlyDeviceQueries(events, selectedSerial) {
  expect(events.length).toBeGreaterThan(0);
  events.forEach((args) => {
    if (args[0] === "devices") return;
    expect(args.slice(0, 2)).toEqual(["-s", selectedSerial]);
    expect([
      "emu avd name",
      "get-state",
      "shell getprop ro.kernel.qemu",
      "shell getprop ro.boot.qemu",
      "shell getprop sys.boot_completed",
    ]).toContain(args.slice(2).join(" "));
  });
}

describe("canonical Android notification image verification", () => {
  it("exposes the native instrumentation runner through a repeatable package command", () => {
    // The existing source guard cannot establish bitmap dimensions, Glide
    // ownership/cache behavior, cancellation, or notification construction.
    // A named command must run the real installed module's androidTest suite;
    // this assertion fails cleanly before attempting any native execution.
    expect({ command: scripts["test:native:notification-images"] }).toEqual({
      command: "node scripts/native-notification-images.js",
    });
  });

  it("requires an explicitly selected emulator even when only one emulator is available", () => {
    const result = runCli(["--plan", "--json", "--expect-avd", qaAvd]);

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toMatch(/--device|explicit.*(?:device|emulator)/i);
    expect(result.events.every(args => args[0] === "devices")).toBe(true);
  });

  it("rejects ambiguous available emulators before attempting native operations", () => {
    const result = runCli(["--plan", "--json", "--expect-avd", qaAvd], [
      { serial: "emulator-5554", state: "device", avd: qaAvd },
      { serial: "emulator-5556", state: "device", avd: "OTHER_QA" },
    ]);

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toMatch(/--device|explicit|ambiguous/i);
    expect(result.events.every(args => args[0] === "devices")).toBe(true);
  });

  it("rejects a selected physical device before attempting native operations", () => {
    const before = protectedFileHashes();
    const result = runCli(["--device", "PHYSICAL-PHONE", "--expect-avd", qaAvd, "--plan", "--json"], [
      { serial: "PHYSICAL-PHONE", state: "device", avd: "" },
    ]);

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toMatch(/emulator|physical/i);
    expect(result.events.every(args => args[0] === "devices" || (args[0] === "-s" && args[1] === "PHYSICAL-PHONE" && args.slice(2).join(" ").startsWith("shell getprop ")))).toBe(true);
    expect(protectedFileHashes()).toEqual(before);
  });

  it("rejects an emulator whose AVD does not match the explicitly selected QA identity", () => {
    const result = runCli(["--device", "emulator-5554", "--expect-avd", qaAvd, "--plan", "--json"], [
      { serial: "emulator-5554", state: "device", avd: "SURVEYOR_OTHER_EMULATOR" },
    ]);

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toMatch(/AVD|identity|match/i);
    expectOnlyDeviceQueries(result.events, "emulator-5554");
  });

  it("plans only the source-linked module's isolated native test APK and class on the selected QA emulator", () => {
    const before = protectedFileHashes();
    const result = runCli(["--device", "emulator-5554", "--expect-avd", qaAvd, "--plan", "--json"]);
    // Parse only after asserting a valid JSON plan exists. Missing/stub runners
    // must fail the missing-behavior assertion rather than JSON.parse crashing.
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\{/);
    const plan = JSON.parse(result.stdout);

    expect(plan).toMatchObject({
      device: { serial: "emulator-5554", avdName: qaAvd },
      native: {
        project: ":expo-notifications",
        sourceDir: path.join(notificationsRoot, "android"),
        task: ":expo-notifications:connectedDebugAndroidTest",
        testPackage: "expo.modules.notifications.test",
        testClass: nativeTestClass,
      },
      appMutations: [],
    });
    expectOnlyDeviceQueries(result.events, "emulator-5554");
    expect(protectedFileHashes()).toEqual(before);
  });
});
