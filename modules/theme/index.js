import { DefaultTheme } from 'react-native-paper';
import layout from './layout';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3d80fc',
    accent: '#FFE680',
    // primary: '#FFE680',
    // accent: '#3d80fc',
    background: '#F5F5F5',
    black: '#333'
  },
};

export { theme, layout };
