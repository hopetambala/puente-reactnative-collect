/**
 * SupplementaryForm Edit Mode - RED-GREEN TDD Tests
 * Phase 5: Tests for reverse field transformations (BP, custom text, etc.)
 */

import { AlertContextProvider } from '@app/context/alert.context';
import SupplementaryForm from '@app/domains/DataCollection/Forms/SupplementaryForm/index';
import { reverseFormResultsFields,reverseSelectTextInputs, reverseVitalsBloodPressure } from '@app/domains/DataCollection/Forms/SupplementaryForm/utils';
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
        objectId: 'user-123',
      });
    }
    if (key === 'appVersion') {
      return Promise.resolve('1.0.0');
    }
    return Promise.resolve(null);
  }),
  storeData: jest.fn(),
}));

describe('SupplementaryForm Edit Mode - RED-GREEN TDD', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
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

  describe('Unit: Reverse transformations', () => {
    describe('reverseVitalsBloodPressure', () => {
      test('should reverse blood pressure "120/80" to { Systolic: "120", Diastolic: "80" }', () => {
        const storedData = { bloodPressure: '120/80' };
        const result = reverseVitalsBloodPressure(storedData);

        expect(result).toEqual({
          Systolic: '120',
          Diastolic: '80',
        });
      });

      test('should handle missing blood pressure', () => {
        const storedData = {};
        const result = reverseVitalsBloodPressure(storedData);

        expect(result).toEqual({});
      });

      test('should handle malformed blood pressure', () => {
        const storedData = { bloodPressure: '120' };
        const result = reverseVitalsBloodPressure(storedData);

        expect(result).toEqual({
          Systolic: '120',
          Diastolic: '',
        });
      });
    });

    describe('reverseSelectTextInputs', () => {
      test('should reverse custom text field "other__Custom issue" format', () => {
        const storedData = {
          biggestproblemofcommunity_v2: 'other__Custom issue',
        };
        const config = {
          fields: [
            {
              formikKey: 'biggestproblemofcommunity_v2',
              options: [
                { value: 'Water', text: false },
                // eslint-disable-next-line no-underscore-dangle
                { value: 'other', text: true, textKey: '__biggestproblemofcommunity_v2__other' },
              ],
            },
          ],
        };

        const result = reverseSelectTextInputs(storedData, config);
        // eslint-disable-next-line no-underscore-dangle
        expect(result.__biggestproblemofcommunity_v2__other).toBe('Custom issue');
      });

      test('should handle fields without custom text options', () => {
        const storedData = { simpleField: 'value' };
        const config = {
          fields: [
            {
              formikKey: 'simpleField',
              options: [{ value: 'value', text: false }],
            },
          ],
        };

        const result = reverseSelectTextInputs(storedData, config);
        expect(result).toEqual({});
      });
    });

    describe('reverseFormResultsFields', () => {
      test('should reverse fields array to flat object', () => {
        const storedData = {
          fields: [
            { title: 'fieldName', answer: 'fieldValue' },
            { title: 'anotherField', answer: 123 },
          ],
        };

        const result = reverseFormResultsFields(storedData);
        expect(result).toEqual({
          fieldName: 'fieldValue',
          anotherField: 123,
        });
      });

      test('should handle empty fields array', () => {
        const storedData = { fields: [] };
        const result = reverseFormResultsFields(storedData);
        expect(result).toEqual({});
      });

      test('should handle missing fields', () => {
        const storedData = {};
        const result = reverseFormResultsFields(storedData);
        expect(result).toEqual({});
      });
    });
  });

  describe('RED: Vitals form - no edit pre-population', () => {
    test('should start with empty Formik values in create mode', () => {
      renderWithContext(
        <SupplementaryForm
          selectedForm="vitals"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      // BP inputs should be empty
      expect(screen.queryByDisplayValue('120')).toBeNull();
      expect(screen.queryByDisplayValue('80')).toBeNull();
    });
  });

  describe('GREEN: Vitals form - edit mode pre-population', () => {
    test('should pre-populate Vitals with reversed blood pressure', async () => {
      const existingVitals = {
        objectId: 'vitals-123',
        height: 180,
        weight: 75,
        bloodPressure: '145/92',
      };

      renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingVitals}
          selectedForm="vitals"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      await waitFor(() => {
        // BP should be pre-populated as separate Systolic/Diastolic fields
        expect(screen.getByDisplayValue('145')).toBeDefined(); // Systolic
        expect(screen.getByDisplayValue('92')).toBeDefined(); // Diastolic
      });
    });

    test('should submit Vitals edit with updateObjectInClass', async () => {
      updateObjectInClass.mockResolvedValue({});

      const existingVitals = {
        objectId: 'vitals-123',
        bloodPressure: '120/80',
      };

      const { getByTestId } = renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingVitals}
          selectedForm="vitals"
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
          'Vitals',
          'vitals-123',
          expect.any(Object),
          expect.any(String)
        );
      });
    });
  });

  describe('GREEN: Custom form - edit mode pre-population', () => {
    test('should pre-populate custom form with reversed fields array', async () => {
      const customFormSpec = {
        objectId: 'spec-123',
        name: 'Test Form',
        fields: [
          { formikKey: 'userName', label: 'User Name', fieldType: 'text' },
          { formikKey: 'userAge', label: 'User Age', fieldType: 'text' },
        ],
      };
      const existingCustomRecord = {
        objectId: 'form-123',
        fields: [
          { title: 'userName', answer: 'John Smith' },
          { title: 'userAge', answer: '35' },
        ],
      };

      renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingCustomRecord}
          customForm={customFormSpec}
          selectedForm="custom"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Smith')).toBeDefined();
        expect(screen.getByDisplayValue('35')).toBeDefined();
      });
    });

    test('should submit custom form edit with updateObjectInClass', async () => {
      updateObjectInClass.mockResolvedValue({});

      const customFormSpec = {
        objectId: 'spec-123',
        name: 'Test Form',
        fields: [
          { formikKey: 'userName', label: 'User Name', fieldType: 'text' },
        ],
      };
      const existingCustomRecord = {
        objectId: 'form-123',
        fields: [{ title: 'userName', answer: 'John Smith' }],
      };

      const { getByTestId } = renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingCustomRecord}
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
  });

  describe('GREEN: Dual mode submission', () => {
    test('should NOT call postSupplementaryForm in edit mode', async () => {
      updateObjectInClass.mockResolvedValue({});

      const existingVitals = {
        objectId: 'vitals-123',
        bloodPressure: '120/80',
      };

      const { getByTestId } = renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingVitals}
          selectedForm="vitals"
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

    test('should call postSupplementaryForm in create mode', async () => {
      postSupplementaryForm.mockResolvedValue({});

      const { getByTestId } = renderWithContext(
        <SupplementaryForm
          selectedForm="vitals"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(postSupplementaryForm).toHaveBeenCalled();
      });
    });
  });

  describe('GREEN: Navigation after edit', () => {
    test('should call navigation.goBack after edit submit', async () => {
      updateObjectInClass.mockResolvedValue({});

      const existingVitals = {
        objectId: 'vitals-123',
        bloodPressure: '120/80',
      };

      const { getByTestId } = renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingVitals}
          selectedForm="vitals"
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

  describe('GREEN: Custom form - synthetic config from existingRecord fields', () => {
    test('should build synthetic config from existingRecord.fields in edit mode', async () => {
      // existingRecord.fields = [{title, answer}] answer pairs (NOT a schema)
      // SupplementaryForm must build a synthetic config so PaperInputPicker can render inputs
      const existingCustomRecord = {
        objectId: 'form-456',
        title: 'Health Survey',
        fields: [
          { title: 'waterSource', answer: 'river' },
          { title: 'householdSize', answer: '4' },
        ],
      };

      renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingCustomRecord}
          customForm={undefined}
          selectedForm="custom"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      // Inputs for each field.title should render with field.answer as the value
      await waitFor(() => {
        expect(screen.getByDisplayValue('river')).toBeDefined();
        expect(screen.getByDisplayValue('4')).toBeDefined();
      });
    });

    test('should render all fields from existingRecord.fields as text inputs', async () => {
      const existingCustomRecord = {
        objectId: 'form-789',
        title: 'Custom Survey',
        fields: [
          { title: 'fieldA', answer: 'answerA' },
          { title: 'fieldB', answer: 'answerB' },
          { title: 'fieldC', answer: 'answerC' },
        ],
      };

      renderWithContext(
        <SupplementaryForm
          editMode
          existingRecord={existingCustomRecord}
          selectedForm="custom"
          surveyee={mockSurveyee}
          surveyingUser="Test User"
          surveyingOrganization="Test Org"
          navigation={mockNavigation}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('answerA')).toBeDefined();
        expect(screen.getByDisplayValue('answerB')).toBeDefined();
        expect(screen.getByDisplayValue('answerC')).toBeDefined();
      });
    });
  });
});
