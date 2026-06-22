/**
 * Asset Forms Edit Mode - RED-GREEN TDD Tests
 */

import { AlertContextProvider } from '@app/context/alert.context';
import AssetSupplementary from '@app/domains/DataCollection/Assets/NewAssets/AssetSupplementary/index';
import { updateObjectInClass } from '@app/services/parse/crud';
import { postSupplementaryAssetForm } from '@modules/cached-resources';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock(
  '@app/domains/DataCollection/Assets/NewAssets/AssetSupplementary/AssetFormSelect',
  () => {
    // eslint-disable-next-line global-require
    const MockReact = require('react');
    return function MockAssetFormSelect({ setSelectedForm }) {
      MockReact.useEffect(() => {
        setSelectedForm({ objectId: 'form-type-456', name: 'Mock Form', fields: [] });
      }, []);
      return null;
    };
  }
);

jest.mock('@modules/cached-resources', () => ({
  postSupplementaryAssetForm: jest.fn(() => Promise.resolve({})),
  assetFormsQuery: jest.fn(() => Promise.resolve([])),
}));
jest.mock('@app/services/parse/crud');
jest.mock('@modules/async-storage', () => ({
  getData: jest.fn((key) => {
    if (key === 'currentUser') {
      return Promise.resolve({
        id: 'user-123',
        objectId: 'user-123',
      });
    }
    return Promise.resolve(null);
  }),
  storeData: jest.fn(),
}));

jest.mock('@modules/cached-resources/populate-cache', () => ({
  storeAppVersion: jest.fn(() => Promise.resolve('1.0.0')),
}));

