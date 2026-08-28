/**
 * Mock Cloud Code for Integration Tests
 *
 * This stands in for puente-node-cloudcode when the Jest integration suite runs
 * against an in-memory Parse Server. Anything this file gets wrong is a
 * behaviour the suite cannot catch, so the offline-sync path below is kept a
 * close transcription of the real service rather than a convenient shortcut.
 *
 * Source of truth (puente-node-cloudcode/cloud/src):
 *   services/offline/offline.js        — metadata fallback, offline-id idempotency
 *   services/post/post.js              — field copy, geopoints, pointers
 *   services/post/hooks/afterSave.js   — offline parent/household reconciliation
 *   definer/crud.definer.js            — postObjectsToClass(WithRelation), updateObject
 *   definer/auth.definer.js            — signup, signin
 *
 * Deliberate simplifications, each of which makes the mock LESS capable than
 * production rather than differently behaved:
 *   - Parse.File conversion: base64/URI values are stored as plain strings.
 *   - Organization pointer stamping (services/organization) is not reproduced;
 *     the collected surveyingOrganization STRING is stored, the pointer is not.
 *   - Looped forms (utils.Loop) are not reproduced.
 *
 * Reference: https://github.com/hopetambala/puente-node-cloudcode
 */

module.exports = function mockCloudCode(Parse) {
  if (!Parse || !Parse.Cloud) {
    throw new Error('Parse Cloud Code module requires Parse instance with Cloud.define method');
  }

  console.log('📝 Registering Mock Cloud Code functions...');

  /* ==========================================================================
   * Shared helpers — mirrors of services/offline/offline.js + services/post
   * ======================================================================== */

  /**
   * Collection-time values (who surveyed, on which app/OS) must win over
   * sync-time metadata — whoever presses "sync" is often not the surveyor.
   * Metadata only fills fields the stored record left missing or empty.
   * Mirror of mergeMetadataAsFallback in services/offline/offline.js.
   */
  const mergeMetadataAsFallback = (localObject, metadata) => {
    const merged = { ...(localObject || {}) };
    Object.entries(metadata || {}).forEach(([key, value]) => {
      if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
        merged[key] = value;
      }
    });
    return merged;
  };

  /**
   * A partially-failed batch stays queued on the device in full, so a retry
   * re-sends records that already saved. The offline id (objectIdOffline) is
   * the idempotency key: if a record with it already exists, return that
   * record instead of creating a duplicate.
   */
  const findExistingOfflineRecord = (parseClass, objectIdOffline) => {
    const query = new Parse.Query(parseClass);
    query.equalTo('objectIdOffline', objectIdOffline);
    return query.first({ useMasterKey: true });
  };

  /**
   * Copies EVERY key of localObject onto the record. The real implementation
   * has no field whitelist; a mock that keeps one silently drops whatever the
   * app added since the whitelist was written.
   */
  const applyLocalObject = (record, localObject) => {
    Object.keys(localObject).forEach((key) => record.set(String(key), localObject[key]));
    if (Array.isArray(localObject.location)) {
      const [latitude, longitude] = localObject.location;
      record.set('location', new Parse.GeoPoint(parseFloat(latitude), parseFloat(longitude)));
    }
  };

  const setParseUserPointer = (record, parseUser) => {
    if (!parseUser) return;
    const userObject = new Parse.Object('_User');
    userObject.id = String(parseUser);
    record.set('parseUser', userObject);
  };

  // Cloud Code returns saved Parse.Objects; the client sees them serialized.
  const serializeRecord = (record) => (
    record && typeof record.toJSON === 'function'
      ? { objectId: record.id, ...record.toJSON() }
      : record
  );

  /* ==========================================================================
   * Cloud functions
   * ======================================================================== */

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
   *
   * The parent goes in the `client` column and the user in a `parseUser`
   * POINTER — those are the column name and type every downstream consumer
   * (Manage, the Flask exporter, afterSupplementaryFormHook) reads. See
   * crud.definer.js postObjectsToClassWithRelation.
   */
  Parse.Cloud.define('postObjectsToClassWithRelation', async (request) => {
    const {
      parseClass,
      parseParentClass,
      parseParentClassID,
      parseUser,
      loopParentID,
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
        const parent = new Parse.Object(parseParentClass);
        parent.id = String(parseParentClassID);
        obj.set('client', parent);
      }

      if (loopParentID) {
        const loopParent = new Parse.Object(parseClass);
        loopParent.id = String(loopParentID);
        obj.set('loopClient', loopParent);
      }

      setParseUserPointer(obj, parseUser);

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
   * Matches puente-node-cloudcode implementation:
   * - Derives username from phonenumber or email (not a param)
   * - Assigns roles based on org user count (first user gets admin)
   * - Sets ACL and returns full user object
   */
  Parse.Cloud.define('signup', async (request) => {
    const {
      firstname,
      lastname,
      password,
      email,
      phonenumber,
      organization,
    } = request.params;

    if (!password) {
      throw new Error('password is required');
    }
    if (!email && !phonenumber) {
      throw new Error('email or phonenumber is required');
    }

    // Derive username from phonenumber or email (matching real implementation)
    const username = phonenumber || email;

    try {
      // Count existing users in organization to determine if this is the first user
      const userQuery = new Parse.Query(Parse.User);
      userQuery.equalTo('organization', String(organization || ''));
      const existingUserCount = await userQuery.count({ useMasterKey: true });

      // Determine role: first user gets admin, others are contributors
      let role = 'contributor';
      let adminVerified = false;
      if (existingUserCount === 0) {
        role = 'administrator';
        adminVerified = true;
      }

      const user = new Parse.User();
      user.set('username', String(username));
      user.set('password', String(password));
      if (String(email) !== '' && email) {
        user.set('email', String(email));
      }
      user.set('firstname', String(firstname || ''));
      user.set('lastname', String(lastname || ''));
      user.set('phonenumber', String(phonenumber || ''));
      user.set('organization', String(organization || ''));
      user.set('role', role);
      user.set('adminVerified', adminVerified);

      // Sign up the user (creates session token)
      const result = await user.signUp();

      // Set ACL (simplified for tests)
      const acl = new Parse.ACL();
      acl.setPublicReadAccess(true);
      acl.setWriteAccess(result, true);
      acl.setRoleWriteAccess('admin', true);
      result.setACL(acl);
      await result.save(null, { useMasterKey: true });

      return {
        objectId: result.id,
        sessionToken: result.getSessionToken(),
        username: result.getUsername(),
        firstname: result.get('firstname'),
        email: result.get('email'),
        organization: result.get('organization'),
        role: result.get('role'),
        adminVerified: result.get('adminVerified'),
      };
    } catch (error) {
      throw new Error(`Signup failed: ${error.message}`);
    }
  });

  /**
   * Cloud function: signin
   * Named `signin` because that is what auth.definer.js defines — a mock that
   * answers to `login` would let a rename of the real function go unnoticed.
   * Falls back to an email lookup when the username does not resolve, as the
   * real implementation does.
   *
   * NOTE: Collect itself signs in through Parse.User.logIn, not through this
   * cloud function. It is mocked for parity with the deployed backend only.
   */
  Parse.Cloud.define('signin', async (request) => {
    const { username, password } = request.params;

    if (!username || !password) {
      throw new Error('username and password are required');
    }

    try {
      return await Parse.User.logIn(String(username), String(password));
    } catch (error) {
      // The user may have typed their email instead of their username.
      const userQuery = new Parse.Query(Parse.User);
      userQuery.equalTo('email', username);
      const match = await userQuery.first({ useMasterKey: true });
      if (!match) {
        throw new Error(`Login failed: ${error.message}`);
      }
      return Parse.User.logIn(match.get('username'), String(password));
    }
  });

  /* ==========================================================================
   * uploadOfflineForms — transcription of services/offline/offline.js
   * ======================================================================== */

  // The class a category falls back to when a queued record carries no
  // parseClass. Records normally DO carry one, and the record's own value
  // always wins — the real service never hardcodes a class name.
  const DEFAULT_OFFLINE_CLASS = {
    residentForms: 'SurveyData',
    residentSupplementaryForms: 'FormResults',
    households: 'Household',
    assetForms: 'Assets',
    assetSupplementaryForms: 'FormAssetResults',
  };

  const postOfflineObject = (record, parseClass, localObject) => {
    const surveyPoint = new Parse.Object(parseClass);
    const { photoFile, signature, parseUser } = record;

    // Simplified: the real implementation saves these as Parse.File.
    if (photoFile) surveyPoint.set('picture', photoFile);
    if (signature) surveyPoint.set('signature', signature);

    applyLocalObject(surveyPoint, localObject);
    setParseUserPointer(surveyPoint, parseUser);

    return surveyPoint.save(null, { useMasterKey: true });
  };

  // postObjectsArray: residents and assets.
  const postObjectsArray = async (data, metadata, category) => {
    if (!data || !Array.isArray(data)) return [];

    return Promise.all(data.map(async (obj) => {
      const record = obj;
      const parseClass = record.parseClass || DEFAULT_OFFLINE_CLASS[category];
      const localObject = mergeMetadataAsFallback(record.localObject, metadata);

      // Local ids minted on the device are not Parse ids. They move to
      // objectIdOffline, which is both the idempotency key and what the
      // afterSave hooks use to reconnect children to their parents.
      if (localObject.objectId && localObject.objectId.includes('PatientID-')) {
        localObject.objectIdOffline = localObject.objectId;
        delete localObject.objectId;
      }

      if (localObject.householdId && localObject.householdId.includes('Household-')) {
        localObject.householdObjectIdOffline = localObject.householdId;
        delete localObject.householdId;
      }

      if (localObject.objectId && localObject.objectId.includes('AssetID-')) {
        localObject.objectIdOffline = localObject.objectId;
        delete localObject.objectId;
      }

      if (localObject.objectIdOffline) {
        const existing = await findExistingOfflineRecord(parseClass, localObject.objectIdOffline);
        if (existing) return existing;
      }

      return postOfflineObject(record, parseClass, localObject);
    }));
  };

  const postHouseholdArray = async (data, metadata, category) => {
    if (!data || !Array.isArray(data)) return [];

    return Promise.all(data.map(async (obj) => {
      const record = obj;
      const parseClass = record.parseClass || DEFAULT_OFFLINE_CLASS[category];
      const localObject = mergeMetadataAsFallback(record.localObject, metadata);

      if (localObject.objectId && localObject.objectId.includes('Household-')) {
        localObject.objectIdOffline = localObject.objectId;
        delete localObject.objectId;
      }

      if (localObject.objectIdOffline) {
        const existing = await findExistingOfflineRecord(parseClass, localObject.objectIdOffline);
        if (existing) return existing;
      }

      return postOfflineObject(record, parseClass, localObject);
    }));
  };

  const postObjectsWithRelationshipsArray = async (data, metadata, category) => {
    if (!data || !Array.isArray(data)) return [];

    return Promise.all(data.map(async (obj) => {
      const record = obj;
      const parseClass = record.parseClass || DEFAULT_OFFLINE_CLASS[category];
      const localObject = mergeMetadataAsFallback(record.localObject, metadata);

      const parentId = record.parseParentClassID ? String(record.parseParentClassID) : '';
      const parentIsOfflineLocal = parentId.includes('PatientID-') || parentId.includes('AssetID-');

      // The parent does not exist in Parse yet. Record the local id so
      // afterSupplementaryFormHook can find the parent once it is saved —
      // without this the record is an orphan with no way back.
      if (parentIsOfflineLocal) {
        localObject.parseParentClassObjectIdOffline = parentId;
      }

      if (localObject.objectId && localObject.objectId.includes('SupID-')) {
        localObject.objectIdOffline = localObject.objectId;
        delete localObject.objectId;
      }

      if (localObject.objectIdOffline) {
        const existing = await findExistingOfflineRecord(parseClass, localObject.objectIdOffline);
        if (existing) return existing;
      }

      const supplementaryForm = new Parse.Object(parseClass);
      applyLocalObject(supplementaryForm, localObject);

      // A real (already-synced) parent id can be pointed at directly.
      if (parentId && !parentIsOfflineLocal && record.parseParentClass) {
        const parentForm = new Parse.Object(record.parseParentClass);
        parentForm.id = parentId;
        supplementaryForm.set('client', parentForm);
      }

      if (record.loopParentID) {
        const loopParentForm = new Parse.Object(parseClass);
        loopParentForm.id = String(record.loopParentID);
        supplementaryForm.set('loopClient', loopParentForm);
      }

      setParseUserPointer(supplementaryForm, record.parseUser);

      return supplementaryForm.save(null, { useMasterKey: true });
    }));
  };

  const isSavedRecord = (record) => !!record && typeof record.get === 'function';

  // Mirror of services/post/hooks/afterSave.js afterSurveyHouseholdHook.
  const afterSurveyHouseholdHook = (records) => Promise.all(records.map(async (record) => {
    const survey = record;
    if (!isSavedRecord(survey)) return survey;

    const householdPointer = survey.get('householdObjectIdOffline');
    if (!householdPointer) return survey;

    const householdQuery = new Parse.Query('Household');
    householdQuery.equalTo('objectIdOffline', householdPointer);
    const household = await householdQuery.first({ useMasterKey: true });
    if (!household) return survey;

    survey.set('householdClient', household);
    survey.set('householdId', String(household.id));
    return survey.save(null, { useMasterKey: true });
  }));

  // Mirror of services/post/hooks/afterSave.js afterSupplementaryFormHook.
  const afterSupplementaryFormHook = (records, parentClass) => Promise.all(
    records.map(async (record) => {
      const supplementaryForm = record;
      if (!isSavedRecord(supplementaryForm)) return supplementaryForm;

      const parentPointer = supplementaryForm.get('parseParentClassObjectIdOffline');
      if (!parentPointer) return supplementaryForm;

      const parentQuery = new Parse.Query(parentClass);
      parentQuery.equalTo('objectIdOffline', parentPointer);
      const parent = await parentQuery.first({ useMasterKey: true });

      if (!parent) {
        console.error(`afterSupplementaryFormHook: ORPHANED ${supplementaryForm.className} ${supplementaryForm.id} — no ${parentClass} found with objectIdOffline=${parentPointer}; client pointer NOT set`);
        return supplementaryForm;
      }

      supplementaryForm.set('client', parent);
      return supplementaryForm.save(null, { useMasterKey: true });
    })
  );

  /**
   * Cloud function: uploadOfflineForms
   * Uploads offline collected forms to the Parse database.
   *
   * Categories are processed in the same order as Offline.upload: households
   * first so residents can be attached to them, then residents so
   * supplementary forms can be attached to those. Reordering silently breaks
   * offline parent reconciliation.
   */
  Parse.Cloud.define('uploadOfflineForms', async (request) => {
    const offlineForms = request.params;

    if (!offlineForms) {
      throw new Error('offlineForms parameter is required');
    }

    const { metadata } = offlineForms;

    console.log('🔄 uploadOfflineForms called with:', {
      residentFormsCount: offlineForms.residentForms?.length || 0,
      supplementaryFormsCount: offlineForms.residentSupplementaryForms?.length || 0,
      householdsCount: offlineForms.households?.length || 0,
      assetFormsCount: offlineForms.assetForms?.length || 0,
      assetSupplementaryFormsCount: offlineForms.assetSupplementaryForms?.length || 0,
      hasMetadata: !!metadata,
    });

    try {
      const households = await postHouseholdArray(
        offlineForms.households, metadata, 'households',
      );

      const residentForms = await postObjectsArray(
        offlineForms.residentForms, metadata, 'residentForms',
      ).then(afterSurveyHouseholdHook);

      const assetForms = await postObjectsArray(
        offlineForms.assetForms, metadata, 'assetForms',
      );

      const residentSupplementaryForms = await postObjectsWithRelationshipsArray(
        offlineForms.residentSupplementaryForms, metadata, 'residentSupplementaryForms',
      ).then((results) => afterSupplementaryFormHook(results, 'SurveyData'));

      const assetSupplementaryForms = await postObjectsWithRelationshipsArray(
        offlineForms.assetSupplementaryForms, metadata, 'assetSupplementaryForms',
      ).then((results) => afterSupplementaryFormHook(results, 'Assets'));

      const uploadedForms = {
        residentForms: residentForms.map(serializeRecord),
        residentSupplementaryForms: residentSupplementaryForms.map(serializeRecord),
        households: households.map(serializeRecord),
        assetForms: assetForms.map(serializeRecord),
        assetSupplementaryForms: assetSupplementaryForms.map(serializeRecord),
      };

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

  /**
   * Cloud function: updateObject
   * Matches puente-node-cloudcode/cloud/src/definer/crud.definer.js (line 462)
   * Input: { parseClass, parseClassID, localObject }
   * Gets object by ID, sets all localObject fields, saves with master key
   */
  Parse.Cloud.define('updateObject', async (request) => {
    const { parseClass, parseClassID, localObject } = request.params;

    if (!parseClass || !parseClassID || !localObject) {
      throw new Error('parseClass, parseClassID and localObject are required');
    }

    const Class = Parse.Object.extend(parseClass);
    const query = new Parse.Query(Class);

    const result = await query.get(parseClassID, { useMasterKey: true });

    Object.keys(localObject).forEach((key) => {
      result.set(String(key), localObject[key]);
    });

    if (localObject.latitude) {
      const point = new Parse.GeoPoint(localObject.latitude, localObject.longitude);
      result.set('location', point);
    }

    const saved = await result.save(null, { useMasterKey: true });
    return saved;
  });

  console.log('✓ Mock Cloud Code functions registered: postObjectsToClass, postObjectsToClassWithRelation, signup, signin, uploadOfflineForms, updateObject');
};
