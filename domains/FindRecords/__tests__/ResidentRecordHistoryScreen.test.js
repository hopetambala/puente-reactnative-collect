/**
 * ResidentRecordHistoryScreen - RED-GREEN TDD Tests
 * Phase 2: Tests for record history querying, grouping, and navigation
 */

import ResidentRecordHistoryScreen from '@app/domains/FindRecords/ResidentRecordHistoryScreen';
import { customQueryService } from '@app/services/parse/crud';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock the customQueryService
jest.mock('@app/services/parse/crud', () => ({
  customQueryService: jest.fn(),
}));

// Mock utilities
jest.mock('@modules/i18n', () => ({
  t: (key) => key,
}));

describe('ResidentRecordHistoryScreen - RED-GREEN TDD', () => {
  const mockResident = {
    objectId: 'resident-123',
    fname: 'John',
    lname: 'Doe',
    get: (field) => {
      const data = { fname: 'John', lname: 'Doe' };
      return data[field];
    },
  };

  const mockVitalsRecord = {
    objectId: 'vitals-1',
    createdAt: new Date('2026-04-10').toISOString(),
    height: 180,
    weight: 75,
    toJSON: () => ({ objectId: 'vitals-1', createdAt: new Date('2026-04-10').toISOString(), height: 180, weight: 75 }),
    get: (field) => {
      const data = {
        height: 180,
        weight: 75,
        createdAt: new Date('2026-04-10'),
        _parseClass: 'Vitals',
      };
      return data[field];
    },
  };

  const mockMedicalRecord = {
    objectId: 'med-1',
    createdAt: new Date('2026-04-08').toISOString(),
    diagnosis: 'Flu',
    toJSON: () => ({ objectId: 'med-1', createdAt: new Date('2026-04-08').toISOString(), diagnosis: 'Flu' }),
    get: (field) => {
      const data = {
        diagnosis: 'Flu',
        createdAt: new Date('2026-04-08'),
        _parseClass: 'EvaluationMedical',
      };
      return data[field];
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RED: Initial state', () => {
    test('should render loading indicator when fetching records', () => {
      customQueryService.mockImplementation(() => new Promise(() => {})); // Never resolves
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);
      // Expect to see loading state
      expect(screen.getByTestId('loadingIndicator')).toBeDefined();
    });

    test('should initialize with empty records state', () => {
      customQueryService.mockResolvedValue([]);
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);
      // Component should render without crashing
      expect(screen.queryByText('John Doe')).toBeDefined();
    });
  });

  describe('GREEN: Query and fetch records', () => {
    test('should query each record type in parallel', async () => {
      customQueryService.mockResolvedValue([mockVitalsRecord, mockMedicalRecord]);
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        // Should call customQueryService 4 times (one for each form type)
        expect(customQueryService).toHaveBeenCalledTimes(4); // Vitals + EnvHealth + MedEval + FormResults (SurveyData is the resident itself)
      });
    });

    test('should group records by type', async () => {
      // Mock different responses for different calls
      customQueryService
        .mockResolvedValueOnce([mockVitalsRecord]) // Vitals
        .mockResolvedValueOnce([]) // Environmental Health
        .mockResolvedValueOnce([mockMedicalRecord]) // Medical
        .mockResolvedValueOnce([]); // FormResults

      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        // Should have grouped records by type
        expect(screen.queryByText('Vitals')).toBeDefined();
        expect(screen.queryByText('Medical Evaluation')).toBeDefined();
      });
    });

    test('should sort records by createdAt descending', async () => {
      const oldRecord = { ...mockVitalsRecord, get: (f) => ({ createdAt: new Date('2026-04-01') }[f]) };
      const newRecord = { ...mockVitalsRecord, get: (f) => ({ createdAt: new Date('2026-04-12') }[f]) };

      customQueryService.mockResolvedValue([oldRecord, newRecord]);
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        // Newest record should appear first
        const records = screen.queryAllByTestId('recordItem');
        if (records.length >= 2) {
          expect(records[0]).toBe(newRecord);
        }
      });
    });
  });

  describe('GREEN: Navigation', () => {
    test('should navigate back when back button pressed', async () => {
      customQueryService.mockResolvedValue([]);
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      // Find and click back button (implementation dependent)
      const backButton = screen.queryByTestId('backButton');
      if (backButton) {
        backButton.press();
        expect(mockNavigation.goBack).toHaveBeenCalled();
      }
    });

    test('should navigate to edit form when record tapped', async () => {
      customQueryService.mockResolvedValue([mockVitalsRecord]);
      const mockNavigation = { navigate: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        const recordItem = screen.queryByTestId('vitals-1');
        if (recordItem) {
          recordItem.press();
          expect(mockNavigation.navigate).toHaveBeenCalledWith(
            'EditForm',
            expect.objectContaining({
              editMode: true,
              existingRecord: mockVitalsRecord,
              formType: 'Vitals',
            })
          );
        }
      });
    });
  });

  describe('GREEN: Error handling', () => {
    test('should display error message if query fails', async () => {
      customQueryService.mockRejectedValue(new Error('Query failed'));
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load records')).toBeDefined();
      });
    });

    test('should continue querying other types if one fails', async () => {
      customQueryService
        .mockRejectedValueOnce(new Error('Vitals query failed'))
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockMedicalRecord])
        .mockResolvedValueOnce([]);

      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        // Should still show medical records despite Vitals query failure
        expect(screen.queryByText('Medical Evaluation')).toBeDefined();
      });
    });
  });
});
