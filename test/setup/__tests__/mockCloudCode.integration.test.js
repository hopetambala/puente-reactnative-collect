/**
 * Fidelity tests for test/setup/mockCloudCode.js.
 *
 * The Jest integration suite runs against a mock of Parse Cloud Code, not
 * against puente-node-cloudcode. Every behaviour asserted here is copied from
 * the real implementation, so that a mock that quietly drifts away from
 * production fails a test instead of keeping 400+ green ones honest-looking.
 *
 * Source of truth:
 *   puente-node-cloudcode/cloud/src/services/offline/offline.js
 *   puente-node-cloudcode/cloud/src/services/post/post.js
 *   puente-node-cloudcode/cloud/src/services/post/hooks/afterSave.js
 *   puente-node-cloudcode/cloud/src/definer/auth.definer.js
 */
import testUsers from "@app/test/fixtures/users";
import hooks from "@app/test/hooks";
import { Parse } from "parse/react-native";

hooks();

const uid = () => Math.random().toString(36).slice(2, 10);

const runUpload = (payload) =>
  Parse.Cloud.run("uploadOfflineForms", payload);

const findOne = (parseClass, column, value) =>
  new Parse.Query(parseClass).equalTo(column, value).first({ useMasterKey: true });

const countWhere = (parseClass, column, value) =>
  new Parse.Query(parseClass).equalTo(column, value).count({ useMasterKey: true });

const metadataFor = (overrides = {}) => ({
  surveyingUser: "sync.presser",
  surveyingOrganization: "Puente Test Org",
  appVersion: "15.6.0",
  phoneOS: "ios",
  ...overrides,
});

describe("mockCloudCode uploadOfflineForms — metadata fallback", () => {
  test("fills surveyingUser/surveyingOrganization/appVersion/phoneOS from sync metadata when the record carries none", async () => {
    const fname = `MetaFill-${uid()}`;

    await runUpload({
      residentForms: [
        {
          parseClass: "SurveyData",
          localObject: { fname, lname: "Reyes" },
        },
      ],
      metadata: metadataFor({ surveyingUser: "field.worker" }),
    });

    const saved = await findOne("SurveyData", "fname", fname);
    expect(saved).toBeDefined();
    expect(saved.get("surveyingUser")).toBe("field.worker");
    expect(saved.get("surveyingOrganization")).toBe("Puente Test Org");
    expect(saved.get("appVersion")).toBe("15.6.0");
    expect(saved.get("phoneOS")).toBe("ios");
  });

  test("collection-time values win: metadata never overwrites a field the record already carries", async () => {
    const fname = `MetaNoClobber-${uid()}`;

    await runUpload({
      residentForms: [
        {
          parseClass: "SurveyData",
          localObject: {
            fname,
            surveyingUser: "the.surveyor",
            surveyingOrganization: "Collected Org",
          },
        },
      ],
      metadata: metadataFor(),
    });

    const saved = await findOne("SurveyData", "fname", fname);
    expect(saved).toBeDefined();
    expect(saved.get("surveyingUser")).toBe("the.surveyor");
    expect(saved.get("surveyingOrganization")).toBe("Collected Org");
  });

  test("an empty-string field counts as missing and is filled from metadata", async () => {
    const fname = `MetaEmpty-${uid()}`;

    await runUpload({
      residentForms: [
        {
          parseClass: "SurveyData",
          localObject: { fname, surveyingOrganization: "" },
        },
      ],
      metadata: metadataFor({ surveyingOrganization: "Rescued Org" }),
    });

    const saved = await findOne("SurveyData", "fname", fname);
    expect(saved).toBeDefined();
    expect(saved.get("surveyingOrganization")).toBe("Rescued Org");
  });

  test("households pick up surveyingUser/surveyingOrganization from metadata", async () => {
    const latitude = 41 + Math.random();

    await runUpload({
      households: [
        {
          parseClass: "Household",
          localObject: { latitude, longitude: -71 },
        },
      ],
      metadata: metadataFor({ surveyingUser: "household.surveyor" }),
    });

    const saved = await findOne("Household", "latitude", latitude);
    expect(saved).toBeDefined();
    expect(saved.get("surveyingUser")).toBe("household.surveyor");
    expect(saved.get("surveyingOrganization")).toBe("Puente Test Org");
  });
});

