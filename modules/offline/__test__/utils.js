import { faker } from "@faker-js/faker";
import { storeData } from "@modules/async-storage";

const createOfflineUserMockData = async () => {
  const user = {
    objectId: faker.database.mongodbObjectId(),
    username: faker.internet.username(),
    firstname: faker.person.firstName(),
    lastname: faker.person.lastName(),
    organization: faker.company.name(),
    email: faker.internet.email(),
    createdAt: faker.date.past(),
  };
  await storeData(user, "currentUser");
  return user;
};

const createResidentMockData = (
  numberOfRecords,
  userObjectId,
  householdId = ""
) => {
  const residentArray = [];

  for (let i = 0; i < numberOfRecords; i += 1) {
    const postParams = {
      parseClass: "SurveyData",
      parseUser: userObjectId,
      photoFile: faker.image.url(),
      localObject: {
        fname: faker.person.firstName(),
        lname: faker.person.lastName(),
        nickname: faker.person.middleName(),
        dob: String(faker.date.birthdate()),
        sex: faker.person.sex(),
        householdId,
      },
    };

    residentArray.push(postParams);
  }

  return residentArray;
};

const createSupplementaryFormMockData = (
  numberOfRecords,
  surveyeeObjectedId,
  userObjectId,
  numberOfResponses = 5
) => {
  const supplementaryFormArray = [];

  const customFormSpecifications = {
    objectId: faker.database.mongodbObjectId(),
    name: `Form ${faker.commerce.productName()}`,
    description: faker.commerce.productDescription(),
  };

  const fakeTitles = [
    "waterSourceDrinking",
    "waterSourceOther",
    "problemsWater",
    "receiveWater",
    "timeToGetWater",
    "getsWaterHousehold",
  ];
  const fakeAnswers = [
    "aqueduct",
    "lessThan1",
    ["none"],
    ["adultMale"],
    "moreThan30",
    "no",
    "1,000",
    "yes",
  ];

  const fields = Array(numberOfResponses)
    .fill(0)
    .map(() => ({
      title: faker.helpers.arrayElement(fakeTitles),
      answer: faker.helpers.arrayElement(fakeAnswers),
    }));

  const localObject = {
    title: customFormSpecifications.name,
    description: customFormSpecifications.description,
    formSpecificationsId: customFormSpecifications.objectId,
    fields,
    surveyingUser: "JJ McCarthy",
    surveyingOrganization: "Michigan",
  };

  for (let i = 0; i < numberOfRecords; i += 1) {
    const postParams = {
      parseParentClassID: surveyeeObjectedId,
      parseParentClass: "SurveyData",
      parseUser: userObjectId,
      parseClass: "FormResults",
      photoFile: faker.image.dataUri(),
      localObject,
    };

    supplementaryFormArray.push(postParams);
  }

  return supplementaryFormArray;
};

const createHouseholdMockData = (numberOfRecords) => {
  const households = [];

  const localObject = {
    latitude: 0,
    longitude: 0,
  };

  for (let i = 0; i < numberOfRecords; i += 1) {
    const postParams = {
      parseClass: "Household",
      localObject,
    };
    households.push(postParams);
  }

  return households;
};

const createAssetMockData = (numberOfRecords, userObjectId) => {
  const assetArray = [];

  for (let i = 0; i < numberOfRecords; i += 1) {
    const postParams = {
      parseClass: "Assets",
      parseUser: userObjectId,
      photoFile: faker.image.url(),
      signature: "Asset Signature",
      localObject: {
        name: faker.word.noun(),
        location: faker.address.nearbyGPSCoordinate(),
        communityname: faker.address.cityName(),
        province: faker.address.state(),
        country: faker.address.country(),
      },
    };

    assetArray.push(postParams);
  }

  return assetArray;
};

const createAssetSupplementaryFormMockData = (
  numberOfRecords,
  assetObjectedId,
  userObjectId,
  numberOfResponses = 5
) => {
  const supplementaryAssetFormArray = [];

  const customFormSpecifications = {
    objectId: faker.database.mongodbObjectId(),
    name: `Form ${faker.commerce.productName()}`,
    description: faker.commerce.productDescription(),
  };

  const fakeTitles = [
    "waterSourceDrinking",
    "waterSourceOther",
    "problemsWater",
    "receiveWater",
    "timeToGetWater",
    "getsWaterHousehold",
  ];
  const fakeAnswers = [
    "aqueduct",
    "lessThan1",
    ["none"],
    ["adultMale"],
    "moreThan30",
    "no",
    "1,000",
    "yes",
  ];

  const fields = Array(numberOfResponses)
    .fill(0)
    .map(() => ({
      title: faker.helpers.arrayElement(fakeTitles),
      answer: faker.helpers.arrayElement(fakeAnswers),
    }));

  const localObject = {
    title: customFormSpecifications.name,
    description: customFormSpecifications.description,
    formSpecificationsId: customFormSpecifications.objectId,
    fields,
    surveyingUser: "JJ McCarthy",
    surveyingOrganization: "Michigan",
  };

  for (let i = 0; i < numberOfRecords; i += 1) {
    const postParams = {
      parseParentClassID: assetObjectedId,
      parseParentClass: "Assets",
      parseUser: userObjectId,
      parseClass: "FormAssetResults",
      photoFile: faker.image.dataUri(),
      localObject,
      typeOfForm: "Asset",
    };

    supplementaryAssetFormArray.push(postParams);
  }

  return supplementaryAssetFormArray;
};

export {
  createAssetMockData,
  createAssetSupplementaryFormMockData,
  createHouseholdMockData,
  createOfflineUserMockData,
  createResidentMockData,
  createSupplementaryFormMockData,
};
