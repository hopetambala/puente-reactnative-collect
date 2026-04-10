/**
 * Minimal Mock Cloud Code for Integration Tests
 * Provides essential Cloud Code functions used by the app
 */

module.exports = function mockCloudCode(Parse) {
  /**
   * Cloud function: postObjectsToClass
   * Creates a Parse object in the specified class with the provided data
   * Used for: Creating surveys, residents, assets, etc.
   */
  Parse.Cloud.define('postObjectsToClass', async (request) => {
    const {
      parseClass,
      parseUser,
      localObject,
      photoFile,
    } = request.params;

    if (!parseClass || !localObject) {
      throw new Error('parseClass and localObject are required');
    }

    try {
      const Class = Parse.Object.extend(parseClass);
      const obj = new Class();

      // Set all local object properties
      if (localObject && typeof localObject === 'object') {
        Object.entries(localObject).forEach(([key, value]) => {
          obj.set(key, value);
        });
      }

      // Set user if provided
      if (parseUser) {
        obj.set('parseUser', parseUser);
      }

      // Set file if provided
      if (photoFile) {
        obj.set('photoFile', photoFile);
      }

      // Set ACL for security
      const acl = new Parse.ACL();
      if (parseUser) {
        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);
        acl.setRoleReadAccess('admin', true);
        acl.setRoleWriteAccess('admin', true);
      }
      obj.setACL(acl);

      const result = await obj.save(null, { useMasterKey: true });
      return {
        objectId: result.id,
        createdAt: result.createdAt,
        ...result.toJSON(),
      };
    } catch (error) {
      throw new Error(`Failed to create ${parseClass}: ${error.message}`);
    }
  });

  /**
   * Cloud function: postObjectsToClassWithRelation
   * Creates a Parse object with a relationship to a parent object
   * Used for: Creating forms related to residents
   */
  Parse.Cloud.define('postObjectsToClassWithRelation', async (request) => {
    const {
      parseClass,
      parseParentClass,
      parseParentClassID,
      parseUser,
      localObject,
    } = request.params;

    if (!parseClass || !localObject) {
      throw new Error('parseClass and localObject are required');
    }

    try {
      const Class = Parse.Object.extend(parseClass);
      const obj = new Class();

      // Set all local object properties
      if (localObject && typeof localObject === 'object') {
        Object.entries(localObject).forEach(([key, value]) => {
          obj.set(key, value);
        });
      }

      // Set parent relationship if provided
      if (parseParentClass && parseParentClassID) {
        const ParentClass = Parse.Object.extend(parseParentClass);
        const parent = new ParentClass();
        parent.id = parseParentClassID;
        obj.set(parseParentClass, parent);
      }

      // Set user if provided
      if (parseUser) {
        obj.set('parseUser', parseUser);
      }

      // Set ACL
      const acl = new Parse.ACL();
      if (parseUser) {
        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);
        acl.setRoleReadAccess('admin', true);
        acl.setRoleWriteAccess('admin', true);
      }
      obj.setACL(acl);

      const result = await obj.save(null, { useMasterKey: true });
      return {
        objectId: result.id,
        createdAt: result.createdAt,
        ...result.toJSON(),
      };
    } catch (error) {
      throw new Error(`Failed to create ${parseClass}: ${error.message}`);
    }
  });

  /**
   * Cloud function: signup
   * Custom signup function for user registration
   * Used for: Creating new users with specific fields
   */
  Parse.Cloud.define('signup', async (request) => {
    const { username, password, email, firstname, lastname, organization } = request.params;

    if (!username || !password) {
      throw new Error('username and password are required');
    }

    try {
      const user = new Parse.User();
      user.set('username', username);
      user.set('password', password);
      user.set('email', email || '');
      user.set('firstname', firstname || '');
      user.set('lastname', lastname || '');
      user.set('organization', organization || '');

      const result = await user.save(null, { useMasterKey: true });
      return {
        objectId: result.id,
        sessionToken: result.getSessionToken(),
        username: result.getUsername(),
      };
    } catch (error) {
      throw new Error(`Signup failed: ${error.message}`);
    }
  });

  /**
   * Cloud function: login
   * Custom login function for user authentication
   * Used for: Testing authentication flow
   */
  Parse.Cloud.define('login', async (request) => {
    const { username, password } = request.params;

    if (!username || !password) {
      throw new Error('username and password are required');
    }

    try {
      const user = await Parse.User.logIn(username, password);
      return {
        objectId: user.id,
        sessionToken: user.getSessionToken(),
        username: user.getUsername(),
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  });

  /**
   * Cloud function: uploadOfflineForms
   * Uploads forms that were collected offline
   * Used for: Migrating offline data to the cloud
   */
  Parse.Cloud.define('uploadOfflineForms', async (request) => {
    const offlineForms = request.params;

    if (!offlineForms) {
      throw new Error('offlineForms parameter is required');
    }

    try {
      const uploadedForms = {
        residentForms: [],
        residentSupplementaryForms: [],
        households: [],
        assetForms: [],
        assetSupplementaryForms: [],
      };

      // Upload resident forms
      if (offlineForms.residentForms && Array.isArray(offlineForms.residentForms)) {
        for (const form of offlineForms.residentForms) {
          const SurveyData = Parse.Object.extend('SurveyData');
          const surveyData = new SurveyData();

          if (offlineForms.metadata?.parseUser) {
            surveyData.set('parseUser', offlineForms.metadata.parseUser);
          }

          if (form.localObject) {
            Object.entries(form.localObject).forEach(([key, value]) => {
              surveyData.set(key, value);
            });
          }

          const result = await surveyData.save(null, { useMasterKey: true });
          uploadedForms.residentForms.push({
            objectId: result.id,
            ...result.toJSON(),
          });
        }
      }

      // Upload supplementary forms
      if (offlineForms.residentSupplementaryForms && Array.isArray(offlineForms.residentSupplementaryForms)) {
        for (const form of offlineForms.residentSupplementaryForms) {
          const SupplementaryForm = Parse.Object.extend('SupplementaryForm');
          const suppForm = new SupplementaryForm();

          if (form.localObject) {
            Object.entries(form.localObject).forEach(([key, value]) => {
              suppForm.set(key, value);
            });
          }

          const result = await suppForm.save(null, { useMasterKey: true });
          uploadedForms.residentSupplementaryForms.push({
            objectId: result.id,
            ...result.toJSON(),
          });
        }
      }

      // Upload households
      if (offlineForms.households && Array.isArray(offlineForms.households)) {
        for (const form of offlineForms.households) {
          const Household = Parse.Object.extend('Household');
          const household = new Household();

          if (form.localObject) {
            Object.entries(form.localObject).forEach(([key, value]) => {
              household.set(key, value);
            });
          }

          const result = await household.save(null, { useMasterKey: true });
          uploadedForms.households.push({
            objectId: result.id,
            ...result.toJSON(),
          });
        }
      }

      // Upload asset forms
      if (offlineForms.assetForms && Array.isArray(offlineForms.assetForms)) {
        for (const form of offlineForms.assetForms) {
          const AssetForm = Parse.Object.extend('AssetForm');
          const assetForm = new AssetForm();

          if (form.localObject) {
            Object.entries(form.localObject).forEach(([key, value]) => {
              assetForm.set(key, value);
            });
          }

          const result = await assetForm.save(null, { useMasterKey: true });
          uploadedForms.assetForms.push({
            objectId: result.id,
            ...result.toJSON(),
          });
        }
      }

      // Upload asset supplementary forms
      if (offlineForms.assetSupplementaryForms && Array.isArray(offlineForms.assetSupplementaryForms)) {
        for (const form of offlineForms.assetSupplementaryForms) {
          const AssetSuppForm = Parse.Object.extend('AssetSupplementaryForm');
          const assetSuppForm = new AssetSuppForm();

          if (form.localObject) {
            Object.entries(form.localObject).forEach(([key, value]) => {
              assetSuppForm.set(key, value);
            });
          }

          const result = await assetSuppForm.save(null, { useMasterKey: true });
          uploadedForms.assetSupplementaryForms.push({
            objectId: result.id,
            ...result.toJSON(),
          });
        }
      }

      return uploadedForms;
    } catch (error) {
      throw new Error(`Upload offline forms failed: ${error.message}`);
    }
  });

  console.log('✓ Mock Cloud Code functions registered');
};
