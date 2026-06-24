/**
 * IdentificationFormWrapper unit test
 * Proves that surveyingOrganization prop is forwarded to PaperInputPicker
 */

import { AlertContextProvider } from '@app/context/alert.context';
import IdentificationFormWrapper from '@app/domains/DataCollection/Forms/IdentificationForm/index';
import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@modules/cached-resources', () => ({
  postIdentificationForm: jest.fn(),
  invalidateResidentCache: jest.fn(),
}));

jest.mock('@app/services/parse/crud', () => ({
  updateObjectInClass: jest.fn(),
}));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn((key) => {
    if (key === 'currentUser') {
      return Promise.resolve({
        id: 'user-123',
        objectId: 'user-123',
        firstname: 'Admin',
        lastname: 'User',
      });
    }
    return Promise.resolve(null);
  }),
  storeData: jest.fn(),
}));

// Capture received props in a module-level array so the factory can write to it
// without needing an out-of-scope jest.fn reference
const mockCapturedProps = [];

// Override the global Extensions mock to capture what props PaperInputPicker receives
jest.mock('@impacto-design-system/Extensions', () => {
  const noop = () => null;
  return {
    ErrorPicker: noop,
    PaperInputPicker: (props) => {
      mockCapturedProps.push(props);
      return null;
    },
    YupValidationPicker: () => null,
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

describe('IdentificationFormWrapper — surveyingOrganization prop forwarding', () => {
  beforeEach(() => {
    mockCapturedProps.length = 0;
  });

  it('passes surveyingOrganization to PaperInputPicker for every input field', () => {
    render(
      <AlertContextProvider>
        <IdentificationFormWrapper
          surveyingOrganization="test-org"
          surveyingUser="Test User"
          scrollViewScroll={false}
          setScrollViewScroll={jest.fn()}
          setSelectedForm={jest.fn()}
          setSurveyee={jest.fn()}
        />
      </AlertContextProvider>
    );

    // PaperInputPicker must have been called at least once
    expect(mockCapturedProps.length).toBeGreaterThan(0);

    // Every call must receive surveyingOrganization="test-org"
    const allReceiveOrg = mockCapturedProps.every(
      (props) => props.surveyingOrganization === 'test-org'
    );

    expect(allReceiveOrg).toBe(true);
  });
});
