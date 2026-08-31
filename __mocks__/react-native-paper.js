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
  Button: ({ children, onPress, testID, disabled }) => React.createElement('button', { onPress, testID, disabled, type: 'button' }, children),
  // Rendered by AutoFill and every FormInput. Its absence made those
  // components render `undefined` and crash the test renderer with "Element
  // type is invalid", which reads like a broken import rather than a gap here.
  // Forwards the handlers tests need to fire - focus especially, since that is
  // what tells a form to scroll a field clear of the keyboard.
  TextInput: ({
    label, value, onChangeText, onBlur, onFocus, placeholder, testID, secureTextEntry,
  }) => React.createElement('textinput', {
    accessibilityLabel: label,
    value,
    onChangeText,
    onBlur,
    onFocus,
    placeholder,
    testID,
    secureTextEntry,
  }),
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
