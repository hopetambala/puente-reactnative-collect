const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");
const english = require("@modules/i18n/english/en.json");
const spanish = require("@modules/i18n/spanish/es.json");

const eslintRequire = createRequire(require.resolve("eslint/package.json"));
const yaml = eslintRequire("js-yaml");

it("recognizes both current policy sheet headings before asserting authenticated Home", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../../.maestro/subflows/login.yaml"), "utf8");
  const [, commands] = yaml.loadAll(source);
  const policyGate = commands.find(command => command.runFlow?.commands?.some(
    step => step.tapOn === "^Ok$"
  )).runFlow;

  expect(policyGate.when.visible.split("|")).toEqual(expect.arrayContaining([
    english.termsModal.termsService,
    spanish.termsModal.termsService,
  ]));
});
