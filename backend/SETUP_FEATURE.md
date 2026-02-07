# First-Time Setup Feature

## Overview

The FortuneCampus application now includes a secure first-time setup flow that allows creating the initial admin/CEO user when the system is deployed with a fresh database.

## How It Works

### 🔒 Security Model

1. **Fresh Installation Detection**
   - System checks if ANY users exist in the database
   - If no users exist → Setup is required
   - If users exist → Setup is locked

2. **One-Time Setup**
   - Only works when database has ZERO users
   - Creates the first user with CEO role
   - After first user is created, setup route is permanently disabled
   - Returns 403 Forbidden if users already exist

3. **No Authentication Required**
   - Setup endpoints are intentionally NOT protected by JWT
   - They internally validate the user count
   - This allows initial admin creation without existing credentials

## API Endpoints

### 1. Check Setup Status

```http
GET /api/setup/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "setupRequired": true
  },
  "message": "Setup status retrieved successfully"
}
```

**Logic:**
- `setupRequired: true` → No users exist, setup needed
- `setupRequired: false` → Users exist, setup completed

### 2. Initialize Setup

```http
POST /api/setup/initialize
```

**Request Body:**
```json
{
  "email": "admin@fortunecampus.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx...",
      "email": "admin@fortunecampus.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CEO",
      "branchId": null
    }
  },
  "message": "Admin account created successfully"
}
```

**Error Response (403) - Setup Already Completed:**
```json
{
  "success": false,
  "message": "Setup has already been completed. Please use the login page."
}
```

**Error Response (400) - Validation Failed:**
```json
{
  "success": false,
  "message": "Password must be at least 6 characters long"
}
```

## Frontend Flow

### User Experience

1. **App Loads**
   - `SetupGuard` component checks `/api/setup/status`
   - Shows loading spinner during check

2. **Setup Required**
   - If `setupRequired: true` → Redirects to `/setup`
   - Shows professional setup screen
   - Collects admin details

3. **Setup Complete**
   - If `setupRequired: false` → Redirects to `/login`
   - User must use normal login flow

4. **After Setup**
   - User creates admin account
   - Automatically logged in with JWT
   - Redirected to CEO dashboard

### Setup Page Features

- ✅ Clean, professional UI matching app theme
- ✅ Form validation (email, password match, minimum length)
- ✅ Loading states during API calls
- ✅ Error handling with user-friendly messages
- ✅ Auto-login after successful setup
- ✅ Responsive design

## File Structure

### Backend

```
backend/src/modules/setup/
├── setup.controller.ts   # Business logic for setup
└── setup.routes.ts       # Route definitions (no auth)
```

### Frontend

```
frontend/src/
├── pages/Setup.tsx              # Setup page component
├── components/SetupGuard.tsx    # Setup detection wrapper
└── lib/api.ts                   # API service functions
```

## Validation Rules

### Backend Validation

- ✅ All fields required (email, password, firstName, lastName)
- ✅ Email format validation (regex)
- ✅ Password minimum 6 characters
- ✅ User count check (must be 0)
- ✅ Password hashing with bcrypt
- ✅ Duplicate email prevention

### Frontend Validation

- ✅ All fields required
- ✅ Email format validation
- ✅ Password minimum 6 characters
- ✅ Password confirmation match
- ✅ Real-time error feedback

## Security Considerations

### ✅ Protected Against

1. **Multiple Admin Creation**
   - After first user, endpoint returns 403
   - Cannot create more admins via setup

2. **Unauthorized Access**
   - Setup page auto-redirects if setup already complete
   - Backend validates user count on every request

3. **Password Security**
   - Passwords hashed with bcrypt (10 rounds)
   - Never stored in plain text
   - Never returned in API responses

4. **SQL Injection**
   - Protected by Prisma ORM
   - Parameterized queries only

### ⚠️ Important Notes

- Setup endpoints intentionally bypass JWT authentication
- This is secure because they check user count internally
- Once first user exists, endpoints are locked

## Testing the Feature

### Test Case 1: Fresh Database

```bash
# 1. Reset database
npm run prisma:reset

# 2. Start backend
npm run dev

# 3. Check setup status
curl http://localhost:5000/api/setup/status
# Expected: { "setupRequired": true }

# 4. Create admin
curl -X POST http://localhost:5000/api/setup/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123",
    "firstName": "Test",
    "lastName": "Admin"
  }'
# Expected: Success with JWT token

# 5. Check setup status again
curl http://localhost:5000/api/setup/status
# Expected: { "setupRequired": false }

# 6. Try to create another admin
curl -X POST http://localhost:5000/api/setup/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "email": "another@test.com",
    "password": "Admin123",
    "firstName": "Another",
    "lastName": "Admin"
  }'
# Expected: 403 Forbidden
```

### Test Case 2: Existing Users

```bash
# 1. Run seed script
npm run prisma:seed

# 2. Check setup status
curl http://localhost:5000/api/setup/status
# Expected: { "setupRequired": false }

# 3. Try to access setup
curl -X POST http://localhost:5000/api/setup/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test123",
    "firstName": "Test",
    "lastName": "User"
  }'
# Expected: 403 Forbidden
```

## Environment Variables

No additional environment variables required. The feature uses existing configuration:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
```

## Production Deployment Checklist

Before deploying to production:

- [ ] Set strong JWT_SECRET in environment
- [ ] Enable HTTPS/SSL
- [ ] Set CORS origin to production domain
- [ ] Test setup flow on staging environment
- [ ] Verify setup locks after first user
- [ ] Document admin credentials securely
- [ ] Consider adding email verification
- [ ] Add rate limiting to setup endpoints

## Troubleshooting

### Issue: Setup page keeps redirecting

**Cause:** Frontend can't reach backend API

**Solution:**
- Check backend is running on correct port
- Verify VITE_API_URL in frontend .env
- Check CORS configuration

### Issue: "Setup already completed" on fresh database

**Cause:** Database has existing users (possibly from seed)

**Solution:**
```bash
npm run prisma:reset
```

### Issue: Token not working after setup

**Cause:** JWT_SECRET mismatch or token storage issue

**Solution:**
- Verify JWT_SECRET is set in backend .env
- Check browser localStorage for auth_token
- Clear browser cache and try again

## Future Enhancements

Potential improvements for future versions:

- [ ] Email verification for admin account
- [ ] Multi-step setup wizard (branch creation, etc.)
- [ ] Setup completion notification via email
- [ ] Audit log for setup events
- [ ] CAPTCHA on setup page
- [ ] Rate limiting (prevent brute force)
- [ ] Setup expiration (time-limited setup window)

---

**Created:** February 2026  
**Status:** ✅ Production Ready
