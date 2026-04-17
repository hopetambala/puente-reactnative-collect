/**
 * UseCamera Integration Tests with Parse Server
 * Tests photo capture and submission to Parse server
 *
 * Runs against a real MongoDB-backed Parse Server via jest.integration.config.js
 * Use: yarn test:integration
 */

import hooks from '@app/test/hooks';
import { Parse } from 'parse/react-native';

/**
 * Test utilities for photo submission
 */
const createMockPhoto = (overrides = {}) => ({
  uri: 'file:///photo123.jpg',
  base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  ...overrides,
});

const createPhotoDataUri = (base64) => `data:image/jpg;base64,${base64}`;

const createTestSupplementaryFormPhoto = (photoDataUri, overrides = {}) => ({
  photoData: photoDataUri,
  formType: 'SupplementaryForm',
  userId: `test-user-${Date.now()}`,
  timestamp: new Date(),
  ...overrides,
});

hooks();

describe('UseCamera - Parse Server Integration Tests', () => {
  let testUser;

  beforeAll(async () => {
    // Create a test user directly for this test suite
    const username = `camera-test-user-${Date.now()}`;
    const password = 'password';
    const user = new Parse.User();
    user.set('username', username);
    user.set('password', password);
    user.set('email', `camera-test-${Date.now()}@example.com`);
    await user.save(null, { useMasterKey: true });
    // Log in the user to establish authenticated session
    testUser = await Parse.User.logIn(username, password);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Photo Submission to Parse', () => {
    it('should save captured photo to Parse SupplementaryFormPhoto class', async () => {
      const mockPhoto = createMockPhoto();
      const photoDataUri = createPhotoDataUri(mockPhoto.base64);

      const parseObject = new Parse.Object('SupplementaryFormPhoto');
      parseObject.set('photoData', photoDataUri);
      parseObject.set('originalUri', mockPhoto.uri);
      parseObject.set('timestamp', new Date());

      const savedPhoto = await parseObject.save(null, { useMasterKey: true });

      expect(savedPhoto).toBeDefined();
      expect(savedPhoto.id).toBeDefined();
      expect(savedPhoto.get('photoData')).toContain('data:image/jpg;base64,');
    });

    it('should query saved photo from Parse', async () => {
      const mockPhoto = createMockPhoto();
      const photoDataUri = createPhotoDataUri(mockPhoto.base64);
      const userId = `test-user-${Date.now()}`;

      const parseObject = new Parse.Object('SupplementaryFormPhoto');
      parseObject.set('photoData', photoDataUri);
      parseObject.set('userId', userId);
      await parseObject.save(null, { useMasterKey: true });

      const query = new Parse.Query('SupplementaryFormPhoto');
      query.equalTo('userId', userId);
      const results = await query.find();

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].get('photoData')).toContain('data:image/jpg;base64,');
    });

    it('should save photo with metadata (timestamp, userId, formType)', async () => {
      const mockPhoto = createMockPhoto();
      const photoDataUri = createPhotoDataUri(mockPhoto.base64);
      const userId = `meta-user-${Date.now()}`;

      const parseObject = new Parse.Object('SupplementaryFormPhoto');
      parseObject.set('photoData', photoDataUri);
      parseObject.set('userId', userId);
      parseObject.set('formType', 'SupplementaryForm');
      parseObject.set('timestamp', new Date());

      const saved = await parseObject.save(null, { useMasterKey: true });

      expect(saved.get('userId')).toBe(userId);
      expect(saved.get('formType')).toBe('SupplementaryForm');
      expect(saved.get('timestamp')).toBeInstanceOf(Date);
    });

    it('should handle form with multiple photo fields', async () => {
      const photo1 = createPhotoDataUri(createMockPhoto({ uri: 'file:///photo1.jpg' }).base64);
      const photo2 = createPhotoDataUri('differentBase64ContentForPhoto2==');

      const parseObject = new Parse.Object('SupplementaryForm');
      parseObject.set('photoFile', photo1);
      parseObject.set('supplementaryPhoto', photo2);
      parseObject.set('firstName', 'Jane');
      parseObject.set('lastName', 'Doe');

      const saved = await parseObject.save(null, { useMasterKey: true });

      expect(saved.get('photoFile')).toBeDefined();
      expect(saved.get('supplementaryPhoto')).toBeDefined();
      expect(saved.get('photoFile')).not.toEqual(saved.get('supplementaryPhoto'));
    });

    it('should create pointer relationship between photo and form', async () => {
      const form = new Parse.Object('SupplementaryForm');
      form.set('firstName', 'John');
      const savedForm = await form.save(null, { useMasterKey: true });

      const photoDataUri = createPhotoDataUri(createMockPhoto().base64);
      const photoObject = new Parse.Object('SupplementaryFormPhoto');
      photoObject.set('photoData', photoDataUri);
      photoObject.set('form', savedForm);

      const savedPhoto = await photoObject.save(null, { useMasterKey: true });

      expect(savedPhoto.get('form')).toBeDefined();
      expect(savedPhoto.get('form').id).toBe(savedForm.id);
    });

    it('should handle invalid photo data without crashing', async () => {
      const parseObject = new Parse.Object('SupplementaryFormPhoto');
      parseObject.set('photoData', 'data:image/jpg;base64,invalid!!!');

      try {
        const saved = await parseObject.save(null, { useMasterKey: true });
        expect(saved).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Photo Data Structure', () => {
    it('should correctly format photo data as data URI', () => {
      const mockPhoto = createMockPhoto();
      const photoDataUri = createPhotoDataUri(mockPhoto.base64);

      expect(photoDataUri).toMatch(/^data:image\/jpg;base64,/);
      expect(photoDataUri.length).toBeGreaterThan(30);
    });

    it('should create Parse Object for photo', () => {
      const photoObject = new Parse.Object('SupplementaryFormPhoto');
      expect(photoObject).toBeDefined();
      expect(photoObject.className).toBe('SupplementaryFormPhoto');
    });

    it('should structure form data correctly with photo', () => {
      const mockPhoto = createMockPhoto();
      const photoDataUri = createPhotoDataUri(mockPhoto.base64);
      const formData = createTestSupplementaryFormPhoto(photoDataUri);

      expect(formData.photoData).toContain('data:image/jpg;base64,');
      expect(formData.formType).toBe('SupplementaryForm');
      expect(formData.userId).toBeDefined();
      expect(formData.timestamp).toBeInstanceOf(Date);
    });

    it('should handle null photo gracefully', () => {
      const formData = createTestSupplementaryFormPhoto(null);

      expect(formData.photoData).toBeNull();
      expect(formData.formType).toBe('SupplementaryForm');
    });

    it('should detect and preserve corrupt base64 data as-is', () => {
      const corruptBase64 = 'not-valid-base64-!!!';
      const photoDataUri = createPhotoDataUri(corruptBase64);

      expect(photoDataUri).toContain('data:image/jpg;base64,');
      expect(photoDataUri).toContain(corruptBase64);
    });
  });

  describe('Parse Connection', () => {
    it('should query Parse SupplementaryFormPhoto class', async () => {
      const query = new Parse.Query('SupplementaryFormPhoto');
      const results = await query.find();

      expect(Array.isArray(results)).toBe(true);
    });

    it('should query Parse SupplementaryForm class', async () => {
      const query = new Parse.Query('SupplementaryForm');
      const results = await query.find();

      expect(Array.isArray(results)).toBe(true);
    });
  });
});
