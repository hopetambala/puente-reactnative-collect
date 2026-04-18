// eslint-disable-next-line import/no-unresolved
import { dark as darkTokens, light as lightTokens } from "style-dictionary-dlite-tokens/rn/puente/default";

// Use semantic tokens directly from the design system library
export const tokens = {
  light: lightTokens,
  dark: darkTokens,
};

// Convenience getters for current mode
export const getTokens = (mode) => {
  const selectedTokens = tokens[mode] || tokens.light;
  return selectedTokens;
};

// Helper to get a specific color by path and mode
export const getColor = (mode, path) => {
  const parts = path.split(".");
  let value = getTokens(mode);
  parts.forEach((part) => {
    value = value?.[part];
  });
  return value;
};
