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
          // TEMPORARILY DISABLED: Testing if react-native-paper/babel causes production crash
          // "react-native-paper/babel",
        ],
      },
    },
  };
};
