/**
 * confirmLogout - Unit Tests
 *
 * Offline login is permanently disabled (context/auth.context.js), so a
 * promotor who logs out while offline cannot get back in until they
 * reconnect. Logout used to just warn-and-allow in that case; this now
 * blocks it outright with an explanatory alert instead.
 */

import { confirmLogout } from '@modules/settings/confirmLogout';
import { Alert } from 'react-native';

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

const mockCheckOnlineStatus = jest.fn();
jest.mock('@modules/offline', () => (...args) => mockCheckOnlineStatus(...args));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn().mockResolvedValue(null),
}));

describe('confirmLogout', () => {
  let alertSpy;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockCheckOnlineStatus.mockReset();
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('blocks logout outright when offline, with no way to proceed', async () => {
    mockCheckOnlineStatus.mockResolvedValue(false);
    const logOut = jest.fn();

    await confirmLogout(logOut);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [title, , buttons] = alertSpy.mock.calls[0];
    expect(title).toBe('accountSettings.logoutBlockedOfflineTitle');
    expect(buttons).toHaveLength(1);
    expect(buttons.some((b) => b.text === 'accountSettings.logoutConfirm')).toBe(false);

    buttons[0].onPress?.();
    expect(logOut).not.toHaveBeenCalled();
  });

  it('still offers to log out when online', async () => {
    mockCheckOnlineStatus.mockResolvedValue(true);
    const logOut = jest.fn();

    await confirmLogout(logOut);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [title, , buttons] = alertSpy.mock.calls[0];
    expect(title).toBe('accountSettings.logoutTitle');

    const confirmButton = buttons.find((b) => b.text === 'accountSettings.logoutConfirm');
    expect(confirmButton).toBeTruthy();
    confirmButton.onPress();
    expect(logOut).toHaveBeenCalledTimes(1);
  });
});
