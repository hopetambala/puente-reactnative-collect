const fs = require("fs");
const os = require("os");
const path = require("path");
const { releaseMetadata, dataSafetyCsv } = require("@app/scripts/release/androidMetadata");

describe("Google Play release metadata", () => {
  let root;
  const version = "15.7.5";
  const metadata = {
    releaseNotes: [
      { language: "en-US", text: "Faster resident search and reliable offline collection." },
      { language: "es-ES", text: "Búsqueda más rápida y recopilación sin conexión fiable." },
    ],
    contactEmail: "info@puente-dr.org",
  };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "android-metadata-"));
    fs.mkdirSync(path.join(root, "store/google-play"), { recursive: true });
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  function writeMetadata(value) {
    fs.writeFileSync(path.join(root, `store/google-play/${version}.json`), JSON.stringify(value));
  }

  it("reads the version-specific bilingual notes and contact metadata", () => {
    writeMetadata(metadata);

    expect(releaseMetadata(root, version)).toEqual(metadata);
  });

  it("normalizes explicit text notes without importing the default contact metadata", () => {
    writeMetadata(metadata);
    fs.writeFileSync(path.join(root, "release-notes.txt"), "  Test offline creation and sync.\n");

    expect(releaseMetadata(root, version, "release-notes.txt")).toEqual({
      releaseNotes: [{ language: "en-US", text: "Test offline creation and sync." }],
    });
  });

  it.each([
    ["over 500 characters", [{ language: "en-US", text: "x".repeat(501) }]],
    ["empty text", [{ language: "en-US", text: " \n " }]],
    ["no notes", []],
    ["duplicate locale", [
      { language: "en-US", text: "First note." },
      { language: "en-US", text: "Another note." },
    ]],
  ])("rejects %s before a release can be submitted", (_description, releaseNotes) => {
    writeMetadata({ ...metadata, releaseNotes });

    expect(() => releaseMetadata(root, version)).toThrow();
  });

  it.each([" \n ", "x".repeat(501)])("validates explicit text notes too", (text) => {
    fs.writeFileSync(path.join(root, "release-notes.txt"), text);

    expect(() => releaseMetadata(root, version, "release-notes.txt")).toThrow();
  });

  it("reads the version-controlled Data Safety CSV without altering it", () => {
    const csv = 'Question ID,Response ID,Response value\nPSL_DATA_TYPES,PSL_HEALTH,TRUE\n';
    const csvPath = path.join(root, "store/google-play/data-safety.csv");
    fs.writeFileSync(csvPath, csv);

    expect(dataSafetyCsv(root)).toBe(csv);
    expect(fs.readFileSync(csvPath, "utf8")).toBe(csv);
  });

  it("rejects an empty Data Safety CSV before it can replace the disclosure", () => {
    fs.writeFileSync(path.join(root, "store/google-play/data-safety.csv"), " \n ");

    expect(() => dataSafetyCsv(root)).toThrow();
  });
});