describe('Asset Forms Edit Mode - RED-GREEN TDD', () => {
  const mockNavigation = {
    goBack: jest.fn(),
  };

  const mockSelectedAsset = {
    objectId: 'asset-123',
    name: 'Community Center',
    communityName: 'Springfield',
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

  describe('RED: Asset form - no edit mode', () => {
    test('should have empty form in create mode', () => {
      renderWithContext(
        <AssetSupplementary
          selectedAsset={mockSelectedAsset}
          setSelectedAsset={() => {}}
          surveyingOrganization="Test Org"
          surveyingUser="Test User"
          setPage={() => {}}
        />
      );

      // Form inputs should be empty
      expect(screen.queryByDisplayValue('2024-01-15')).toBeNull();
    });
  });

  describe('GREEN: Asset form - edit mode initialization', () => {
    test('should not provide edit controls without editMode', () => {
      renderWithContext(
        <AssetSupplementary
          selectedAsset={mockSelectedAsset}
          setSelectedAsset={() => {}}
          surveyingOrganization="Test Org"
          surveyingUser="Test User"
          setPage={() => {}}
        />
      );

      // Edit-specific UI should not be present
      expect(screen.queryByTestId('editModeIndicator')).toBeNull();
    });
  });

  describe('GREEN: Asset form - edit mode pre-population', () => {
    test('should pre-populate asset form fields from FormAssetResults', async () => {
      const existingAssetForm = {
        objectId: 'result-789',
        title: 'Asset Maintenance Form',
        fields: [
          { title: 'maintenanceDate', answer: '2024-03-15' },
          { title: 'maintenanceType', answer: 'Cleaning' },
          { title: 'notes', answer: 'Fixed broken window' },
        ],
      };

      renderWithContext(
        <AssetSupplementary
          editMode
          existingRecord={existingAssetForm}
          navigation={mockNavigation}
          selectedAsset={mockSelectedAsset}
          setSelectedAsset={() => {}}
          surveyingOrganization="Test Org"
          surveyingUser="Test User"
          setPage={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('2024-03-15')).toBeDefined();
        expect(screen.getByDisplayValue('Cleaning')).toBeDefined();
        expect(screen.getByDisplayValue('Fixed broken window')).toBeDefined();
      });
    });

    test('should handle asset forms with multiple field types', async () => {
      const existingAssetForm = {
        objectId: 'result-789',
        fields: [
          { title: 'assetCondition', answer: 'Good' },
          { title: 'repairCost', answer: 1500 },
          { title: 'repairsNeeded', answer: ['roof', 'plumbing'] },
          { title: 'reportedBy', answer: 'John Doe' },
        ],
      };

      renderWithContext(
        <AssetSupplementary
          editMode
          existingRecord={existingAssetForm}
          navigation={mockNavigation}
          selectedAsset={mockSelectedAsset}
          setSelectedAsset={() => {}}
          surveyingOrganization="Test Org"
          surveyingUser="Test User"
          setPage={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Good')).toBeDefined();
        expect(screen.getByDisplayValue('1500')).toBeDefined();
        expect(screen.getByDisplayValue('John Doe')).toBeDefined();
      });
    });
  });

  describe('GREEN: Asset form - edit submission', () => {
    test('should submit asset form edit with updateObjectInClass', async () => {
      updateObjectInClass.mockResolvedValue({});

      const existingAssetForm = {
        objectId: 'result-789',
        fields: [
          { title: 'maintenanceDate', answer: '2024-03-15' },
          { title: 'notes', answer: 'Fixed broken window' },
        ],
      };

      const { getByTestId } = renderWithContext(
        <AssetSupplementary
          editMode
          existingRecord={existingAssetForm}
          navigation={mockNavigation}
          selectedAsset={mockSelectedAsset}
          setSelectedAsset={() => {}}
          surveyingOrganization="Test Org"
          surveyingUser="Test User"
          setPage={() => {}}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(updateObjectInClass).toHaveBeenCalledWith(
          'FormAssetResults',
          'result-789',
          expect.any(Object),
          expect.any(String)
        );
      });
    });

    test('should NOT call postSupplementaryAssetForm in edit mode', async () => {
      updateObjectInClass.mockResolvedValue({});

      const existingAssetForm = {
        objectId: 'result-789',
        fields: [{ title: 'maintenanceDate', answer: '2024-03-15' }],
      };

      const { getByTestId } = renderWithContext(
        <AssetSupplementary
          editMode
          existingRecord={existingAssetForm}
          navigation={mockNavigation}
          selectedAsset={mockSelectedAsset}
          setSelectedAsset={() => {}}
          surveyingOrganization="Test Org"
          surveyingUser="Test User"
          setPage={() => {}}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(postSupplementaryAssetForm).not.toHaveBeenCalled();
      });
    });

    test('should call postSupplementaryAssetForm in create mode', async () => {
      postSupplementaryAssetForm.mockResolvedValue({});

      const { getByTestId } = renderWithContext(
        <AssetSupplementary
          selectedAsset={mockSelectedAsset}
          setSelectedAsset={() => {}}
          surveyingOrganization="Test Org"
          surveyingUser="Test User"
          setPage={() => {}}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(postSupplementaryAssetForm).toHaveBeenCalled();
      });
    });
  });

  describe('GREEN: Asset form - edit navigation', () => {
    test('should call navigation.goBack after successful edit', async () => {
      updateObjectInClass.mockResolvedValue({});

      const existingAssetForm = {
        objectId: 'result-789',
        fields: [{ title: 'maintenanceDate', answer: '2024-03-15' }],
      };

      const { getByTestId } = renderWithContext(
        <AssetSupplementary
          editMode
          existingRecord={existingAssetForm}
          navigation={mockNavigation}
          selectedAsset={mockSelectedAsset}
          setSelectedAsset={() => {}}
          surveyingOrganization="Test Org"
          surveyingUser="Test User"
          setPage={() => {}}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });

    test('should NOT call navigation.goBack in create mode', async () => {
      postSupplementaryAssetForm.mockResolvedValue({});

      const { getByTestId } = renderWithContext(
        <AssetSupplementary
          selectedAsset={mockSelectedAsset}
          setSelectedAsset={() => {}}
          surveyingOrganization="Test Org"
          surveyingUser="Test User"
          setPage={() => {}}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockNavigation.goBack).not.toHaveBeenCalled();
      });
    });
  });

  describe('GREEN: Asset form - audit trail', () => {
    test('should include userId in updateObjectInClass for audit trail', async () => {
      updateObjectInClass.mockResolvedValue({});

      const existingAssetForm = {
        objectId: 'result-789',
        fields: [{ title: 'maintenanceDate', answer: '2024-03-15' }],
      };

      const { getByTestId } = renderWithContext(
        <AssetSupplementary
          editMode
          existingRecord={existingAssetForm}
          navigation={mockNavigation}
          selectedAsset={mockSelectedAsset}
          setSelectedAsset={() => {}}
          surveyingOrganization="Test Org"
          surveyingUser="Test User"
          setPage={() => {}}
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

  describe('offline asset — isOfflineLocal forwarded to postParams', () => {
    test('postSupplementaryAssetForm receives isOfflineLocal:true when selectedAsset is offline-local', async () => {
      postSupplementaryAssetForm.mockResolvedValue({});

      const offlineAsset = {
        objectId: 'AssetID-offline-123',
        isOfflineLocal: true,
        name: 'Test Asset',
      };

      const { getByTestId } = renderWithContext(
        <AssetSupplementary
          selectedAsset={offlineAsset}
          setSelectedAsset={() => {}}
          surveyingOrganization="Test Org"
          surveyingUser="Test User"
          setPage={() => {}}
        />
      );

      const submitButton = getByTestId('formSubmit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(postSupplementaryAssetForm).toHaveBeenCalledWith(
          expect.objectContaining({ isOfflineLocal: true })
        );
      });
    });
  });
});
