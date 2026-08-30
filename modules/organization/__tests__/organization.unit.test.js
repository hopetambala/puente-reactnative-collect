import { getData, storeData } from "@modules/async-storage";
import {
  loadOrganizationScope,
  loadSelectableOrganizations,
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


describe("loadSelectableOrganizations", () => {
  // The signup screen's organization field has been a bare text box since
  // January 2022: cacheAutofillData returns the enclosing function instead of
  // the array, JSON.stringify drops the function-valued property, and the read
  // then throws on undefined and is swallowed. That cache is also populated
  // only AFTER login, so a fresh install has nothing on the signup screen -
  // the exact moment the list is for.
  //
  // This reads the Organization class directly. It has public read, so it
  // works before anyone is signed in.
  const parseStub = (records, { shouldThrow } = {}) => {
    function Query() {
      this.select = () => this;
      this.limit = () => this;
      this.find = () =>
        (shouldThrow ? Promise.reject(new Error("offline")) : Promise.resolve(records));
    }
    return { Query };
  };

  const rec = (name, shortCode, active = true) => ({
    id: shortCode,
    get: (k) => ({ name, shortCode, active }[k]),
  });

  beforeEach(() => {
    getData.mockReset();
    storeData.mockReset();
  });

  it("returns the canonical names, sorted for scanning", async () => {
    const Parse = parseStub([
      rec("Solea Water", "solea"),
      rec("Cevicos", "cevicos"),
      rec("Puente", "puente"),
    ]);

    const names = await loadSelectableOrganizations(Parse);

    expect(names).toEqual(["Cevicos", "Puente", "Solea Water"]);
  });

  it("omits an inactive organization, which must not be offered to a new account", async () => {
    const Parse = parseStub([rec("Live Org", "live"), rec("Retired Org", "retired", false)]);

    expect(await loadSelectableOrganizations(Parse)).toEqual(["Live Org"]);
  });

  it("omits the internal-test organization", async () => {
    // Same exclusion Manage's picker applies. It is a junk bucket, not a
    // partner, and offering it to a real signup is how records end up there.
    const Parse = parseStub([rec("Internal / test", "internal-test"), rec("Real", "real")]);

    expect(await loadSelectableOrganizations(Parse)).toEqual(["Real"]);
  });

  it("falls back to the cached set when the read fails", async () => {
    // Signing up in a batey with no signal is the normal case, not the edge.
    getData.mockResolvedValue(["Cached Org"]);
    const Parse = parseStub([], { shouldThrow: true });

    expect(await loadSelectableOrganizations(Parse)).toEqual(["Cached Org"]);
  });

  it("returns an empty list rather than throwing when there is no cache either", async () => {
    // The field degrades to free text, which is exactly today's behaviour.
    // Throwing here would break the whole signup screen.
    getData.mockResolvedValue(null);
    const Parse = parseStub([], { shouldThrow: true });

    expect(await loadSelectableOrganizations(Parse)).toEqual([]);
  });
});
