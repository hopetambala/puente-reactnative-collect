import _ from 'lodash';

import { postObjectsToClass, postObjectsToClassWithRelation } from '../../../services/parse/crud';
import {
  getData,
  storeData
} from '../../async-storage';
import checkOnlineStatus from '../../offline';
import { generateRandomID } from '../../utils';
import {
  postForms,
  postHouseholdRelations,
  postHouseholds,
  postSupForms
} from './Offline';

function postIdentificationForm(postParams) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then((connected) => {
      if (connected) {
        postObjectsToClass(postParams).then((surveyee) => {
          const surveyeeSanitized = JSON.parse(JSON.stringify(surveyee));
          resolve(surveyeeSanitized);
        }, (error) => {
          reject(error);
        });
      } else {
        getData('offlineIDForms').then(async (idForms) => {
          const id = `PatientID-${generateRandomID()}`;
          const idParams = postParams;
          idParams.localObject.objectId = id;
          if (idForms !== null || idForms === []) {
            const forms = idForms.concat(idParams);
            await storeData(forms, 'offlineIDForms');
            resolve(idParams.localObject);
          } else {
            const idData = [idParams];
            // idData[id] = postParams;
            await storeData(idData, 'offlineIDForms');
            resolve(idParams.localObject);
          }
        });
      }
    });
  });
}

/** ***********************************************
 * Function to post asset id form offline offline
 * @name postForms
 * @example
 * postAssetForm(postParam);
 *
 * @param {Object} postParam Object normally configirued for for Parse-server
 *
 *********************************************** */

function postAssetForm(postParams) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then((connected) => {
      if (connected) {
        postObjectsToClass(postParams).then((asset) => {
          const assetSanitized = JSON.parse(JSON.stringify(asset));
          resolve(assetSanitized);
        }, (error) => {
          reject(error);
        });
      } else {
        getData('offlineAssetIDForms').then(async (assetIdForms) => {
          const id = `AssetID-${generateRandomID()}`;
          const assetIdParams = postParams;
          assetIdParams.localObject.objectId = id;
          if (assetIdForms !== null || assetIdForms === []) {
            const forms = assetIdForms.concat(assetIdParams);
            await storeData(forms, 'offlineAssetIDForms');
            resolve(assetIdParams.localObject);
          } else {
            const idData = [assetIdParams];
            // idData[id] = postParams;
            await storeData(idData, 'offlineAssetIDForms');
            resolve(assetIdParams.localObject);
          }
        });
      }
    });
  });
}

function postSupplementaryForm(postParams) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then((connected) => {
      if (connected && !postParams.parseParentClassID.includes('PatientID-')) {
        postObjectsToClassWithRelation(postParams).then(() => {
          resolve('success');
        }, (error) => {
          reject(error);
        });
      } else {
        getData('offlineSupForms').then(async (supForms) => {
          if (supForms !== null) {
            const forms = supForms.concat(postParams);
            await storeData(forms, 'offlineSupForms');
            resolve('success');
          } else {
            const supData = [postParams];
            await storeData(supData, 'offlineSupForms');
            resolve('success');
          }
        });
      }
    });
  });
}

/** ***********************************************
 * Function to post asset supplementary form offline
 * @name postForms
 * @example
 * postSupplementaryAssetForm(postParam);
 *
 * @param {Object} postParams Object normally configured for for Parse-Server Cloud Code
 *
 *********************************************** */
function postSupplementaryAssetForm(postParams) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then((connected) => {
      if (connected && !postParams.parseParentClassID.includes('AssetID-')) {
        postObjectsToClassWithRelation(postParams).then(() => {
          resolve('success');
        }, (error) => {
          reject(error);
        });
      } else {
        getData('offlineAssetSupForms').then(async (supForms) => {
          if (supForms !== null) {
            const forms = supForms.concat(postParams);
            await storeData(forms, 'offlineAssetSupForms');
            resolve('success');
          } else {
            const supData = [postParams];
            await storeData(supData, 'offlineAssetSupForms');
            resolve('success');
          }
        });
      }
    });
  });
}

