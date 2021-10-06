import retrievePuenteAutofillData from '../../services/aws';
import { customMultiParamQueryService, customQueryService, residentIDQuery } from '../../services/parse/crud';
import getTasks from '../../services/tasky';
import { getData, storeData } from '../async-storage';
import checkOnlineStatus from '../offline';

async function residentQuery(queryParams) {
  let records = await residentIDQuery(queryParams);
  records = JSON.parse(JSON.stringify(records));
  return records;
}

async function cacheResidentData(queryParams) {
  const records = await residentQuery(queryParams);
  if (records !== null && records !== undefined && records !== '') {
    storeData(records, 'residentData');
  }
}

async function cacheAutofillData(parameter) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then((connected) => {
      if (connected) {
        retrievePuenteAutofillData('all').then((result) => {
          // cache organizations tied to all users
          customQueryService(0, 500, 'User', 'adminVerified', true).then((users) => {
            const orgsCapitalized = [];
            const orgResults = [];
            users.forEach((user) => {
              const org = user.get('organization');
              if (org !== null && org !== undefined && org !== '') {
                const orgCapitalized = org.toUpperCase().trim() || '';
                if (!orgsCapitalized.includes(orgCapitalized) && org !== '') {
                  orgsCapitalized.push(orgCapitalized);
                  orgResults.push(org);
                }
              }
            });
            const autofillData = result;
            autofillData.organization = orgResults;
            storeData(autofillData, 'autofill_information');
            resolve(autofillData[parameter]);
          }, () => {
            storeData(result, 'autofill_information');
            resolve(result[parameter]);
          });
        }, (error) => {
          reject(error);
        });
      } else {
        resolve(getData('autofill_information')[parameter]);
      }
    }, (error) => {
      reject(error);
    });
  });
}

function customFormsQuery(surveyingOrganization) {
  return checkOnlineStatus().then((online) => {
    if (online) {
      const parseParams = {
        typeOfForm: 'Custom',
        organizations: surveyingOrganization
      };

      return customMultiParamQueryService(5000, 'FormSpecificationsV2', parseParams).then(async (forms) => {
        if (forms !== null && forms !== undefined && forms !== '') {
          let activeForms = []
          JSON.parse(JSON.stringify(forms)).forEach((form) => {
            if(form.active !== 'false'){
              activeForms = activeForms.concat([form])
            }
          })
          await storeData(activeForms, 'customForms');
          return activeForms;
        }
        return getData('customForms').then((customForms) => customForms);
      }, (error) => {
        console.log(error); //eslint-disable-line
      });
    }
    return getData('customForms').then((forms) => forms, (error) => console.log(error)); // eslint-disable-line
  });
}

function getTasksAsync() {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then(async (online) => {
      if (online) {
        await getTasks().then(async (result) => {
          await storeData(result, 'tasks');
          resolve(result);
        }, (error) => {
          reject(error);
        });
      } else {
        getData('tasks').then((tasks) => {
          resolve(tasks);
        }, (error) => {
          reject(error);
        });
      }
    }, (error) => {
      reject(error);
    });
  });
}

function assetFormsQuery(surveyingOrganization) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then((online) => {
      if (online) {
        const parseParams = {
          typeOfForm: 'Assets',
          organizations: surveyingOrganization
        };
        customMultiParamQueryService(5000, 'FormSpecificationsV2', parseParams).then((forms) => {
          storeData(forms, 'assetForms');
          resolve(JSON.parse(JSON.stringify(forms)));
        }, (error) => {
          reject(error);
        });
      } else {
        getData('assetForms').then((forms) => {
          resolve(forms);
        }, (error) => {
          reject(error);
        });
      }
    }, (error) => {
      reject(error);
    });
  });
}

function assetDataQuery(surveyingOrganization) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then((online) => {
      if (online) {
        customQueryService(0, 10000, 'Assets', 'surveyingOrganization', surveyingOrganization).then(async (forms) => {
          await storeData(forms, 'assetData');
          resolve(JSON.parse(JSON.stringify(forms)));
        }, (error) => {
          reject(error);
        });
      } else {
        getData('assetData').then((forms) => {
          resolve(forms);
        }, (error) => {
          reject(error);
        });
      }
    }, (error) => {
      reject(error);
    });
  });
}

export {
  assetDataQuery,
  assetFormsQuery,
  cacheAutofillData,
  cacheResidentData,
  customFormsQuery,
  getTasksAsync,
  residentQuery
};
