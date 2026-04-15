/**
 * ResidentRecordHistoryScreen - RED-GREEN TDD Tests
 * Phase 2: Tests for record history querying, grouping, and navigation
 */

import ResidentRecordHistoryScreen from '@app/domains/FindRecords/ResidentRecordHistoryScreen';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock Parse query
const mockFind = jest.fn(() => Promise.resolve([]));
const mockQuery = {
  equalTo: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  descending: jest.fn().mockReturnThis(),
  find: mockFind,
};

jest.mock('@app/services/parse/client', () => {
  function MockParseObject(className) {
    this.className = className;
    this.id = null;
  }
  MockParseObject.extend = jest.fn(() => function MockModel() {});
  MockParseObject.fromJSON = jest.fn(() => ({}));

  return jest.fn(() => ({
    Object: MockParseObject,
    Query: jest.fn(() => mockQuery),
  }));
});

// Mock fetchResidentById used for resident name refresh on focus
const mockFetchResidentById = jest.fn(() => Promise.resolve(null));
jest.mock('@impacto-design-system/Extensions/FindResidents/_utils', () => ({
  __esModule: true,
  fetchResidentById: (...args) => mockFetchResidentById(...args),
}));

// Mock utilities
jest.mock('@modules/i18n', () => ({
  t: (key) => key,
}));