function postOfflineForms() {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then(async (connected) => {
      if (connected) {
        const idForms = await getData('offlineIDForms');
        const supForms = await getData('offlineSupForms');
        const households = await getData('offlineHouseholds');
        const householdsRelation = await getData('offlineHouseholdsRelation');

        const assetIdForms = await getData('offlineAssetIDForms');
        const assetSupForms = await getData('offlineAssetSupForms');

        // Post all resident offline data
        // Deep copies needed to ensure no double submission when Parent objects' objectID
        // changes from offline object ID like 'PatientId-xxxxxx' to Parse object ID
        postHouseholds(households, householdsRelation, idForms, supForms).then(() => {
          const householdsRelationCopy1 = _.cloneDeep(householdsRelation);
          const idFormsCopy1 = _.cloneDeep(idForms);
          const supFormsCopy1 = _.cloneDeep(supForms);
          postHouseholdRelations(householdsRelationCopy1, idFormsCopy1, supFormsCopy1)
            .then(async () => {
              const idFormsCopy2 = _.cloneDeep(idForms);
              const supFormsCopy2 = _.cloneDeep(supForms);
              postForms(idFormsCopy2, supFormsCopy2).then(() => {
                const supFormsCopy3 = _.cloneDeep(supForms);
                postSupForms(supFormsCopy3, 'PatientID-').then(() => {
                  resolve(true);
                }, (error) => {
                  reject(error);
                });
              }, (error) => {
                reject(error);
              });
            }, (error) => {
              reject(error);
            });
        }, (error) => {
          reject(error);
        });

        // Post asset offline data
        postForms(assetIdForms, assetSupForms).then(() => {
          postSupForms(assetSupForms, 'AssetID-').then(() => {
            resolve(true);
          }, (error) => {
            reject(error);
          });
        }, (error) => {
          reject(error);
        });
      } else {
        reject();
      }
    }, (error) => {
      reject(error);
    });
  });
}

function postHousehold(postParams) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then((connected) => {
      if (connected) {
        postObjectsToClass(postParams).then((result) => {
          resolve(result.id);
        }, (error) => {
          reject(error);
        });
      } else {
        getData('offlineHouseholds').then(async (households) => {
          const id = `Household-${generateRandomID()}`;
          const householdParams = postParams;
          householdParams.localObject.objectId = id;
          if (households !== null || households === []) {
            const forms = households.concat(householdParams);
            await storeData(forms, 'offlineHouseholds');
            resolve(id);
          } else {
            const householdData = [householdParams];
            // idData[id] = postParams;
            await storeData(householdData, 'offlineHouseholds');
            resolve(id);
          }
        });
      }
    });
  });
}

function postHouseholdWithRelation(postParams) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then((connected) => {
      if (connected) {
        postObjectsToClassWithRelation(postParams).then((result) => {
          resolve(result.id);
        }, (error) => {
          reject(error);
        });
      } else {
        getData('offlineHouseholdsRelation').then(async (householdsRelation) => {
          const id = `Household-${generateRandomID()}`;
          const householdParams = postParams;
          householdParams.localObject.objectId = id;
          if (householdsRelation !== null || householdsRelation === []) {
            const forms = householdsRelation.concat(householdParams);
            await storeData(forms, 'offlineHouseholdsRelation');
            resolve(id);
          } else {
            const householdData = [householdParams];
            // idData[id] = postParams;
            await storeData(householdData, 'offlineHouseholdsRelation');
            resolve(id);
          }
        });
      }
    });
  });
}

export {
  postAssetForm,
  postHousehold,
  postHouseholdWithRelation,
  postIdentificationForm,
  postOfflineForms,
  postSupplementaryAssetForm,
  postSupplementaryForm
};