describe("mockCloudCode uploadOfflineForms — offline id transforms", () => {
  test("a PatientID- objectId becomes objectIdOffline and is not stored as objectId", async () => {
    const fname = `PatientXform-${uid()}`;
    const offlineId = `PatientID-${uid()}`;

    await runUpload({
      residentForms: [
        { parseClass: "SurveyData", localObject: { fname, objectId: offlineId } },
      ],
      metadata: metadataFor(),
    });

    const saved = await findOne("SurveyData", "fname", fname);
    expect(saved).toBeDefined();
    expect(saved.get("objectIdOffline")).toBe(offlineId);
    expect(saved.get("objectId")).toBeUndefined();
  });

  test("an AssetID- objectId becomes objectIdOffline", async () => {
    const name = `AssetXform-${uid()}`;
    const offlineId = `AssetID-${uid()}`;

    await runUpload({
      assetForms: [
        { parseClass: "Assets", localObject: { name, objectId: offlineId } },
      ],
      metadata: metadataFor(),
    });

    const saved = await findOne("Assets", "name", name);
    expect(saved).toBeDefined();
    expect(saved.get("objectIdOffline")).toBe(offlineId);
  });

  test("a Household- objectId becomes objectIdOffline", async () => {
    const latitude = 42 + Math.random();
    const offlineId = `Household-${uid()}`;

    await runUpload({
      households: [
        {
          parseClass: "Household",
          localObject: { latitude, longitude: -71, objectId: offlineId },
        },
      ],
      metadata: metadataFor(),
    });

    const saved = await findOne("Household", "latitude", latitude);
    expect(saved).toBeDefined();
    expect(saved.get("objectIdOffline")).toBe(offlineId);
  });

  test("a resident's Household- householdId becomes householdObjectIdOffline", async () => {
    const fname = `HouseholdXform-${uid()}`;
    const householdOfflineId = `Household-${uid()}`;

    await runUpload({
      residentForms: [
        {
          parseClass: "SurveyData",
          localObject: { fname, householdId: householdOfflineId },
        },
      ],
      metadata: metadataFor(),
    });

    const saved = await findOne("SurveyData", "fname", fname);
    expect(saved).toBeDefined();
    expect(saved.get("householdObjectIdOffline")).toBe(householdOfflineId);
  });
});

describe("mockCloudCode uploadOfflineForms — objectIdOffline idempotency", () => {
  test("re-uploading a batch that already saved yields one resident, not a duplicate", async () => {
    const fname = `RetryResident-${uid()}`;
    const offlineId = `PatientID-${uid()}`;
    const batch = {
      residentForms: [
        { parseClass: "SurveyData", localObject: { fname, objectId: offlineId } },
      ],
      metadata: metadataFor(),
    };

    await runUpload(JSON.parse(JSON.stringify(batch)));
    await runUpload(JSON.parse(JSON.stringify(batch)));

    expect(await countWhere("SurveyData", "fname", fname)).toBe(1);
  });

  test("re-uploading a batch that already saved yields one household, not a duplicate", async () => {
    const latitude = 43 + Math.random();
    const offlineId = `Household-${uid()}`;
    const batch = {
      households: [
        {
          parseClass: "Household",
          localObject: { latitude, longitude: -71, objectId: offlineId },
        },
      ],
      metadata: metadataFor(),
    };

    await runUpload(JSON.parse(JSON.stringify(batch)));
    await runUpload(JSON.parse(JSON.stringify(batch)));

    expect(await countWhere("Household", "latitude", latitude)).toBe(1);
  });

  test("a retried asset batch yields one asset, not a duplicate", async () => {
    const name = `RetryAsset-${uid()}`;
    const offlineId = `AssetID-${uid()}`;
    const batch = {
      assetForms: [
        { parseClass: "Assets", localObject: { name, objectId: offlineId } },
      ],
      metadata: metadataFor(),
    };

    await runUpload(JSON.parse(JSON.stringify(batch)));
    await runUpload(JSON.parse(JSON.stringify(batch)));

    expect(await countWhere("Assets", "name", name)).toBe(1);
  });
});