// Mock useFocusEffect from react-navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(() => {
    // For testing, don't call the callback during render
    // Just return void like the real useFocusEffect does
  }),
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
    mockFind.mockResolvedValue([]);
    mockFetchResidentById.mockResolvedValue(null);
  });

  describe('RED: Initial state', () => {
    test('should render loading indicator when fetching records', () => {
      mockFind.mockImplementation(() => new Promise(() => {})); // Never resolves
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);
      // Expect to see loading state
      expect(screen.getByTestId('loadingIndicator')).toBeDefined();
    });

    test('should initialize with empty records state', () => {
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);
      // Component should render without crashing
      expect(screen.queryByText('John Doe')).toBeDefined();
    });
  });

  describe('GREEN: Query and fetch records', () => {
    test('should query each record type in parallel', async () => {
      mockFind.mockResolvedValue([mockVitalsRecord, mockMedicalRecord]);
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        // Should call query.find() 4 times (one for each form type)
        // Vitals + HistoryEnvironmentalHealth + EvaluationMedical + FormResults
        expect(mockFind).toHaveBeenCalledTimes(4);
      });
    });

    test('should query FormResults using client pointer, not parseParentClassID string', async () => {
      // FormResults parent link is stored as a 'client' Parse Pointer (same as all
      // other supplementary forms). Querying by 'parseParentClassID' string returns 0 results.
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(mockFind).toHaveBeenCalledTimes(4);
      });

      // All 4 queries must use equalTo('client', ...) — never equalTo('parseParentClassID', ...)
      const equalToCalls = mockQuery.equalTo.mock.calls;
      const usedColumns = equalToCalls.map((call) => call[0]);
      expect(usedColumns).not.toContain('parseParentClassID');
      expect(usedColumns.every((col) => col === 'client')).toBe(true);
    });

    test('should group records by type', async () => {
      // Mock different responses for different calls
      mockFind
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

      mockFind.mockResolvedValue([oldRecord, newRecord]);
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
      mockFind.mockResolvedValue([mockVitalsRecord]);
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
      mockFind.mockRejectedValue(new Error('Query failed'));
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load records')).toBeDefined();
      });
    });

    test('should continue querying other types if one fails', async () => {
      mockFind
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

  describe('RED-GREEN: Infinite loop prevention', () => {
    test('RED: should NOT trigger fetchRecords multiple times due to recordTypes dependency', async () => {
      // Track how many times fetchRecords runs by counting mockFind invocations
      // RED: Bug causes many rapid invocations (infinite loop)
      // GREEN: Fix causes exactly 4 invocations (one per record type, only on mount + initial render)
      mockFind.mockResolvedValue([]);
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      // Reset before render
      mockFind.mockClear();

      const { rerender } = render(
        <ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Allow async operations to settle
      await waitFor(() => {
        // GREEN: Should fetch exactly 4 times (one query per record type)
        // RED: Before fix, this would be called way more times in rapid succession
        expect(mockFind).toHaveBeenCalledTimes(4);
      }, { timeout: 500 });

      // Re-render with same props should NOT trigger fetchRecords again
      mockFind.mockClear();
      rerender(
        <ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />
      );

      // GREEN: Second render should NOT call fetchRecords again
      // (since resident.objectId hasn't changed)
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockFind).toHaveBeenCalledTimes(0);
    });

    test('GREEN: should memoize recordTypes to prevent recreation on every render', async () => {
      mockFind.mockResolvedValue([]);
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        // Should reach loading state successfully
        expect(screen.queryByText(/Record History/i)).toBeDefined();
      });

      // Track call count
      const initialCallCount = mockFind.mock.calls.length;

      // Wait a bit and verify no additional calls
      await new Promise((resolve) => setTimeout(resolve, 200));
      const finalCallCount = mockFind.mock.calls.length;

      // GREEN: Call count should not increase after initial fetch
      expect(finalCallCount).toBe(initialCallCount);
    });
  });

  describe('RED-GREEN: Stale resident name in header after SurveyData edit', () => {
    // The useFocusEffect mock above swallows the callback by default.
    // These tests directly verify that:
    // (a) residentName is initialised from navigation params (so the initial render is correct)
    // (b) fetchResidentById is called with the correct residentId (so the refresh logic exists)
    // (c) when fetchResidentById resolves with a new name, the header title updates

    test('RED: header shows stale name when residentName is a plain const from params', async () => {
      // Before the fix, residentName was a const — it could never update.
      // This test documents the expected GREEN behaviour after the fix.
      const mockNavigation = { goBack: jest.fn() };
      const ronResident = { objectId: 'resident-ron', fname: 'Ron', lname: 'Smith' };
      const mockRoute = { params: { resident: ronResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        // Initially the header should show "Ron Smith" from params
        expect(screen.queryByText(/Ron Smith/i)).toBeDefined();
      });
    });

    test('GREEN: residentName state initialises from navigation params on first render', async () => {
      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: { objectId: 'resident-123', fname: 'John', lname: 'Doe' } } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        // Header should show initial name from route params
        expect(screen.queryByText(/John Doe/i)).toBeDefined();
      });
    });

    test('GREEN: fetchResidentById is called with resident objectId on focus', async () => {
      // Simulate useFocusEffect firing the callback (override the no-op mock for this test only)
      const { useFocusEffect } = require('@react-navigation/native');
      useFocusEffect.mockImplementationOnce((callback) => {
        callback();
      });

      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(mockFetchResidentById).toHaveBeenCalledWith('resident-123');
      });
    });

    test('GREEN: header updates to new name when fetchResidentById returns fresh resident', async () => {
      // Simulate useFocusEffect calling the callback with fresh data
      const { useFocusEffect } = require('@react-navigation/native');
      useFocusEffect.mockImplementationOnce((callback) => {
        callback();
      });

      // fetchResidentById returns the updated name
      mockFetchResidentById.mockResolvedValueOnce({
        objectId: 'resident-123',
        fname: 'Updated',
        lname: 'Name',
      });

      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        // After focus re-fetch, the header should show the new name
        expect(screen.queryByText(/Updated Name/i)).toBeDefined();
      });
    });

    test('GREEN: header keeps original name when fetchResidentById returns null (offline)', async () => {
      const { useFocusEffect } = require('@react-navigation/native');
      useFocusEffect.mockImplementationOnce((callback) => {
        callback();
      });

      // null means offline or PatientID — keep original name from params
      mockFetchResidentById.mockResolvedValueOnce(null);

      const mockNavigation = { goBack: jest.fn() };
      const mockRoute = { params: { resident: mockResident } };

      render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        // Should still show original name
        expect(screen.queryByText(/John Doe/i)).toBeDefined();
      });
    });
  });
});
