/**
 * Jest Setup File
 * Global test configuration and mocks
 */

// Setup test environment
process.env.NODE_ENV = 'test';

// Mock native alert for all tests
global.alert = jest.fn();

// Mock react-native-gesture-handler for all tests
jest.mock('react-native-gesture-handler', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  // eslint-disable-next-line global-require
  const { View, TouchableOpacity, ScrollView } = require('react-native');
  const PassThrough = ({ children, ...props }) => React.createElement(View, props, children);
  return {
    ScrollView: ({ children, ...props }) => React.createElement(ScrollView, props, children),
    TouchableWithoutFeedback: ({ children, onPress, ...props }) => React.createElement(TouchableOpacity, { onPress, ...props }, children),
    TouchableOpacity: ({ children, onPress, ...props }) => React.createElement(TouchableOpacity, { onPress, ...props }, children),
    GestureHandlerRootView: PassThrough,
    PanGestureHandler: PassThrough,
    State: {},
    Directions: {},
  };
});

// Mock SafeAreaContext for all tests
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children, ...props }) => React.createElement('view', props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});

// Mock AlertContext for all tests with usable default
jest.mock('@app/context/alert.context', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  const AlertContext = React.createContext();

  // Provider wrapper to give tests a way to provide context
  const AlertContextProvider = ({ children }) => {
    const value = React.useMemo(
      () => ({
        alert: jest.fn(),
        dismiss: jest.fn(),
        visible: false,
        message: '',
      }),
      []
    );
    return AlertContext.Provider
      ? React.createElement(
        AlertContext.Provider,
        { value },
        children
      )
      : children;
  };

  return {
    AlertContext,
    AlertContextProvider,
  };
});

// Mock AsyncStorage globally with in-memory store
const asyncStorageStore = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key) => Promise.resolve(asyncStorageStore[key] || null)),
  setItem: jest.fn((key, value) => {
    asyncStorageStore[key] = value;
    return Promise.resolve(undefined);
  }),
  removeItem: jest.fn((key) => {
    delete asyncStorageStore[key];
    return Promise.resolve(undefined);
  }),
  multiGet: jest.fn((keys) =>
    Promise.resolve(
      keys.map((key) => [key, asyncStorageStore[key] || null])
    )
  ),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([key, value]) => {
      asyncStorageStore[key] = value;
    });
    return Promise.resolve(undefined);
  }),
  clear: jest.fn(() => {
    Object.keys(asyncStorageStore).forEach((key) => {
      delete asyncStorageStore[key];
    });
    return Promise.resolve(undefined);
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(asyncStorageStore))),
}));

// Mock react-native-reanimated and react-native-worklets
const mockAnimationChain = {
  damping: jest.fn(function dapmingFn() { return this; }),
  stiffness: jest.fn(function stiffnessFn() { return this; }),
  duration: jest.fn(function durationFn() { return this; }),
  delay: jest.fn(function delayFn() { return this; }),
  springify: jest.fn(function springifyFn() { return this; }),
};

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  cancelAnimation: jest.fn(),
  default: {
    View: ({ children }) => children || null,
    Text: ({ children }) => children || null,
    Image: ({ children }) => children || null,
    createAnimatedComponent: (Component) => Component,
  },
  Easing: {
    in: jest.fn(),
    out: jest.fn(),
    inOut: jest.fn(),
    bezier: jest.fn(),
    circle: jest.fn(),
    ease: jest.fn(),
  },
  Keyframe: class {
    // eslint-disable-next-line no-useless-constructor
    constructor() {
      // Mock constructor for Reanimated Keyframe
    }

    delay() { return this; }

    duration() { return this; }
  },
  ZoomIn: {
    springify: jest.fn(() => ({
      damping: jest.fn(function dapmingFn() { return this; }),
      stiffness: jest.fn(function stiffnessFn() { return this; }),
      duration: jest.fn(function durationFn() { return this; }),
    })),
  },
  ZoomOut: {
    springify: jest.fn(() => ({
      damping: jest.fn(function dapmingFn() { return this; }),
      stiffness: jest.fn(function stiffnessFn() { return this; }),
      duration: jest.fn(function durationFn() { return this; }),
    })),
  },
  FadeIn: {
    springify: jest.fn(() => ({
      damping: jest.fn(function dapmingFn() { return this; }),
      stiffness: jest.fn(function stiffnessFn() { return this; }),
      duration: jest.fn(function durationFn() { return this; }),
    })),
  },
  useAnimatedStyle: () => ({}),
  useSharedValue: () => ({ value: 0 }),
  runOnJS: (fn) => fn,
  withTiming: jest.fn(),
}));

jest.mock('react-native-worklets', () => ({
  // Empty mock to prevent initialization errors
}));

