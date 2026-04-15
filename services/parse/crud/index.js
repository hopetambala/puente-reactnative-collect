import selectedENV from "@app/environment";
import client from "@app/services/parse/client";

import {
  customMultiParamQueryService,
  customMultiValueArrayService,
  customQueryService,
} from "./custom-queries";

const { TEST_MODE } = selectedENV;

/**
 * Lazy-load Parse instance on first use
 * This defers initialization until tests have properly set up Parse configuration
 */
let parseInstance = null;

function getParse() {
  if (!parseInstance) {
    parseInstance = client(TEST_MODE);
  }
  return parseInstance;
}

function retrieveHelloFunction() {
  getParse().Cloud.run("hello").then((result) => result);
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
    const Parse = getParse();
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
    getParse().Cloud.run("countService", params).then(
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
    getParse().Cloud.run("postObjectsToClass", params).then(
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
    getParse().Cloud.run("postObjectsToClassWithRelation", params).then(
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
    getParse().Cloud.run("geoQuery", params).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function postOfflineForms(params) {
  return new Promise((resolve, reject) => {
    getParse().Cloud.run("postOfflineForms", params).then(
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
    getParse().Cloud.run("uploadOfflineForms", params).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function aggregateStats(params) {
  return new Promise((resolve, reject) => {
    if (TEST_MODE) {
      console.log('aggregateStats: Called'); // eslint-disable-line
    }
    getParse().Cloud.run("aggregateStats", params).then(
      (result) => {
        if (TEST_MODE) {
          console.log('aggregateStats: Success'); // eslint-disable-line
        }
        resolve(result);
      },
      (error) => {
        if (TEST_MODE) {
          console.error('aggregateStats: Error details:', { message: error?.message, code: error?.code }); // eslint-disable-line
        }
        reject(error);
      }
    );
  });
}

function aggregateStatsItems(params) {
  return new Promise((resolve, reject) => {
    getParse().Cloud.run("aggregateStatsItems", params).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

/**
 * Update an existing object in a Parse class via the updateObject cloud function.
 * Runs server-side with master key, bypassing client ACL restrictions.
 * Audit trail (editedBy, editedAt) is added client-side before the cloud call.
 * @param {string} parseClass - Parse class name (e.g., 'SurveyData', 'Vitals', 'FormResults')
 * @param {string} objectId - Object ID to update
 * @param {object} updateFields - Fields to update {fieldName: value}
 * @param {string} surveyingUser - Current user making the edit (for audit trail)
 * @returns {Promise<object>} Updated Parse object
 */
function updateObjectInClass(parseClass, objectId, updateFields, surveyingUser) {
  return new Promise((resolve, reject) => {
    if (!surveyingUser) {
      reject(new Error('surveyingUser is required for audit trail'));
      return;
    }

    // Build localObject: user fields (excluding any attempt to override audit fields) + audit trail
    const localObject = {};
    if (updateFields && typeof updateFields === 'object') {
      Object.entries(updateFields).forEach(([key, value]) => {
        if (key !== 'editedBy' && key !== 'editedAt') {
          localObject[key] = value;
        }
      });
    }
    localObject.editedBy = surveyingUser;
    localObject.editedAt = new Date();

    getParse().Cloud.run('updateObject', {
      parseClass,
      parseClassID: objectId,
      localObject,
    }).then(resolve, reject);
  });
}

export {
  aggregateStats,
  aggregateStatsItems,
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
  updateObjectInClass,
  uploadOfflineForms,
};
