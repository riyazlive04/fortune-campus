# Fortune Campus Backend API

Complete backend implementation for Fortune Campus - Educational Institution Management System.

## 🏗️ Architecture Overview

- **Framework**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL (Supabase - DB Only)
- **ORM**: Prisma
- **Authentication**: JWT (Custom - No Supabase Auth)
- **WhatsApp**: Evolution API Integration

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Supabase account)
- Evolution API instance for WhatsApp integration

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Evolution API
EVOLUTION_API_URL=https://your-evolution-api-url.com
EVOLUTION_API_KEY=your-evolution-api-key
EVOLUTION_INSTANCE_NAME=fortunecampus

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

### 3. Supabase Database Setup

1. Create a project on [Supabase](https://supabase.com)
2. Go to **Settings > Database**
3. Copy the **Connection String** (URI format)
4. Replace `[YOUR-PASSWORD]` with your actual database password
5. Paste into `DATABASE_URL` in `.env`

**Important**: We only use Supabase as a PostgreSQL database host. We do NOT use:
- ❌ Supabase Auth
- ❌ Supabase Client SDK
- ❌ Supabase Storage
- ✅ Only PostgreSQL Database

### 4. Database Migration & Seed

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data
npm run prisma:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### 6. Test API

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Fortune Campus API is running",
  "timestamp": "2024-..."
}
```

## 🔐 Default Credentials (After Seed)

| Role | Email | Password |
|------|-------|----------|
| CEO | ceo@fortunecampus.com | Admin@123 |
| Branch Head | head.main@fortunecampus.com | Admin@123 |
| Trainer | trainer1@fortunecampus.com | Admin@123 |
| Student | vikram.reddy@student.fortunecampus.com | Student@123 |

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected routes require JWT token in header:
```
Authorization: Bearer <token>
```

### Response Format

All responses follow this structure:
```typescript
{
  success: boolean,
  data?: any,
  message?: string
}
```

### Core Endpoints

#### Authentication
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login & get JWT token
GET    /api/auth/me           - Get current user (protected)
```

#### Users
```
GET    /api/users             - List users (Branch Head+)
GET    /api/users/:id         - Get user by ID
PUT    /api/users/:id         - Update user
DELETE /api/users/:id         - Delete user
```

#### Branches
```
GET    /api/branches          - List branches
GET    /api/branches/:id      - Get branch by ID
POST   /api/branches          - Create branch (CEO only)
PUT    /api/branches/:id      - Update branch (CEO only)
DELETE /api/branches/:id      - Delete branch (CEO only)
```

#### Leads
```
GET    /api/leads             - List leads (with pagination)
GET    /api/leads/:id         - Get lead details
POST   /api/leads             - Create new lead
PUT    /api/leads/:id         - Update lead
DELETE /api/leads/:id         - Delete lead
POST   /api/leads/:id/convert - Convert lead to admission
```

#### Admissions
```
GET    /api/admissions        - List admissions
GET    /api/admissions/:id    - Get admission details
POST   /api/admissions        - Create admission
PUT    /api/admissions/:id    - Update admission
DELETE /api/admissions/:id    - Delete admission (Branch Head+)
POST   /api/admissions/:id/approve - Approve admission (Branch Head+)
```

#### Students
```
GET    /api/students          - List students
GET    /api/students/:id      - Get student details
POST   /api/students          - Create student from admission
PUT    /api/students/:id      - Update student
DELETE /api/students/:id      - Delete student
```

#### Trainers
```
GET    /api/trainers          - List trainers
GET    /api/trainers/:id      - Get trainer details
POST   /api/trainers          - Create trainer (Branch Head+)
PUT    /api/trainers/:id      - Update trainer
DELETE /api/trainers/:id      - Delete trainer
```

#### Courses
```
GET    /api/courses           - List courses
GET    /api/courses/:id       - Get course details
POST   /api/courses           - Create course (Branch Head+)
PUT    /api/courses/:id       - Update course
DELETE /api/courses/:id       - Delete course
POST   /api/courses/:id/trainers - Assign trainer to course
DELETE /api/courses/:id/trainers/:trainerId - Remove trainer
```

#### Attendance
```
GET    /api/attendance        - List attendance records
GET    /api/attendance/:id    - Get attendance details
POST   /api/attendance        - Mark single attendance (Trainer+)
POST   /api/attendance/bulk   - Mark bulk attendance (Trainer+)
PUT    /api/attendance/:id    - Update attendance
DELETE /api/attendance/:id    - Delete attendance
```

#### Portfolios
```
GET    /api/portfolios        - List portfolios
GET    /api/portfolios/:id    - Get portfolio details
POST   /api/portfolios        - Create portfolio
PUT    /api/portfolios/:id    - Update portfolio
DELETE /api/portfolios/:id    - Delete portfolio
POST   /api/portfolios/:id/verify - Verify portfolio (Trainer+)
```

#### Placements
```
GET    /api/placements        - List placements
GET    /api/placements/:id    - Get placement details
POST   /api/placements        - Create placement (Trainer+)
PUT    /api/placements/:id    - Update placement
DELETE /api/placements/:id    - Delete placement
PATCH  /api/placements/:id/status - Update placement status
```

#### Companies
```
GET    /api/companies         - List companies
GET    /api/companies/:id     - Get company details
POST   /api/companies         - Create company (Branch Head+)
PUT    /api/companies/:id     - Update company
DELETE /api/companies/:id     - Delete company
```

#### Incentives
```
GET    /api/incentives        - List incentives
GET    /api/incentives/:id    - Get incentive details
POST   /api/incentives        - Create incentive (Branch Head+)
PUT    /api/incentives/:id    - Update incentive
DELETE /api/incentives/:id    - Delete incentive
PATCH  /api/incentives/:id/paid - Mark incentive as paid
```

