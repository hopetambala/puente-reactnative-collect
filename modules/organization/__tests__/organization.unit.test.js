import { getData, storeData } from "@modules/async-storage";
import {
  loadOrganizationScope,
  organizationMatchValues,
} from "@modules/organization";

jest.mock("@modules/async-storage", () => ({
  getData: jest.fn(),
  storeData: jest.fn(),
}));

const DR = {
  objectId: "o1",
  name: "DR Missions",
  shortCode: "dr-missions",
  aliases: ["DR Missions", "DRMT"],
};

describe("organizationMatchValues", () => {
  it("returns every string the organization's records may carry", () => {
    // Records store the string that was COLLECTED. In production DR Missions
    // has 11 rows under "DR Missions" and 611 under "DRMT", so filtering on one
    // string shows a surveyor 1% of their own organization's data — and two DR
    // Missions accounts see zero records because their account string is
    // "Dominican Republic Mission Team".
    expect(organizationMatchValues("DR Missions", [DR]).sort()).toEqual([
      "DR Missions",
      "DRMT",
    ]);
  });

  it("finds the whole set from any alias, not only the canonical name", () => {
    expect(organizationMatchValues("DRMT", [DR]).sort()).toEqual([
      "DR Missions",
      "DRMT",
    ]);
  });

  it("falls back to the literal string when nothing resolves", () => {
    expect(organizationMatchValues("Peace Corps", [DR])).toEqual(["Peace Corps"]);
  });
});

describe("loadOrganizationScope", () => {
  const makeParse = (records, { fail = false } = {}) => ({
    Query: function Query() {
      const q = {
        select: () => q,
        limit: () => q,
        find: async () => {
          if (fail) throw new Error("offline");
          return records;
        },
      };
      return q;
    },
  });

  const record = {
    id: "o1",
    get: (k) => ({
      name: "DR Missions",
      shortCode: "dr-missions",
      aliases: ["DR Missions", "DRMT"],
housing: null,
    }[k]),
  };

  beforeEach(() => {
    getData.mockReset();
    storeData.mockReset();
  });

  it("caches the organization set so it survives going offline", async () => {
    // Collect is offline-first. A scope that only works with a connection would
    // narrow every surveyor's records the moment they lose signal, which is
    // most of the time in the field.
    const values = await loadOrganizationScope("DRMT", makeParse([record]));

    expect(values.sort()).toEqual(["DR Missions", "DRMT"]);
    expect(storeData).toHaveBeenCalled();
  });

  it("uses the cached set when the lookup fails", async () => {
    getData.mockResolvedValue([DR]);

    const values = await loadOrganizationScope("DRMT", makeParse([], { fail: true }));

    expect(values.sort()).toEqual(["DR Missions", "DRMT"]);
  });

  it("narrows rather than blanks when there is no cache and no network", async () => {
    getData.mockResolvedValue(null);

    const values = await loadOrganizationScope("DRMT", makeParse([], { fail: true }));

    expect(values).toEqual(["DRMT"]);
  });
});

describe("a blank organization must not inherit the junk bucket", () => {
  // The internal-test organization carries an empty string among its aliases in
  // production, so a blank account organization folds to "" and MATCHES it —
  // handing 11 accounts the 343 records of a bucket that is not theirs.
  const INTERNAL = {
    objectId: "o9",
    name: "Internal / test",
    shortCode: "internal-test",
    aliases: ["", "testORG", "Company A"],
  };

  it.each(["", "   ", null, undefined])("does not resolve %p", (blank) => {
    expect(organizationMatchValues(blank, [INTERNAL])).toEqual([blank]);
  });
});

