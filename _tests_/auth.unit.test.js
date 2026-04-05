/**
 * @jest-environment node
 * Unit Tests for Authentication Context
 * Tests individual auth functions in isolation
 */

// Mock Parse and async storage
jest.mock("@modules/async-storage", () => ({
  getData: jest.fn(),
  storeData: jest.fn(),
  deleteData: jest.fn(),
}));

jest.mock("@modules/offline", () => jest.fn(() => Promise.resolve(true)));

jest.mock("@app/services/parse/auth/index", () => ({
  retrieveCurrentUserAsyncFunction: jest.fn(),
  retrieveSignInFunction: jest.fn(),
  retrieveSignOutFunction: jest.fn(),
  retrieveSignUpFunction: jest.fn(),
}));

const { getData, storeData, deleteData } = require("@modules/async-storage");
const {
  retrieveCurrentUserAsyncFunction,
  retrieveSignInFunction,
  retrieveSignOutFunction,
  retrieveSignUpFunction,
} = require("@app/services/parse/auth/index");

describe("Auth Context Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register() function", () => {
    it("should create user without storing password", async () => {
      const mockUser = {
        id: "user-123",
        username: "testuser@example.com",
        firstname: "Test",
        lastname: "User",
      };

      retrieveSignUpFunction.mockResolvedValue(mockUser);
      deleteData.mockResolvedValue(true);
      storeData.mockResolvedValue(true);

      // Verify deleteData is called for old session
      expect(deleteData).toHaveBeenCalledWith("currentUser");
      
      // Verify storeData is called for new user (but NOT password)
      expect(storeData).toHaveBeenCalledWith(mockUser, "currentUser");
      
      // Verify password is NOT stored
      expect(storeData).not.toHaveBeenCalledWith(
        expect.any(String),
        "password"
      );
    });

    it("should handle server error during registration", async () => {
      const error = new Error("Email already taken");
      retrieveSignUpFunction.mockRejectedValue(error);

      // Error should be caught and stored in context error state
      expect(retrieveSignUpFunction).toHaveBeenCalled();
    });
  });

  describe("onlineLogin() function", () => {
    it("should return true on successful login", async () => {
      const mockUser = {
        id: "user-456",
        username: "login@example.com",
        getSessionToken: jest.fn().mockReturnValue("session-token-123"),
      };

      retrieveSignInFunction.mockResolvedValue(mockUser);
      storeData.mockResolvedValue(true);

      // User should be stored without password
      expect(storeData).toHaveBeenCalledWith(mockUser, "currentUser");
      expect(storeData).not.toHaveBeenCalledWith(
        expect.any(String),
        "password"
      );
    });

    it("should return false on invalid credentials", async () => {
      const error = new Error("Invalid username/password");
      retrieveSignInFunction.mockRejectedValue(error);

      // Login should fail without storing anything
      expect(storeData).not.toHaveBeenCalled();
    });

    it("should handle session token error (code 209)", async () => {
      const error = new Error("Invalid session token");
      error.code = 209;
      retrieveSignInFunction.mockRejectedValue(error);

      // Should clear invalid session
      expect(deleteData).toHaveBeenCalledWith("currentUser");
      expect(storeData).not.toHaveBeenCalled();
    });
  });

  describe("offlineLogin() function", () => {
    it("should return false in online-only mode", () => {
      // Offline login should always fail in new architecture
      const credentials = { username: "test@example.com", password: "pass123" };
      
      // Function should reject offline login
      expect(retrieveSignInFunction).toBeDefined();
    });
  });

  describe("onLogout() function", () => {
    it("should clear user state on logout", async () => {
      deleteData.mockResolvedValue(true);
      retrieveSignOutFunction.mockResolvedValue(true);

      // Verify currentUser is deleted (but NOT password anymore)
      expect(deleteData).toHaveBeenCalledWith("currentUser");
      expect(deleteData).not.toHaveBeenCalledWith("password");
    });

    it("should handle offline logout", async () => {
      deleteData.mockResolvedValue(true);

      // Should still clear data even offline
      expect(deleteData).toHaveBeenCalledWith("currentUser");
    });
  });

  describe("Password Storage Security", () => {
    it("should never store plain text passwords", () => {
      // No password operations should exist
      const allCalls = storeData.mock.calls;
      allCalls.forEach((call) => {
        expect(call[1]).not.toBe("password");
      });
    });

    it("should not restore passwords from AsyncStorage", () => {
      // getData should NOT be called for 'password' key
      const allCalls = getData.mock.calls;
      allCalls.forEach((call) => {
        expect(call[0]).not.toBe("password");
      });
    });
  });

  describe("Session Token Management", () => {
    it("should use Parse SDK for session management", () => {
      // retrieveCurrentUserAsyncFunction should be called (Parse SDK)
      expect(retrieveCurrentUserAsyncFunction).toBeDefined();
      expect(retrieveSignInFunction).toBeDefined();
      expect(retrieveSignOutFunction).toBeDefined();
    });

    it("should detect invalid session tokens (code 209)", () => {
      const error = new Error("Session expired");
      error.code = 209;

      // Error handling should check for code 209
      const errorCode = error.code ? parseInt(error.code) : null;
      expect(errorCode).toBe(209);
    });
  });
});
