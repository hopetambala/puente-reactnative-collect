import DevOfflineToggle from '@app/domains/Settings/DevOfflineToggle/index';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('react-native-paper', () => {
  const mockColors = { primary: '#000', background: '#fff', text: '#000', onSurface: '#000' };
  return {
    useTheme: () => ({ colors: mockColors }),
    Switch: ({ value, onValueChange, testID }) => {
      const { View, TouchableOpacity } = require('react-native');
      return (
        <TouchableOpacity testID={testID} onPress={() => onValueChange(!value)}>
          <View>{value ? 'ON' : 'OFF'}</View>
        </TouchableOpacity>
      );
    },
    Text: ({ children }) => {
      const { Text: RNText } = require('react-native');
      return <RNText>{children}</RNText>;
    },
  };
});

jest.mock('@modules/async-storage', () => ({
  storeData: jest.fn().mockResolvedValue(undefined),
  getData: jest.fn().mockResolvedValue(null),
  deleteData: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line global-require
const { storeData, getData, deleteData } = require('@modules/async-storage');

describe('DevOfflineToggle', () => {
  let savedDev;

  beforeEach(() => {
    savedDev = global.__DEV__;
    jest.clearAllMocks();
    getData.mockResolvedValue(null);
  });

  afterEach(() => {
    global.__DEV__ = savedDev;
  });

  describe('when __DEV__ is true', () => {
    beforeEach(() => {
      global.__DEV__ = true;
    });

    it('renders a label containing "Force Offline Mode"', async () => {
      render(<DevOfflineToggle />);

      await waitFor(() => {
        expect(screen.getByText(/force offline mode/i)).toBeTruthy();
      });
    });

    it('renders the switch in the OFF state when AsyncStorage has no DEV_FORCE_OFFLINE key', async () => {
      getData.mockResolvedValue(null);

      render(<DevOfflineToggle />);

      await waitFor(() => {
        expect(screen.getByText('OFF')).toBeTruthy();
      });
    });

    it('calls storeData with "DEV_FORCE_OFFLINE" and true when the switch is pressed while OFF', async () => {
      getData.mockResolvedValue(null);

      render(<DevOfflineToggle />);

      await waitFor(() => {
        expect(screen.getByText('OFF')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('dev-offline-toggle'));

      await waitFor(() => {
        expect(storeData).toHaveBeenCalledWith(true, 'DEV_FORCE_OFFLINE');
      });
    });

    it('calls deleteData with "DEV_FORCE_OFFLINE" when the switch is pressed while ON', async () => {
      getData.mockResolvedValue(true);

      render(<DevOfflineToggle />);

      await waitFor(() => {
        expect(screen.getByText('ON')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('dev-offline-toggle'));

      await waitFor(() => {
        expect(deleteData).toHaveBeenCalledWith('DEV_FORCE_OFFLINE');
      });
    });
  });

  describe('when __DEV__ is false', () => {
    beforeEach(() => {
      global.__DEV__ = false;
    });

    it('renders nothing', async () => {
      const { toJSON } = render(<DevOfflineToggle />);

      await waitFor(() => {
        expect(toJSON()).toBeNull();
      });
    });
  });
});
