function addSelectTextInputs(values, formObject) {
  const newFormObject = formObject;
  Object.entries(values).forEach(([key, val]) => {
    if (key.slice(0, 2) === '__') {
      const keys = key.split('__');
      const formikKey = keys[1];
      const formikOrigVal = keys[2];
      const index = newFormObject[formikKey].indexOf(formikOrigVal);
      newFormObject[formikKey][index] = `${formikOrigVal}__${val}`;
      delete newFormObject[key];
    }
  });
  return formObject;
}

function vitalsBloodPressue(values, formObject) {
  const newFormObject = formObject;
  newFormObject.bloodPressure = `${values.Systolic || '00'}/${values.Diastolic || '00'}`;

  const valuesToPrune = ['Systolic', 'Diastolic'];
  valuesToPrune.forEach((value) => {
    delete newFormObject[value];
  });
  return newFormObject;
}

export { addSelectTextInputs, vitalsBloodPressue };
