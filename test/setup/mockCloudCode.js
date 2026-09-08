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
   *
   * MIRRORS PRODUCTION. Re-verified 2026-09-08 against Back4App release v121
   * (`GHA 1464e23`) — downloaded with the b4a CLI and byte-identical to
   * `master`. Staging mirrors the same code (v713). Ported from
   * `cloud/src/services/offline/offline.js` + `cloud/src/services/post/post.js`
   * as actually deployed to production Back4App — release v120 (`GHA d860f22`),
   * downloaded with the b4a CLI and verified byte-identical to `master` on
   * 2026-09-04. Staging was mirrored onto the same code (v712) the same day.
   *
   * The mock this replaces invented a backend. It wrote to three Parse classes
   * that do not exist in the schema (`SupplementaryForm`, `AssetForm`,
   * `AssetSupplementaryForm`), set three fields nothing in any repo reads
   * (`patientObjectId`, `householdObjectId`, `assetObjectId`), ignored the
   * `metadata` argument entirely, never deduplicated, and threw on error where
   * production RETURNS the error. Six integration tests drove the offline sync
   * path through it, so they were validating behaviour no backend has.
   *
   * FIDELITY BOUNDARY — deliberately NOT modelled, and why:
   *   - `Organization.stampOrganization` (421 lines in production). Mirroring
   *     it here would be a second source of truth that drifts silently. A test
   *     that needs organization resolution belongs in puente-node-cloudcode.
   *   - `Parse.File` base64 conversion for `photoFile` / `signature`.
   *   - `loop` / `loopParentID` looped forms.
   *
   * Offline IDENTITY, dedupe, metadata precedence and failure propagation ARE
   * modelled, because those are the contract the offline queue depends on —
   * and they are where the real defects live. In particular this mock
   * reproduces, on purpose, three production behaviours that are bugs:
   *   1. A failed `save()` is swallowed into `undefined` rather than rejecting.
   *   2. The afterSave hooks then call `.get()` on that `undefined` and throw.
   *   3. `record.parseParentClassID.includes(...)` is unguarded, so a null
   *      parent is a TypeError.
   * Reproducing them is the point: a mock that is kinder than production
   * cannot catch a production bug.
   */
  Parse.Cloud.define('uploadOfflineForms', async (request) => {
    const offlineForms = request.params;

    if (!offlineForms) {
      throw new Error('offlineForms parameter is required');
    }

    // Metadata FILLS GAPS, it does not overwrite. Staging did the opposite
    // (`{ ...localObject, ...metadata }`) until 2026-09-04, so every flow that
    // asserted on surveyingUser/surveyingOrganization stamping was validating
    // the inverted rule.
    const mergeMetadataAsFallback = (localObject, metadata) => {
      const merged = { ...localObject };
      Object.entries(metadata || {}).forEach(([key, value]) => {
        if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
          merged[key] = value;
        }
      });
      return merged;
    };

    // A save Parse refuses resolves UNDEFINED rather than rejecting, so it
    // travels on looking like a saved record. An explicit marker lets a partial
    // failure be reported instead of vanishing. Mirrors
    // cloud/src/services/offline/failureMarker.js.
    const isUnsaved = (row) => !row || row.offlineSaveFailed === true;

    const attempt = async (category, record, run) => {
      const lo = (record && record.localObject) || {};
      const offlineId = lo.objectIdOffline || lo.objectId || null;
      try {
        const saved = await run();
        if (saved === undefined || saved === null) {
          return {
            offlineSaveFailed: true, category, offlineId, message: 'Parse refused the save',
          };
        }
        return saved;
      } catch (error) {
        const detail = (error && error.message) ? error.message : String(error);
        return {
          offlineSaveFailed: true,
          category,
          offlineId,
          message: (error && error.code) ? `[${error.code}] ${detail}` : detail,
        };
      }
    };

    // The idempotency key. A partially-failed batch stays queued in full, so a
    // retry re-sends records that already saved; if one carries an
    // objectIdOffline that is already in Parse, the existing record is returned
    // instead of a duplicate being created.
    const findExistingOfflineRecord = (parseClass, objectIdOffline) => {
      const query = new Parse.Query(parseClass);
      query.equalTo('objectIdOffline', objectIdOffline);
      return query.first({ useMasterKey: true });
    };

    // Mirrors post.postObjectFactory('post', …). Note the trailing catch:
    // production swallows a save failure and resolves UNDEFINED.
    const postObject = async (survey) => {
      const surveyPoint = new Parse.Object(survey.parseClass);
      const { localObject, parseUser } = survey;

      if (Array.isArray(localObject.location)) {
        const { location } = localObject;
        localObject.location = new Parse.GeoPoint(
          parseFloat(location[0]), parseFloat(location[1]),
        );
      }

      Object.keys(localObject).forEach((key) => surveyPoint.set(key, localObject[key]));

      if (typeof parseUser !== 'undefined' && parseUser) {
        const userObject = new Parse.Object('_User');
        userObject.id = String(parseUser);
        surveyPoint.set('parseUser', userObject);
      }

      return surveyPoint.save(null, { useMasterKey: true })
        .then((result) => result)
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Error: postObject', error);
        });
    };

    // Mirrors post.postObjectFactory('post-relationship', …).
    const postObjectWithRelationships = async (survey) => {
      const supplementaryForm = new Parse.Object(survey.parseClass);
      const { localObject } = survey;

      Object.keys(localObject).forEach((key) => {
        if (key !== 'photoFile') supplementaryForm.set(key, localObject[key]);
      });

      // A real parent id can be pointed at directly. Ids minted offline
      // (PatientID-/AssetID-) do not exist in Parse yet and are resolved after
      // upload by afterSupplementaryFormHook via objectIdOffline.
      const parentId = survey.parseParentClassID ? String(survey.parseParentClassID) : '';
      const parentIsOfflineLocal = parentId.includes('PatientID-') || parentId.includes('AssetID-');
      if (parentId && !parentIsOfflineLocal && survey.parseParentClass) {
        const parentForm = new Parse.Object(survey.parseParentClass);
        parentForm.id = parentId;
        supplementaryForm.set('client', parentForm);
      }

      if (typeof survey.parseUser !== 'undefined' && survey.parseUser) {
        const userObject = new Parse.Object('_User');
        userObject.id = String(survey.parseUser);
        supplementaryForm.set('parseUser', userObject);
      }

      return supplementaryForm.save(null, { useMasterKey: true })
        .then((result) => result)
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Error: postObjectWithRelationships', error);
        });
    };

    const postObjectsArray = async (data, metadata, category) => {
      if (!data) return Promise.all([]);
      const promises = data.map(async (obj) => attempt(category, obj, async () => {
        const record = obj;
        record.localObject = mergeMetadataAsFallback(record.localObject, metadata);
        const { localObject } = record;

        if (localObject.objectId && localObject.objectId.includes('PatientID-')) {
          localObject.objectIdOffline = localObject.objectId;
          delete localObject.objectId;
        }
        if (localObject.householdId && localObject.householdId.includes('Household-')) {
          localObject.householdObjectIdOffline = localObject.householdId;
        }
        if (localObject.objectId && localObject.objectId.includes('AssetID-')) {
          localObject.objectIdOffline = localObject.objectId;
          delete localObject.objectId;
        }

        if (localObject.objectIdOffline) {
          const existing = await findExistingOfflineRecord(
            record.parseClass, localObject.objectIdOffline,
          );
          if (existing) return existing;
        }

        return postObject(record);
      }));

      return Promise.all(promises);
    };

    const postObjectsWithRelationshipsArray = async (data, metadata, category) => {
      if (!data) return Promise.all([]);
      const promises = data.map(async (obj) => attempt(category, obj, async () => {
        const record = obj;
        record.localObject = mergeMetadataAsFallback(record.localObject, metadata);
        const { localObject } = record;

        // Guarded. A record with no parent id used to throw a TypeError here.
        const parentId = record.parseParentClassID ? String(record.parseParentClassID) : '';
        if (parentId.includes('PatientID-')) {
          localObject.parseParentClassObjectIdOffline = parentId;
        }
        if (parentId.includes('AssetID-')) {
          localObject.parseParentClassObjectIdOffline = parentId;
        }

        // The supplementary idempotency key. Production has had this branch
        // since cf16c0f (2026-07-16); the client has never stamped a SupID-.
        if (localObject.objectId && localObject.objectId.includes('SupID-')) {
          localObject.objectIdOffline = localObject.objectId;
          delete localObject.objectId;
        }

        if (localObject.objectIdOffline) {
          const existing = await findExistingOfflineRecord(
            record.parseClass, localObject.objectIdOffline,
          );
          if (existing) return existing;
        }

        return postObjectWithRelationships(record);
      }));

      return Promise.all(promises);
    };

    const postHouseholdArray = async (data, metadata, category) => {
      if (!data) return [];
      const promises = data.map(async (obj) => attempt(category, obj, async () => {
        const record = obj;
        record.localObject = mergeMetadataAsFallback(record.localObject, metadata);
        const { localObject } = record;

        if (localObject.objectId && localObject.objectId.includes('Household-')) {
          localObject.objectIdOffline = localObject.objectId;
          delete localObject.objectId;
        }

        if (localObject.objectIdOffline) {
          const existing = await findExistingOfflineRecord(
            record.parseClass, localObject.objectIdOffline,
          );
          if (existing) return existing;
        }

        return postObject(record);
      }));

      return Promise.all(promises);
    };

    // Resolves householdClient from the phone-side household id.
    const afterSurveyHouseholdHook = async (records) => {
      if (!Array.isArray(records)) return [];
      const data = records.map(async (record) => {
        if (isUnsaved(record)) return record;
        const survey = record;
        const householdPointer = await survey.get('householdObjectIdOffline');
        if (!householdPointer) return survey;

        const householdQuery = new Parse.Query('Household');
        householdQuery.equalTo('objectIdOffline', householdPointer);
        const household = await householdQuery.first({ useMasterKey: true });
        if (!household) return survey;

        const resident = await new Parse.Query('SurveyData').get(survey.id, { useMasterKey: true });
        resident.set('householdClient', household);
        resident.set('householdId', String(household.id));
        return resident.save(null, { useMasterKey: true });
      });

      return Promise.all(data);
    };

    // Resolves the `client` pointer from the phone-side parent id.
    const afterSupplementaryFormHook = async (records, parentClass = 'SurveyData') => {
      if (!Array.isArray(records)) return [];
      const data = records.map(async (record) => {
        if (isUnsaved(record)) return record;
        const supplementaryForm = record;
        const parentPointer = await supplementaryForm.get('parseParentClassObjectIdOffline');
        if (!parentPointer) return supplementaryForm;

        const parentQuery = new Parse.Query(parentClass);
        parentQuery.equalTo('objectIdOffline', parentPointer);
        const parent = await parentQuery.first({ useMasterKey: true });

        if (!parent) {
          // eslint-disable-next-line no-console
          console.error(`afterSupplementaryFormHook: ORPHANED ${supplementaryForm.className} ${supplementaryForm.id} — no ${parentClass} found with objectIdOffline=${parentPointer}; client pointer NOT set`);
          return supplementaryForm;
        }
        supplementaryForm.set('client', parent);
        return supplementaryForm.save(null, { useMasterKey: true })
          // eslint-disable-next-line no-console
          .catch((error) => console.error('Error: afterSupplementaryFormHook', error));
      });

      return Promise.all(data);
    };

    const OfflineFactory = (records, type) => {
      const {
        residentForms,
        residentSupplementaryForms,
        households,
        assetForms,
        assetSupplementaryForms,
        metadata,
      } = records;

      // households and assetForms have NO afterSave hook. That asymmetry is
      // load-bearing: a swallowed failure in those two categories still yields
      // an ARRAY (holding undefined), which the client reads as success and
      // then deletes the queue — whereas the three hooked categories throw and
      // wedge instead. Same root cause, opposite symptom.
      if (type === 'households') return postHouseholdArray(households, metadata, 'households');
      if (type === 'assetForms') return postObjectsArray(assetForms, metadata, 'assetForms');
      if (type === 'residentForms') return postObjectsArray(residentForms, metadata, 'residentForms').then((results) => afterSurveyHouseholdHook(results));
      if (type === 'residentSupplementaryForms') return postObjectsWithRelationshipsArray(residentSupplementaryForms, metadata, 'residentSupplementaryForms').then((results) => afterSupplementaryFormHook(results, 'SurveyData'));
      if (type === 'assetSupplementaryForms') return postObjectsWithRelationshipsArray(assetSupplementaryForms, metadata, 'assetSupplementaryForms').then((results) => afterSupplementaryFormHook(results, 'Assets'));
      return [];
    };

    try {
      const households = await OfflineFactory(offlineForms, 'households');
      const residentForms = await OfflineFactory(offlineForms, 'residentForms');
      const assetForms = await OfflineFactory(offlineForms, 'assetForms');
      const residentSupplementaryForms = await OfflineFactory(offlineForms, 'residentSupplementaryForms');
      const assetSupplementaryForms = await OfflineFactory(offlineForms, 'assetSupplementaryForms');
      const categories = {
        residentForms,
        assetForms,
        households,
        residentSupplementaryForms,
        assetSupplementaryForms,
      };

      const saved = {};
      const failures = [];
      Object.entries(categories).forEach(([key, list]) => {
        // Unreachable by construction, but coercing a non-array to [] would
        // drop its records AND record no failure — a clean success, and the
        // device deletes its queue. Throws into the catch below instead.
        if (!Array.isArray(list)) {
          throw new Error(`offline upload: category ${key} was not an array`);
        }
        const rows = list;
        saved[key] = rows.filter((row) => !isUnsaved(row));
        rows.filter(isUnsaved).forEach((row) => failures.push({
          category: key,
          offlineId: (row && row.offlineId) || null,
          message: (row && row.message) || 'Parse refused the save',
        }));
      });

      if (failures.length === 0) return saved;

      return { status: 'PartialFailure', saved, failures };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error: Offline', err);
      // Answers in the documented shape even on an unexpected throw.
      return {
        status: 'Error',
        saved: {
          residentForms: [],
          assetForms: [],
          households: [],
          residentSupplementaryForms: [],
          assetSupplementaryForms: [],
        },
        failures: [{
          category: null,
          offlineId: null,
          message: (err && err.message) ? err.message : String(err),
        }],
      };
    }
  });

  /**
   * Cloud function: updateObject
   * Matches puente-node-cloudcode/cloud/src/definer/crud.definer.js (line 426)
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

  console.log('✓ Mock Cloud Code functions registered: postObjectsToClass, postObjectsToClassWithRelation, signup, login, uploadOfflineForms, updateObject');
};
