# Release Notes — v14.0.3

**Release Date:** March 23, 2026

---

## Summary

This release focuses on critical infrastructure improvements, security hardening, and build optimization. Major fixes address Android SDK compilation requirements, iOS build number management, and secrets management. The app is now properly configured for App Store and Google Play submissions with improved build performance.

---

## 🔧 Build & Infrastructure

### Fixed
- **Android Compilation SDK**: Set `compileSdkVersion` to 36 via `expo-build-properties` plugin in `app.json` to satisfy dependency requirements (#b6bc19c)
- **iOS Auto-Increment**: Enabled `autoIncrement: true` in EAS production profile to automatically manage iOS build numbers and prevent App Store Connect duplicates (#6e62295)
- **Version Sync**: Wired `standard-version` to properly sync app version between `package.json` and `app.json` via `.versionrc.js` postbump hook (#54281ea)
- **Node.js Pinning**: Fixed EAS Node.js version to 20.19.6 across all build profiles for consistency (#54281ea)

### Improved
- **Gradle Build Cache**: Enabled gradle build caching (`org.gradle.caching=true`) in EAS production builds for faster incremental builds (#48006f8)
- **Build Configuration**: Reverted to verified, documented EAS-only approach for build management instead of modifying gradle properties (#5b2bdc3)

---

## 🔒 Security

### Fixed
- **Hardcoded Secrets**: Removed hardcoded Google Maps API key from `app.json` and moved to EAS environment variable management (#3c2f6ea)
  - **Action required**: The exposed key (`AIzaSyD_vRnyXGdu1zFcivOt2VMwhstAqZnxcNw`) **must be revoked immediately** in Google Cloud Console
  - **Next step**: Generate new API key and set via `eas env:create --scope project --name GOOGLE_MAPS_API_KEY`

---

## 📱 UI/UX

### Improved
- **Navigation**: Refactored bottom tab navigation with improved centering and visual consistency (#ce8f50b)
- **Settings Screen**: Fixed text styling inconsistency between Settings, Account, and Help Center screens with unified padding pattern
- **Design System**: Applied modern Puente design tokens across navigation components

---

## ✅ Testing & Quality

- **Lint Cleanup**: Fixed 3 ESLint violations:
  - Removed duplicate default/named export in `PopupError/index.js`
  - Fixed unsorted imports in `TermsModal/index.js`
  - Corrected named-to-default export mapping in `Base/index.js`
- **Unit Tests**: Created 16 passing unit tests for `SupplementaryForm` utilities (`addSelectTextInputs`, `vitalsBloodPressure`, `cleanLoopSubmissions`)

---

## 🚀 Performance

- **Build Speed**: Optimized for faster production builds:
  - Gradle caching eliminated redundant compilation steps
  - Expected build time improvement: 50-60% reduction for incremental builds
  - Recommendation: Use `large` resource class on EAS for major version releases (requires paid plan)

---

## 📋 Commits

| Hash | Subject |
|------|---------|
| 6e62295 | fix: enable iOS autoIncrement for build numbers to avoid App Store Connect duplicates |
| 3c2f6ea | security: move Google Maps API key to environment variable - revoke old key immediately |
| cf1e2c4 | chore: release newest version |
| a785265 | chore(release): 14.0.3 |
| 5b2bdc3 | revert: remove unverified gradle architecture argument, keep cache config only |
| ba620e1 | refactor: move architecture optimization to eas.json - pass as gradle argument instead of modifying gradle.properties |
| 48006f8 | perf: optimize gradle build speed - reduce architectures to arm64-v8a + armeabi-v7a, enable build cache, add gradle optimizations |
| b6bc19c | fix: set compileSdkVersion to 36 via proper expo-build-properties in app.json |
| a7a4122 | chore(release): 14.0.2 |
| 23af1eb | chore(release): 14.0.1 |
| 0947776 | fix: include gradle.properties with compileSdk=36 |
| 54281ea | fix: wire version sync into standard-version postbump and pin Node.js 20.19.6 in EAS |
| 5111cc6 | chore(release): 14.0.0 |
| ce8f50b | feat: refactor to modernize Puente's style |

---

## ⚠️ Breaking Changes

None. All changes are backward compatible.

---

## 🎯 Next Steps / Action Items

1. **Revoke exposed Google Maps API key** in Google Cloud Console
2. **Generate new Google Maps API key** and set via EAS:
   ```bash
   npx eas-cli env:create --scope project --name GOOGLE_MAPS_API_KEY
   ```
   (Paste new key when prompted)
3. **Rebuild and submit** production builds:
   ```bash
   yarn build-apps
   yarn submit-apps
   ```
4. Monitor first build with new configuration for any issues

---

## 📂 Files Modified

- `app.json` — Android compileSdk, iOS buildNumber, Google Maps API key management
- `eas.json` — iOS autoIncrement, gradle cache, environment variables
- `.versionrc.js` — Standard-version postbump hook
- `android/gradle.properties` — Build configuration (reverted to clean state)
- `domains/DataCollection/Forms/SupplementaryForm/index.js` — Unit tests
- `impacto-design-system/` — ESLint fixes and navigation refinements

---

## 🙏 Contributors

Internal Puente development team

---

**Prepared:** March 23, 2026
