# Testing Documentation

## Test Strategy

This document describes the testing strategy, frameworks, and test cases for the JiffyJobs application.

### Testing Frameworks

**Backend:**
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library for API testing
- **ts-jest**: TypeScript preprocessor for Jest

**Frontend:**
- **Vitest**: Fast unit test framework powered by Vite
- **React Testing Library**: React component testing utilities
- **jsdom**: DOM implementation for Node.js

### Test Coverage Goals

- **Target Coverage**: 70% for critical paths
- **Focus Areas**: 
  - Authentication and authorization
  - Payment processing
  - Bid management
  - Task operations
  - Admin functionality

### Running Tests

#### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

#### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in UI mode
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Cases

### Backend Test Cases

#### 1. Authentication API (`auth.test.ts`)

**Test Suite: POST /api/auth/signup**
- ✅ Create new user with valid data
- ✅ Return 400 for duplicate email
- ✅ Return 400 for invalid email format

**Test Suite: POST /api/auth/login**
- ✅ Login with valid credentials
- ✅ Return 401 for invalid credentials
- ✅ Return 400 for missing email

**Test Oracle:** 
- Success: Status 200/201, contains token and user object
- Failure: Status 400/401, error message present

#### 2. Bid API (`bid.test.ts`)

**Test Suite: POST /api/bids**
- ✅ Place bid on open task
- ✅ Return 400 for invalid amount
- ✅ Return 404 for non-existent task

**Test Suite: GET /api/bids/my-bids**
- ✅ Return user bids

**Test Oracle:**
- Success: Status 201, bid created with correct properties
- Failure: Status 400/404, appropriate error message

#### 3. Task API (`task.test.ts`)

**Test Suite: POST /api/tasks**
- ✅ Create new task
- ✅ Return 400 for missing required fields

**Test Suite: GET /api/tasks/my-tasks**
- ✅ Return user tasks

**Test Oracle:**
- Success: Status 201, task created with all fields
- Failure: Status 400, validation error message

#### 4. Payment API (`payment.test.ts`)

**Test Suite: POST /api/payments/create-payment-intent**
- ✅ Create payment intent for contract
- ✅ Return 404 for non-existent contract

**Test Oracle:**
- Success: Status 200, clientSecret and paymentIntentId present
- Failure: Status 404, contract not found error

#### 5. Admin API (`admin.test.ts`)

**Test Suite: POST /api/admin/users/:userId/suspend**
- ✅ Suspend user as admin
- ✅ Return 403 for non-admin user
- ✅ Return 404 for non-existent user

**Test Suite: GET /api/admin/reports**
- ✅ Return reports as admin
- ✅ Return 403 for non-admin user

**Test Oracle:**
- Success: Status 200, user suspended or reports returned
- Failure: Status 403/404, appropriate error message

### Frontend Test Cases

#### 1. LoginForm Component (`LoginForm.test.tsx`)

**Test Cases:**
- ✅ Render login form with email and password fields
- ✅ Display validation error for invalid email
- ✅ Display validation error for empty password

**Test Oracle:**
- Success: Form renders correctly, validation works
- Failure: Error messages displayed appropriately

## Coverage Analysis

### Backend Coverage

To generate coverage report:

```bash
cd backend
npm run test:coverage
```

Coverage report will be generated in `backend/coverage/` directory.

**Current Coverage:**
- Services: ~75% (target)
- Controllers: ~70% (target)
- Middleware: ~80% (target)
- Overall: ~72% (target)

### Frontend Coverage

To generate coverage report:

```bash
cd frontend
npm run test:coverage
```

Coverage report will be generated in `frontend/coverage/` directory.

## Test Configuration

### Jest Configuration (`backend/jest.config.js`)

- Test environment: Node.js
- Coverage reporters: text, lcov, html
- Test match pattern: `**/__tests__/**/*.test.ts`
- Setup file: `src/__tests__/setup.ts`

### Vitest Configuration (`frontend/vitest.config.ts`)

- Test environment: jsdom
- Coverage provider: v8
- Setup file: `src/__tests__/setup.ts`

## Test Data Management

### Setup and Teardown

Each test suite includes:
- `beforeAll`: Set up test data and authentication
- `afterAll`: Clean up test data and disconnect database

### Mocking

External services are mocked in `backend/src/__tests__/setup.ts`:
- Email service (Resend)
- Upload service (AWS S3)
- Stripe API

## Continuous Integration

Tests run automatically on:
- Pull requests to `development` or `main`
- Pushes to `development` or `main`

See `.github/workflows/backend-ci.yml` and `.github/workflows/frontend-ci.yml` for CI configuration.

## Future Improvements

1. **E2E Testing**: Add Cypress or Playwright for end-to-end tests
2. **Performance Testing**: Add load testing for critical endpoints
3. **Integration Tests**: Expand integration test coverage
4. **Visual Regression**: Add visual regression testing for UI components

