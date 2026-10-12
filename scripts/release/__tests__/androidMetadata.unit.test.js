const fs = require("fs");
const os = require("os");
const path = require("path");
const { releaseMetadata, dataSafetyCsv } = require("@app/scripts/release/androidMetadata");

describe("Google Play release metadata", () => {
  let root;
  const version = "15.7.5";
  const dataSafetyHeader = "Question ID (machine readable),Response ID (machine readable),Response value,Answer requirement,Human-friendly question label";
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
    const csv = `${dataSafetyHeader}\r\nPSL_DATA_TYPES_HEALTH,PSL_HEALTH,TRUE,MULTIPLE_CHOICE,"Health and fitness\r\nHealth info"\r\n`;
    const csvPath = path.join(root, "store/google-play/data-safety.csv");
    fs.writeFileSync(csvPath, csv);

    expect(dataSafetyCsv(root)).toBe(csv);
    expect(fs.readFileSync(csvPath, "utf8")).toBe(csv);
  });

  it.each([
    "Question ID,Response ID,Response value",
    "Question ID (machine readable),Response ID (machine readable),Response value,Answer requirement",
    "Response ID (machine readable),Question ID (machine readable),Response value,Answer requirement,Human-friendly question label",
  ])("rejects a Data Safety CSV without the official five-column header: %s", (header) => {
    fs.writeFileSync(path.join(root, "store/google-play/data-safety.csv"), `${header}\nPSL_DATA_TYPES_HEALTH,PSL_HEALTH,TRUE,MULTIPLE_CHOICE,Health info\n`);

    expect(() => dataSafetyCsv(root)).toThrow();
  });

  it("rejects copied output truncation markers even after a correct CSV header", () => {
    const csv = `${dataSafetyHeader}\nWarning: truncated output (original token count: 43825)\nTotal output lines: 2208\n\nPSL_DATA_TYPES_HEALTH,PSL_HEALTH,TRUE,MULTIPLE_CHOICE,Health info\n`;
    fs.writeFileSync(path.join(root, "store/google-play/data-safety.csv"), csv);

    expect(() => dataSafetyCsv(root)).toThrow();
  });

  it("rejects an empty Data Safety CSV before it can replace the disclosure", () => {
    fs.writeFileSync(path.join(root, "store/google-play/data-safety.csv"), " \n ");

    expect(() => dataSafetyCsv(root)).toThrow();
  });
});
