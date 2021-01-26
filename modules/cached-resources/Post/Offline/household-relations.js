import { postObjectsToClass, postObjectsToClassWithRelation } from '../../../../services/parse/crud';
/** ***********************************************
 * Function to post offline forms and households that are related to households
 * new households and households with relation
 * @name postHouseholdRelations
 * @example
 * postHouseholdRelations(householdsRelation, idForms, supForms);
 *
 * @param {Array} householdsRelation Array of households created w relationship to
 *  previosuly created households
 * @param {Array} idForms Array of id forms created offline
 * @param {Array} supForms Array of all supplementary forms created offline
 *
 *********************************************** */

export default function postHouseholdRelations(householdsRelation, idForms, supForms) {
  return new Promise((resolve, reject) => {
    if (householdsRelation !== null && householdsRelation !== []) {
      // post new households with relations to existing households
      householdsRelation.forEach((householdRelation, index, array) => {
        if (!householdRelation.parseParentClassID.includes('Household-')) {
          const householdRelationParams = householdRelation;
          const offlineHouseholdRelationID = householdRelationParams.localObject.objectId;
          delete householdRelationParams.localObject.objectId;
          postObjectsToClassWithRelation(householdRelationParams).then((relationResult) => {
            const parseHouseholdRelationID = relationResult.id;
            // post id/sup forms with newly created households with relation
            // tied to existing households
            if (idForms !== null && idForms !== []) {
              idForms.forEach((postParams) => {
                if (postParams.localObject.householdId === offlineHouseholdRelationID) {
                  const offlineObjectID = postParams.localObject.objectId;
                  const idParams = postParams;
                  idParams.localObject.householdId = parseHouseholdRelationID;
                  delete idParams.localObject.objectId;
                  postObjectsToClass(idParams).then((surveyee) => {
                    const surveyeeSanitized = JSON.parse(JSON.stringify(surveyee));
                    const parseObjectID = surveyeeSanitized.objectId;
                    if (supForms !== null && supForms !== []) {
                      supForms.forEach((supForm) => {
                        if (supForm.parseParentClassID === offlineObjectID) {
                          const supParams = supForm;
                          supParams.parseParentClassID = parseObjectID;
                          postObjectsToClassWithRelation(supParams).then(() => {
                          }, (error) => {
                            reject(error);
                          });
                        }
                      });
                    }
                  }, (error) => {
                    reject(error);
                  });
                }
              });
            }
          }, (error) => {
            reject(error);
          });
        }
        if (index === array.length - 1) resolve(true);
      });
    } else {
      resolve(true);
    }
  });
}
