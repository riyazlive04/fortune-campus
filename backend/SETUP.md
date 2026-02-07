# Fortune Campus Backend - Quick Setup Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL database (Supabase account)
- ✅ Text editor (VS Code recommended)

## Step-by-Step Setup

### 1️⃣ Install Dependencies

```bash
cd backend
npm install
```

### 2️⃣ Configure Environment

Create a `.env` file by copying `.env.example`:

```bash
cp .env.example .env
```

Then edit `.env` and update:

```env
# Required: Get from Supabase Dashboard
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Required: Generate a strong secret
JWT_SECRET="your-secure-random-string-here"

# Optional: For WhatsApp (can skip for now)
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-api-key
```

**To get DATABASE_URL from Supabase:**
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy "Connection string" (URI mode)
5. Replace `[YOUR-PASSWORD]` with your actual password

### 3️⃣ Initialize Database

```bash
# Generate Prisma client
npm run prisma:generate

# Create database tables
npm run prisma:migrate

# Add sample data
npm run prisma:seed
```

### 4️⃣ Start Development Server

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server running on port 5000
📝 Environment: development
🌐 CORS enabled for: http://localhost:5173
```

### 5️⃣ Test the API

Open http://localhost:5000/health in your browser or run:

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

### 6️⃣ Test Authentication

Try logging in with seeded credentials:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ceo@fortunecampus.com","password":"Admin@123"}'
```

You should get a JWT token in response.

## Default Test Credentials

After seeding, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| CEO | ceo@fortunecampus.com | Admin@123 |
| Branch Head | head.main@fortunecampus.com | Admin@123 |
| Trainer | trainer1@fortunecampus.com | Admin@123 |
| Student | vikram.reddy@student.fortunecampus.com | Student@123 |

## Common Issues & Solutions

### Issue: "Can't reach database server"
**Solution:** Check your DATABASE_URL is correct and Supabase project is active.

### Issue: "Port 5000 already in use"
**Solution:** Change PORT in `.env` to 5001 or kill the process using port 5000.

### Issue: "Prisma Client not found"
**Solution:** Run `npm run prisma:generate`

### Issue: Migration fails
**Solution:** Run `npm run prisma:reset` (⚠️ This deletes all data)

## Next Steps

1. ✅ Backend is running
2. 📖 Read [README.md](./README.md) for full API documentation
3. 🎨 Check [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for frontend integration
4. 🔧 Customize seed data in `prisma/seed.ts`
5. 🚀 Start building features!

## Useful Commands

```bash
# View database in browser
npm run prisma:studio

# Reset database (⚠️ deletes all data)
npm run prisma:reset

# Check Prisma schema for errors
npx prisma validate

# Format Prisma schema
npx prisma format
```

## Development Workflow

1. Make changes to code
2. Server auto-restarts (with tsx watch)
3. Test changes in Postman/Frontend
4. If schema changes, run migrations:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

## Production Deployment Checklist

- [ ] Set strong JWT_SECRET
- [ ] Use production DATABASE_URL
- [ ] Set NODE_ENV=production
- [ ] Run `npm run build`
- [ ] Run migrations on production DB
- [ ] Configure CORS for production frontend URL
- [ ] Set up monitoring and logging
- [ ] Enable rate limiting
- [ ] Use HTTPS

## Need Help?

1. Check [README.md](./README.md) for detailed docs
2. Review error messages carefully
3. Check Prisma logs for database issues
4. Verify environment variables are set correctly

---

🎉 **You're all set! Happy coding!**
