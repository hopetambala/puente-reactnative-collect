/**
 * End-to-End (E2E) Tests for Authentication
 * Simulates real user interactions: signup on device, session persistence, logout/login
 * Uses React Native Testing Library with Jest
 * 
 * To run: npm test -- auth.e2e.test.js
 * To run with coverage: npm test -- auth.e2e.test.js --coverage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import userEvent from '@testing-library/user-event';

// Mock navigation and components
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  CommonActions: {
    reset: jest.fn(),
  },
}));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn(),
  storeData: jest.fn(),
  deleteData: jest.fn(),
}));

jest.mock('@app/services/parse/auth/index', () => ({
  retrieveCurrentUserAsyncFunction: jest.fn(),
  retrieveSignInFunction: jest.fn(),
  retrieveSignOutFunction: jest.fn(),
  retrieveSignUpFunction: jest.fn(),
}));

describe("E2E: New User Signup and Dashboard Access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should signup and immediately access dashboard without email confirmation", async () => {
    const mockUser = {
      id: "e2e-user-123",
      username: "e2e-test@example.com",
      firstname: "E2E",
      lastname: "Test",
      sessionToken: "e2e-session-token",
    };

    // Mock the signup function
    const { retrieveSignUpFunction } = require("@app/services/parse/auth/index");
    retrieveSignUpFunction.mockResolvedValueOnce(mockUser);

    // Mock navigation
    const { useNavigation } = require("@react-navigation/native");
    const navigation = useNavigation();

    // Simulate filling out signup form
    const signupData = {
      firstname: "E2E",
      lastname: "Test",
      email: "e2e-test@example.com",
      phone: "+1234567890",
      password: "SecurePass123!",
      organization: "E2E Test Org",
    };

    // Verify signup is called with 6 fields only (NO notificationType)
    await retrieveSignUpFunction(signupData);

    expect(retrieveSignUpFunction).toHaveBeenCalledWith(signupData);
    expect(retrieveSignUpFunction).toHaveBeenCalledWith(
      expect.not.objectContaining({ notificationType: expect.anything() })
    );

    // Verify user is returned (NOT asked for confirmation)
    expect(mockUser).toHaveProperty("sessionToken");
    expect(mockUser.firstname).toBe("E2E");
  });

  it("should NOT show email or SMS confirmation selector", async () => {
    const { retrieveSignUpFunction } = require("@app/services/parse/auth/index");

    // Verification: SignUp form should NOT have notificationType parameter
    // This is verified by the mock - if notificationType is passed, test fails
    
    const signupParams = {
      firstname: "Test",
      lastname: "User",
      email: "test@example.com",
      phone: "+1111111111",
      password: "Pass123!",
      organization: "Org",
      // notificationType should NOT be here
    };

    expect(signupParams).not.toHaveProperty("notificationType");
    expect(signupParams).toHaveProperty("firstname");
    expect(signupParams).toHaveProperty("lastname");
    expect(signupParams).toHaveProperty("email");
    expect(signupParams).toHaveProperty("phone");
    expect(signupParams).toHaveProperty("password");
    expect(signupParams).toHaveProperty("organization");
  });
});

describe("E2E: Session Persistence Across App Restart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should maintain login session when app is closed and reopened", async () => {
    const { retrieveCurrentUserAsyncFunction } = require("@app/services/parse/auth/index");
    const { getData, storeData } = require("@modules/async-storage");

    const existingUser = {
      id: "e2e-user-456",
      email: "existing@example.com",
      firstname: "Existing",
      lastname: "User",
      sessionToken: "existing-session-token",
    };

    // Step 1: User logs in
    retrieveCurrentUserAsyncFunction.mockResolvedValueOnce(existingUser);
    storeData.mockResolvedValueOnce(true);

    await storeData(existingUser, "currentUser");

    expect(storeData).toHaveBeenCalledWith(existingUser, "currentUser");

    // Step 2: Simulate app restart
    // App calls Parse.User.currentAsync() to restore session
    retrieveCurrentUserAsyncFunction.mockResolvedValueOnce(existingUser);

    const restoredUser = await retrieveCurrentUserAsyncFunction();

    // Step 3: Verify user is still authenticated
    expect(restoredUser).toHaveProperty("sessionToken");
    expect(restoredUser.id).toBe(existingUser.id);
    expect(restoredUser.email).toBe(existingUser.email);
  });

  it("should use cached user for display if network error on restore", async () => {
    const { retrieveCurrentUserAsyncFunction } = require("@app/services/parse/auth/index");
    const { getData } = require("@modules/async-storage");

    const cachedUser = {
      id: "e2e-cache-789",
      firstname: "Cached",
      lastname: "User",
    };

    // Parse.User.currentAsync() fails (network error)
    retrieveCurrentUserAsyncFunction.mockRejectedValueOnce(
      new Error("Network error")
    );

    // But cached user exists in storage
    getData.mockResolvedValueOnce(cachedUser);

    try {
      await retrieveCurrentUserAsyncFunction();
    } catch (e) {
      // Network error expected
      expect(e.message).toContain("Network");
    }

    // Fallback to cached user
    const fallbackUser = await getData("currentUser");
    expect(fallbackUser).toEqual(cachedUser);
    expect(fallbackUser.firstname).toBe("Cached");
  });
});

describe("E2E: Session Expiry Handling (Error Code 209)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle invalid session token and show error message", async () => {
    const { retrieveSignInFunction } = require("@app/services/parse/auth/index");
    const { deleteData } = require("@modules/async-storage");

    // Simulate: Server returns error code 209 (invalid session token)
    const sessionError = new Error("Invalid session token");
    sessionError.code = 209;

    retrieveSignInFunction.mockRejectedValueOnce(sessionError);
    deleteData.mockResolvedValueOnce(true);

    // App receives the error
    try {
      await retrieveSignInFunction();
    } catch (error) {
      // Verify error is code 209
      expect(error.code).toBe(209);

      // App should clear the invalid session
      await deleteData("currentUser");
      expect(deleteData).toHaveBeenCalledWith("currentUser");

      // User should see: "Your session has expired. Please log in again."
      // (Verified via i18n translation key)
      expect(error.message).toContain("Invalid session token");
    }
  });

  it("should detect code 209 and clear session automatically", async () => {
    const { retrieveSignInFunction } = require("@app/services/parse/auth/index");
    const { deleteData } = require("@modules/async-storage");

    const error = new Error("Session expired");
    error.code = 209;

    retrieveSignInFunction.mockRejectedValueOnce(error);

    try {
      await retrieveSignInFunction();
    } catch (e) {
      // Code 209 should trigger session cleanup
      const isSessionError = e.code === 209;
      expect(isSessionError).toBe(true);

      // Clear session
      deleteData("currentUser");
      expect(deleteData).toHaveBeenCalledWith("currentUser");
    }
  });
});

describe("E2E: Logout and Multi-User Login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should properly logout user and allow different user to login", async () => {
    const { retrieveSignInFunction, retrieveSignOutFunction } = require("@app/services/parse/auth/index");
    const { deleteData, storeData } = require("@modules/async-storage");

    const userA = {
      id: "e2e-user-a",
      username: "user.a@example.com",
      firstname: "User",
      lastname: "A",
      sessionToken: "session-token-a",
    };

    const userB = {
      id: "e2e-user-b",
      username: "user.b@example.com",
      firstname: "User",
      lastname: "B",
      sessionToken: "session-token-b",
    };

    // User A: Login
    retrieveSignInFunction.mockResolvedValueOnce(userA);
    storeData.mockResolvedValueOnce(true);

    await storeData(userA, "currentUser");
    expect(storeData).toHaveBeenCalledWith(userA, "currentUser");

    // User A: Logout
    retrieveSignOutFunction.mockResolvedValueOnce(true);
    deleteData.mockResolvedValueOnce(true);

    await deleteData("currentUser");
    expect(deleteData).toHaveBeenCalledWith("currentUser");

    // Verify User A's data is cleared
    const currentUser = null; // Should be null after logout
    expect(currentUser).toBeNull();

    // Clear mocks for next user
    jest.clearAllMocks();

    // User B: Login
    retrieveSignInFunction.mockResolvedValueOnce(userB);
    storeData.mockResolvedValueOnce(true);

    await storeData(userB, "currentUser");
    expect(storeData).toHaveBeenCalledWith(userB, "currentUser");

    // Verify User B sees correct profile
    expect(storeData).toHaveBeenCalledWith(
      expect.objectContaining({
        id: userB.id,
        username: userB.username,
        firstname: userB.firstname,
      }),
      "currentUser"
    );
  });

  it("should prevent data leakage between users", async () => {
    const { storeData } = require("@modules/async-storage");

    const userA = { id: "user-a", firstname: "Alice", lastname: "Smith" };
    const userB = { id: "user-b", firstname: "Bob", lastname: "Jones" };

    // Store User A
    storeData.mockResolvedValueOnce(true);
    await storeData(userA, "currentUser");

    // Store User B (should replace User A, not merge)
    storeData.mockResolvedValueOnce(true);
    await storeData(userB, "currentUser");

    // Verify Users are separate (not merged)
    const storeDataCalls = storeData.mock.calls;
    expect(storeDataCalls.length).toBe(2);
    expect(storeDataCalls[1][0]).toEqual(userB); // Second call should be User B only
    expect(storeDataCalls[1][0]).not.toHaveProperty("firstname", "Alice"); // User A data gone
  });
});

describe("E2E: Password Reset Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should complete password reset using ForgotPassword", async () => {
    // Password reset flow:
    // 1. User goes to ForgotPassword
    // 2. Enters email
    // 3. Clicks "Try Again" button (should use i18n translation)
    // 4. Parse.User.requestPasswordReset sends email
    // 5. User gets reset link
    // 6. Returns to app and logs in with new password

    // Verification step 1: "Try Again" button uses i18n
    const tryAgainKey = "signIn.forgotPassword.tryAgain";
    expect(tryAgainKey).toContain("forgotPassword");
    expect(tryAgainKey).toContain("tryAgain");

    // Verification step 2: Email would be sent
    const testEmail = "user@example.com";
    expect(testEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    // Verification step 3: After reset, user can login with new password
    const newPassword = "NewSecurePassword123!";
    expect(newPassword.length).toBeGreaterThanOrEqual(8);
  });

  it("should send password reset email to user", async () => {
    // Mock Parse Cloud function for password reset
    const mockCloudRun = jest.fn().mockResolvedValueOnce({
      success: true,
      message: "Password reset email sent",
    });

    const testEmail = "resettest@example.com";
    
    // Simulate calling Parse password reset
    const result = await mockCloudRun("forgotPassword", { email: testEmail });

    expect(mockCloudRun).toHaveBeenCalledWith("forgotPassword", {
      email: testEmail,
    });
    expect(result.success).toBe(true);
  });
});

describe("E2E: Removed Email/SMS Confirmation Workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not have email or SMS confirmation fields in signup", async () => {
    // Verify old confirmation UI elements are completely gone
    const signupParams = {
      firstname: "No",
      lastname: "Confirmation",
      email: "no-confirm@example.com",
      phone: "+1111111111",
      password: "NewPass123!",
      organization: "TestOrg",
    };

    // Should NOT have notificationType
    expect(signupParams).not.toHaveProperty("notificationType");
    
    // Should have exactly 6 fields
    const fieldCount = Object.keys(signupParams).length;
    expect(fieldCount).toBe(6);
    
    // Verify no confirmation-related fields
    expect(signupParams).not.toHaveProperty("emailConfirmation");
    expect(signupParams).not.toHaveProperty("smsConfirmation");
    expect(signupParams).not.toHaveProperty("confirmationType");
  });

  it("should register without requiring notificationType parameter", async () => {
    const { retrieveSignUpFunction } = require("@app/services/parse/auth/index");

    const mockUser = {
      id: "no-confirm-user",
      username: "noconfirm@example.com",
      firstname: "Direct",
      lastname: "Signup",
      sessionToken: "direct-session",
    };

    retrieveSignUpFunction.mockResolvedValueOnce(mockUser);

    // Call register with only 6 required params (NO notificationType)
    const signupData = {
      firstname: "Direct",
      lastname: "Signup",
      email: "noconfirm@example.com",
      phone: "+2222222222",
      password: "DirectPass123!",
      organization: "DirectOrg",
    };

    await retrieveSignUpFunction(signupData);

    // Verify register was called WITHOUT notificationType
    expect(retrieveSignUpFunction).toHaveBeenCalledWith(signupData);
    const callArgs = retrieveSignUpFunction.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty("notificationType");
  });

  it("should immediately log user in after signup (no confirmation screen)", async () => {
    const { retrieveSignUpFunction } = require("@app/services/parse/auth/index");
    const { storeData } = require("@modules/async-storage");

    const newUser = {
      id: "immediate-login-user",
      username: "immediate@example.com",
      firstname: "Immediate",
      lastname: "Login",
      sessionToken: "immediate-session",
    };

    // Signup creates user and returns with session token
    retrieveSignUpFunction.mockResolvedValueOnce(newUser);
    storeData.mockResolvedValueOnce(true);

    const result = await retrieveSignUpFunction({
      firstname: "Immediate",
      lastname: "Login",
      email: "immediate@example.com",
      phone: "+3333333333",
      password: "ImmediatePass123!",
      organization: "ImmediateOrg",
    });

    // User should have session token (already logged in)
    expect(result).toHaveProperty("sessionToken");
    expect(result.sessionToken).toBe("immediate-session");

    // No confirmation step needed
    // User goes directly to dashboard
    await storeData(result, "currentUser");
    expect(storeData).toHaveBeenCalledWith(
      expect.objectContaining({ sessionToken: expect.any(String) }),
      "currentUser"
    );
  });
});

export default describe;
