module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@impacto-design-system": "./impacto-design-system",
            "@modules": "./modules",
            "@assets": "./assets",
            "@context": "./context",
            "@app": ".",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
    env: {
      production: {
        plugins: [
          // DISABLED: react-native-paper/babel plugin corrupts bundle transformation
          // causing Hermes VM crashes during startup. See: https://github.com/hopetambala/puente-reactnative-collect/issues/XXX
          // "react-native-paper/babel",
        ],
      },
    },
  };
};
