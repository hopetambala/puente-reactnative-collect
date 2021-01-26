import { getData } from '../../../../modules/async-storage';

const surveyingUserFailsafe = async (defautValue, validationFail) => {
  const user = await getData('currentUser');
  const userChecks = [defautValue, user.username, user.email, user.id, user.firstname, user.lastname, 'N/A'];
  const validIdentifiers = userChecks.filter((uniqueId) => validationFail(uniqueId) === false);
  return validIdentifiers[0];
};

export default surveyingUserFailsafe;