describe("mockCloudCode uploadOfflineForms — full field copy and class routing", () => {
  test("every localObject key is copied, not a hand-picked whitelist", async () => {
    const fname = `FullCopy-${uid()}`;

    await runUpload({
      residentForms: [
        {
          parseClass: "SurveyData",
          localObject: {
            fname,
            communityname: "Batey 50",
            province: "Barahona",
            country: "Dominican Republic",
            evacuationLocation: "School",
          },
        },
      ],
      metadata: metadataFor(),
    });

    const saved = await findOne("SurveyData", "fname", fname);
    expect(saved).toBeDefined();
    expect(saved.get("communityname")).toBe("Batey 50");
    expect(saved.get("province")).toBe("Barahona");
    expect(saved.get("country")).toBe("Dominican Republic");
    expect(saved.get("evacuationLocation")).toBe("School");
  });

  test("records land in the parseClass the record declares, not a hardcoded class name", async () => {
    const title = `ClassRouting-${uid()}`;

    await runUpload({
      residentSupplementaryForms: [
        {
          parseClass: "FormResults",
          parseParentClass: "SurveyData",
          parseParentClassID: "",
          localObject: { title, fields: [] },
        },
      ],
      metadata: metadataFor(),
    });

    const saved = await findOne("FormResults", "title", title);
    expect(saved).toBeDefined();
  });
});

describe("mockCloudCode uploadOfflineForms — offline parent reconciliation", () => {
  test("a supplementary form whose parent was collected offline records parseParentClassObjectIdOffline and is linked to the parent's saved record", async () => {
    const suffix = uid();
    const fname = `OrphanParent-${suffix}`;
    const title = `OrphanSup-${suffix}`;
    const parentOfflineId = `PatientID-${suffix}`;

    await runUpload({
      residentForms: [
        {
          parseClass: "SurveyData",
          localObject: { fname, objectId: parentOfflineId },
        },
      ],
      residentSupplementaryForms: [
        {
          parseClass: "FormResults",
          parseParentClass: "SurveyData",
          parseParentClassID: parentOfflineId,
          localObject: { title, fields: [] },
        },
      ],
      metadata: metadataFor(),
    });

    const parent = await findOne("SurveyData", "fname", fname);
    expect(parent).toBeDefined();

    const saved = await findOne("FormResults", "title", title);
    expect(saved).toBeDefined();
    expect(saved.get("parseParentClassObjectIdOffline")).toBe(parentOfflineId);
    expect(saved.get("client")).toBeDefined();
    expect(saved.get("client").id).toBe(parent.id);
  });

  test("a resident whose household was collected offline is linked to the household's saved record", async () => {
    const suffix = uid();
    const fname = `HouseholdLink-${suffix}`;
    const latitude = 44 + Math.random();
    const householdOfflineId = `Household-${suffix}`;

    await runUpload({
      households: [
        {
          parseClass: "Household",
          localObject: {
            latitude,
            longitude: -71,
            objectId: householdOfflineId,
          },
        },
      ],
      residentForms: [
        {
          parseClass: "SurveyData",
          localObject: { fname, householdId: householdOfflineId },
        },
      ],
      metadata: metadataFor(),
    });

    const household = await findOne("Household", "latitude", latitude);
    expect(household).toBeDefined();

    const resident = await findOne("SurveyData", "fname", fname);
    expect(resident).toBeDefined();
    expect(resident.get("householdId")).toBe(household.id);
    expect(resident.get("householdClient")).toBeDefined();
    expect(resident.get("householdClient").id).toBe(household.id);
  });
});

describe("mockCloudCode postObjectsToClassWithRelation", () => {
  test("stores the parent in the 'client' pointer column and parseUser as a pointer", async () => {
    const title = `RelationClient-${uid()}`;
    const parent = new Parse.Object("SurveyData");
    parent.set("fname", `RelationParent-${uid()}`);
    await parent.save(null, { useMasterKey: true });

    await Parse.Cloud.run("postObjectsToClassWithRelation", {
      parseClass: "FormResults",
      parseParentClass: "SurveyData",
      parseParentClassID: parent.id,
      parseUser: global.testParseConfig
        ? global.testParseConfig.user.objectId
        : JSON.parse(process.env.PARSE_TEST_CONFIG).user.objectId,
      localObject: { title, fields: [] },
    });

    const saved = await findOne("FormResults", "title", title);
    expect(saved).toBeDefined();
    expect(saved.get("client")).toBeDefined();
    expect(saved.get("client").id).toBe(parent.id);
    expect(saved.get("parseUser")).toBeDefined();
    expect(saved.get("parseUser").className).toBe("_User");
  });
});

describe("mockCloudCode auth", () => {
  test("the sign-in cloud function is named signin, matching puente-node-cloudcode", async () => {
    const { username, password } = testUsers.dataCollector;

    const result = await Parse.Cloud.run("signin", { username, password });

    expect(result).toBeDefined();
    const resultUsername =
      typeof result.get === "function" ? result.get("username") : result.username;
    expect(resultUsername).toBe(username);
  });
});
