#!/usr/bin/env node
/** Run real bitmap instrumentation in the source-linked library's own test APK. */
const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const testClass = "expo.modules.notifications.notifications.presentation.builders.DownloadImageNativeTest";
const testPackage = "expo.modules.notifications.test";

function optionsFrom(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === "--plan" || flag === "--json") options[flag.slice(2)] = true;
    else if (flag === "--device" || flag === "--expect-avd") {
      index += 1;
      const value = args[index];
      if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
      options[flag] = value;
    } else throw new Error(`Unknown option: ${flag}`);
  }
  if (!options["--device"]) throw new Error("Select an explicit QA emulator with --device emulator-<port>.");
  if (!options["--expect-avd"]) throw new Error("Supply the QA emulator identity with --expect-avd <AVD name>.");
  if (options.json && !options.plan) throw new Error("--json requires --plan.");
  return options;
}

function main(args) {
  const options = optionsFrom(args);
  const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  const adb = sdk ? path.join(sdk, "platform-tools", "adb") : "adb";
  const query = (command) => execFileSync(adb, command, {
    cwd: repoRoot, encoding: "utf8", timeout: 10000,
  }).trim();
  const serial = options["--device"];
  const devices = query(["devices", "-l"]).split(/\r?\n/)
    .map(line => line.trim().split(/\s+/));
  if (!devices.some(device => device[0] === serial && device[1] === "device")) {
    throw new Error(`Selected device ${serial} is unavailable or not authorized.`);
  }
  if (!/^emulator-\d+$/.test(serial)) throw new Error("Physical devices are refused; select a QA emulator.");
  const deviceQuery = (...command) => query(["-s", serial, ...command]);
  if (deviceQuery("shell", "getprop", "ro.kernel.qemu") !== "1"
    && deviceQuery("shell", "getprop", "ro.boot.qemu") !== "1") {
    throw new Error("Selected device is not an Android emulator.");
  }
  const avdName = deviceQuery("emu", "avd", "name").split(/\r?\n/)[0];
  if (avdName !== options["--expect-avd"]) {
    throw new Error(`AVD identity mismatch: expected ${options["--expect-avd"]}, received ${avdName}.`);
  }
  if (deviceQuery("get-state") !== "device" || deviceQuery("shell", "getprop", "sys.boot_completed") !== "1") {
    throw new Error("Selected QA emulator has not finished booting.");
  }

  const notificationsRoot = path.dirname(require.resolve("expo-notifications/package.json"));
  const plan = {
    device: { serial, avdName },
    native: {
      project: ":expo-notifications",
      sourceDir: path.join(notificationsRoot, "android"),
      task: ":expo-notifications:connectedDebugAndroidTest",
      testPackage,
      testClass,
    },
    appMutations: [],
  };
  if (options.plan) {
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    return 0;
  }

  const androidRoot = path.join(repoRoot, "android");
  const gradlew = path.join(androidRoot, "gradlew");
  if (!fs.existsSync(gradlew)) throw new Error("Android project is missing; run yarn prebuild:android first.");
  const result = spawnSync(gradlew, [
    plan.native.task,
    "--init-script", path.join(__dirname, "native-notification-images.gradle"),
    `-PnotificationImagesSourceDir=${plan.native.sourceDir}`,
    `-PnotificationImagesFixtures=${path.join(__dirname, "release/__tests__/native")}`,
    `-Pandroid.testInstrumentationRunnerArguments.class=${testClass}`,
    "--no-configuration-cache", "--rerun-tasks", "--console=plain",
  ], {
    cwd: androidRoot,
    stdio: "inherit",
    // AGP's ConnectedDeviceProvider filters to ANDROID_SERIAL. Always replace
    // any inherited device selection with the verified explicit emulator.
    env: { ...process.env, ANDROID_SERIAL: serial },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Native instrumentation failed (${result.signal || result.status}).`);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
