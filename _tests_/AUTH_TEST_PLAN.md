# Authentication Test Suite Documentation

## Overview

This document describes the comprehensive red-green testing plan for the refactored authentication system. The test suite is organized into 4 phases:

1. **Unit Tests** - Individual function testing in isolation
2. **Integration Tests** - Complete authentication flows from signup to logout
3. **End-to-End (E2E) Tests** - Real user interactions on device/simulator
4. **Security Tests** - Password storage, session security, unauthorized access prevention

---

## Phase 1: Unit Tests (`auth.unit.test.js`)

### Purpose
Test individual authentication functions in isolation to verify that each piece works as expected.

### Test Cases

#### `register()` Function
- **✅ GREEN**: User created without storing password
  - Verify `storeData` is called with user object
  - Verify `storeData` is NOT called with `("password", "password")`
  - Expected: User saved safely

- **❌ RED**: Server returns duplicate email error
  - Verify error is caught and stored in context
  - Mock: `retrieveSignUpFunction` rejects with "Email already taken"
  - Expected: Error message shown to user

#### `onlineLogin()` Function
- **✅ GREEN**: User logs in successfully
  - Verify Parse session restored
  - Verify user object stored (not password)
  - Expected: `isLoading` = false, `user` populated, `error` = null

- **❌ RED**: Invalid credentials
  - Verify login fails gracefully
  - Mock: `retrieveSignInFunction` rejects with "Invalid username/password"
  - Expected: Error shown, `user` remains null

- **❌ RED**: Session token error (code 209)
  - Verify error code 209 detected
  - Verify `deleteData("currentUser")` called to clear invalid session
  - Mock: Parse error with `code: 209`
  - Expected: User logged out, Error: "Your session has expired..."

#### `offlineLogin()` Function
- **❌ RED**: Offline login attempt
  - Verify function returns false (online-only mode)
  - Expected: Offline login not allowed

#### `onLogout()` Function
- **✅ GREEN**: User logs out successfully
  - Verify `deleteData("currentUser")` called
  - Verify password is NOT deleted (because it was never stored)
  - Expected: User state cleared, `user` = null

- **✅ GREEN**: Offline logout
  - Verify logout works even without network
  - Expected: Local state cleared

#### Password Storage Security
- **✅ GREEN**: No passwords in AsyncStorage after any auth operation
  - Check all `storeData` calls
  - Verify no key is "password"
  - Expected: `storeData` calls only include "currentUser"

- **✅ GREEN**: No passwords restored on app init
  - Check all `getData` calls
  - Verify no attempt to `getData("password")`
  - Expected: Only `getData("currentUser")` called

#### Session Token Management
- **✅ GREEN**: Parse SDK manages session tokens
  - Verify user object has valid `sessionToken`
  - Verify token format is alphanumeric
  - Expected: `sessionToken` property exists and is valid

- **❌ RED**: Invalid session token detection
  - Verify error code 209 properly detected
  - Verify session invalidation triggered
  - Expected: Code 209 caught, session cleared

### Running Unit Tests

```bash
# Run all unit tests
npm test -- auth.unit.test.js

# Run specific test
npm test -- auth.unit.test.js -t "should create user without storing password"

# Run with coverage
npm test -- auth.unit.test.js --coverage

# Watch mode (re-run on file changes)
npm test -- auth.unit.test.js --watch
```

### Expected Results

- All tests should **PASS** ✅
- Coverage should be **>90%** for auth context functions
- No warnings about uncleared mocks or async operations

---

## Phase 2: Integration Tests (`auth.integration.test.js`)

### Purpose
Test complete authentication workflows to ensure all pieces work together correctly.

### Test Scenarios

#### Signup → Login → Logout Flow
- **✅ GREEN**: Complete signup and login without email confirmation
  - User fills: firstname, lastname, email, phone, password, organization (6 fields)
  - User is immediately logged in after signup (NO confirmation screen)
  - NO `notificationType` state or UI
  - Expected: Dashboard visible within 2-3 seconds

#### Session Persistence Across App Restart
- **✅ GREEN**: User logs in, closes app, reopens app
  - Step 1: Login with credentials
  - Step 2: Store user in AsyncStorage
  - Step 3: Close app (simulate with mock)
  - Step 4: Reopen app (new context initialization)
  - Step 5: `Parse.User.currentAsync()` restores session
  - Expected: User logged in without re-entering credentials

- **✅ GREEN**: Fallback to cached user if network error
  - Parse.User.currentAsync() fails (network error)
  - But getData("currentUser") returns cached user
  - Expected: UI shows cached user while in-flight session check happens