#### Reports
```
GET    /api/reports/branch        - Branch-wise report
GET    /api/reports/trainer       - Trainer performance report
GET    /api/reports/admissions    - Admissions analytics
GET    /api/reports/placements    - Placement statistics
GET    /api/reports/revenue       - Revenue report
```

### Query Parameters (Common)

Most list endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term
- `branchId` - Filter by branch (CEO only)

Example:
```
GET /api/students?page=1&limit=20&search=john&branchId=xxx
```

## 🔒 Role-Based Access Control

### User Roles
1. **CEO** - Full system access
2. **BRANCH_HEAD** - Branch-level management
3. **TRAINER** - Course & student management
4. **STUDENT** - Limited access (own data)

### Permission Matrix

| Feature | CEO | Branch Head | Trainer | Student |
|---------|-----|-------------|---------|---------|
| View All Branches | ✅ | ❌ | ❌ | ❌ |
| Manage Branches | ✅ | ❌ | ❌ | ❌ |
| View Branch Data | ✅ | ✅ (own) | ✅ (own) | ✅ (own) |
| Manage Users | ✅ | ✅ (own branch) | ❌ | ❌ |
| Manage Leads | ✅ | ✅ | ✅ | ❌ |
| Manage Admissions | ✅ | ✅ | ✅ | ❌ |
| Manage Courses | ✅ | ✅ | ❌ | ❌ |
| Mark Attendance | ✅ | ✅ | ✅ | ❌ |
| Manage Placements | ✅ | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ (own branch) | ✅ (own branch) | ❌ |

## 📊 Database Schema

### Core Entities
- **User** - System users (all roles)
- **Branch** - Physical branches
- **Lead** - Prospective students
- **Admission** - Enrolled students
- **Student** - Active students
- **Trainer** - Teaching staff
- **Course** - Available courses
- **Attendance** - Daily attendance
- **Portfolio** - Student projects
- **Placement** - Job placements
- **Company** - Hiring companies
- **Incentive** - Performance incentives
- **WhatsAppLog** - Message history

## 📱 WhatsApp Integration

The system uses Evolution API for WhatsApp messaging.

### Setup Evolution API

1. Deploy Evolution API instance (see [Evolution API Docs](https://github.com/EvolutionAPI/evolution-api))
2. Create an instance
3. Connect WhatsApp via QR code
4. Update `.env` with credentials

### Automated Messages

The system automatically sends WhatsApp messages for:
- 🎯 New lead created
- 📞 Follow-up reminders
- 🎉 Admission confirmation
- 📝 Custom notifications

Messages are logged in the `whatsapp_logs` table.

## 🛠️ Development

### Project Structure
```
backend/
├── src/
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── users/        # User management
│   │   ├── branches/     # Branch management
│   │   ├── leads/        # Lead management
│   │   ├── admissions/   # Admission management
│   │   ├── students/     # Student management
│   │   ├── trainers/     # Trainer management
│   │   ├── courses/      # Course management
│   │   ├── attendance/   # Attendance tracking
│   │   ├── portfolio/    # Portfolio management
│   │   ├── placements/   # Placement tracking
│   │   ├── incentives/   # Incentive management
│   │   └── reports/      # Analytics & reports
│   ├── services/         # Business logic services
│   ├── middlewares/      # Express middlewares
│   ├── utils/            # Utility functions
│   ├── config/           # Configuration
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── package.json
├── tsconfig.json
└── .env
```

### Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm start             # Start production server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database
npm run prisma:studio    # Open Prisma Studio
npm run prisma:reset     # Reset database (WARNING: deletes all data)
```

### Prisma Studio

View and edit database data visually:
```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

## 🔧 Troubleshooting

### Database Connection Issues

If you get connection errors:
1. Verify Supabase project is active
2. Check DATABASE_URL format
3. Ensure password doesn't have special characters (URL encode if needed)
4. Test connection: `npx prisma db pull`

### Migration Errors

If migrations fail:
```bash
# Reset and reapply
npm run prisma:reset
npm run prisma:migrate
npm run prisma:seed
```

### Port Already in Use

Change port in `.env`:
```env
PORT=5001
```

## 🚢 Production Deployment

### 1. Build Application
```bash
npm run build
```

### 2. Environment Variables

Set all environment variables in your hosting platform.

### 3. Run Migrations
```bash
npm run prisma:migrate
```

### 4. Start Server
```bash
npm start
```

### Recommended Hosting
- **API**: Railway, Render, Heroku, DigitalOcean
- **Database**: Supabase (already configured)
- **WhatsApp**: Self-hosted Evolution API

## 🔗 Frontend Integration

### Example: Login Request

```typescript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'ceo@fortunecampus.com',
    password: 'Admin@123',
  }),
});

const data = await response.json();
// Store data.data.token for future requests
```

### Example: Fetch Students (Protected)

```typescript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5000/api/students?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const data = await response.json();
console.log(data.data.students);
```

## 📝 Notes

- Always use JWT token for protected routes
- Branch-level access is automatically enforced
- CEO role has unrestricted access
- All dates are in ISO 8601 format
- Pagination is 0-indexed (page 1 = first page)
- Search is case-insensitive

## 🤝 Support

For issues or questions:
1. Check this README
2. Review Prisma schema for data structure
3. Check API endpoints in `src/modules/*/routes.ts`
4. Review error messages in response

## 📄 License

MIT License - Fortune Innovatives

---

Built with ❤️ by Fortune Innovatives Team
