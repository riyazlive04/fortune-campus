# FortuneCampus - Institute Management System

A comprehensive, production-ready institute management system built for Fortune Innovatives with role-based access control, course management, student tracking, and complete administrative features.

## 🎯 Features

### Core Functionality
- **Secure User Onboarding** - First-time admin setup with automatic branch creation
- **Role-Based Access Control** - ADMIN, BRANCH_HEAD, TRAINER, and STUDENT roles
- **User Management** - Complete CRUD operations with auto-generated temporary passwords
- **Profile & Settings** - Self-service profile management and password changes
- **Course Management** - Full course catalog with syllabus, fees, and duration tracking
- **Branch Management** - Multi-branch support (Tirupur, Salem, Erode, Coimbatore)
- **Student Management** - Track enrollments, attendance, and performance
- **Trainer Management** - Assign trainers to courses and branches
- **Lead Management** - Track and convert potential students
- **Admissions** - Streamlined admission process
- **Attendance Tracking** - Record and monitor student attendance
- **Incentive Management** - Track trainer and staff incentives
- **Placement Management** - Manage company partnerships and student placements
- **Reports & Analytics** - Comprehensive reporting system

### Security Features
- JWT authentication with 7-day expiry
- Password hashing with bcrypt
- Protected routes and API endpoints
- Role-based middleware protection
- One-time setup lock mechanism

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: JWT + bcryptjs
- **Validation**: Custom validation utilities

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: React Router v6

## 📁 Project Structure

```
FortuneCampus/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Database migrations
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── middlewares/       # Auth, role, branch middlewares
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── profile/
│   │   │   ├── courses/
│   │   │   ├── students/
│   │   │   ├── trainers/
│   │   │   ├── branches/
│   │   │   ├── leads/
│   │   │   ├── admissions/
│   │   │   ├── attendance/
│   │   │   ├── incentives/
│   │   │   ├── placements/
│   │   │   ├── portfolio/
│   │   │   ├── reports/
│   │   │   └── setup/
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   ├── app.ts            # Express app setup
│   │   └── server.ts         # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and API client
│   │   └── main.tsx         # App entry point
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or bun package manager

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
PORT=5000
FRONTEND_URL=http://localhost:8081
NODE_ENV=development
```

4. Run database migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

5. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:8081`

## 📖 Usage Guide

### First-Time Setup

1. Navigate to `http://localhost:8081/setup`
2. Create the admin account (Vasudevan):
   - First Name: Vasudevan
   - Last Name: (Your last name)
   - Email: admin@fortuneinnovatives.com
   - Password: (Choose a secure password)
3. Four branches will be automatically created:
   - Tirupur
   - Salem
   - Erode
   - Coimbatore

### User Roles & Permissions

#### ADMIN
- Full system access
- Create users (except other ADMINs)
- Manage all branches
- Access all reports and analytics
- Configure system settings

#### BRANCH_HEAD
- Manage own branch
- Create TRAINER and STUDENT users in own branch
- Manage courses for own branch
- View branch-specific reports

#### TRAINER
- View assigned courses
- Mark attendance
- Update student progress
- Access training materials

#### STUDENT
- View enrolled courses
- Track attendance
- Access learning materials
- View own progress reports

### Creating Users

1. Navigate to **User Management** (Admin/Branch Head only)
2. Click **Add User**
3. Fill in user details:
   - Name, email, role
   - Branch assignment
   - System will auto-generate a temporary password
4. Copy the temporary password and share with the user
5. User should change password on first login via Profile settings

### Managing Courses

1. Navigate to **Courses & Syllabus**
2. Click **Add Course** (Admin/Branch Head only)
3. Enter course details:
   - Name, code, description
   - Duration (months), fees
   - Prerequisites, syllabus
4. Assign trainers to courses
5. Students can be enrolled through Admissions module

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Setup
- `GET /api/setup/status` - Check setup status
- `POST /api/setup/initialize` - Initialize system (one-time)

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Profile
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update own profile
- `PUT /api/profile/password` - Change password
- `PUT /api/profile/admin/:id` - Admin update user profile
- `PUT /api/profile/admin/:id/reset-password` - Admin reset password

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Branches
- `GET /api/branches` - List branches
- `POST /api/branches` - Create branch
- `GET /api/branches/:id` - Get branch details
- `PUT /api/branches/:id` - Update branch

## 🗄️ Database Schema

### Key Models
- **User** - System users with roles and branch assignments
- **Branch** - Institute branches
- **Course** - Course catalog with syllabus and fees
- **Student** - Student records with enrollment details
- **Trainer** - Trainer profiles with specializations
- **Admission** - Admission records and tracking
- **Attendance** - Student attendance tracking
- **Lead** - Prospective student leads
- **Placement** - Student placement records
- **Incentive** - Staff incentive tracking

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use a strong, random secret key in production
3. **Database**: Use connection pooling and prepared statements
4. **Passwords**: Minimum 8 characters, hashed with bcrypt
5. **CORS**: Configure allowed origins in production
6. **HTTPS**: Always use HTTPS in production
7. **Rate Limiting**: Implement rate limiting for production APIs

## 📝 Development

### Running Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests (to be implemented)
cd backend
npm test
```

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist/ folder with a static server
```

## 🤝 Contributing

This is a private project for Fortune Innovatives. For internal contributions:

1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Wait for code review

## 📄 License

Copyright © 2026 Fortune Innovatives. All rights reserved.

## 🙏 Credits

**Developed by [Sirah Digital](https://sirahdigital.in/)**

For support and inquiries, visit: https://sirahdigital.in/

## 📞 Support

For technical support or questions:
- Email: support@fortuneinnovatives.com
- Documentation: See `/backend/API_SUMMARY.md` for detailed API docs

## 🔄 Version History

### v1.0.0 (February 2026)
- Initial production release
- Complete user management system
- Course and syllabus management
- Multi-branch support
- Role-based access control
- Profile and settings management
- Authentication and security features

---

**Built with ❤️ by Sirah Digital**