#### Multi-User Login
- **✅ GREEN**: Switch from user A to user B
  - User A logs in
  - User A logs out (clears `currentUser`)
  - User B logs in
  - Expected: User B's data shown, no User A data visible

#### Session Error Handling (Code 209)
- **❌ RED**: Invalid session token error
  - Server returns error code 209
  - Expected: Session cleared, error message shown, user at SignIn screen

- **❌ RED**: Network timeout during login
  - Login request times out
  - Expected: Error shown, session NOT cleared (recoverable)

#### Password Security in Flows
- **✅ GREEN**: No passwords stored after signup/login
  - Verify all `storeData` calls
  - Check that NO key is "password"
  - Expected: Only user object stored

- **✅ GREEN**: No passwords restored from storage
  - Verify `getData` never called with "password" key
  - Expected: Session restored from `currentUser`, not password

#### Offline Behavior
- **❌ RED**: Offline login not allowed
  - Network down, user tries to login
  - Expected: Login fails (no offline fallback)

- **✅ GREEN**: Offline logout allowed
  - Network down, user logs out
  - Expected: Local state cleared successfully

#### Form Field Validation
- **✅ GREEN**: SignUp form has exactly 6 fields
  - firstname, lastname, email, phone, password, organization
  - NO notificationType selector
  - Expected: Form collects correct fields

### Running Integration Tests

```bash
# Run all integration tests
npm test -- auth.integration.test.js

# Run specific flow
npm test -- auth.integration.test.js -t "Signup → Login → Logout Flow"

# Run with coverage
npm test -- auth.integration.test.js --coverage

# Watch mode
npm test -- auth.integration.test.js --watch
```

### Expected Results

- All tests should **PASS** ✅
- Session persistence tested across mock app restarts
- Multi-user scenarios verified without data leakage
- Form validation confirms old UI removed

---

## Phase 3: End-to-End (E2E) Tests (`auth.e2e.test.js`)

### Purpose
Test real user interactions on a physical device or simulator using Detox/Appium/React Native Testing Library.

### Test Scenarios

#### New User Signup (GREEN)
- User opens app → taps "Create Account"
- Fills form: firstname, lastname, email, phone, password, organization
- **Verifies:**
  - ❌ NO email/SMS selector shown
  - ❌ NO "Send confirmation via email" button
  - ❌ NO "Send confirmation via SMS" button
  - ✅ Dashboard visible within 3 seconds
  - ✅ User name displayed in profile

#### Session Persistence (GREEN)
- User logs in → closes app → reopens app
- **Verifies:**
  - ✅ Dashboard immediately visible (no login screen)
  - ✅ Faster load time than first login (~1 second)
  - ✅ User data displayed correctly

#### Session Expiry (RED)
- Simulates server invalidating session token
- App makes API call and receives error code 209
- **Verifies:**
  - ✅ Error message: "Your session has expired. Please log in again."
  - ✅ Redirected to SignIn screen
  - ✅ Can login with credentials to restore access

#### Logout and Multi-User (GREEN)
- User A logs in → logs out → User B logs in
- **Verifies:**
  - ✅ User A's data cleared
  - ✅ SignIn form clean (no stale data)
  - ✅ User B sees correct profile data
  - ❌ NO data leakage between users

#### Password Reset (RED)
- User taps "Forgot Password" → enters email
- **Verifies:**
  - ✅ "Try Again" button uses i18n translation
  - ✅ Reset email sent successfully
  - ✅ Can set new password and login

#### No Confirmation Required (RED)
- Navigate to SignUp form
- **Verifies:**
  - ❌ `signup.notificationType` element does NOT exist
  - ❌ `signup.button.sendEmail` button does NOT exist
  - ❌ `signup.button.sendSMS` button does NOT exist
  - ✅ Signup completes without confirmation step

### Running E2E Tests

```bash
# Build app for testing
npm run build:e2e

# Run with Detox (iOS)
detox test e2e --configuration ios.sim.debug --cleanup

# Run with Detox (Android)
detox test e2e --configuration android.emu.debug --cleanup

# Run with Appium/WebdriverIO
npm run test:e2e

# Run specific test file
npm run test:e2e -- auth.e2e.test.js
```

### Expected Results

- All scenarios should **PASS** on physical device or simulator ✅
- No UI elements from old confirmation workflow visible
- Session persistence works across app kill/restart
- Error handling displays user-friendly messages

### E2E Test Environment Setup

