/**
 * offlineLoginError copy - Unit Tests
 *
 * Offline login is permanently disabled (context/auth.context.js), always
 * failing regardless of what was typed. The old copy told the user to
 * "check your credentials" -- which blames the wrong thing and sends them
 * back to re-type a correct password for no reason. It must instead say
 * offline login isn't available and an internet connection is needed.
 */
import en from '@modules/i18n/english/en.json';
import hk from '@modules/i18n/kreyol/hk.json';
import es from '@modules/i18n/spanish/es.json';

describe('signIn.offlineLoginError copy', () => {
  it('does not blame the user credentials', () => {
    expect(en.signIn.offlineLoginError).not.toMatch(/credential/i);
    expect(es.signIn.offlineLoginError).not.toMatch(/credencial/i);
    expect(hk.signIn.offlineLoginError).not.toMatch(/kalifikasyon/i);
  });

  it('explains that an internet connection is required', () => {
    expect(en.signIn.offlineLoginError).toMatch(/internet connection/i);
    expect(es.signIn.offlineLoginError).toMatch(/conexión a internet/i);
    expect(hk.signIn.offlineLoginError).toMatch(/koneksyon entènèt/i);
  });
});
