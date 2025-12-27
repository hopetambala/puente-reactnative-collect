import retrievePuenteAutofillData from "@app/services/aws";
import {
  customMultiParamQueryService,
  customMultiValueArrayService,
  customQueryService,
  residentIDQuery,
} from "@app/services/parse/crud";
import getTasks from "@app/services/tasky";
import { getData, storeData } from "@modules/async-storage";
import checkOnlineStatus from "@modules/offline";
import _ from "lodash";

async function residentQuery(queryParams) {
  const records = await residentIDQuery(queryParams);
  return records;
}

async function cacheResidentDataMulti(queryParamsArray) {
  let records = await customMultiValueArrayService(
    "SurveyData",
    "communityname",
    queryParamsArray,
    5000
  );
  records = JSON.parse(JSON.stringify(records));
  if (records !== null && records !== undefined && records !== "") {
    storeData(records, "residentData");
  }
}

async function cacheAutofillData(surveyingOrganization) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then(
      (connected) => {
        if (connected) {
          retrievePuenteAutofillData("all").then(
            async (result) => {
              // cache organizations tied to all users
              customQueryService(0, 500, "User", "adminVerified", true).then(
                async (users) => {
                  const orgs = () => {
                    const orgsCapitalized = [];
                    const orgResults = [];
                    users.forEach((user) => {
                      const org = user.get("organization");
                      if (org !== null && org !== undefined && org !== "") {
                        const orgCapitalized = org.toUpperCase().trim() || "";
                        if (
                          !orgsCapitalized.includes(orgCapitalized) &&
                          org !== ""
                        ) {
                          orgsCapitalized.push(orgCapitalized);
                          orgResults.push(org);
                        }
                      }
                    });

                    return orgs;
                  };
                  /**
                   * @returns Unique list of communities entered by the users organization
                   */
                  const comms = async () => {
                    const records = await customQueryService(
                      0,
                      10000,
                      "SurveyData",
                      "surveyingOrganization",
                      surveyingOrganization
                    );
                    const uniqueCommunities = _.uniq(
                      _.map(
                        JSON.parse(JSON.stringify(records)),
                        "communityname"
                      )
                    )
                      .sort()
                      .filter(Boolean);
                    return uniqueCommunities;
                  };

                  const autofillData = result; // This result already has City, Communities stored

                  if (surveyingOrganization)
                    autofillData.CommunitiesUserEntered = await comms();

                  autofillData.organization = orgs();

                  storeData(autofillData, "autofill_information");

                  resolve(autofillData);
                },
                () => {
                  storeData(result, "autofill_information");
                  resolve(result);
                }
              );
            },
            (error) => {
              reject(error);
            }
          );
        } else {
          resolve(getData("autofill_information"));
        }
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function customFormsQuery(surveyingOrganization) {
  return checkOnlineStatus().then((online) => {
    if (online) {
      const parseParams = {
        typeOfForm: "Custom",
        organizations: surveyingOrganization,
      };

      return customMultiParamQueryService(
        "FormSpecificationsV2",
        parseParams,
        5000
      ).then(
        async (forms) => {
          if (forms !== null && forms !== undefined && forms !== "") {
            let activeForms = [];
            JSON.parse(JSON.stringify(forms)).forEach((form) => {
              if (form.active !== "false") {
                activeForms = activeForms.concat([form]);
              }
            });
            await storeData(activeForms, "customForms");
            return activeForms;
          }
          return getData("customForms").then((customForms) => customForms);
        },
        (error) => {
          console.log(error); //eslint-disable-line
        }
      );
    }
    return getData("customForms").then(
      (forms) => forms,
      (error) => console.log(error) // eslint-disable-line
    );
  });
}

function getTasksAsync() {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then(
      async (online) => {
        if (online) {
          await getTasks().then(
            async (result) => {
              await storeData(result, "tasks");
              resolve(result);
            },
            (error) => {
              reject(error);
            }
          );
        } else {
          getData("tasks").then(
            (tasks) => {
              resolve(tasks);
            },
            (error) => {
              reject(error);
            }
          );
        }
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function assetFormsQuery(surveyingOrganization) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then(
      (online) => {
        if (online) {
          const parseParams = {
            typeOfForm: "Assets",
            organizations: surveyingOrganization,
          };
          customMultiParamQueryService(
            "FormSpecificationsV2",
            parseParams,
            5000
          ).then(
            (forms) => {
              let activeForms = [];
              JSON.parse(JSON.stringify(forms)).forEach((form) => {
                if (form.active !== "false") {
                  activeForms = activeForms.concat([form]);
                }
              });
              storeData(activeForms, "assetForms");
              resolve(activeForms);
            },
            (error) => {
              reject(error);
            }
          );
        } else {
          getData("assetForms").then(
            (forms) => {
              resolve(forms);
            },
            (error) => {
              reject(error);
            }
          );
        }
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function assetDataQuery(surveyingOrganization) {
  return new Promise((resolve, reject) => {
    checkOnlineStatus().then(
      (online) => {
        if (online) {
          customQueryService(
            0,
            10000,
            "Assets",
            "surveyingOrganization",
            surveyingOrganization
          ).then(
            async (forms) => {
              await storeData(forms, "assetData");
              resolve(JSON.parse(JSON.stringify(forms)));
            },
            (error) => {
              reject(error);
            }
          );
        } else {
          getData("assetData").then(
            (forms) => {
              resolve(forms);
            },
            (error) => {
              reject(error);
            }
          );
        }
      },
      (error) => {
        reject(error);
      }
    );
  });
}

export {
  assetDataQuery,
  assetFormsQuery,
  cacheAutofillData,
  cacheResidentDataMulti,
  customFormsQuery,
  getTasksAsync,
  residentQuery,
};
