import { postObjectsToClass, postObjectsToClassWithRelation } from '../../../services/parse/crud';
import checkOnlineStatus from '../../offline';
import { generateRandomID } from '../../utils';
import {
  getData,
  storeData
} from '../../async-storage';
import {
  postForms,
  postSupForms,
  postHouseholds,
  postHouseholdRelations
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

function postOfflineForms() {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then(async (connected) => {
      if (connected) {
        const idForms = await getData('offlineIDForms');
        const supForms = await getData('offlineSupForms');
        const households = await getData('offlineHouseholds');
        const householdsRelation = await getData('offlineHouseholdsRelation');

        // post all offline data
        postHouseholds(households, householdsRelation, idForms, supForms).then(() => {
          postHouseholdRelations(householdsRelation, idForms, supForms).then(async () => {
            postForms(idForms, supForms).then(() => {
              postSupForms(supForms).then(() => {
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
  postIdentificationForm,
  postSupplementaryForm,
  postOfflineForms,
  postHousehold,
  postHouseholdWithRelation
};
