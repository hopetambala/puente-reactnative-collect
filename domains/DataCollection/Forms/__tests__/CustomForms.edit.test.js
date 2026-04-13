/**
 * Custom Forms (FormResults) Edit Mode - RED-GREEN TDD Tests
 * Phase 6: Tests for FormResults fields array reversal
 */

import { AlertContextProvider } from '@app/context/alert.context';
import SupplementaryForm from '@app/domains/DataCollection/Forms/SupplementaryForm';
import { reverseFormResultsFields } from '@app/domains/DataCollection/Forms/SupplementaryForm/utils';
import { updateObjectInClass } from '@app/services/parse/crud';
import { postSupplementaryForm } from '@modules/cached-resources';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@modules/cached-resources');
jest.mock('@app/services/parse/crud');
jest.mock('@modules/async-storage', () => ({
  getData: jest.fn((key) => {
    if (key === 'currentUser') {
      return Promise.resolve({
        id: 'user-123',
        organization: 'Test Org',
      });
    }
    if (key === 'appVersion') {
      return Promise.resolve('1.0.0');
    }
    return Promise.resolve(null);
  }),
  storeData: jest.fn(),
}));

describe('Custom Forms Edit Mode - RED-GREEN TDD', () => {
  const mockNavigation = {
    goBack: jest.fn(),
  };

  const mockSurveyee = {
    objectId: 'surveyee-123',
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

  describe('Unit: reverseFormResultsFields', () => {
    test('should convert fields array to object', () => {
      const formResultsRecord = {
        title: 'Health Survey',
        fields: [
          { title: 'blood_type', answer: 'O+' },
          { title: 'has_allergies', answer: 'yes' },
          { title: 'allergies_list', answer: 'Peanuts, Shellfish' },
        ],
      };

      const result = reverseFormResultsFields(formResultsRecord);

      expect(result).toEqual({
        blood_type: 'O+',
        has_allergies: 'yes',
        allergies_list: 'Peanuts, Shellfish',
      });
    });

    test('should handle fields with array answers', () => {
      const formResultsRecord = {
        fields: [
          { title: 'vaccinations', answer: ['polio', 'measles', 'covid'] },
        ],
      };

      const result = reverseFormResultsFields(formResultsRecord);

      expect(result.vaccinations).toEqual(['polio', 'measles', 'covid']);
    });

    test('should handle fields with numeric answers', () => {
      const formResultsRecord = {
        fields: [
          { title: 'age', answer: 45 },
          { title: 'visits', answer: 3 },
        ],
      };

      const result = reverseFormResultsFields(formResultsRecord);

      expect(result).toEqual({
        age: 45,
        visits: 3,
      });
    });
  });

  describe('RED: Custom form - no edit mode', () => {
    test('should have empty form in create mode', () => {
      const customFormSpec = {
        objectId: 'spec-123',
        name: 'Health Assessment',
        fields: [
          { formikKey: 'bloodType', label: 'Blood Type' },
          { formikKey: 'hasAllergies', label: 'Has Allergies' },
        ],
      };

      renderWithContext(
        <SupplementaryForm
          selectedForm="custom"
          customForm={customFormSpec}
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      // Form inputs should be empty
      expect(screen.queryByDisplayValue('O+')).toBeNull();
    });
  });

  describe('GREEN: Custom form - edit mode pre-population', () => {
    test('should pre-populate custom form fields from FormResults', async () => {
      const customFormSpec = {
        objectId: 'spec-123',
        name: 'Health Assessment',
        fields: [
          { formikKey: 'bloodType', label: 'Blood Type', fieldType: 'text' },
          { formikKey: 'hasAllergies', label: 'Has Allergies', fieldType: 'text' },
        ],
      };

      const existingFormResult = {
        objectId: 'form-123',
        title: 'Health Assessment',
        fields: [
          { title: 'bloodType', answer: 'O+' },
          { title: 'hasAllergies', answer: 'yes' },
        ],
      };

      renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingFormResult}
          customForm={customFormSpec}
          selectedForm="custom"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('O+')).toBeDefined();
        expect(screen.getByDisplayValue('yes')).toBeDefined();
      });
    });

    test('should handle FormResults with complex data types', async () => {
      const customFormSpec = {
        objectId: 'spec-123',
        name: 'Preferences Survey',
        fields: [
          { formikKey: 'favoriteColors', label: 'Favorite Colors', fieldType: 'text' },
          { formikKey: 'visitCount', label: 'Visit Count', fieldType: 'text' },
          { formikKey: 'notes', label: 'Notes', fieldType: 'text' },
        ],
      };

      const existingFormResult = {
        objectId: 'form-123',
        fields: [
          { title: 'favoriteColors', answer: ['blue', 'green'] },
          { title: 'visitCount', answer: 5 },
          { title: 'notes', answer: 'User prefers morning appointments' },
        ],
      };

      renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingFormResult}
          customForm={customFormSpec}
          selectedForm="custom"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('5')).toBeDefined();
        expect(screen.getByDisplayValue('User prefers morning appointments')).toBeDefined();
      });
    });
  });

  describe('GREEN: Custom form - edit submission', () => {
    test('should submit custom form edit as FormResults class', async () => {
      updateObjectInClass.mockResolvedValue({});

      const customFormSpec = {
        objectId: 'spec-123',
        name: 'Health Assessment',
      };

      const existingFormResult = {
        objectId: 'form-123',
        fields: [{ title: 'bloodType', answer: 'O+' }],
      };

      const { getByTestId } = renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingFormResult}
          customForm={customFormSpec}
          selectedForm="custom"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(updateObjectInClass).toHaveBeenCalledWith(
          'FormResults',
          'form-123',
          expect.any(Object),
          expect.any(String)
        );
      });
    });

    test('should NOT call postSupplementaryForm in edit mode', async () => {
      updateObjectInClass.mockResolvedValue({});

      const customFormSpec = {
        objectId: 'spec-123',
        name: 'Health Assessment',
      };

      const existingFormResult = {
        objectId: 'form-123',
        fields: [{ title: 'bloodType', answer: 'O+' }],
      };

      const { getByTestId } = renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingFormResult}
          customForm={customFormSpec}
          selectedForm="custom"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(postSupplementaryForm).not.toHaveBeenCalled();
      });
    });

    test('should include audit trail in custom form edit', async () => {
      updateObjectInClass.mockResolvedValue({});

      const customFormSpec = {
        objectId: 'spec-123',
        name: 'Health Assessment',
      };

      const existingFormResult = {
        objectId: 'form-123',
        fields: [{ title: 'bloodType', answer: 'O+' }],
      };

      const { getByTestId } = renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingFormResult}
          customForm={customFormSpec}
          selectedForm="custom"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        const callArgs = updateObjectInClass.mock.calls[0];
        // Should include surveyingUser in audit trail (set by updateObjectInClass)
        expect(callArgs[2]).toHaveProperty('surveyingUser');
      });
    });
  });

  describe('GREEN: Custom form - edit navigation', () => {
    test('should return to record history after successful edit', async () => {
      updateObjectInClass.mockResolvedValue({});

      const customFormSpec = {
        objectId: 'spec-123',
        name: 'Health Assessment',
      };

      const existingFormResult = {
        objectId: 'form-123',
        fields: [{ title: 'bloodType', answer: 'O+' }],
      };

      const { getByTestId } = renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingFormResult}
          customForm={customFormSpec}
          selectedForm="custom"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });
  });
});
