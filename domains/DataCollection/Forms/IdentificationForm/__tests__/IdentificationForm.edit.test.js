/**
 * IdentificationForm Edit Mode - RED-GREEN TDD Tests
 * Phase 4: Tests for dual-mode (CREATE/EDIT) form with field pre-population
 */

import { AlertContextProvider } from '@app/context/alert.context';
import IdentificationFormWrapper from '@app/domains/DataCollection/Forms/IdentificationForm/index';
import { updateObjectInClass } from '@app/services/parse/crud';
import { postIdentificationForm } from '@modules/cached-resources';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@modules/cached-resources');
jest.mock('@app/services/parse/crud');
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

describe('IdentificationForm Edit Mode - RED-GREEN TDD', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  const mockExistingRecord = {
    objectId: 'id-123',
    fname: 'John',
    lname: 'Doe',
    nickname: 'JD',
    sex: 'M',
    dob: '05/15/1990',
    phone: '555-1234',
    marriageStatus: 'married',
    educationLevel: 'primary',
    communityname: 'Springfield',
    location: { latitude: 0, longitude: 0 },
  };

  // Helper to render component with AlertContextProvider
  const renderWithContext = (component) => render(
    <AlertContextProvider>
      {component}
    </AlertContextProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RED: Create mode (existing behavior)', () => {
    test('should initialize with empty form values in create mode', () => {
      renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
        />
      );

      // Form inputs should be empty in create mode
      expect(screen.queryByDisplayValue('John')).toBeNull();
    });

    test('should submit with postIdentificationForm in create mode', async () => {
      postIdentificationForm.mockResolvedValue({
        objectId: 'new-id',
        fname: 'Jane',
        lname: 'Smith',
      });

      const { getByTestId } = renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
        />
      );

      // Fill form and submit
      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(postIdentificationForm).toHaveBeenCalled();
        expect(updateObjectInClass).not.toHaveBeenCalled();
      });
    });
  });

  describe('RED: Edit mode - no pre-population', () => {
    test('should NOT pre-populate if editMode is false', () => {
      renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          editMode={false}
        />
      );

      // Should have empty form
      expect(screen.queryByDisplayValue('John')).toBeNull();
    });

    test('should NOT pre-populate if existingRecord is missing', () => {
      renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          editMode
        />
      );

      // Should have empty form
      expect(screen.queryByDisplayValue('John')).toBeNull();
    });
  });

  describe('GREEN: Edit mode - field pre-population', () => {
    test('should pre-populate simple text fields', async () => {
      const { getByDisplayValue } = renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          editMode
          existingRecord={mockExistingRecord}
        />
      );

      await waitFor(() => {
        expect(getByDisplayValue('John')).toBeDefined();
        expect(getByDisplayValue('Doe')).toBeDefined();
        expect(getByDisplayValue('JD')).toBeDefined();
        expect(getByDisplayValue('555-1234')).toBeDefined();
      });
    });

    test('should reverse-map DOB field from MM/DD/YYYY to Month/Day/Year', async () => {
      const { getByDisplayValue } = renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          editMode
          existingRecord={mockExistingRecord}
        />
      );

      await waitFor(() => {
        // DOB "05/15/1990" should be split into Month=05, Day=15, Year=1990
        expect(getByDisplayValue('05')).toBeDefined(); // Month
        expect(getByDisplayValue('15')).toBeDefined(); // Day
        expect(getByDisplayValue('1990')).toBeDefined(); // Year
      });
    });

    test('should pre-populate select fields', async () => {
      const { getByDisplayValue } = renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          editMode
          existingRecord={mockExistingRecord}
        />
      );

      await waitFor(() => {
        expect(getByDisplayValue('married')).toBeDefined();
        expect(getByDisplayValue('primary')).toBeDefined();
      });
    });

    test('should pre-populate location coordinates', async () => {
      const recordWithLocation = {
        ...mockExistingRecord,
        latitude: 40.7128,
        longitude: -74.0060,
      };

      renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          editMode
          existingRecord={recordWithLocation}
        />
      );

      await waitFor(() => {
        // Location should be pre-populated
        expect(screen.getByTestId('locationPreview')).toBeDefined();
      });
    });
  });

  describe('GREEN: Edit mode - conditional submission', () => {
    test('should call updateObjectInClass in edit mode', async () => {
      updateObjectInClass.mockResolvedValue(mockExistingRecord);

      const { getByTestId } = renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          editMode
          existingRecord={mockExistingRecord}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(updateObjectInClass).toHaveBeenCalledWith(
          'SurveyData',
          'id-123',
          expect.any(Object),
          expect.any(String)
        );
      });
    });

    test('should NOT call postIdentificationForm in edit mode', async () => {
      updateObjectInClass.mockResolvedValue(mockExistingRecord);

      const { getByTestId } = renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          editMode
          existingRecord={mockExistingRecord}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(postIdentificationForm).not.toHaveBeenCalled();
      });
    });
  });

  describe('GREEN: Edit mode - navigation', () => {
    test('should call navigation.goBack after successful edit', async () => {
      updateObjectInClass.mockResolvedValue(mockExistingRecord);

      const { getByTestId } = renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          editMode
          existingRecord={mockExistingRecord}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });

    test('should NOT call navigation.goBack in create mode', async () => {
      postIdentificationForm.mockResolvedValue({
        objectId: 'new-id',
        fname: 'Jane',
      });

      const { getByTestId } = renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockNavigation.goBack).not.toHaveBeenCalled();
      });
    });
  });

  describe('GREEN: Audit trail', () => {
    test('should include userId in updateObjectInClass call', async () => {
      updateObjectInClass.mockResolvedValue(mockExistingRecord);

      const { getByTestId } = renderWithContext(
        <IdentificationFormWrapper
          navigation={mockNavigation}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          editMode
          existingRecord={mockExistingRecord}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        const callArgs = updateObjectInClass.mock.calls[0];
        expect(callArgs[3]).toBe('user-123'); // userId parameter
      });
    });
  });
});
