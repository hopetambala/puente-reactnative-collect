/**
 * SupplementaryForm - RED-GREEN TDD Tests
 * Covers: config loading per selectedForm, edit mode pre-population (enableReinitialize)
 */

import SupplementaryForm from '@app/domains/DataCollection/Forms/SupplementaryForm';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

// --- Mocks ---

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn((key) => {
    if (key === 'currentUser') {
      return Promise.resolve({
        firstname: 'Test',
        lastname: 'User',
        organization: 'Test Org',
      });
    }
    return Promise.resolve(null);
  }),
}));

jest.mock('@modules/cached-resources', () => ({
  postSupplementaryForm: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@app/services/parse/crud', () => ({
  updateObjectInClass: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

jest.mock('@app/domains/DataCollection/Forms/utils', () =>
  jest.fn(async (user) => `${user?.firstname || ''} ${user?.lastname || ''}`.trim())
);

jest.mock('@context/alert.context', () => {
  const mockReact = require('react');
  return {
    AlertContext: mockReact.createContext({ alert: jest.fn() }),
  };
});

// Minimal mock for impacto-design-system fields — renders formikKey as testID
jest.mock('@impacto-design-system/Extensions/FormikFields/PaperInputPicker', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return ({ data, formikProps }) => (
    <TextInput
      testID={`field-${data.formikKey}`}
      value={String(formikProps.values[data.formikKey] ?? '')}
      onChangeText={(v) => formikProps.setFieldValue(data.formikKey, v)}
    />
  );
});

jest.mock('@impacto-design-system/Extensions/FormikFields/ErrorPicker', () => () => null);
jest.mock('@impacto-design-system/Extensions/FormikFields/YupValidation', () => () => null);
jest.mock('@impacto-design-system/Base/PopupError', () => () => null);

jest.mock('@modules/theme', () => ({
  createLayoutStyles: () => ({ formContainer: {} }),
}));

jest.mock('@modules/utils', () => ({ isEmpty: (v) => v == null || v === '' }));

// --- Helpers ---

const baseProps = {
  navigation: { navigate: jest.fn(), goBack: jest.fn() },
  surveyee: { objectId: 'surveyee-1' },
  surveyingUser: 'Test User',
  surveyingOrganization: 'Test Org',
  setSelectedForm: jest.fn(),
  editMode: false,
  existingRecord: null,
  customForm: null,
};

// --- Tests ---

describe('SupplementaryForm - RED-GREEN TDD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RED: Config loading — form must match selectedForm key', () => {
    test('should render Vitals fields when selectedForm is "vitals"', async () => {
      render(<SupplementaryForm {...baseProps} selectedForm="vitals" />);

      await waitFor(() => {
        // height and weight are defined in vitals.config.js
        expect(screen.getByTestId('field-height')).toBeDefined();
        expect(screen.getByTestId('field-weight')).toBeDefined();
      });
    });

    test('should render env health fields when selectedForm is "env"', async () => {
      render(<SupplementaryForm {...baseProps} selectedForm="env" />);

      await waitFor(() => {
        // At least one field from envhealth.config.js must render
        const fields = screen.queryAllByTestId(/^field-/);
        expect(fields.length).toBeGreaterThan(0);
      });
    });

    test('should render medical evaluation fields when selectedForm is "med-eval"', async () => {
      render(<SupplementaryForm {...baseProps} selectedForm="med-eval" />);

      await waitFor(() => {
        const fields = screen.queryAllByTestId(/^field-/);
        expect(fields.length).toBeGreaterThan(0);
      });
    });

    test('should NOT render any fields for unknown selectedForm values', async () => {
      // Simulates the old bug where raw Parse class names were passed:
      // "HistoryEnvironmentalHealth" instead of "env" — config never loaded.
      render(<SupplementaryForm {...baseProps} selectedForm="HistoryEnvironmentalHealth" />);

      // After any async effects, no fields should be rendered
      await waitFor(() => {
        const fields = screen.queryAllByTestId(/^field-/);
        expect(fields.length).toBe(0);
      });
    });
  });

  describe('RED: Edit mode pre-population (enableReinitialize)', () => {
    test('should pre-populate Vitals fields with existingRecord values', async () => {
      const existingRecord = {
        objectId: 'vitals-1',
        height: '175',
        weight: '70',
        surveyingUser: 'Test User',
      };

      render(
        <SupplementaryForm
          {...baseProps}
          selectedForm="vitals"
          editMode
          existingRecord={existingRecord}
        />
      );

      await waitFor(() => {
        // Fields must be pre-populated from existingRecord via Formik enableReinitialize
        // Without enableReinitialize, config loads async and Formik keeps empty initialValues
        const heightField = screen.getByTestId('field-height');
        expect(heightField.props.value).toBe('175');
        const weightField = screen.getByTestId('field-weight');
        expect(weightField.props.value).toBe('70');
      });
    });

    test('should show empty fields in create mode even when existingRecord is provided', async () => {
      const existingRecord = { height: '175', weight: '70' };

      render(
        <SupplementaryForm
          {...baseProps}
          selectedForm="vitals"
          editMode={false}
          existingRecord={existingRecord}
        />
      );

      await waitFor(() => {
        const heightField = screen.getByTestId('field-height');
        // In create mode, initialValues is {} so field should be empty
        expect(heightField.props.value).toBe('');
      });
    });
  });
});
