import * as yup from 'yup';
import I18n from '../../../modules/i18n';

export default function yupValidationPicker(fields) {
  let validationSchema = yup.object().shape({});
  fields.map((result) => {
    const {
      label, formikKey, fieldType, validation, options
    } = result;
    if (validation) {
      if (fieldType === 'input' || fieldType === 'numberInput' || fieldType === 'select'
        || fieldType === ' autofill') {
        const resultSchemaInput = {};
        resultSchemaInput[formikKey] = yup.string().label(I18n.t(label)).required();
        const resultObjectInput = yup.object().shape(resultSchemaInput);
        validationSchema = validationSchema.concat(resultObjectInput);
      } else if (fieldType === 'geolocation') {
        const resultSchemaGeo = {};
        resultSchemaGeo[formikKey] = yup.object().label(I18n.t(label)).required();
        const resultObjectGeo = yup.object().shape(resultSchemaGeo);
        validationSchema = validationSchema.concat(resultObjectGeo);
      } else if (fieldType === 'multiInputRow' || fieldType === 'multiInputRowNum') {
        options.map((option) => {
          const resultSchemaMultiInput = {};
          resultSchemaMultiInput[I18n.t(option)] = yup.string().label(I18n.t(option)).required();
          const resultObjectMultiInput = yup.object().shape(resultSchemaMultiInput);
          validationSchema = validationSchema.concat(resultObjectMultiInput);
        });
      }
    }
  });
  return validationSchema;
}
