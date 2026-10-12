const fs = require("fs");
const path = require("path");

function releaseMetadata(root, version, notesPath) {
  const metadata = notesPath
    ? {
      releaseNotes: [{
        language: "en-US",
        text: fs.readFileSync(path.resolve(root, notesPath), "utf8").trim(),
      }],
    }
    : JSON.parse(fs.readFileSync(path.join(root, "store/google-play", `${version}.json`), "utf8"));

  if (!Array.isArray(metadata.releaseNotes) || !metadata.releaseNotes.length) {
    throw new Error("Google Play release metadata must contain release notes");
  }
  const languages = new Set();
  metadata.releaseNotes.forEach((note) => {
    if (
      typeof note?.language !== "string" ||
      !note.language.trim() ||
      languages.has(note.language) ||
      typeof note.text !== "string" ||
      !note.text.trim() ||
      note.text.length > 500
    ) {
      throw new Error("Release notes need unique locales and 1–500 characters per locale");
    }
    languages.add(note.language);
  });
  return metadata;
}

function dataSafetyCsv(root) {
  const csv = fs.readFileSync(path.join(root, "store/google-play/data-safety.csv"), "utf8");
  if (!csv.trim()) throw new Error("Google Play Data Safety CSV must not be empty");
  const header = "Question ID (machine readable),Response ID (machine readable),Response value,Answer requirement,Human-friendly question label";
  if (csv.split(/\r?\n/, 1)[0] !== header) {
    throw new Error("Google Play Data Safety CSV must have the official five-column header");
  }
  if (/Warning: truncated output|Total output lines:|\d+ tokens truncated/i.test(csv)) {
    throw new Error("Google Play Data Safety CSV contains copied output truncation markers");
  }
  return csv;
}

module.exports = { releaseMetadata, dataSafetyCsv };