// Mock design system components that depend on native modules
jest.mock('@impacto-design-system/Base', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  // eslint-disable-next-line global-require
  const { Text, TouchableOpacity } = require('react-native');
  const noop = () => null;
  const PassThrough = ({ children }) => React.createElement(React.Fragment, null, children);
  const Button = ({ onPress, children, buttonText, testID, ...rest }) => React.createElement(
    TouchableOpacity, { onPress, testID }, React.createElement(Text, null, buttonText || children)
  );
  const PopupError = noop;
  const PopupSuccess = noop;
  const Toast = noop;
  const GlassContainer = PassThrough;
  const GlassView = PassThrough;
  const ImpactoText = ({ children }) => React.createElement(Text, null, children);
  return {
    Button, PopupError, PopupSuccess, Toast, GlassContainer, GlassView, Text: ImpactoText,
  };
});

jest.mock('@impacto-design-system/Extensions', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  // eslint-disable-next-line global-require
  const { TextInput, View } = require('react-native');
  const noop = () => null;
  // PaperInputPicker renders a real TextInput so getByDisplayValue works in tests
  // It reads value from formikProps.values[data.formikKey] to simulate real behavior
  const PaperInputPicker = ({ formikProps, data }) => {
    const fieldKey = data?.formikKey || data?.name;
    // For multiInputRowNum, render each sub-option as its own TextInput
    if (data?.fieldType === 'multiInputRowNum' && Array.isArray(data?.options)) {
      return React.createElement(
        React.Fragment,
        null,
        ...data.options.map((opt) => {
          const subValue = formikProps?.values?.[opt.value];
          const strVal = subValue !== undefined && subValue !== null ? String(subValue) : '';
          return React.createElement(TextInput, { key: opt.value, value: strVal, testID: `field-${opt.value}` });
        })
      );
    }
    if (data?.fieldType === 'geolocation') {
      const locValue = formikProps?.values?.[fieldKey];
      return React.createElement(
        View,
        { testID: 'locationPreview' },
        React.createElement(TextInput, { value: JSON.stringify(locValue || {}), testID: `field-${fieldKey}` })
      );
    }
    const fieldValue = formikProps?.values?.[fieldKey];
    const strValue = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : '';
    return React.createElement(TextInput, { value: strValue, testID: `field-${fieldKey}` });
  };
  return {
    ErrorPicker: noop,
    PaperInputPicker,
    YupValidationPicker: noop,
    FormInput: noop,
    FormikFields: noop,
    AssetSearchbar: noop,
    FindResidents: noop,
    Header: noop,
    LanguagePicker: noop,
    ResidentIdSearchbar: noop,
    TabBarIcon: noop,
    TermsModal: noop,
  };
});

// Sub-path mocks for components that import directly from deep paths
jest.mock('@impacto-design-system/Base/PopupError', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  const noop = () => React.createElement(React.Fragment, null);
  return { __esModule: true, default: noop };
});

jest.mock('@impacto-design-system/Extensions/FormikFields/ErrorPicker', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  const noop = () => React.createElement(React.Fragment, null);
  return { __esModule: true, default: noop };
});

jest.mock('@impacto-design-system/Extensions/FormikFields/PaperInputPicker', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  // eslint-disable-next-line global-require
  const { TextInput, View } = require('react-native');
  const PaperInputPicker = ({ formikProps, data }) => {
    const fieldKey = data?.formikKey || data?.name;
    if (data?.fieldType === 'geolocation') {
      const locValue = formikProps?.values?.[fieldKey];
      return React.createElement(
        View,
        { testID: 'locationPreview' },
        React.createElement(TextInput, { value: JSON.stringify(locValue || {}), testID: `field-${fieldKey}` })
      );
    }
    if (data?.fieldType === 'multiInputRowNum' && Array.isArray(data?.options)) {
      return React.createElement(
        React.Fragment,
        null,
        ...data.options.map((opt) => {
          const subValue = formikProps?.values?.[opt.value];
          const strVal = subValue !== undefined && subValue !== null ? String(subValue) : '';
          return React.createElement(TextInput, { key: opt.value, value: strVal, testID: `field-${opt.value}` });
        })
      );
    }
    const fieldValue = formikProps?.values?.[fieldKey];
    const strValue = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : '';
    return React.createElement(TextInput, { value: strValue, testID: `field-${fieldKey}` });
  };
  return { __esModule: true, default: PaperInputPicker };
});

jest.mock('@impacto-design-system/Extensions/FormikFields/YupValidation', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  const noop = () => React.createElement(React.Fragment, null);
  return { __esModule: true, default: noop };
});

jest.mock('@impacto-design-system/Cards/ModernCard', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, onPress }) => {
      // eslint-disable-next-line global-require
      const { View } = require('react-native');
      return React.createElement(View, { onPress }, children);
    },
  };
});

// Suppress console logs during tests - suppress act() warnings more aggressively
const originalError = console.error; // eslint-disable-line no-console

global.console = {
  ...console,
  error: (...args) => { // eslint-disable-line no-console
    // Suppress act() warnings but allow other errors
    const message = JSON.stringify(args);
    if (message.includes('act(') || message.includes('not wrapped in act')) {
      return; // Suppress act() warnings
    }
    // Still print real errors
    if (!message.includes('jest')) {
      originalError.call(console, ...args);
    }
  },
  warn: jest.fn(), // Suppress all warnings
  log: jest.fn(), // Suppress logs
  info: jest.fn(),
  debug: jest.fn(),
};

// Increase test timeout for async operations
jest.setTimeout(15000);


