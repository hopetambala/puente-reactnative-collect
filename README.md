# Puente - Collect

[![made with expo](https://img.shields.io/badge/MADE%20WITH%20EXPO-000.svg?style=for-the-badge&logo=expo&labelColor=4630eb&logoWidth=20)](https://github.com/expo/expo) [![supports iOS and Android](https://img.shields.io/badge/Platforms-Native-4630EB.svg?style=for-the-badge&logo=EXPO&labelColor=000&logoColor=fff)](https://github.com/expo/expo)

**Current Version:** 12.7.1  
**Expo SDK:** 54.0.0

## Quick Start

Here are some quick commands to get started (we use **yarn**):

- `yarn install`: Install Node dependencies
- `yarn start`: Start Expo development server
- `yarn ios`: Run on iOS simulator
- `yarn android`: Run on Android emulator
- `yarn test`: Run the test suite and watch for changes
- `yarn lint-fix`: Run ESLint and auto-fix issues

## Async Storage Values

| Name of Value       | Description of Data                                                                  |
| ------------------- | ------------------------------------------------------------------------------------ |
| `assetMapRegion`    | Region location numbers of asset map                                                 |
| `organization`      | Name of the surveying users surveyingOrganization                                    |
| `residentData`      | All `SurveyData` parse model data stored based on the users surveyingOrganization    |
| `offlineIDForms`    | All `SurveyData` forms collected when user is offline                                |
| `offlineSupForms`   | All Supplementary/Custom forms collected when user is offline                        |
| `offlineHouseholds` | All `Household` parse model created when user is offline                             |
| `pinnedForms`       | All local pinned form data that the user choses when the long press on a custom form |

## Select Values with Text Input

Select and MultiSelect PaperInputPicker fieldTypes have the option to have a text associated with a given select option.

For example if you wanted the user to have the option to add text when a user selects "Other", you would format your config for the field like this:

{
"label": "Some text.",
"formikKey": "KEY",
"value": [''],
"fieldType": "select",
"options": [
{
"label": "Some text,
"value": "some_val"
},
{
"label": "Other",
"value": "OTHER",
"text": true,
"textKey": "__KEY__OTHER"
}
]
}

Important notes:
"text": true

- This adds the text input field to the Other select option
  "textKey": "**KEY**OTHER"
- \_\_: The double underscore at the beginning of the key is required. No other keys in the config use this and CANNOT use the double underscore or there will be errors
- KEY: this portion of the textKey needs to be an exact match to the formikKey of the field
- \_\_: Second double underscore is also required. Without the first double underscore it will not matter.
- OTHER: This portion of the key is a direct match to the value of the select option. This is required to append the text input value to the original value in the array
- none of these values need to be capitalized

## Deployment

This project uses **EAS Build** for building and deploying to app stores. Native folders (`android/` and `ios/`) are generated locally and are not tracked in git.

### Configuration

- **App Configuration**: `app.json` contains the main app configuration including bundle identifiers, permissions, and app metadata
- **Environment Variables**: Sensitive values are stored in `environment.js` (not tracked in git)
- **EAS Configuration**: `eas.json` defines build profiles for development, preview, and production

### Version Management

For releases and bumping versions, we have:

- `yarn release-patch`: Does a patch bump i.e. `1.0.0` to `1.0.1`
- `yarn release-minor`: Does a minor bump i.e. `1.0.0` to `1.1.0`
- `yarn release-major`: Does a major bump i.e. `1.0.0` to `2.0.0`

_NOTE:_ Version bumps are required for app store submissions. Both Google Play and App Store require unique version codes for each submission.

### Building & Submitting

Build and deployment commands:

- `yarn build-apps` or `eas build --platform all`: Build for both iOS and Android using EAS Build
- `eas build --platform ios`: Build for iOS only
- `eas build --platform android`: Build for Android only
- `yarn submit-apps`: Submit the latest builds to both App Store and Google Play

### First Time Setup

1. Install EAS CLI: `npm install -g eas-cli`
2. Login to your Expo account: `eas login`
3. Configure the project: `eas build:configure`
4. Create required files from examples:
   - Copy `environment-example.js` to `environment.js`
   - Fill in required API keys and secrets
5. Build: `eas build --platform all`

## Testing

We use Jest for both unit tests and integration/cross-stack tests.

- `yarn test`: Run tests in watch mode
- `yarn test-debug`: Run tests in debug mode without coverage
- `yarn test-run`: Run all tests once and exit

## Resources

- [React Native Paper](https://callstack.github.io/react-native-paper/index.html)
- [Material Icons](https://materialdesignicons.com/)
- [Native Base](https://docs.nativebase.io/)
- [Expo](https://docs.expo.io/versions/latest/)
- [Understanding Flexbox](https://yogalayout.com/playground)

## Troubleshooting

- [React-Native Navigation Crash in Android](https://github.com/react-navigation/react-navigation/issues/6919#issuecomment-592093015)
- [Getting Google Maps to work on Android](https://forums.expo.io/t/blank-mapview-on-android-for-standalone-after-publishing/2376/10)

## Standards

[![js-standard-style](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/expo-community/standard-version-expo)
