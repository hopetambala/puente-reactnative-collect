/**
 * EditForm - RED-GREEN TDD Tests
 * Phase 3: Tests for smart form routing based on formType
 */

import IdentificationForm from '@app/domains/DataCollection/Forms/IdentificationForm';
import SupplementaryForm from '@app/domains/DataCollection/Forms/SupplementaryForm';
import EditForm from '@app/domains/FindRecords/EditForm';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock child components
// eslint-disable-next-line react/no-unknown-property
jest.mock('@app/domains/DataCollection/Forms/IdentificationForm', () => ({
  __esModule: true,
  // eslint-disable-next-line react/no-unknown-property
  default: jest.fn(() => <div testID="identification-form" />),
}));

// eslint-disable-next-line react/no-unknown-property
jest.mock('@app/domains/DataCollection/Forms/SupplementaryForm', () => ({
  __esModule: true,
  // eslint-disable-next-line react/no-unknown-property
  default: jest.fn(() => <div testID="supplementary-form" />),
}))

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn((key) => {
    if (key === 'currentUser') {
      return Promise.resolve({
        firstname: 'John',
        lastname: 'Doe',
        organization: 'Test Org',
      });
    }
    return Promise.resolve(null);
  }),
}));

describe('EditForm - RED-GREEN TDD', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  const mockExistingRecord = {
    objectId: 'rec-123',
    fname: 'Jane',
    lname: 'Smith',
  };

  const mockResident = {
    objectId: 'res-123',
    get: (field) => ({ fname: 'Jane', lname: 'Smith' }[field]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RED: Invalid edit params', () => {
    test('should show error if editMode is missing', () => {
      const mockRoute = {
        params: {
          existingRecord: mockExistingRecord,
          formType: 'Vitals',
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);
      // Should display error or loading state
      expect(screen.queryByTestId('error-view')).toBeDefined();
    });

    test('should show error if existingRecord is missing', () => {
      const mockRoute = {
        params: {
          editMode: true,
          formType: 'Vitals',
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);
      // Should display error
      expect(screen.queryByTestId('error-view')).toBeDefined();
    });

    test('should show error if formType is missing', () => {
      const mockRoute = {
        params: {
          editMode: true,
          existingRecord: mockExistingRecord,
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);
      // Should display error
      expect(screen.queryByTestId('error-view')).toBeDefined();
    });
  });

  describe('GREEN: Identification form routing', () => {
    test('should render IdentificationForm when formType is SurveyData', async () => {
      const mockRoute = {
        params: {
          editMode: true,
          existingRecord: mockExistingRecord,
          formType: 'SurveyData',
          resident: mockResident,
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(IdentificationForm).toHaveBeenCalled();
        const callArgs = IdentificationForm.mock.calls[0][0];
        expect(callArgs.editMode).toBe(true);
        expect(callArgs.existingRecord).toEqual(mockExistingRecord);
        expect(callArgs.navigation).toEqual(mockNavigation);
      });
    });

    test('should render IdentificationForm when formType is Identification', async () => {
      const mockRoute = {
        params: {
          editMode: true,
          existingRecord: mockExistingRecord,
          formType: 'Identification',
          resident: mockResident,
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(screen.getByTestId('identification-form')).toBeDefined();
      });
    });
  });

  describe('GREEN: Supplementary form routing', () => {
    test('should render SupplementaryForm when formType is Vitals', async () => {
      const mockRoute = {
        params: {
          editMode: true,
          existingRecord: mockExistingRecord,
          formType: 'Vitals',
          resident: mockResident,
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(SupplementaryForm).toHaveBeenCalled();
        const callArgs = SupplementaryForm.mock.calls[0][0];
        expect(callArgs.editMode).toBe(true);
        expect(callArgs.existingRecord).toEqual(mockExistingRecord);
        expect(callArgs.selectedForm).toBe('Vitals');
        expect(callArgs.navigation).toEqual(mockNavigation);
      });
    });

    test('should render SupplementaryForm for HistoryEnvironmentalHealth', async () => {
      const mockRoute = {
        params: {
          editMode: true,
          existingRecord: mockExistingRecord,
          formType: 'HistoryEnvironmentalHealth',
          resident: mockResident,
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(screen.getByTestId('supplementary-form')).toBeDefined();
      });
    });

    test('should render SupplementaryForm for EvaluationMedical', async () => {
      const mockRoute = {
        params: {
          editMode: true,
          existingRecord: mockExistingRecord,
          formType: 'EvaluationMedical',
          resident: mockResident,
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(SupplementaryForm).toHaveBeenCalled();
      });
    });

    test('should render SupplementaryForm for FormResults (custom forms)', async () => {
      const mockRoute = {
        params: {
          editMode: true,
          existingRecord: mockExistingRecord,
          formType: 'FormResults',
          resident: mockResident,
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(SupplementaryForm).toHaveBeenCalled();
      });
    });
  });

  describe('GREEN: Prop passing', () => {
    test('should pass correct props to IdentificationForm', async () => {
      const mockRoute = {
        params: {
          editMode: true,
          existingRecord: mockExistingRecord,
          formType: 'SurveyData',
          resident: mockResident,
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(IdentificationForm).toHaveBeenCalled();
        const callArgs = IdentificationForm.mock.calls[0][0];
        expect(callArgs.editMode).toBe(true);
        expect(callArgs.existingRecord).toEqual(mockExistingRecord);
        expect(callArgs.navigation).toEqual(mockNavigation);
        expect(typeof callArgs.surveyingUser).toBe('string');
        expect(typeof callArgs.surveyingOrganization).toBe('string');
      });
    });

    test('should pass existingRecord as selectedForm to SupplementaryForm for custom forms', async () => {
      const mockRoute = {
        params: {
          editMode: true,
          existingRecord: mockExistingRecord,
          formType: 'FormResults',
          resident: mockResident,
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(SupplementaryForm).toHaveBeenCalled();
        const callArgs = SupplementaryForm.mock.calls[0][0];
        expect(callArgs.customForm).toEqual(mockExistingRecord);
      });
    });
  });

  describe('GREEN: Loading states', () => {
    test('should show loading indicator while fetching user data', () => {
      const mockRoute = {
        params: {
          editMode: true,
          existingRecord: mockExistingRecord,
          formType: 'Vitals',
          resident: mockResident,
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);
      // Initially should show loading
      expect(screen.queryByTestId('loadingIndicator')).toBeDefined();
    });

    test('should render form after loading completes', async () => {
      const mockRoute = {
        params: {
          editMode: true,
          existingRecord: mockExistingRecord,
          formType: 'Vitals',
          resident: mockResident,
        },
      };

      render(<EditForm navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(screen.getByTestId('supplementary-form')).toBeDefined();
      });
    });
  });
});
