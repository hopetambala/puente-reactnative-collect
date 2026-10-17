const fs = require("fs");
const path = require("path");

describe("installed Android notification image loader", () => {
  it("keeps manual network bitmap decoding out of the remote image path", () => {
    // Read the installed native module that Expo autolinks, rather than a patch
    // file: a patch that was never applied must not make this regression green.
    const notificationsRoot = path.dirname(require.resolve("expo-notifications/package.json"));
    const downloadImage = fs.readFileSync(
      path.join(
        notificationsRoot,
        "android/src/main/java/expo/modules/notifications/notifications/presentation/builders/DownloadImage.kt"
      ),
      "utf8"
    );

    // Play mapped its bitmap warning to this loader. Raw decoding allocates the
    // remote image at its original dimensions outside the image pipeline's
    // cache/memory management. This source integration guard is intentionally
    // library agnostic; native tests still need to exercise bounded dimensions,
    // cache reuse, request cleanup, and notification delivery on image failure.
    expect(downloadImage).not.toMatch(
      /\bBitmapFactory\s*\.\s*decode(?:Stream|ByteArray|File|FileDescriptor)\s*\(/
    );
    expect(downloadImage).not.toMatch(/\.\s*openConnection\s*\(/);
  });
});
