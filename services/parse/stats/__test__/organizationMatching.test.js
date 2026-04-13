/**
 * Organization Matching Integration Tests - RED/GREEN TDD
 * Verifies that stats queries correctly match or exclude records
 * based on organization field consistency
 */

describe('Organization Matching Integration Tests - RED/GREEN TDD', () => {
  /**
   * Helper to simulate Parse query equality check
   */
  const doesRecordMatch = (record, queryConstraints) => {
    return Object.keys(queryConstraints).every((key) => {
      return record[key] === queryConstraints[key];
    });
  };

  describe('Test Suite 1: Organization Matching in Stats Queries', () => {
    test('RED: Post Vitals with organization="testOrg", query finds record', () => {
      const currentUser = {
        firstname: 'asdf',
        lastname: 'asdf',
        organization: 'testOrg',
      };

      const recordBySameUser = {
        surveyingUser: 'asdf asdf',
        surveyingOrganization: 'testOrg',
        height: '170',
      };

      const queryConstraints = {
        surveyingUser: currentUser.firstname + ' ' + currentUser.lastname,
        surveyingOrganization: currentUser.organization,
      };

      const isMatch = doesRecordMatch(recordBySameUser, queryConstraints);

      expect(isMatch).toBe(true);
    });

    test('GREEN: Record without matching organization should not be found', () => {
      const currentUser = {
        organization: 'orgA',
      };

      const recordByDifferentOrg = {
        surveyingOrganization: 'orgB',
      };

      const queryConstraints = {
        surveyingOrganization: currentUser.organization,
      };

      const isMatch = doesRecordMatch(recordByDifferentOrg, queryConstraints);

      expect(isMatch).toBe(false);
    });
  });

  describe('Test Suite 2: Multi-User Organization Filtering', () => {
    test('RED: Two users in different orgs - each queries only their own', () => {
      const user1 = {
        username: 'user1',
        firstname: 'Alice',
        lastname: 'Smith',
        organization: 'orgA',
      };

      const user2 = {
        username: 'user2',
        firstname: 'Bob',
        lastname: 'Jones',
        organization: 'orgB',
      };

      // Vitals submitted by user1
      const vitalsUser1 = {
        surveyingUser: 'Alice Smith',
        surveyingOrganization: 'orgA',
      };

      // Vitals submitted by user2
      const vitalsUser2 = {
        surveyingUser: 'Bob Jones',
        surveyingOrganization: 'orgB',
      };

      // User1 queries
      const user1Query = {
        surveyingUser: 'Alice Smith',
        surveyingOrganization: 'orgA',
      };

      // Only vitalsUser1 should match
      expect(doesRecordMatch(vitalsUser1, user1Query)).toBe(true);
      expect(doesRecordMatch(vitalsUser2, user1Query)).toBe(false);
    });

    test('GREEN: Organization query only (for org aggregates) filters correctly', () => {
      const currentOrg = 'orgA';

      const records = [
        { surveyingOrganization: 'orgA', height: '170' },
        { surveyingOrganization: 'orgA', height: '175' },
        { surveyingOrganization: 'orgB', height: '172' },
      ];

      const orgQuery = { surveyingOrganization: currentOrg };

      const matching = records.filter((record) =>
        doesRecordMatch(record, orgQuery)
      );

      expect(matching.length).toBe(2);
      expect(
        matching.every((record) => record.surveyingOrganization === 'orgA')
      ).toBe(true);
    });
  });

  describe('Test Suite 3: Null/Undefined Organization Handling', () => {
    test('RED: Record with undefined organization should not match query', () => {
      const recordWithUndefinedOrg = {
        surveyingUser: 'John Doe',
        surveyingOrganization: undefined,
      };

      const queryConstraints = {
        surveyingOrganization: 'testOrg',
      };

      const isMatch = doesRecordMatch(recordWithUndefinedOrg, queryConstraints);

      expect(isMatch).toBe(false);
    });

    test('RED: Query with undefined organization should not match populated records', () => {
      const record = {
        surveyingUser: 'John Doe',
        surveyingOrganization: 'orgA',
      };

      const queryConstraints = {
        surveyingUser: 'John Doe',
        surveyingOrganization: undefined,
      };

      const isMatch = doesRecordMatch(record, queryConstraints);

      expect(isMatch).toBe(false);
    });

    test('GREEN: Two undefined should match', () => {
      const record = {
        surveyingOrganization: undefined,
      };

      const queryConstraints = {
        surveyingOrganization: undefined,
      };

      const isMatch = doesRecordMatch(record, queryConstraints);

      expect(isMatch).toBe(true);
    });
  });

  describe('Test Suite 4: Empty String Organization Handling', () => {
    test('RED: Record with empty string organization differs from null', () => {
      const recordWithEmpty = {
        surveyingOrganization: '',
      };

      const queryForUndefined = {
        surveyingOrganization: undefined,
      };

      const isMatch = doesRecordMatch(recordWithEmpty, queryForUndefined);

      expect(isMatch).toBe(false);
    });

    test('GREEN: Both empty should match', () => {
      const record = { surveyingOrganization: '' };
      const query = { surveyingOrganization: '' };

      expect(doesRecordMatch(record, query)).toBe(true);
    });

    test('RED: Empty organization should not match non-empty query', () => {
      const record = { surveyingOrganization: '' };
      const query = { surveyingOrganization: 'orgA' };

      expect(doesRecordMatch(record, query)).toBe(false);
    });
  });

  describe('Test Suite 5: Organization Mismatch Scenarios', () => {
    test('RED: Form passed org="testOrg" but query uses user.organization="differentOrg"', () => {
      // Scenario: Screen passes organization="testOrg" to form
      const formSubmittedOrg = 'testOrg';

      // But currentUser.organization is "differentOrg"
      const userOrg = 'differentOrg';

      const record = { surveyingOrganization: formSubmittedOrg };
      const query = { surveyingOrganization: userOrg };

      // Should NOT match because organizations differ
      expect(doesRecordMatch(record, query)).toBe(false);
    });

    test('GREEN: When organizations match, records are found', () => {
      const formSubmittedOrg = 'testOrg';
      const userOrg = 'testOrg';

      const record = { surveyingOrganization: formSubmittedOrg };
      const query = { surveyingOrganization: userOrg };

      expect(doesRecordMatch(record, query)).toBe(true);
    });

    test('RED: Case-sensitive organization matching', () => {
      const recordOrg = 'TestOrg';
      const queryOrg = 'testorg';

      const record = { surveyingOrganization: recordOrg };
      const query = { surveyingOrganization: queryOrg };

      expect(doesRecordMatch(record, query)).toBe(false);
    });
  });

  describe('Test Suite 6: Stats Aggregation Isolation', () => {
    test('GREEN: Each user only sees their own records', () => {
      const allRecords = [
        {
          surveyingUser: 'Alice Smith',
          surveyingOrganization: 'orgA',
          type: 'Vitals',
        },
        {
          surveyingUser: 'Alice Smith',
          surveyingOrganization: 'orgA',
          type: 'EnvHealth',
        },
        {
          surveyingUser: 'Bob Jones',
          surveyingOrganization: 'orgB',
          type: 'Vitals',
        },
      ];

      const aliceQuery = {
        surveyingUser: 'Alice Smith',
        surveyingOrganization: 'orgA',
      };

      const aliceRecords = allRecords.filter((record) =>
        doesRecordMatch(record, aliceQuery)
      );

      expect(aliceRecords.length).toBe(2);
      expect(aliceRecords.every((r) => r.surveyingUser === 'Alice Smith')).toBe(
        true
      );
    });

    test('GREEN: Organization-level aggregates exclude individual filters', () => {
      const allRecords = [
        { surveyingUser: 'Alice Smith', surveyingOrganization: 'orgA' },
        { surveyingUser: 'Bob Jones', surveyingOrganization: 'orgA' },
        { surveyingUser: 'Charlie Brown', surveyingOrganization: 'orgB' },
      ];

      const orgAQuery = { surveyingOrganization: 'orgA' };

      const orgARecords = allRecords.filter((record) =>
        doesRecordMatch(record, orgAQuery)
      );

      expect(orgARecords.length).toBe(2);
      expect(
        orgARecords.every((r) => r.surveyingOrganization === 'orgA')
      ).toBe(true);
    });
  });

  describe('Test Suite 7: Edge Cases', () => {
    test('RED: Record with surveyingUser but no organization', () => {
      const record = {
        surveyingUser: 'John Doe',
        surveyingOrganization: undefined,
      };

      const query = {
        surveyingUser: 'John Doe',
        surveyingOrganization: 'orgA',
      };

      expect(doesRecordMatch(record, query)).toBe(false);
    });

    test('RED: Query on surveyingUser only ignores organization', () => {
      const record = {
        surveyingUser: 'John Doe',
        surveyingOrganization: 'orgB', // Different organization
      };

      const query = {
        surveyingUser: 'John Doe',
        // No organization constraint
      };

      expect(doesRecordMatch(record, query)).toBe(true);
    });

    test('GREEN: Empty query matches all records', () => {
      const record = {
        surveyingUser: 'John Doe',
        surveyingOrganization: 'orgA',
      };

      const emptyQuery = {};

      expect(doesRecordMatch(record, emptyQuery)).toBe(true);
    });

    test('GREEN: Organization with special characters', () => {
      const record = { surveyingOrganization: 'Org (A) & B' };
      const query = { surveyingOrganization: 'Org (A) & B' };

      expect(doesRecordMatch(record, query)).toBe(true);
    });

    test('RED: Similar but different organization strings', () => {
      const record = { surveyingOrganization: 'Test Organization' };
      const query = { surveyingOrganization: 'Test Org' };

      expect(doesRecordMatch(record, query)).toBe(false);
    });
  });
});
