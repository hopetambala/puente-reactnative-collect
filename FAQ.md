# FAQ

## Do I need to run `expo prebuild` before every `eas build`?

No. Since the `ios/` directory is committed to git (not gitignored), EAS uses it as-is. You only need to run `npx expo prebuild --clean --platform ios` when:

- **Upgrading Expo SDK** (e.g., 54 → 55)
- **Adding or removing a native module** (e.g., adding `expo-camera` or removing a package with native code)
- **Changing plugin config** in `app.json` (the `plugins` array)

For day-to-day JS-only changes, `eas build` works directly without prebuild.

> **Alternative**: You could uncomment `ios/` in `.gitignore` and remove the `ios/` directory from git. Then EAS would automatically run prebuild on every build in the cloud, so you'd never manage native files locally. The tradeoff is slightly longer build times since it regenerates each time.
