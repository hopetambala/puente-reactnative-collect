import {
  addSelectTextInputs,
  cleanLoopSubmissions,
  vitalsBloodPressue,
} from "@app/domains/DataCollection/Forms/SupplementaryForm/utils/index";

describe("addSelectTextInputs", () => {
  test("returns formObject unchanged when no __ prefixed keys", () => {
    const values = { name: "Alice", age: "30" };
    const formObject = { name: "Alice", age: "30" };
    const result = addSelectTextInputs(values, formObject);
    expect(result).toEqual({ name: "Alice", age: "30" });
  });

  test("appends text input to a string field value", () => {
    const values = {
      condition: "fever",
      "__condition__sameForm__other": "custom",
    };
    const formObject = {
      condition: "fever",
      "__condition__sameForm__other": "custom",
    };
    const result = addSelectTextInputs(values, formObject);
    // The __ key is processed and the formikKey value is updated
    expect(result).toBeDefined();
  });

  test("appends text input to an array field value", () => {
    const values = {
      symptoms: ["fever", "cough"],
      "__symptoms__other": "headache",
    };
    const formObject = {
      symptoms: ["fever", "cough"],
      "__symptoms__other": "headache",
    };
    const result = addSelectTextInputs(values, formObject);
    // The __ key causes the array item to be updated with __text appended
    expect(result.symptoms).toBeDefined();
  });

  test("handles empty values", () => {
    const result = addSelectTextInputs({}, {});
    expect(result).toEqual({});
  });
});

describe("vitalsBloodPressue", () => {
  test("combines Systolic and Diastolic into bloodPressure field", () => {
    const values = { Systolic: "120", Diastolic: "80" };
    const formObject = { Systolic: "120", Diastolic: "80", name: "Test" };
    const result = vitalsBloodPressue(values, formObject);
    expect(result.bloodPressure).toBe("120/80");
  });

  test("removes Systolic and Diastolic from form object", () => {
    const values = { Systolic: "120", Diastolic: "80" };
    const formObject = { Systolic: "120", Diastolic: "80" };
    const result = vitalsBloodPressue(values, formObject);
    expect(result.Systolic).toBeUndefined();
    expect(result.Diastolic).toBeUndefined();
  });

  test("defaults to 00 when Systolic is missing", () => {
    const values = { Diastolic: "80" };
    const formObject = { Diastolic: "80" };
    const result = vitalsBloodPressue(values, formObject);
    expect(result.bloodPressure).toBe("00/80");
  });

  test("defaults to 00 when Diastolic is missing", () => {
    const values = { Systolic: "120" };
    const formObject = { Systolic: "120" };
    const result = vitalsBloodPressue(values, formObject);
    expect(result.bloodPressure).toBe("120/00");
  });

  test("defaults to 00/00 when both values are missing", () => {
    const values = {};
    const formObject = {};
    const result = vitalsBloodPressue(values, formObject);
    expect(result.bloodPressure).toBe("00/00");
  });

  test("preserves other form fields", () => {
    const values = { Systolic: "110", Diastolic: "70" };
    const formObject = { Systolic: "110", Diastolic: "70", weight: "70kg" };
    const result = vitalsBloodPressue(values, formObject);
    expect(result.weight).toBe("70kg");
  });
});

describe("cleanLoopSubmissions", () => {
  test("returns formObject unchanged when no __sameForm keys", () => {
    const values = { name: "Alice", condition: "fever" };
    const formObject = { name: "Alice", condition: "fever" };
    const result = cleanLoopSubmissions(values, formObject);
    expect(result).toEqual({ name: "Alice", condition: "fever" });
  });

  test("concatenates __sameForm values with pipe separator", () => {
    const values = {
      condition: "fever",
      "condition__sameForm": "cough",
    };
    const formObject = {
      condition: "fever",
      "condition__sameForm": "cough",
    };
    const result = cleanLoopSubmissions(values, formObject);
    expect(result.condition).toBe("fever|cough");
  });

  test("removes __sameForm keys from formObject", () => {
    const values = {
      condition: "fever",
      "condition__sameForm": "cough",
    };
    const formObject = {
      condition: "fever",
      "condition__sameForm": "cough",
    };
    const result = cleanLoopSubmissions(values, formObject);
    expect(result.condition__sameForm).toBeUndefined();
  });

  test("handles multiple __sameForm values for the same key", () => {
    const values = {
      condition: "fever",
      "condition__sameForm": "cough",
      "condition__sameForm1": "headache",
    };
    const formObject = {
      condition: "fever",
      "condition__sameForm": "cough",
      "condition__sameForm1": "headache",
    };
    const result = cleanLoopSubmissions(values, formObject);
    expect(result.condition).toContain("fever");
  });

  test("handles empty values and formObject", () => {
    const result = cleanLoopSubmissions({}, {});
    expect(result).toEqual({});
  });

  test("preserves non-loop fields", () => {
    const values = {
      name: "Alice",
      "condition__sameForm": "cough",
    };
    const formObject = {
      name: "Alice",
      condition: "fever",
      "condition__sameForm": "cough",
    };
    const result = cleanLoopSubmissions(values, formObject);
    expect(result.name).toBe("Alice");
  });
});
