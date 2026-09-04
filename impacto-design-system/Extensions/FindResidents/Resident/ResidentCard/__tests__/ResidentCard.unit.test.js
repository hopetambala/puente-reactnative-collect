import ResidentCard from '@impacto-design-system/Extensions/FindResidents/Resident/ResidentCard';
import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

const resident = {
  objectId: 'abc123',
  fname: 'Rararo',
  lname: 'Long',
  sex: 'male',
  educationLevel: 'someHighSchool',
};

describe('ResidentCard', () => {
  // The card is a paper Card with onPress, which becomes ONE touchable
  // accessibility element and swallows the Text children beneath it. On device
  // that means the resident's name renders visibly but is absent from the
  // accessibility tree: VoiceOver announces nothing useful, and a Maestro flow
  // cannot confirm the resident was attached (measured 2026-09-03 — a 15s wait
  // on the visible name still timed out).
  it('exposes a stable testID for the attached resident card', () => {
    const { getByTestId } = render(<ResidentCard resident={resident} />);

    expect(getByTestId('resident-card')).toBeTruthy();
  });

  it('announces the resident name as its accessibility label', () => {
    const { getByLabelText } = render(<ResidentCard resident={resident} />);

    expect(getByLabelText('Rararo Long')).toBeTruthy();
  });
});
