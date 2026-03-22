// Shadow elevation system for depth and hierarchy
// 3-level system: subtle (resting), medium (hover/focus), prominent (modal/overlay)

export const shadows = {
  // Subtle shadow - resting state for cards, inputs
  subtle: {
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  // Medium shadow - elevated state, hover, focus
  medium: {
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },

  // Prominent shadow - modals, overlays, highest elevation
  prominent: {
    shadowColor: "rgba(0, 0, 0, 0.15)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },

  // None - flat design
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Aliases
  resting: undefined, // will be subtle
  hover: undefined, // will be medium
  active: undefined, // will be medium
  pressed: undefined, // will be subtle
  modal: undefined, // will be prominent
};

// Assign aliases after definition
shadows.resting = shadows.subtle;
shadows.hover = shadows.medium;
shadows.active = shadows.medium;
shadows.pressed = shadows.subtle;
shadows.modal = shadows.prominent;

export default shadows;
