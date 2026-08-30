import { resolveAutofillFields } from "@impacto-design-system/Extensions/FormikFields/PaperInputPicker/AutoFill/fields";

describe("resolveAutofillFields", () => {
  it("prefers explicit options over the cache", () => {
    // The signup screen supplies its own list from the Organization class. The
    // cache derives from _User free-text strings and is populated only AFTER
    // login, so on a fresh install it holds nothing at the one moment the
    // organization list is actually needed.
    expect(
      resolveAutofillFields({
        options: ["Puente", "Cevicos"],
        cached: { organization: ["From Cache"] },
        parameter: "organization",
      })
    ).toEqual(["Cevicos", "Puente"]);
  });

  it("falls back to the cache when no options are given", () => {
    // City and Communities keep working exactly as before.
    expect(
      resolveAutofillFields({
        cached: { City: ["Santo Domingo", "Azua"] },
        parameter: "City",
      })
    ).toEqual(["Azua", "Santo Domingo"]);
  });

  it("returns an empty list when the cached parameter is missing", () => {
    // THE BUG, live since January 2022: cacheAutofillData returns the enclosing
    // function instead of the array, JSON.stringify drops function-valued
    // properties, so `organization` never reaches storage. The component then
    // called data[parameter].sort() on undefined, threw, and the throw was
    // swallowed - leaving a silent free-text box with one console.error.
    expect(
      resolveAutofillFields({ cached: { City: [] }, parameter: "organization" })
    ).toEqual([]);
  });

  it("returns an empty list when there is no cache at all", () => {
    expect(resolveAutofillFields({ cached: null, parameter: "organization" })).toEqual([]);
  });

  it("ignores a cached value that is not an array", () => {
    // Exactly what the 2022 bug stored: a function, not a list.
    expect(
      resolveAutofillFields({ cached: { organization: () => {} }, parameter: "organization" })
    ).toEqual([]);
  });

  it("drops blanks and duplicates so the list is scannable", () => {
    expect(
      resolveAutofillFields({ options: ["Puente", "", "Puente", "Cevicos", null] })
    ).toEqual(["Cevicos", "Puente"]);
  });
});
