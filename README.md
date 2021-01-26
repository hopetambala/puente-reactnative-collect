# Puente - Collect
[![made with expo](https://img.shields.io/badge/MADE%20WITH%20EXPO-000.svg?style=for-the-badge&logo=expo&labelColor=4630eb&logoWidth=20)](https://github.com/expo/expo) [![supports iOS and Android](https://img.shields.io/badge/Platforms-Native-4630EB.svg?style=for-the-badge&logo=EXPO&labelColor=000&logoColor=fff)](https://github.com/expo/expo)

[![Build Status](https://travis-ci.com/hopetambala/puente-reactnative-collect.svg?branch=master)](https://travis-ci.com/hopetambala/puente-reactnative-collect)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/490748505d184028b66bbdaf9c83f887)](https://app.codacy.com/manual/hopetambala/puente-reactnative-collect?utm_source=github.com&utm_medium=referral&utm_content=hopetambala/puente-reactnative-collect&utm_campaign=Badge_Grade_Dashboard)
[![codecov](https://codecov.io/gh/hopetambala/puente-reactnative-collect/branch/master/graph/badge.svg)](https://codecov.io/gh/hopetambala/puente-reactnative-collect)

Here are some quick npm commands to get started:
- `npm install`: Install Node dependencies
- `npm start`: Start expo.
- `npm test`: Run the test suit and watch for changes.
- `npm build`: Build a production optimized bundle of the app.
- `npm lint-fix`: Run the ESLinter.

## Async Storage Values

| Name of Value  | Description of Data                                                               |
|----------------|-----------------------------------------------------------------------------------|
| `organization` | Name of the surveying users surveyingOrganization                                 |
| `residentData` | All `SurveyData` parse model data stored based on the users surveyingOrganization |
| `offlineIDForms`| All `SurveyData` forms collected when user is offline                            |
| `offlineSupForms`| All Supplementary/Custom forms collected when user is offline                   |
| `offlineHouseholds`| All `Household` parse model created when user is offline                      |
| `offlineHouseholdsRelation`| All `Household` parse model with relation to other households created when user is offline |

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
"textKey": "__KEY__OTHER"
  - __: The double underscore at the beginning of the key is required. No other keys in the config use this and CANNOT use the double underscore or there will be errors
  - KEY: this portion of the textKey needs to be an exact match to the formikKey of the field
  - __: Second double underscore is also required. Without the first double underscore it will not matter.
  - OTHER: This portion of the key is a direct match to the value of the select option. This is required to append the text input value to the original value in the array
  - none of these values need to be capitalized

## Deployment
### Secrets
This project dynamically creates the required `app.json` in order to avoid commit secret keys in the project. The related commands are: 
- `npm run prepublish`: Generates an `app.generated.json` that we use for the rest of the deployment process. It runs a script in `scripts/dynamic-env` that does a deep merge of our `app.secrets.json` file with all our application keys and `app.json` to create `app.generated.json`. This will have to be run before publishing to the store

### Standalone apps
For releases and bumping versions of `app.json`, we have:
- `npm run release-patch`: Does a patch bump i.e. `1.0.0` to `1.0.1`
- `npm run release-minor`: Does a minor bump i.e. `1.0.0` to `1.1.0`
- `npm run release-major`: Does a major bump i.e. `1.0.0` to `2.0.0`

*NOTE* it is REQUIRED to do some sort of bump in order for the app to be upload to its respective stores. Google Play and Itunes Connect disallows applications with the same bundleIdentifier or packageNumber in the store.

Lastly for actual deployment, we have:
- `npm run publish-staging`: Runs `npm run prepublish` which generates our `app.generated.json` and publishes a staging application to Exp
- `npm run publish-prod`: Runs `npm run prepublish` which generates our `app.generated.json` and publishes a production application to Expo
- `npm run upload`: Uploads the lates staging or production application (uploaded in Expo) to both Google Play and iTunes Connect

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
