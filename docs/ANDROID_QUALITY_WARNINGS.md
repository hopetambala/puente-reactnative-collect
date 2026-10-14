# Android quality warning follow-up

Work started from merged release commit `1bc36d22c4e34b064d02e832ca2eedb6a9136e94`.
These changes are not a new store release. The published Android build remains
15.7.5 / 490150709 until a separately verified replacement is promoted.

## Fixes under verification

- **Orientation/resizability:** `withAndroidLargeScreen` removes the main
  activity restriction and explicitly removes the barcode library's inherited
  portrait restriction during manifest merge. Both activities are resizable.
  The Android-only mod leaves the tracked iOS orientations unchanged.
- **R8:** explicit supported minification/resource-shrinking options plus
  `withAndroidR8Optimization` replace Expo's non-optimizing default ProGuard
  rules and enable integrated resource shrinking on the installed AGP 8.12.
  [Android documents this supported configuration](https://developer.android.com/topic/performance/app-optimization/enable-app-optimization).
  This does **not** claim the separate AGP 9 upgrade recommendation is cleared.
- **Bitmap loading:** the exact published mapping identifies the flagged
  downloader as Expo Notifications' `DownloadImageKt`, not the app's ordinary
  React image views. A reproducible Android-only `patch-package` patch delegates
  decoding/caching to the already-used Glide 5.0.5, bounds output to 512 pixels,
  releases the request on failure/cancellation, and copies the result before
  Glide may recycle it. Native compilation/runtime proof is still required.

## Unresolved framework warning

The deprecated edge-to-edge calls originate in React Native's Android
`StatusBarModule` and `WindowUtilKt.enableEdgeToEdge`. Edge-to-edge is already
enabled in the generated project; enabling the same flag is not a fix for those
compiled calls. The inspected upstream React Native implementations still
contain deprecated bar-color APIs. Even
[AndroidX's current WindowCompat implementation](https://raw.githubusercontent.com/androidx/androidx/androidx-main/core/core/src/main/java/androidx/core/view/WindowCompat.java)
uses legacy setters for compatibility.

No framework behavior is removed, hidden through reflection, or suppressed to
make a static scanner appear clean. This warning remains unresolved pending a
compatible upstream migration/backport and native verification on older and
current Android versions. Clearing it cannot be inferred from configuration or
a successful UI test alone.

## Evidence and required release gates

Regression tests were observed failing before implementation. Generated Expo
mods are tested against the installed SDK template and tracked iOS plist.
The notification patch was reversed/reapplied in an isolated copy and checked
byte-for-byte against the installed native files.

Native inspection also found that Expo 55 selects a prebuilt notification
publication by default. `expo.autolinking.android.buildFromSource` now selects
only `expo-notifications`, with an actual installed-resolver regression that
preserves other publications and iOS pod linkage. The first local APK
(`e1169bf43751c6566aa1b178590775d0c8917434e92d80db6a6285944afc1e92`)
is superseded: it built successfully but did **not** contain the Kotlin patch.
Do not use it as bitmap-fix evidence or promote it.

The first native build exceeded Expo's 512 MiB Gradle metaspace cap. The
generated configuration now provides a 4 GiB heap and 1 GiB metaspace and
preserves unrelated JVM flags; the regression covers the installed template.

The source-linked replacement local APK
(`24f9d4e119ba704b362a6d0ec07ccaf8f97ed32e51fc0ed1cfa981febe1a48d1`)
compiled `:expo-notifications:compileReleaseKotlin`; its R8 mapping and compiled
classes contain the patched downloader. Compilation is confirmed, but native
bounded-image/cache/cancellation and notification-fallback checks remain pending.
This hash predates any subsequent shared-JavaScript changes and must be rebuilt
before those changes can be certified on Android.

The CI regression also exposed workflow steps overwriting the tracked `app.json`
with `app-example.json`, silently dropping the actual release plugins. All seven
such steps were removed; runtime credential fixtures remain separate. The guard
failed before the workflow correction, and the complete local suites and lint
passed afterward. Store release configuration must come from the tracked file.

The iOS gate exposed missing checkbox accessibility semantics and unreliable
keyboard dismissal. The existing consent row now has a localized checkbox
role/state and hides its decorative child from accessibility. The shared flow
requires IDs rather than its old consent-coordinate fallback and uses existing
user-accessible keyboard dismissal paths. One complete iOS save/restart/sync
and unique server-readback pass is recorded in
`quality-ios-repaired-journey-awake-2.log`; this is **not** a five-pass gate.

The October 14 five-run iOS batch had two complete passes and two Save-tap
failures before interruption. Accessibility reported Save below the clipped
form viewport, where its tap hit Home. A diagnostic before-tap capture plus a
complete save/restart/sync/read-back pass narrowed the finding. The flow now
centers Save away from the viewport edge, keeps all success assertions, and
captures the hit target. Native accessibility clipping remains a documented
finding; this harness correction does not prove that underlying issue fixed.

Use the package scripts, not reconstructed release commands:

```sh
yarn prebuild:android
yarn android:release --device <qa-avd-name> --no-bundler
yarn maestro:stability .maestro/release-save-restart-sync.yaml 5 --device <device-id>
yarn maestro .maestro/authenticated.yaml --device <device-id>
yarn maestro .maestro/organization-scope.yaml --device <device-id>
yarn maestro .maestro/orientation-diagnostic.yaml --device <device-id>
```

Local Android release builds use the template's debug signing key and are QA
artifacts, not store-upload artifacts. Version numbers alone do not identify
these binaries: retain the APK hash and source revision with test results.
Local Gradle 9.0 requires a compatible Java runtime; Java 17 is used for QA.

The shared durability flow never clears a queue. It synchronizes existing
synthetic records first, tests a unique resident across process death, restores
connectivity, proves the queue empty, then searches the server for that resident.
Run only on the documented internal-test account. iOS Simulator exercises the
DEV offline path, not physical radio loss or a production-signed iOS binary.

Require five consecutive complete durability passes per platform, authenticated
tab/organization checks, inspected Terms and orientation screenshots on phones
and tablets, native notification checks, and green CI before claiming the
follow-up release ready. The orientation flow is diagnostic until its own
intentional-failure and stability gate are recorded. A passing rotation command
does not prove the app rotated or that its layout is usable.
