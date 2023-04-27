import selectedENV from "@app/environment";
import client from "@app/services/parse/client";

import {
  customMultiParamQueryService,
  customMultiValueArrayService,
  customQueryService,
} from "./custom-queries";

const { TEST_MODE } = selectedENV;
const Parse = client(TEST_MODE);

function retrieveHelloFunction() {
  Parse.Cloud.run("hello").then((result) => result);
}

function residentIDQuery(params) {
  const { parseParam, limit } = params;
  function checkIfAlreadyExist(accumulator, currentVal) {
    return accumulator.some(
      (item) =>
        item.get("fname") === currentVal.get("fname") &&
        item.get("lname") === currentVal.get("lname") &&
        item.get("sex") === currentVal.get("sex") &&
        item.get("marriageStatus") === currentVal.get("marriageStatus") &&
        item.get("educationLevel") === currentVal.get("educationLevel")
    );
  }

  return new Promise((resolve, reject) => {
    const Model = Parse.Object.extend("SurveyData");
    const query = new Parse.Query(Model);

    query.descending("createdAt");

    query.equalTo("surveyingOrganization", parseParam);
    query.limit(limit);

    query.find().then(
      (records) => {
        const deDuplicatedRecords = records.reduce((accumulator, current) => {
          if (checkIfAlreadyExist(accumulator, current)) {
            return accumulator;
          }
          return [...accumulator, current];
        }, []);
        resolve(JSON.parse(JSON.stringify(deDuplicatedRecords)));
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function countService(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run("countService", params).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function postObjectsToClass(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run("postObjectsToClass", params).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function postObjectsToClassWithRelation(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run("postObjectsToClassWithRelation", params).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function getObjectsByGeolocation(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run("geoQuery", params).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function updateObject(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run('updateObject', params).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function postOfflineForms(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run("postOfflineForms", params).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function uploadOfflineForms(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run("uploadOfflineForms", params).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

export {
  countService,
  customMultiParamQueryService,
  customMultiValueArrayService,
  customQueryService,
  getObjectsByGeolocation,
  postObjectsToClass,
  postObjectsToClassWithRelation,
  postOfflineForms,
  residentIDQuery,
  retrieveHelloFunction,
  uploadOfflineForms,
};
