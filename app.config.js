/* eslint-disable no-undef */
module.exports = () => {
  return {
    expo: {
      name: 'Collect',
      slug: 'puente-reactnative-collect',
      platforms: ['ios', 'android', 'web'],
      version: '12.7.0',
      orientation: 'portrait',
      icon: './assets/images/icon.png',
      scheme: 'myapp',
      splash: {
        image: './assets/images/splash.png',
        backgroundColor: '#3d80fc',
      },
      updates: {
        fallbackToCacheTimeout: 0,
      },
      assetBundlePatterns: ['**/*'],
      ios: {
        supportsTablet: true,
        buildNumber: '12.7.0',
        infoPlist: {
          NSLocationWhenInUseUsageDescription: 'This app uses your location to geo-tag surveys accurately.',
          NSCameraUsageDescription: 'This app uses photos to identify residents more accurately.',
          NSPhotoLibraryUsageDescription: 'This app uses the photo gallery to let you choose photos to identify residents more accurately.',
          ITSAppUsesNonExemptEncryption: false,
        },
        appStoreUrl: 'https://apps.apple.com/us/app/puente-collect/id1362371696',
        bundleIdentifier: 'io.ionic.starter1270348',
        googleServicesFile: './expo-resources/ios/GoogleService-Info.plist',
      },
      web: {
        favicon: './assets/images/favicon.png',
      },
      android: {
        versionCode: 490120700,
        permissions: [
          'ACCESS_COARSE_LOCATION',
          'ACCESS_FINE_LOCATION',
          'INTERNET',
        ],
        softwareKeyboardLayoutMode: 'pan',
        googleServicesFile: './expo-resources/android/google-services.json',
        package: 'io.ionic.starter1270348',
        config: {
          googleMaps: {
            apiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyD_exampleApiKey',
          },
        },
      },
      packagerOpts: {
        config: 'metro.config.js',
        sourceExts: [
          'expo.ts',
          'expo.tsx',
          'expo.js',
          'expo.jsx',
          'ts',
          'tsx',
          'js',
          'jsx',
          'json',
          'wasm',
          'svg',
        ],
      },
      extra: {
        eas: {
          projectId: '04cfb8a1-9de3-4228-91d4-d2f43aeaed27',
        },
      },
      plugins: ['expo-localization'],
    },
  };
};
