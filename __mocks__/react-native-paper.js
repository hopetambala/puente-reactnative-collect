// Mock for react-native-paper
// eslint-disable-next-line global-require
const React = require('react');

module.exports = {
  DefaultTheme: {
    colors: {
      primary: '#007AFF',
      onPrimary: '#FFFFFF',
      secondary: '#5AC8FA',
      onSecondary: '#000000',
      error: '#FF3B30',
      onError: '#FFFFFF',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      onSurface: '#000000',
      outline: '#CCCCCC',
      outlineVariant: '#DDDDDD',
      surfaceVariant: '#F5F5F5',
      onSurfaceVariant: '#666666',
    },
  },
  MD3DarkTheme: {
    colors: {
      primary: '#007AFF',
      onPrimary: '#FFFFFF',
      secondary: '#5AC8FA',
      onSecondary: '#000000',
      error: '#FF3B30',
      onError: '#FFFFFF',
      background: '#121212',
      surface: '#1E1E1E',
      onSurface: '#FFFFFF',
      outline: '#444444',
      outlineVariant: '#333333',
      surfaceVariant: '#2C2C2C',
      onSurfaceVariant: '#AAAAAA',
    },
  },
  // accessibilityLabel is forwarded because real paper forwards it to the
  // underlying Touchable. Dropping it here makes an a11y assertion read
  // `undefined` and look like a missing label in the component under test.
  Button: ({
    children, onPress, testID, disabled, accessibilityLabel, mode,
  }) => React.createElement('button', {
    onPress, testID, disabled, accessibilityLabel, mode, type: 'button',
  }, children),
  // Rendered by AutoFill and every FormInput. Its absence made those
  // components render `undefined` and crash the test renderer with "Element
  // type is invalid", which reads like a broken import rather than a gap here.
  // Forwards the handlers tests need to fire - focus especially, since that is
  // what tells a form to scroll a field clear of the keyboard.
  TextInput: ({
    label, value, onChangeText, onBlur, onFocus, placeholder, testID, secureTextEntry,
    // Real paper spreads unrecognised props onto the native TextInput. These
    // two decide which keyboard appears and whether it carries a dismiss bar,
    // so a mock that swallows them cannot be used to test either.
    keyboardType, inputAccessoryViewID,
  }) => React.createElement('textinput', {
    accessibilityLabel: label,
    value,
    onChangeText,
    onBlur,
    onFocus,
    placeholder,
    testID,
    secureTextEntry,
    keyboardType,
    inputAccessoryViewID,
  }),
  // Rendered by the GDPR consent screen. Its absence made that component
  // render `undefined` and crash the test renderer with "Element type is
  // invalid", which reads like a broken import rather than a gap here.
  // `status` is forwarded so a test can assert checked/unchecked.
  Checkbox: ({ status, disabled, testID }) => React.createElement('checkbox', {
    status, disabled, testID,
  }),
  // Rendered by ResidentCard. On device a paper Card with onPress collapses to
  // ONE touchable accessibility element, so forward the props a test needs to
  // assert that the card identifies itself rather than swallowing its children.
  Card: ({ children, onPress, testID, accessibilityLabel, accessibilityRole }) =>
    React.createElement('card', {
      onPress, testID, accessibilityLabel, accessibilityRole,
    }, children),
  Text: ({ children }) => React.createElement('text', null, children),
  Title: ({ children }) => React.createElement('text', null, children),
  IconButton: ({ onPress, testID }) => React.createElement('button', { onPress, testID, type: 'button' }),
  useTheme: () => ({
    dark: false,
    colors: {
      primary: '#007AFF',
      onPrimary: '#FFFFFF',
      secondary: '#5AC8FA',
      onSecondary: '#000000',
      error: '#FF3B30',
      onError: '#FFFFFF',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      onSurface: '#000000',
      outline: '#CCCCCC',
      outlineVariant: '#DDDDDD',
      surfaceVariant: '#F5F5F5',
      onSurfaceVariant: '#666666',
      surfaceOverlay: '#000000',
    },
  }),
};
