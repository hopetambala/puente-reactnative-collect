const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");

function packageVersion(contents) {
  return JSON.parse(contents).version;
}

function didVersionChange(previousContents, currentContents) {
  return packageVersion(previousContents) !== packageVersion(currentContents);
}

function main() {
  if (process.env.GITHUB_EVENT_NAME === "workflow_dispatch") {
    process.stdout.write("true");
    return;
  }

  const before = process.env.BEFORE_SHA;
  if (!before || /^0+$/.test(before)) {
    process.stdout.write("false");
    return;
  }

  const previous = execFileSync("git", ["show", `${before}:package.json`], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const current = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
  process.stdout.write(String(didVersionChange(previous, current)));
}

module.exports = { didVersionChange, packageVersion };

if (require.main === module) main();
