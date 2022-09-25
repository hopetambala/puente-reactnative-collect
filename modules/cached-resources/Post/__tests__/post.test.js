import uuid from 'react-native-uuid';

import checkOnlineStatus from '../../../offline';
import {
  postHousehold, postHouseholdWithRelation, postIdentificationForm, postSupplementaryForm
} from '../post';

jest.mock('../../../offline', () => jest.fn());

describe('test offline', () => {
  test('postIdentificationForm', async () => {
    checkOnlineStatus.mockResolvedValue(false);

    const postParams = {
      parseClass: 'SurveyData',
      parseUser: uuid.v4(),
      photoFile: '',
      localObject: {
        fname: 'Hi'
      }
    };

    const postedOfflineForm = await postIdentificationForm(postParams);

    expect(postedOfflineForm).toHaveProperty('objectId');
  });

  test('Post Supplementary Form', async () => {
    checkOnlineStatus.mockResolvedValue(false);

    const surveyeePostParams = {
      parseClass: 'SurveyData',
      parseUser: uuid.v4(),
      photoFile: '',
      localObject: {
        fname: 'Hi'
      }
    };

    const surveyee = await postIdentificationForm(surveyeePostParams);

    const user = {
      objectId: `SurveyingUser-Id-${uuid.v4()}`
    };

    const customForm = {
      objectId: `Custom-Form-Id-${uuid.v4()}`,
      name: 'Custom Form Name',
      description: "I'm a form description"
    };

    const formObject = {
      surveyingUser: 'JJ McCarthy',
      surveyingOrganization: 'Michigan'
    };

    const postParams = {
      parseParentClassID: surveyee.objectId,
      parseParentClass: 'SurveyData',
      parseUser: user.objectId,
      parseClass: 'config.class',
      photoFile: '',
      localObject: formObject,
    };

    postParams.localObject = {
      title: customForm.name,
      description: customForm.description,
      formSpecificationsId: customForm.objectId,
      fields: [],
      surveyingUser: formObject.surveyingUser,
      surveyingOrganization: formObject.surveyingOrganization
    };

    const postedSupplementaryForm = await postSupplementaryForm(postParams);

    expect(postedSupplementaryForm.parseParentClassID).toContain('PatientID'); // signifies it is an offline form
  });

  test('postHousehold', async () => {
    checkOnlineStatus.mockResolvedValue(false);
    const postParams = {
      parseClass: 'Household',
      localObject: {
        latitude: 0,
        longitude: 0
      }
    };

    const postedOfflineHousehold = await postHousehold(postParams);

    expect(postedOfflineHousehold).toHaveProperty('objectId');
    expect(postedOfflineHousehold.objectId).toContain('Household');
  });

  test('Post Household with a relationship', async () => {
    checkOnlineStatus.mockResolvedValue(false);

    const postParams = {
      parseParentClassID: uuid.v4(),
      parseParentClass: 'Household',
      parseClass: 'Household',
      localObject: {
        relationship: 'father',
        latitude: 0,
        longitude: 0
      }
    };

    const postedHouseholdWithRelation = await postHouseholdWithRelation(postParams);

    expect(postedHouseholdWithRelation).toHaveProperty('objectId');
    expect(postedHouseholdWithRelation.objectId).toContain('Household');
  });
});