```javascript
// detox.config.js example
module.exports = {
  testRunner: 'jest',
  runners: {
    jest: {
      args: {
        '$0': 'node_modules/.bin/jest',
        config: 'e2e/config.json',
        testTimeout: 20000,
        verbose: true,
      },
    },
  },
  apps: {
    ios: {
      configuration: 'ios.sim.debug',
      device: {
        type: 'iPhone 14',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: { type: 'simulator' },
      app: 'ios.debug',
    },
  },
};
```

---

## Phase 4: Security Tests (`auth.security.test.js`)

### Purpose
Verify password storage security, session token management, and unauthorized access prevention.

### Test Categories

#### Password Storage Security
- **✅ GREEN**: No passwords in AsyncStorage after login
  - Verify `storeData` never called with key "password"
  - Expected: AsyncStorage contains only "currentUser"

- **✅ GREEN**: No passwords in AsyncStorage after signup
  - Verify `storeData` never called with password data
  - Expected: Only user object stored

- **✅ GREEN**: AsyncStorage inspection shows NO passwords
  - Call `getAllKeys()` and inspect all values
  - Search for "password" in all stored content
  - Expected: ZERO password matches

- **✅ GREEN**: Password data cleared on logout
  - This is automatic since passwords were never stored
  - Expected: No password cleanup needed

#### Session Token Security
- **✅ GREEN**: Session tokens present in user object
  - Verify `sessionToken` property exists
  - Verify token is alphanumeric (not plain text)
  - Expected: Valid session token format

- **❌ RED**: Invalid session token (code 209) handled
  - Error code 209 detected and handled
  - Session invalidated immediately
  - Expected: Code 209 caught, `deleteData("currentUser")` called

- **✅ GREEN**: Session regeneration after 209 error
  - Old session with 209 error → deleted
  - New login → fresh session token obtained
  - Expected: New session token different from old one

#### Unauthorized Access Prevention
- **❌ RED**: Unauthenticated users blocked from API calls
  - `getData("currentUser")` returns null
  - Expected: Redirect to SignIn, no API access

- **❌ RED**: Requests without session token rejected
  - User object missing `sessionToken` property
  - Expected: Treated as unauthenticated

- **❌ RED**: Protected screens inaccessible without login
  - Navigation logic checks for authenticated user
  - Expected: Redirect to SignIn if not authenticated

- **✅ GREEN**: Session cleared immediately on logout
  - `deleteData("currentUser")` removes all auth
  - Expected: NO residual auth data; user must login again

#### Offline Mode Security
- **❌ RED**: Offline login not allowed (online-only)
  - Network unavailable, user attempts login
  - Expected: Login fails (no offline fallback)

- **✅ GREEN**: Offline logout allowed
  - Network down, user logs out
  - Expected: Local state cleared

- **✅ GREEN**: No persistence of auth across app reinstall
  - Simulate app deletion (AsyncStorage wiped)
  - Expected: `getData("currentUser")` returns null

#### Error Message Security
- **✅ GREEN**: Error messages don't expose internal details
  - Error to user: "Unable to sign in"
  - NOT: "Database connection failed" or server details
  - Expected: Generic, user-friendly error messages

- **✅ GREEN**: All error messages use i18n translation keys
  - Example: `signIn.invalidSessionToken`
  - NOT: Hard-coded English strings
  - Expected: Proper translation key format

#### Data Leakage Prevention
- **✅ GREEN**: Navigation params don't include sensitive data
  - Example: OK to pass `{ registered: true }`
  - NOT OK: `{ password: "...", sessionToken: "..." }`
  - Expected: Only safe, non-sensitive params

- **✅ GREEN**: Passwords/tokens not logged to console
  - Check console.log and console.error
  - Expected: No passwords or tokens in any logs

- **✅ GREEN**: Sensitive data not stored in Redux/Context
  - Auth state contains: user (safe fields), isLoading, error
  - NOT: password, sessionToken, phone
  - Expected: No sensitive data in shared state

#### Credential Validation
- **✅ GREEN**: Email format validated before sending
  - Valid regex test for email
  - Expected: Invalid emails rejected

- **✅ GREEN**: Password strength validated
  - E.g., min 8 chars, uppercase, number, special char
  - Expected: Weak passwords rejected

- **✅ GREEN**: Email input sanitized (trim, lowercase)
  - Remove spaces, prevent injection
  - Expected: Clean input sent to server

#### Session Invalidation on Security Events
- **✅ GREEN**: Session invalidated on logout
  - `deleteData("currentUser")` called
  - Expected: User must login again

- **✅ GREEN**: Session invalidated on error code 209
  - Automatic detection and clearing
  - Expected: User prompted to re-login

- **❌ RED**: Account locked after N failed login attempts
  - E.g., 3 failed attempts → temporary lock
  - Expected: Brute force attack prevented

### Running Security Tests

