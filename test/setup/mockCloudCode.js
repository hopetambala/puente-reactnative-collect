/**
 * Minimal Mock Cloud Code for Integration Tests
 * Provides essential Cloud Code functions matching puente-node-cloudcode
 * Reference: https://github.com/hopetambala/puente-node-cloudcode
 */

module.exports = function mockCloudCode(Parse) {
  if (!Parse || !Parse.Cloud) {
    throw new Error('Parse Cloud Code module requires Parse instance with Cloud.define method');
  }

  console.log('📝 Registering Mock Cloud Code functions...');

  /**
   * Cloud function: postObjectsToClass
   * Creates a Parse object in the specified class with the provided data
   * Handles: file uploads, geo points, user references
   * Used for: Creating surveys, residents, assets, etc.
   */
  Parse.Cloud.define('postObjectsToClass', async (request) => {
    const {
      parseClass,
      parseUser,
      localObject,
      photoFile,
      signature,
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

      // Handle geolocation - create GeoPoint if lat/lon present
      if (localObject.latitude !== undefined && localObject.longitude !== undefined) {
        const geoPoint = new Parse.GeoPoint(localObject.latitude, localObject.longitude);
        obj.set('location', geoPoint);
      }

      // Handle photo file (simplified - real version converts base64)
      if (photoFile) {
        obj.set('picture', photoFile);
      }

      // Handle signature file (simplified - real version converts base64)
      if (signature) {
        obj.set('signature', signature);
      }

      // Set user reference if provided
      if (parseUser) {
        const userObject = new Parse.Object('_User');
        userObject.id = String(parseUser);
        obj.set('parseUser', userObject);
      }

      // Set ACL for security
      const acl = new Parse.ACL();
      acl.setPublicReadAccess(false);
      acl.setPublicWriteAccess(false);
      acl.setRoleReadAccess('admin', true);
      acl.setRoleWriteAccess('admin', true);
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
   * Uploads offline collected forms to the Parse database
   * Real implementation: Processes forms through various factories with metadata enrichment
   * Simplified mock: Saves forms directly with whitelisted fields
   * Used for: Syncing offline form data when online connection restored
   */
  Parse.Cloud.define('uploadOfflineForms', async (request) => {
    const offlineForms = request.params;

    if (!offlineForms) {
      throw new Error('offlineForms parameter is required');
    }

    console.log('🔄 uploadOfflineForms called with:', {
      residentFormsCount: offlineForms.residentForms?.length || 0,
      supplementaryFormsCount: offlineForms.residentSupplementaryForms?.length || 0,
      householdsCount: offlineForms.households?.length || 0,
      assetFormsCount: offlineForms.assetForms?.length || 0,
      assetSupplementaryFormsCount: offlineForms.assetSupplementaryForms?.length || 0,
    });

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
        uploadedForms.residentForms = await Promise.all(offlineForms.residentForms.map(async (form) => {
          const SurveyData = Parse.Object.extend('SurveyData');
          const surveyData = new SurveyData();

          if (form.localObject) {
            const { fname, lname, nickname, dob, sex, objectId } = form.localObject;
            if (fname) surveyData.set('fname', fname);
            if (lname) surveyData.set('lname', lname);
            if (nickname) surveyData.set('nickname', nickname);
            if (dob) surveyData.set('dob', dob);
            if (sex) surveyData.set('sex', sex);
            if (objectId) surveyData.set('patientObjectId', objectId);
          }

          const result = await surveyData.save(null, { useMasterKey: true });
          return { objectId: result.id, ...result.toJSON() };
        }));
      }

      // Upload supplementary forms
      if (offlineForms.residentSupplementaryForms && Array.isArray(offlineForms.residentSupplementaryForms)) {
        uploadedForms.residentSupplementaryForms = await Promise.all(
          offlineForms.residentSupplementaryForms.map(async (form) => {
            const SupplementaryForm = Parse.Object.extend('SupplementaryForm');
            const suppForm = new SupplementaryForm();

            if (form.localObject) {
              const { title, description, formSpecificationsId, fields, surveyingUser, surveyingOrganization } = form.localObject;
              if (title) suppForm.set('title', title);
              if (description) suppForm.set('description', description);
              if (formSpecificationsId) suppForm.set('formSpecificationsId', formSpecificationsId);
              if (fields) suppForm.set('fields', fields);
              if (surveyingUser) suppForm.set('surveyingUser', surveyingUser);
              if (surveyingOrganization) suppForm.set('surveyingOrganization', surveyingOrganization);
            }

            const result = await suppForm.save(null, { useMasterKey: true });
            return { objectId: result.id, ...result.toJSON() };
          })
        );
      }

      // Upload households
      if (offlineForms.households && Array.isArray(offlineForms.households)) {
        uploadedForms.households = await Promise.all(offlineForms.households.map(async (form) => {
          const Household = Parse.Object.extend('Household');
          const household = new Household();

          if (form.localObject) {
            const { latitude, longitude, objectId } = form.localObject;
            if (latitude !== undefined && latitude !== null) household.set('latitude', latitude);
            if (longitude !== undefined && longitude !== null) household.set('longitude', longitude);
            if (objectId) household.set('householdObjectId', objectId);
          }

          const result = await household.save(null, { useMasterKey: true });
          return { objectId: result.id, ...result.toJSON() };
        }));
      }

      // Upload asset forms
      if (offlineForms.assetForms && Array.isArray(offlineForms.assetForms)) {
        uploadedForms.assetForms = await Promise.all(offlineForms.assetForms.map(async (form) => {
          const AssetForm = Parse.Object.extend('AssetForm');
          const assetForm = new AssetForm();

          if (form.localObject) {
            const { name, location, communityname, province, country, objectId } = form.localObject;
            if (name) assetForm.set('name', name);
            if (location) assetForm.set('location', location);
            if (communityname) assetForm.set('communityname', communityname);
            if (province) assetForm.set('province', province);
            if (country) assetForm.set('country', country);
            if (objectId) assetForm.set('assetObjectId', objectId);
          }

          const result = await assetForm.save(null, { useMasterKey: true });
          return { objectId: result.id, ...result.toJSON() };
        }));
      }

      // Upload asset supplementary forms
      if (offlineForms.assetSupplementaryForms && Array.isArray(offlineForms.assetSupplementaryForms)) {
        uploadedForms.assetSupplementaryForms = await Promise.all(
          offlineForms.assetSupplementaryForms.map(async (form) => {
            const AssetSuppForm = Parse.Object.extend('AssetSupplementaryForm');
            const assetSuppForm = new AssetSuppForm();

            if (form.localObject) {
              const { title, description, formSpecificationsId, fields, surveyingUser, surveyingOrganization } = form.localObject;
              if (title) assetSuppForm.set('title', title);
              if (description) assetSuppForm.set('description', description);
              if (formSpecificationsId) assetSuppForm.set('formSpecificationsId', formSpecificationsId);
              if (fields) assetSuppForm.set('fields', fields);
              if (surveyingUser) assetSuppForm.set('surveyingUser', surveyingUser);
              if (surveyingOrganization) assetSuppForm.set('surveyingOrganization', surveyingOrganization);
            }

            const result = await assetSuppForm.save(null, { useMasterKey: true });
            return { objectId: result.id, ...result.toJSON() };
          })
        );
      }

      console.log('📤 uploadOfflineForms returning:', {
        residentFormsCount: uploadedForms.residentForms.length,
        supplementaryFormsCount: uploadedForms.residentSupplementaryForms.length,
        householdsCount: uploadedForms.households.length,
        assetFormsCount: uploadedForms.assetForms.length,
        assetSupplementaryFormsCount: uploadedForms.assetSupplementaryForms.length,
      });

      return uploadedForms;
    } catch (error) {
      console.error('❌ uploadOfflineForms error:', error.message);
      throw new Error(`Upload offline forms failed: ${error.message}`);
    }
  });

  console.log('✓ Mock Cloud Code functions registered: postObjectsToClass, postObjectsToClassWithRelation, signup, login, uploadOfflineForms');
};
