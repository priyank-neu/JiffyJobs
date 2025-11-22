# Test Case Encoding and Test Oracles

This document describes how test cases are encoded using suitable testing frameworks and provides test oracles (expected outcomes) for each test case.

## Testing Frameworks

### Backend Testing
- **Framework:** Jest with Supertest
- **Language:** TypeScript/Node.js
- **Test Files Location:** `backend/src/__tests__/`
- **Configuration:** `backend/jest.config.js`

### Frontend Testing
- **Framework:** Vitest with React Testing Library
- **Language:** TypeScript/React
- **Test Files Location:** `frontend/src/__tests__/`
- **Configuration:** `frontend/vitest.config.ts`

---

## Backend Test Cases

### Test Suite 1: Authentication API Tests

**File:** [`backend/src/__tests__/auth.test.ts`](../backend/src/__tests__/auth.test.ts)

**Framework:** Jest with Supertest

#### Test Case 1.1: User Signup with Valid Data

**Code:**
```typescript
it('should create a new user with valid data', async () => {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    });

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('token');
  expect(response.body).toHaveProperty('user');
  expect(response.body.user.email).toBe('newuser@example.com');
  expect(response.body.user).not.toHaveProperty('passwordHash');
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 201 (Created)
  - Response body contains `token` property (JWT token string)
  - Response body contains `user` object
  - `user.email` matches input email ('newuser@example.com')
  - `user` object does NOT contain `passwordHash` (security requirement)
- **Failure Indicators:**
  - Status code ≠ 201 (could be 400, 409, 500)
  - Missing `token` or `user` properties
  - `passwordHash` exposed in response

#### Test Case 1.2: Duplicate Email Signup

**Code:**
```typescript
it('should return 400 for duplicate email', async () => {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'test@example.com',
      password: 'password123',
      name: 'Duplicate User',
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toContain('already exists');
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 400 (Bad Request)
  - Error message contains 'already exists'
- **Failure Indicators:**
  - Status code ≠ 400 (should not create duplicate user)
  - Missing error message or incorrect message

#### Test Case 1.3: Invalid Email Format

**Code:**
```typescript
it('should return 400 for invalid email format', async () => {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'invalid-email',
      password: 'password123',
      name: 'Invalid User',
    });

  expect(response.status).toBe(400);
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 400 (Bad Request)
  - Request rejected due to invalid email format
- **Failure Indicators:**
  - Status code = 201 (should not accept invalid email)
  - User created with invalid email

#### Test Case 1.4: Login with Valid Credentials

**Code:**
```typescript
it('should login with valid credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123',
    });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('token');
  expect(response.body).toHaveProperty('user');
  expect(response.body.user.email).toBe('test@example.com');
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 200 (OK)
  - Response contains valid JWT `token`
  - Response contains `user` object with matching email
- **Failure Indicators:**
  - Status code = 401 (Unauthorized) when credentials are valid
  - Missing token or user data

#### Test Case 1.5: Login with Invalid Credentials

**Code:**
```typescript
it('should return 401 for invalid credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

  expect(response.status).toBe(401);
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 401 (Unauthorized)
  - No token or user data returned
- **Failure Indicators:**
  - Status code = 200 (should not authenticate with wrong password)
  - Token returned for invalid credentials

---

### Test Suite 2: Bid API Tests

**File:** [`backend/src/__tests__/bid.test.ts`](../backend/src/__tests__/bid.test.ts)

#### Test Case 2.1: Place Bid on Open Task

**Code:**
```typescript
it('should place a bid on an open task', async () => {
  const response = await request(app)
    .post('/api/bids')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      taskId: task.taskId,
      amount: 50.00,
      note: 'I can help with this task',
    });

  expect(response.status).toBe(201);
  expect(response.body.bid).toHaveProperty('bidId');
  expect(response.body.bid.amount).toBe(50.00);
  expect(response.body.bid.status).toBe('PENDING');
  expect(response.body.bid.note).toBe('I can help with this task');
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 201 (Created)
  - Response contains `bid` object with `bidId`
  - `bid.amount` matches input (50.00)
  - `bid.status` = 'PENDING'
  - `bid.note` matches input
- **Failure Indicators:**
  - Status code ≠ 201 (could be 400, 404, 401)
  - Bid not created or missing required fields
  - Incorrect bid status or amount

#### Test Case 2.2: Invalid Bid Amount

**Code:**
```typescript
it('should return 400 for invalid amount', async () => {
  const response = await request(app)
    .post('/api/bids')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      taskId: task.taskId,
      amount: -10,
      note: 'Invalid bid',
    });

  expect(response.status).toBe(400);
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 400 (Bad Request)
  - Request rejected due to negative amount
- **Failure Indicators:**
  - Status code = 201 (should not accept negative amounts)
  - Bid created with invalid amount

#### Test Case 2.3: Bid on Non-existent Task

**Code:**
```typescript
it('should return 404 for non-existent task', async () => {
  const response = await request(app)
    .post('/api/bids')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      taskId: 'non-existent-id',
      amount: 50.00,
    });

  expect(response.status).toBe(404);
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 404 (Not Found)
  - Error indicates task not found
- **Failure Indicators:**
  - Status code = 201 (should not create bid for non-existent task)
  - Bid created for invalid task ID

---

### Test Suite 3: Task API Tests

**File:** [`backend/src/__tests__/task.test.ts`](../backend/src/__tests__/task.test.ts)

#### Test Case 3.1: Create Task with Valid Data

**Code:**
```typescript
it('should create a new task', async () => {
  const response = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      title: 'Test Task',
      description: 'Test task description',
      budget: 100.00,
      category: 'CLEANING',
      location: {
        latitude: 42.3398,
        longitude: -71.0892,
        address: '123 Test St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02115',
      },
    });

  expect(response.status).toBe(201);
  expect(response.body.task).toHaveProperty('taskId');
  expect(response.body.task.title).toBe('Test Task');
  expect(response.body.task.status).toBe('OPEN');
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 201 (Created)
  - Response contains `task` object with `taskId`
  - `task.title` matches input
  - `task.status` = 'OPEN' (default status)
- **Failure Indicators:**
  - Status code ≠ 201 (could be 400, 401, 500)
  - Task not created or missing required fields
  - Incorrect task status or title

#### Test Case 3.2: Create Task with Missing Fields

**Code:**
```typescript
it('should return 400 for missing required fields', async () => {
  const response = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      title: 'Incomplete Task',
      // Missing description, budget, etc.
    });

  expect(response.status).toBe(400);
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 400 (Bad Request)
  - Request rejected due to missing required fields
- **Failure Indicators:**
  - Status code = 201 (should not create incomplete task)
  - Task created with missing required data

---

### Test Suite 4: Payment API Tests

**File:** [`backend/src/__tests__/payment.test.ts`](../backend/src/__tests__/payment.test.ts)

#### Test Case 4.1: Create Payment Intent

**Code:**
```typescript
it('should create payment intent for contract', async () => {
  const response = await request(app)
    .post('/api/payments/create-payment-intent')
    .set('Authorization', `Bearer ${posterToken}`)
    .send({
      contractId: contract.contractId,
    });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('clientSecret');
  expect(response.body).toHaveProperty('paymentIntentId');
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 200 (OK)
  - Response contains `clientSecret` (for Stripe 3DS authentication)
  - Response contains `paymentIntentId` (Stripe payment intent identifier)
- **Failure Indicators:**
  - Status code ≠ 200 (could be 404, 400, 500)
  - Missing `clientSecret` or `paymentIntentId`
  - Payment intent not created in Stripe

---

### Test Suite 5: Admin API Tests

**File:** [`backend/src/__tests__/admin.test.ts`](../backend/src/__tests__/admin.test.ts)

#### Test Case 5.1: Suspend User as Admin

**Code:**
```typescript
it('should suspend user as admin', async () => {
  const response = await request(app)
    .post(`/api/admin/users/${regularUser.userId}/suspend`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      reason: 'Violation of terms',
    });

  expect(response.status).toBe(200);
  expect(response.body.message).toContain('suspended');
  
  // Verify user is suspended
  const updatedUser = await prisma.user.findUnique({
    where: { userId: regularUser.userId },
  });
  expect(updatedUser?.accountStatus).toBe(AccountStatus.SUSPENDED);
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 200 (OK)
  - Response message contains 'suspended'
  - Database verification: `user.accountStatus` = 'SUSPENDED'
- **Failure Indicators:**
  - Status code ≠ 200 (could be 403, 404, 500)
  - User account status not updated in database
  - Suspension reason not recorded

#### Test Case 5.2: Non-Admin Cannot Suspend User

**Code:**
```typescript
it('should return 403 for non-admin user', async () => {
  const response = await request(app)
    .post(`/api/admin/users/${regularUser.userId}/suspend`)
    .set('Authorization', `Bearer ${regularToken}`)
    .send({
      reason: 'Test',
    });

  expect(response.status).toBe(403);
});
```

**Test Oracle:**
- **Success Indicators:**
  - HTTP status code = 403 (Forbidden)
  - Request rejected due to insufficient permissions
- **Failure Indicators:**
  - Status code = 200 (should not allow non-admin to suspend users)
  - User suspended by non-admin user

---

## Frontend Test Cases

### Test Suite 6: LoginForm Component Tests

**File:** [`frontend/src/__tests__/LoginForm.test.tsx`](../frontend/src/__tests__/LoginForm.test.tsx)

**Framework:** Vitest with React Testing Library

#### Test Case 6.1: Render Login Form

**Code:**
```typescript
it('should render login form with email and password fields', () => {
  renderLoginForm();
  
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
```

**Test Oracle:**
- **Success Indicators:**
  - Email input field is rendered and accessible by label
  - Password input field is rendered and accessible by label
  - Submit button with "Sign In" text is rendered
- **Failure Indicators:**
  - Missing email or password input fields
  - Submit button not found or incorrect text
  - Form not rendered at all

#### Test Case 6.2: Display Validation Error for Invalid Email

**Code:**
```typescript
it('should display validation error for invalid email', async () => {
  const user = userEvent.setup();
  renderLoginForm();
  
  const emailInput = screen.getByLabelText(/email/i);
  const submitButton = screen.getByRole('button', { name: /sign in/i });
  
  await user.type(emailInput, 'invalid-email');
  await user.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

**Test Oracle:**
- **Success Indicators:**
  - Validation error message "Invalid email" appears after form submission
  - Error message is visible in the DOM
  - Form does not submit with invalid email
- **Failure Indicators:**
  - No error message displayed for invalid email
  - Form submits with invalid email format
  - Error message appears before user interaction

#### Test Case 6.3: Display Validation Error for Empty Password

**Code:**
```typescript
it('should display validation error for empty password', async () => {
  const user = userEvent.setup();
  renderLoginForm();
  
  const emailInput = screen.getByLabelText(/email/i);
  const submitButton = screen.getByRole('button', { name: /sign in/i });
  
  await user.type(emailInput, 'test@example.com');
  await user.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});
```

**Test Oracle:**
- **Success Indicators:**
  - Validation error message "Password is required" appears after form submission
  - Error message is visible in the DOM
  - Form does not submit with empty password
- **Failure Indicators:**
  - No error message displayed for empty password
  - Form submits with empty password field
  - Error message text does not match expected message

---

## Test Framework Configuration

### Backend (Jest)

**Configuration File:** [`backend/jest.config.js`](../backend/jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
};
```

**Key Features:**
- TypeScript support via `ts-jest` preset
- Node.js test environment
- 30-second timeout for async operations
- Automatic test file discovery in `__tests__` directories

### Frontend (Vitest)

**Configuration File:** [`frontend/vitest.config.ts`](../frontend/vitest.config.ts)

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    watch: false,
    pool: 'threads',
  },
});
```

**Key Features:**
- jsdom environment for DOM testing
- React component testing support
- Multi-threaded test execution
- TypeScript and JSX support

---

## Test Execution

### Running Backend Tests

```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report
```

### Running Frontend Tests

```bash
cd frontend
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report
```

---

## Test Oracle Summary

| Test Suite | Test Case | Expected Success | Expected Failure |
|------------|-----------|------------------|------------------|
| Auth API | Signup Valid | 201, token & user returned | Any other status, missing fields |
| Auth API | Duplicate Email | 400, error message | 201 (duplicate created) |
| Auth API | Invalid Email | 400 | 201 (invalid email accepted) |
| Auth API | Login Valid | 200, token returned | 401 with valid creds |
| Auth API | Login Invalid | 401 | 200 with wrong password |
| Bid API | Place Bid | 201, bid created | 400/404, bid not created |
| Bid API | Invalid Amount | 400 | 201 (negative amount accepted) |
| Bid API | Non-existent Task | 404 | 201 (bid on invalid task) |
| Task API | Create Task | 201, task with OPEN status | 400, task not created |
| Task API | Missing Fields | 400 | 201 (incomplete task created) |
| Payment API | Create Intent | 200, clientSecret & paymentIntentId | 404/400, missing fields |
| Admin API | Suspend User | 200, status=SUSPENDED in DB | 403/404, status not updated |
| Admin API | Non-Admin Suspend | 403 | 200 (non-admin succeeded) |
| LoginForm | Render Form | All fields visible | Missing fields |
| LoginForm | Invalid Email | Error message shown | No error, form submits |
| LoginForm | Empty Password | Error message shown | No error, form submits |

---

## Code Links to Test Files

All test files are located in the repository:

- Backend Tests:
  - [`backend/src/__tests__/auth.test.ts`](../backend/src/__tests__/auth.test.ts)
  - [`backend/src/__tests__/bid.test.ts`](../backend/src/__tests__/bid.test.ts)
  - [`backend/src/__tests__/task.test.ts`](../backend/src/__tests__/task.test.ts)
  - [`backend/src/__tests__/payment.test.ts`](../backend/src/__tests__/payment.test.ts)
  - [`backend/src/__tests__/admin.test.ts`](../backend/src/__tests__/admin.test.ts)

- Frontend Tests:
  - [`frontend/src/__tests__/LoginForm.test.tsx`](../frontend/src/__tests__/LoginForm.test.tsx)

- Configuration Files:
  - [`backend/jest.config.js`](../backend/jest.config.js)
  - [`frontend/vitest.config.ts`](../frontend/vitest.config.ts)
  - [`backend/src/__tests__/helpers.ts`](../backend/src/__tests__/helpers.ts)
  - [`frontend/src/__tests__/setup.ts`](../frontend/src/__tests__/setup.ts)

---

## Test Coverage

Test coverage reports are generated using:
- **Backend:** Jest coverage with `--coverage` flag
- **Frontend:** Vitest coverage with `v8` provider

Coverage reports include:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

Generate coverage reports:
```bash
# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage
```

