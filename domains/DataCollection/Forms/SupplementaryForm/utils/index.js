function addSelectTextInputs(values, formObject) {
  const newFormObject = formObject;
  Object.entries(values).forEach(([key, val]) => {
    if (key.slice(0, 2) === "__") {
      const keys = key.split("__");
      const formikKey =
        keys[2].includes("sameForm") || keys[2].includes("loop")
          ? `${keys[1]}__${keys[2]}`
          : keys[1];
      const formikOrigVal =
        keys[2].includes("sameForm") || keys[2].includes("loop")
          ? keys[3]
          : keys[2];
      if (typeof formObject[formikKey] === "object") {
        const index = newFormObject[formikKey].indexOf(formikOrigVal);
        newFormObject[formikKey][index] = `${formikOrigVal}__${val}`;
        delete newFormObject[key];
      } else if (typeof formObject[formikKey] === "string") {
        newFormObject[formikKey] = `${formikOrigVal}__${val}`;
        delete newFormObject[key];
      }
    }
  });
  return formObject;
}

function vitalsBloodPressue(values, formObject) {
  const newFormObject = formObject;
  newFormObject.bloodPressure = `${values.Systolic || "00"}/${
    values.Diastolic || "00"
  }`;

  const valuesToPrune = ["Systolic", "Diastolic"];
  valuesToPrune.forEach((value) => {
    delete newFormObject[value];
  });
  return newFormObject;
}

// function to concatenate all loopSameForm keys to orginal key in use
function cleanLoopSubmissions(values, formObject) {
  const newFormObject = formObject;
  const repeatedQuestions = {};
  const valuesToPrune = [];
  Object.entries(values).forEach(([key, val]) => {
    if (key.includes("__sameForm")) {
      valuesToPrune.push(key);
      const actualKey = key.split("__sameForm")[0];
      if (Object.prototype.hasOwnProperty.call(repeatedQuestions, actualKey)) {
        repeatedQuestions[actualKey].push(val);
      } else {
        repeatedQuestions[actualKey] = [val];
      }
    }
  });

  valuesToPrune.forEach((value) => {
    delete newFormObject[value];
  });
  Object.entries(repeatedQuestions).forEach(([key, value]) => {
    value.forEach((val) => {
      newFormObject[key] = `${newFormObject[key]}|${val}`;
    });
  });

  return newFormObject;
}

/**
 * EDIT MODE REVERSE TRANSFORMATIONS
 * These functions reverse the forward transformations above for edit mode pre-population
 */

// Reverse blood pressure: "120/80" → { Systolic: "120", Diastolic: "80" }
function reverseVitalsBloodPressure(storedData) {
  const editFormValues = {};
  if (storedData.bloodPressure && typeof storedData.bloodPressure === "string") {
    const parts = storedData.bloodPressure.split("/");
    editFormValues.Systolic = parts[0] || "";
    editFormValues.Diastolic = parts[1] || "";
  }
  return editFormValues;
}

// Reverse select text inputs: "option__customText" → separate form fields
// This reconstructs the __fieldName__original form fields for custom text inputs
function reverseSelectTextInputs(storedData, config) {
  const editFormValues = {};
  
  if (!config || !config.fields) {
    return editFormValues;
  }

  // Find all fields that have the "text: true" option (like "other" options)
  const fieldsWithTextOption = {};
  config.fields.forEach((field) => {
    if (field.options) {
      field.options.forEach((option) => {
        if (option.text && option.textKey) {
          if (!fieldsWithTextOption[field.formikKey]) {
            fieldsWithTextOption[field.formikKey] = [];
          }
          fieldsWithTextOption[field.formikKey].push({
            originalValue: option.value,
            textKey: option.textKey,
          });
        }
      });
    }
  });

  // For each field that has custom text options, check if the stored data has "option__text" format
  Object.entries(fieldsWithTextOption).forEach(([fieldKey, options]) => {
    const storedValue = storedData[fieldKey];
    if (storedValue && typeof storedValue === "string") {
      // Check each option that supports custom text
      options.forEach(({ originalValue, textKey }) => {
        if (storedValue.includes(`${originalValue}__`)) {
          // Extract the custom text part
          const customText = storedValue.split("__")[1];
          editFormValues[textKey] = customText;
          // Also set the main select field to the original value (without the custom text)
          editFormValues[fieldKey] = originalValue;
        }
      });
    }
  });

  return editFormValues;
}

// Reverse loop submissions: "val1|val2|val3" → multiple form entries
// For looped questions, stored as "val1|val2|val3", needs to be split back
function reverseCleanLoopSubmissions(storedData, config) {
  const editFormValues = {};
  
  if (!config || !config.fields) {
    return editFormValues;
  }

  // Identify looped fields from config (fields that support loopSameForm)
  const loopedFields = new Set();
  config.fields.forEach((field) => {
    if (field.formikKey && field.formikKey.includes("__loop")) {
      const baseKey = field.formikKey.split("__")[0];
      loopedFields.add(baseKey);
    }
  });

  // For each looped field, split the pipe-separated values back into array format
  Object.entries(storedData).forEach(([key, value]) => {
    if (loopedFields.has(key) && typeof value === "string" && value.includes("|")) {
      const parts = value.split("|").filter((v) => v.length > 0);
      // For looped fields, we'll need to rebuild the individual form fields
      // This is complex and depends on how many loops there are
      // For now, just store the original value and let the form handle it
      editFormValues[key] = value;
    }
  });

  return editFormValues;
}

// Reverse custom form fields array format: FormResults fields → individual form values
// FormResults stores: { fields: [{ title: fieldName, answer: fieldValue }, ...] }
// This reverses it back to: { fieldName: fieldValue, ... }
function reverseFormResultsFields(storedData) {
  const editFormValues = {};

  if (storedData && Array.isArray(storedData.fields)) {
    storedData.fields.forEach((field) => {
      if (field.title && field.answer !== undefined) {
        editFormValues[field.title] = field.answer;
      }
    });
  }

  return editFormValues;
}

export {
  addSelectTextInputs,
  cleanLoopSubmissions,
  reverseCleanLoopSubmissions,
  reverseFormResultsFields,
  reverseSelectTextInputs,
  reverseVitalsBloodPressure,
  vitalsBloodPressue,
};
