/**
 * Shared query services - organization scoping - RED/GREEN TDD
 *
 * These back custom-form discovery and asset data. Form visibility splits worse
 * than record visibility: measured in production 2026-08-29, 17 Puente accounts
 * whose organization string carries a trailing space see 3 of 33 custom forms,
 * every Rayjon account sees exactly half of 12, and Blue Missions sees 4 of 8.
 * A surveyor cannot fill in a form they cannot see.
 */
import {
  customMultiParamQueryService,
  customQueryService,
} from "@app/services/parse/crud/custom-queries";

const constraints = [];
const mockQuery = {
  skip: jest.fn(function s() { return this; }),
  limit: jest.fn(function l() { return this; }),
  descending: jest.fn(function d() { return this; }),
  equalTo: jest.fn(function e(...a) { constraints.push(["equalTo", ...a]); return this; }),
  containedIn: jest.fn(function c(...a) { constraints.push(["containedIn", ...a]); return this; }),
  find: jest.fn(() => Promise.resolve([])),
};

jest.mock("parse/react-native", () => ({
  Parse: {
    Query: jest.fn(() => mockQuery),
    Object: { extend: jest.fn(() => class MockModel {}) },
  },
}));

jest.useFakeTimers();

const run = async (promise) => {
  jest.runAllTimers();
  return promise;
};

describe("shared query services organization scoping", () => {
  beforeEach(() => { constraints.length = 0; jest.clearAllMocks(); });

  it("customQueryService matches every string when given a set", async () => {
    await run(customQueryService(0, 100, "Assets", "surveyingOrganization",
      ["Rayjon", "Rayjon Eye Clinic"]));

    expect(constraints).toContainEqual([
      "containedIn", "surveyingOrganization", ["Rayjon", "Rayjon Eye Clinic"],
    ]);
  });

  it("customQueryService keeps exact equality for a scalar", async () => {
    await run(customQueryService(0, 100, "User", "adminVerified", true));

    expect(constraints).toContainEqual(["equalTo", "adminVerified", true]);
  });

  it("customMultiParamQueryService matches every string for an array param", async () => {
    // typeOfForm stays an exact match; only organizations becomes a set.
    await run(customMultiParamQueryService("FormSpecificationsV2", {
      typeOfForm: "Custom",
      organizations: ["Rayjon", "Rayjon Eye Clinic"],
    }));

    expect(constraints).toContainEqual([
      "containedIn", "organizations", ["Rayjon", "Rayjon Eye Clinic"],
    ]);
    expect(constraints).toContainEqual(["equalTo", "typeOfForm", "Custom"]);
  });
});
