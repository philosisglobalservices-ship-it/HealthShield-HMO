# PostgreSQL Setup Guide for HealthShield HMO Platform

## Step 1 — Install PostgreSQL

Download from: https://www.postgresql.org/download/windows/
- Recommended version: PostgreSQL 15 or 16
- During installation, set a password for the `postgres` user (remember it!)
- Default port: 5432 ✓

## Step 2 — Create the database

Open **pgAdmin** (installed with PostgreSQL) or use **SQL Shell (psql)**:

```sql
CREATE DATABASE hmo_platform;
```

Or via psql shell:
```
psql -U postgres
postgres=# CREATE DATABASE hmo_platform;
postgres=# \q
```

## Step 3 — Configure the backend .env

Open `backend\.env` and update:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hmo_platform
DB_USER=postgres
DB_PASSWORD=<your_postgres_password>
JWT_SECRET=change-this-to-a-long-random-string-in-production
```

## Step 4 — Run migrations (creates all tables)

Open a terminal in the `backend` folder:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run db:migrate
```

Expected output:
```
✅ Migration completed — 20 tables created
```

## Step 5 — Seed demo data

```powershell
npm run db:seed
```

Expected output:
```
✅ Seed completed successfully!

📋 Login credentials:
  Admin:    admin@healthshield.ng / Admin@123
  Claims:   claims@healthshield.ng / Staff@123
  Finance:  finance@healthshield.ng / Staff@123
```

## Step 6 — Start the platform

Double-click `START.bat` in the project root, or run:

```powershell
# Terminal 1 — Backend
cd backend
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev

# Terminal 2 — Frontend
cd frontend
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm start
```

Then open: **http://localhost:3000**

---

## ⚠️ No PostgreSQL? Demo Mode Available

The platform works **without PostgreSQL** using built-in demo data:

- Login still works with the credentials above
- Dashboard, charts, and lists show realistic Nigerian HMO data  
- You can navigate all pages of the UI

To use full functionality (create members, process claims, etc.), you need PostgreSQL set up per steps 1–5 above.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm` not found | Install Node.js from https://nodejs.org |
| Port 5000 in use | Change `PORT=5001` in `backend/.env` |
| Port 3000 in use | Set `PORT=3001` before running `npm start` |
| DB connection refused | Check PostgreSQL is running and `.env` password is correct |
| `uuid_generate_v4()` error | Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` in psql |
