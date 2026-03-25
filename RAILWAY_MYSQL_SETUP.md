# 🚂 Railway MySQL Prisma Setup Guide
## Complete Guide for Budget-Disburse Deployment with UserAdmin Access

**Last Updated:** March 25, 2026  
**Target:** Production MySQL Database with Prisma ORM & UserAdmin Table Management

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Project Setup](#railway-project-setup)
3. [MySQL Database Configuration](#mysql-database-configuration)
4. [Environment Variables for Production](#environment-variables-for-production)
5. [Prisma Database Migrations](#prisma-database-migrations)
6. [Accessing UserAdmin Table](#accessing-useradmin-table)
7. [Connection Troubleshooting](#connection-troubleshooting)
8. [Production Deployment Checklist](#production-deployment-checklist)

---

## Prerequisites

Before starting, ensure you have:

- ✅ A [Railway account](https://railway.app) (free tier or paid)
- ✅ Git installed locally with all code committed
- ✅ GitHub account connected to Railway
- ✅ Node.js 18+ installed locally (for testing)
- ✅ MySQL client installed (optional, for local testing)
- ✅ Your `.env.local` file already configured for local development

**Note:** This guide assumes you have already set up `.env.local` locally. We're now setting up the production environment in Railway.

---

## Railway Project Setup

### Step 1: Create Railway Project

1. **Log in to Railway Dashboard**
   - Go to [Railway.app](https://railway.app/dashboard)
   - Click **"New Project"**

2. **Connect GitHub Repository**
   - Select **"Deploy from GitHub"**
   - Search for and select your `Budget-Disburse` repository
   - Click **"Deploy Now"**
   - Railway will automatically start deploying from your main branch

### Step 2: Add MySQL Database Service

1. **Click "+ New" button** in your Railway project
2. **Select Database** → **MySQL**
3. **Wait for Service Initialization** (2-3 minutes)
   - The MySQL container will spin up automatically
   - Railway assigns a random port and generates credentials

### Step 3: Configure Next.js Service

1. **Click on the Next.js service** (the deployed app)
2. **Navigate to Settings tab**
3. Verify these build settings:
   - **Builder:** Nixpacks (automatic)
   - **Install Command:** `npm install` (automatic)
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

---

## MySQL Database Configuration

### Understanding Railway MySQL Service

When you add MySQL to Railway, it automatically:
- Creates a MySQL database instance
- Generates random username & password
- Assigns a port
- Stores connection info in the service

### Getting Your MySQL Connection Details

**Method 1: From Railway Dashboard (Recommended)**

1. **Click on MySQL service** in your Railway project
2. **Go to the "Connect" tab**
3. You'll see connection info for different clients:

   ```
   MySQL URL: mysql://user:password@host:port/railway
   Host: container-xyz.railway.internal
   User: root
   Password: xxxxxxxxxxxxx
   Port: 3306 (internal), 12345 (external)
   Database: railway (default)
   ```

**Important Notes:**
- **Internal Host:** Use for app-to-database communication (same Railway network)
  - Example: `mysql://root:password@container-xyz.railway.internal:3306/budget_app`
- **External Host:** Use for local MySQL tools/external connections
  - Example: `mysql://root:password@gateway.railway.app:12345/budget_app`

### Creating the Application Database

By default, Railway MySQL creates a `railway` database. You need to create your application database. Choose one approach:

#### **Option A: Railway PostgreSQL Plugin (Easiest)**
1. In the MySQL service, go to **Plugins**
2. Install **MySQL Client** plugin
3. Run commands directly in the console

#### **Option B: Local MySQL Client (From Your Computer)**
```bash
# Connect using external MySQL credentials
mysql -h gateway.railway.app -u root -p -P <external-port>

# Then create the database
CREATE DATABASE budget_disburse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;  # Verify it was created
EXIT;
```

#### **Option C: Automatic via Prisma (Recommended)**
Prisma will create the database and tables from migrations:
```bash
# This runs automatically on Railway during deployment
npx prisma migrate deploy
```

---

## Environment Variables for Production

### Railway Variables Configuration

1. **Click on your Next.js service**
2. **Go to "Variables" tab**
3. **Add the following environment variables:**

### Required Variables

#### **1. DATABASE_URL - MySQL Connection String**

**Format for Railway MySQL:**
```
mysql://root:YOUR_PASSWORD@container-xyz.railway.internal:3306/budget_disburse
```

**How to build it:**
1. Get credentials from MySQL service "Connect" tab
2. Replace placeholders:
   - `root` → Your MySQL username
   - `YOUR_PASSWORD` → Your MySQL password
   - `container-xyz.railway.internal` → Internal host from Railway
   - `3306` → MySQL port (default)
   - `budget_disburse` → Your database name

**Example from Railway:**
```
DATABASE_URL=mysql://root:p7x9kL2mQ5@container-a1b2c3d4.railway.internal:3306/budget_disburse
```

**Add to Railway:**
- Key: `DATABASE_URL`
- Value: `mysql://root:YOUR_PASSWORD@YOUR_HOST:3306/budget_disburse`
- Click Save

#### **2. AUTH_SECRET - Session Encryption Key**

Generate a secure 32-byte random string:

**PowerShell (Windows):**
```powershell
$bytes = [System.Byte[]]::new(32)
(New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Copy the output and add to Railway:**
- Key: `AUTH_SECRET`
- Value: `<your-generated-base64-string>`

#### **3. ADMIN_PASSWORD_HASH - Bcrypt Hash**

First, create your admin password hash locally:

**Generate hash with Node.js:**
```bash
node -e "console.log(require('bcryptjs').hashSync('YourSecurePassword123', 10))"
```

**Online alternative:** https://bcrypt-generator.com/
- Input: Your desired admin password
- Output: Bcrypt hash

**Add to Railway:**
- Key: `ADMIN_PASSWORD_HASH`
- Value: `$2b$10$...` (the full hash starting with $2b$10$)

#### **4. NODE_ENV - Environment Type**

- Key: `NODE_ENV`
- Value: `production`

#### **5. ADMIN_USERNAME - Admin Account**

- Key: `ADMIN_USERNAME`
- Value: `admin` (or your preferred username)

### Variable Summary Table

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `mysql://root:pass@host:port/budget_disburse` | App → MySQL connection |
| `AUTH_SECRET` | Base64 string (32 bytes) | Session & token encryption |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash ($2b$10$...) | Admin login security |
| `ADMIN_USERNAME` | `admin` | Admin account name |
| `NODE_ENV` | `production` | Deployment environment |

---

## Prisma Database Migrations

### Understanding Migrations

Prisma migrations:
- Create database schema (tables, relationships)
- Are version-controlled in `prisma/migrations/`
- Run automatically on Railway during deployment
- Create your database structure from `schema.prisma`

### Migration Process

**Locally (for development):**
```bash
# Create and run new migration
npx prisma migrate dev --name add_new_table

# Just run existing migrations
npx prisma migrate deploy
```

**Automatically on Railway:**
```
Pre-deploy command: npx prisma migrate deploy
```

This runs every time you deploy, ensuring your production database stays synchronized.

### Checking Migration Status

**Generate Prisma client (if running locally to test):**
```bash
npx prisma generate
```

**View database status:**
```bash
npx prisma db push --dry-run  # Preview changes without applying
npx prisma db push            # Apply changes to database
```

### Your Application Schema

Your application has these tables (from `prisma/schema.prisma`):

1. **budget** - Store budget allocations per office
   - Fields: id, officeId, officeName, ps, mooe, co, total, dateCreated, updatedAt

2. **disbursement** - Track fund disbursements
   - Fields: id, dvNo, payee, officeId, officeName, expenseType, expenseCategory, amount, dateCreated, updatedAt

3. **expense** - Expense categories
   - Fields: id, type, category, dateCreated, updatedAt

4. **office** - Office management
   - Fields: id, name, dateCreated
   - Relations: Has many budgets and disbursements

5. **log** - Audit trail
   - Fields: id, message, type, action, performedBy, createdAt

6. **useradmin** - User authentication (★ Focus for this guide)
   - Fields: id, username, password, createdAt, updatedAt

---

## Accessing UserAdmin Table

### What is UserAdmin Table?

The `useradmin` table stores:
- **id** - Primary key (auto-increment)
- **username** - Admin username (unique)
- **password** - Hashed password
- **createdAt** - Account creation timestamp
- **updatedAt** - Last update timestamp

### Method 1: Railway MySQL Console (Easiest for First-Time Setup)

**Only available with Railway MySQL plugins:**

1. Click on **MySQL service** in Railway
2. Click **Plugins** tab
3. Install **MySQL Client** plugin
4. Click the plugin → Opens console

```sql
-- Check current users
SELECT id, username, createdAt, updatedAt FROM useradmin;

-- View full records
SELECT * FROM useradmin;

-- Count users
SELECT COUNT(*) as admin_count FROM useradmin;
```

### Method 2: Local MySQL Client Connection

**From your computer (Windows/Mac/Linux):**

1. **Get external connection details from Railway MySQL Connect tab**
   - External host: `gateway.railway.app`
   - External port: `xxxxx` (e.g., 12345)
   - User: `root`
   - Password: `xxxxxxxxxxxxx`

2. **Open Terminal/Command Prompt:**

   **On Windows (PowerShell):**
   ```powershell
   # Install MySQL if not present: https://dev.mysql.com/downloads/mysql/
   mysql -h gateway.railway.app -P 12345 -u root -p
   # Enter password when prompted
   ```

   **On Mac/Linux:**
   ```bash
   brew install mysql-client  # Mac only
   mysql -h gateway.railway.app -P 12345 -u root -p
   # Enter password when prompted
   ```

3. **Query UserAdmin Table:**
   ```sql
   -- Connect to your database
   USE budget_disburse;

   -- Check if useradmin table exists
   SHOW TABLES LIKE 'useradmin';

   -- View all admin users
   SELECT id, username, createdAt, updatedAt FROM useradmin;

   -- View admin with password hash (for verification)
   SELECT id, username, password, createdAt FROM useradmin;
   ```

### Method 3: DBeaver GUI Client (Best for Visual Management)

**DBeaver is a free universal database tool:**

1. **Download & Install:** https://dbeaver.io/download/
2. **Create New Connection:**
   - Database Type: MySQL
   - Server Host: `gateway.railway.app`
   - Port: `12345` (your external port)
   - Database: `budget_disburse`
   - Username: `root`
   - Password: (from Railway MySQL Connect tab)
3. **Test Connection** → Click "Finish"
4. **Navigate to:** 
   - Databases → budget_disburse → Tables → useradmin
   - Right-click useradmin → View Table Data
5. **You can now:**
   - View all records visually
   - Edit directly
   - Export data
   - Run SQL queries

### Method 4: HeidiSQL (Windows-Specific GUI)

1. **Download:** https://www.heidisql.com/
2. **Open HeidiSQL** → Click "New"
3. **Configure Connection:**
   - Library: MySQL
   - Hostname: `gateway.railway.app`
   - User: `root`
   - Password: (from Railway MySQL)
   - Port: `12345` (external)
   - Database: `budget_disburse`
4. **Click "Open"**
5. **Navigate to useradmin table and view records**

### Method 5: Railway CLI (Advanced)

If you have Railway CLI installed:

```bash
# List Railway services
railway service list

# Connect to specific database
railway database connect mysql

# Then run SQL
SELECT * FROM budget_disburse.useradmin;
```

### Querying UserAdmin Examples

```sql
-- See all admin accounts
USE budget_disburse;
SELECT * FROM useradmin;

-- Find specific admin
SELECT * FROM useradmin WHERE username = 'admin';

-- Check how many admins exist
SELECT username, DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i') as created FROM useradmin;

-- Find most recently created admin
SELECT * FROM useradmin ORDER BY createdAt DESC LIMIT 1;
```

### Adding Initial Admin User

If the table is empty after first deployment, add your admin:

```sql
INSERT INTO useradmin (username, password, createdAt, updatedAt)
VALUES (
  'admin',
  '$2b$10$...your-bcrypt-hash...',
  NOW(),
  NOW()
);
```

Then verify:
```sql
SELECT * FROM useradmin WHERE username = 'admin';
```

---

## Connection Troubleshooting

### Issue 1: "Cannot connect to database"

**Symptoms:**
- App won't start
- Error: `connect ECONNREFUSED` or `ER_ACCESS_DENIED_FOR_USER`

**Solutions:**
```yaml
Check 1: Verify DATABASE_URL in Railway Variables
✓ Syntax correct? (mysql://user:pass@host:port/database)
✓ Credentials match MySQL service? (Check Connect tab)
✓ Using internal host? (container-xyz.railway.internal)
✓ Special characters in password escaped? (@ becomes %40)

Check 2: Verify MySQL service is running
✓ Go to MySQL service
✓ Check Status tab - should show "Running"
✓ Wait 5+ minutes after adding if newly created

Check 3: Verify database exists
✓ Create with: CREATE DATABASE budget_disburse;
✓ Or let Prisma create with: npx prisma migrate deploy
```

### Issue 2: "useradmin table not found"

**Symptoms:**
- Error: `Table 'budget_disburse.useradmin' doesn't exist`

**Solution:**
```bash
# Run migrations to create tables
npx prisma migrate deploy

# Or push schema
npx prisma db push

# Verify with
npx prisma studio  # Opens web GUI to inspect database
```

### Issue 3: "Cannot access MySQL externally"

**Symptoms:**
- Connection works from Railway but not from local computer
- Error: `host '1.2.3.4' is not allowed to connect`

**Solution:**
Railway restricts external access by default. You need:
1. Use **internal host only** for app-to-database (within Railway network)
2. For external access, enable with:
   - MySQL service → Settings tab → "Public Networking" toggle ON
   - Refresh to get external port

### Issue 4: "Port already in use"

**Solution:**
```powershell
# Windows - Kill process using port 3306
netstat -ano | findstr :3306
taskkill /PID <PID> /F
```

---

## Production Deployment Checklist

### Before Deploying to Railway

**Repository & Code:**
- [ ] All changes committed to Git
- [ ] No sensitive credentials in code
- [ ] `.env.production` file exists (can be empty - use Railway Variables)
- [ ] `.gitignore` excludes `.env*` files

**Database:**
- [ ] MySQL service created in Railway
- [ ] `DATABASE_URL` variable set with correct credentials
- [ ] Database name created (`budget_disburse`)
- [ ] Migrations tested locally: `npx prisma migrate dev`

**Deployment Configuration:**
- [ ] `railway.json` has correct build & deploy commands
- [ ] `package.json` has `"build"` and `"start"` scripts
- [ ] Node.js version 18+ specified

**Environment Variables in Railway:**
- [ ] `DATABASE_URL` - Set and tested
- [ ] `AUTH_SECRET` - Generated and set
- [ ] `ADMIN_PASSWORD_HASH` - Generated and set
- [ ] `ADMIN_USERNAME` - Set to `admin`
- [ ] `NODE_ENV` - Set to `production`

**Testing:**
- [ ] App builds locally: `npm run build`
- [ ] Migrations run locally: `npx prisma migrate deploy`
- [ ] App starts locally: `npm start`
- [ ] Can connect to MySQL with credentials

**Post-Deployment:**
- [ ] Check Railway deployment logs
- [ ] Verify app is running (Status = Active)
- [ ] Test login on live app
- [ ] Query useradmin table to verify admin exists
- [ ] Check app logs for errors

### Deployment Steps

```bash
# 1. Ensure everything is committed
git add .
git commit -m "Ready for Railway deployment"
git push origin main

# 2. In Railway Dashboard:
#    - Watch deployment logs in real-time
#    - Verify all variables are set
#    - Wait for build to complete

# 3. Test the app:
#    - Visit your Railway app URL
#    - Log in with admin credentials
#    - Check dashboard loads data

# 4. Verify database:
#    - Connect to useradmin table
#    - Confirm admin user exists
#    - Check if data persists after reload
```

---

## Quick Reference Card

### Connection String Format
```
mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

### Getting Railway MySQL Credentials
```
In Railway Dashboard:
1. Click MySQL service
2. Click "Connect" tab
3. Copy the MySQL URL
4. Replace 'railway' database name with 'budget_disburse'
```

### Required Variables to Set
```
DATABASE_URL=mysql://root:password@host:port/budget_disburse
AUTH_SECRET=<32-byte-base64-string>
ADMIN_PASSWORD_HASH=<bcrypt-hash>
ADMIN_USERNAME=admin
NODE_ENV=production
```

### Common SQL Queries
```sql
-- Check useradmin table
USE budget_disburse;
SELECT * FROM useradmin;

-- Insert admin if empty
INSERT INTO useradmin (username, password)
VALUES ('admin', '<your-bcrypt-hash>');

-- Check all tables
SHOW TABLES;

-- Check table structure
DESCRIBE useradmin;
```

### Helpful Links
- Railway Dashboard: https://railway.app/dashboard
- MySQL Documentation: https://dev.mysql.com/doc/
- Prisma Docs: https://www.prisma.io/docs/
- DBeaver Download: https://dbeaver.io/

---

## Final Notes

1. **Keep credentials secure** - Never commit `.env.production` with real values
2. **Railway internal network** - App to MySQL uses internal host (fast, secure)
3. **Backups** - Railway automatically backs up MySQL (check settings)
4. **Monitoring** - Watch Railways deployment logs during initial setup
5. **Support** - Check Railway docs at https://docs.railway.app if stuck

**You're ready to deploy!** 🚀