```bash
# Run all security tests
npm test -- auth.security.test.js

# Run specific security category
npm test -- auth.security.test.js -t "Password Storage Security"

# Run with coverage
npm test -- auth.security.test.js --coverage

# Watch mode
npm test -- auth.security.test.js --watch
```

### Expected Results

- All tests should **PASS** ✅
- Coverage >90% for security-sensitive code
- No passwords found in storage
- Unauthorized access properly blocked
- Session tokens properly managed

---

## RED ↔ GREEN Test Summary

### RED Tests (Currently Failing - These Verify Improvements)
These tests verify that the OLD broken system is fixed:

| Issue | Red Test | Expected Outcome |
|-------|----------|------------------|
| Plain text passwords stored | `grep AsyncStorage for "password"` | ✅ ZERO matches (fixed) |
| Email/SMS selector required | Check SignUp UI for buttons | ✅ Buttons don't exist (fixed) |
| Offline login with password | Try offline login | ❌ LOGIN FAILS (as intended) |
| Session expiry not handled | Receive code 209 error | ✅ Handled gracefully (fixed) |
| No password reset UX | Check i18n for translation | ✅ Uses i18n (fixed) |

### GREEN Tests (Currently Passing - These Maintain Good Behavior)
These tests verify the NEW system works correctly:

| Feature | Green Test | Expected Outcome |
|---------|------------|-----------------|
| Signup without confirmation | Complete signup flow | ✅ Dashboard immediately visible |
| Session persistence | Close/reopen app | ✅ Already logged in |
| Logout works | Click logout | ✅ Returns to SignIn |
| Password not stored | Inspect AsyncStorage | ✅ No passwords found |
| Login works | Valid credentials | ✅ Logged in successfully |

---

## Running All Tests

```bash
# Run entire test suite
npm test

# Run with coverage report
npm test -- --coverage

# Run 4 test types in order
npm test -- auth.unit.test.js
npm test -- auth.integration.test.js
# (Run E2E on device manually)
npm test -- auth.security.test.js

# Generate coverage badge
npm test -- --coverage --coverageReporters=text-summary
```

### Expected Coverage

```
Statements   : 92.3% (✅ >90%)
Branches     : 88.7% (✅ >85%)
Functions    : 94.1% (✅ >90%)
Lines        : 92.8% (✅ >90%)
```

---

## Test Checklist

Before marking implementation complete, verify:

### Phase 1: Unit Tests
- [ ] All `register()`, `onlineLogin()`, `onLogout()` functions tested
- [ ] Password storage verified NOT happening
- [ ] Session token management verified
- [ ] Error code 209 detection tested
- [ ] Coverage >90%

### Phase 2: Integration Tests
- [ ] Full signup→login→logout flow works
- [ ] Session persists across app restart mock
- [ ] Multi-user switching has no data leakage
- [ ] Password security verified end-to-end
- [ ] All form fields correct (6 fields, no notificationType)

### Phase 3: E2E Tests
- [ ] Real device/simulator signup without confirmation
- [ ] Dashboard visible within 3 seconds of signup
- [ ] App restart maintains session
- [ ] Logout and re-login works
- [ ] No old UI elements visible

### Phase 4: Security Tests
- [ ] AsyncStorage inspection: ZERO password matches
- [ ] Unauthorized access blocked
- [ ] Session tokens properly managed
- [ ] Offline login fails (online-only)
- [ ] Error messages use i18n
- [ ] No data leakage in navigation params

---

## Continuous Integration

Add to CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Auth Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test -- --coverage
      - run: npm test -- auth.security.test.js
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## Rollback Plan

If issues found in production:

1. **Issue**: Passwords in logs
   - Rollback: Revert to v1 (old system) 
   - Quick fix: Remove all logging of credentials
   - Re-deploy: v1.1

2. **Issue**: Session errors (code 209) not handled
   - Rollback: Revert to v1
   - Quick fix: Add global 209 error handler
   - Re-deploy: v1.2

3. **Issue**: Unauthorized access possible
   - Rollback: Revert to v1 immediately
   - Audit: Check for security implications
   - Fix: Add request validation
   - Re-deploy: v2.0 (with security audit)

---

## Success Criteria

✅ All tests pass (Unit, Integration, E2E, Security)
✅ Coverage >90% for auth functions
✅ NO passwords in AsyncStorage
✅ NO old email/SMS confirmation UI
✅ Session persists across app restart
✅ Error code 209 handled gracefully
✅ New users can signup and login immediately
✅ i18n translations complete (3 locales)
✅ Security scan shows no password storage issues
✅ Production monitoring shows no 209 errors (or handled correctly)

