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
        plugins: ["react-native-paper/babel"],
      },
    },
  };
};
