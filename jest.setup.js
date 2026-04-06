/**
 * Jest Setup File
 * Global test configuration and mocks
 */

// Setup test environment
process.env.NODE_ENV = 'test';

// Mock SafeAreaContext for all tests
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children, ...props }) => React.createElement('view', props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
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

// Suppress console logs during tests - suppress act() warnings more aggressively
const originalError = console.error;
const originalWarn = console.warn;

global.console = {
  ...console,
  error: (...args) => {
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


