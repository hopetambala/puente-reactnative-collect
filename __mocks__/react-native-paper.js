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
  Text: ({ children }) => React.createElement('text', null, children),
  Title: ({ children }) => React.createElement('text', null, children),
  IconButton: ({ onPress, testID }) => React.createElement('button', { onPress, testID, type: 'button' }),
  useTheme: () => ({
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
  }),
};
