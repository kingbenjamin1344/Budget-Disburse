# 🎯 Railway MySQL Setup - Step-by-Step Visual Guide

Complete visual walkthrough for deploying Budget-Disburse to Railway with MySQL.

---

## 📍 Step 1: Create Railway Project

### 1.1 - Open Railway Dashboard
```
Go to: https://railway.app/dashboard
Click: "New Project"
```

### 1.2 - Deploy from GitHub
```
Select: "Deploy from GitHub"
Search: "Budget-Disburse"
Click: "Configure in GitHub"
Grant: Repository access
Return: Click "Deploy Now"
```

**You should see:**
- Next.js deployment starting
- Build logs appearing in real-time
- Estimated build time: 3-5 minutes

---

## 🗄️ Step 2: Add MySQL Service

### 2.1 - Add Database
```
In your Railway Project:
Click: "+ New"
Select: "Database"
Choose: "MySQL"
Wait: 2-3 minutes for startup
```

**You should see:**
- MySQL service card appearing
- Status changing from "starting" → "running"
- Green checkmark icon

### 2.2 - Get MySQL Connection Details
```
Click: MySQL Service
Click: "Connect" tab

You will see:
├── MySQL URL: mysql://root:password@host:port/railway
├── Host: container-abc123.railway.internal
├── User: root
├── Password: (random string, 20+ chars)
├── Port: 3306 (internal), 12345 (external)
└── Database: railway (create budget_disburse yourself)

COPY and SAVE these details
```

---

## 🔗 Step 3: Create Application Database

### Option A: Using Railway MySQL Client Plugin (Easiest)

**3A.1 - Install MySQL Client**
```
Click: MySQL Service
Click: "Plugins" tab
Click: "+ Add"
Search: "MySQL Client"
Click: Install

Wait: 1-2 minutes
```

**3A.2 - Open MySQL Console**
```
Click: MySQL Client plugin
Click: "Open" or "Connect"

Terminal opens in Railway dashboard
```

**3A.3 - Create Database**
```sql
CREATE DATABASE budget_disburse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify
SHOW DATABASES;

-- You should see:
-- | budget_disburse |

EXIT;
```

### Option B: Using DBeaver (Visual Alternative)

1. See USERADMIN_QUICK_REFERENCE.md for DBeaver setup
2. Connect with Railway MySQL credentials
3. Right-click "Databases" → Create New Database → name "budget_disburse"

---

## ⚙️ Step 4: Configure Environment Variables

### 4.1 - Create DATABASE_URL

**From Railway MySQL Connect tab, you have:**
```
User: root
Password: p7x9kL2mQ5
Host: container-a1b2c3d4.railway.internal
Port: 3306
```

**Build DATABASE_URL:**
```
Replace template: mysql://USER:PASSWORD@HOST:PORT/DATABASE

Result: mysql://root:p7x9kL2mQ5@container-a1b2c3d4.railway.internal:3306/budget_disburse
        └─user──┘ └───password────┘ └──────────────host──────────────┘ └─port─┘ └──database────┘
```

**Check for special characters in password:**
- If password has `@` → Replace with `%40`
- If password has `:` → Replace with `%3A`
- If password has `/` → Replace with `%2F`

### 4.2 - Generate AUTH_SECRET

**Run in PowerShell (Windows):**
```powershell
$bytes = [System.Byte[]]::new(32)
(New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Output example:
# aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890AbCd=
```

**Copy the output** (including the `=` at the end)

### 4.3 - Generate ADMIN_PASSWORD_HASH

**Open PowerShell and run:**
```powershell
# Enter the command
node -e "console.log(require('bcryptjs').hashSync('YourSecurePassword123', 10))"

# Wait for output (takes 2-3 seconds)
# Output example:
# $2b$10$xyzABC123...full-hash...
```

**Copy the full hash starting with `$2b$10$`**

### 4.4 - Set Variables in Railway

```
Dashboard → Your Next.js Service
↓
Click: "Variables" tab
↓
Add each variable:
```

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | From step 4.1 | `mysql://root:p7x9kL2mQ5@container-a1b2c3d4.railway.internal:3306/budget_disburse` |
| `AUTH_SECRET` | From step 4.2 | `aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890AbCd=` |
| `ADMIN_PASSWORD_HASH` | From step 4.3 | `$2b$10$xyzABC123...full-hash...` |
| `ADMIN_USERNAME` | Your choice | `admin` |
| `NODE_ENV` | production | `production` |

**After adding each:**
- Railway auto-saves variables
- Watch the bottom: "Variables saved" message

---

## 🚀 Step 5: Deploy Application

### 5.1 - Trigger Deployment

**Option A: Automatic (Recommended)**
```
Your Next.js service should show:
Status: Deploying

The deployment runs:
1. Installs dependencies (npm install)
2. Builds app (npm run build)
3. Runs migrations (npx prisma migrate deploy)
4. Starts server (npm start)
```

**Option B: Redeploy Manually**
```
Your Next.js Service → Deployments tab
↓
Click: "New Deployment" button
↓
Select: Latest commit
↓
Click: "Deploy"
```

### 5.2 - Watch Build Logs

```
Deployments tab → Click active deployment → View Logs

Look for these success messages:
✓ "npm install" completed
✓ "npm run build" completed  
✓ "prisma migrate deploy" completed (creates tables)
✓ "npm start" listening on port 3000

Look for these ERROR messages (if any):
✗ "Cannot connect to database"
✗ "Table 'budget_disburse.useradmin' doesn't exist"

Wait time: 5-10 minutes total
```

### 5.3 - Verify Success

```
Your Next.js Service → Settings tab → "Domains"

Copy your app URL (example: budget-disburse-production.railway.app)
Open in browser

You should see:
✓ App loading
✓ Login page appears
✓ No error messages in browser console (press F12)
```

---

## 🔓 Step 6: First Login Test

### 6.1 - Log In
```
Username: admin
Password: YourSecurePassword123 (the one you hashed in step 4.3)

Click: Login

If successful:
✓ Redirects to Dashboard
✓ Shows "Welcome, admin"
✓ Can see budget/disbursement data
```

### 6.2 - Check useradmin Table

**Via DBeaver:**
1. Open DBeaver (installed earlier)
2. Connect to your Railway MySQL
3. Navigate: Databases → budget_disburse → Tables → useradmin
4. Right-click → View Table
5. You should see your admin user record

**Via Terminal:**
```bash
# From Railway MySQL Console or local connection
USE budget_disburse;
SELECT id, username, createdAt FROM useradmin;

# Output should show:
# | id | username | createdAt           |
# | 1  | admin    | 2024-01-15 10:30:00 |
```

---

## 📊 Visual Verification Checklist

### Railway Dashboard Should Show:

```
Your Project
├── ✓ Next.js Service (Status: Active, Green)
├── ✓ MySQL Service (Status: Active, Green)
└── Deployments
    └── ✓ Latest Deployment (Status: Success)

Your Next.js Service
├── ✓ Domains (your app URL)
├── ✓ Variables (all 5 set)
├── ✓ Build Logs (no errors)
└── ✓ Deployment Logs (migration successful)

MySQL Service
├── ✓ Connect tab (credentials visible)
├── ✓ Status: Running
└── ✓ Plugins: MySQL Client installed
```

### App Browser Should Show:

```
https://your-app.railway.app

✓ Page loads (no connection errors)
✓ Login form appears
✓ Can log in with admin credentials
✓ Dashboard appears after login
✓ Browser console (F12) has no major errors
```

### MySQL uModule Should Contain:

```
Database: budget_disburse
├── Table: budget
├── Table: disbursement  
├── Table: expense
├── Table: office
├── Table: log
└── Table: useradmin  ← Can see your admin user here
    └── Row: admin | $2b$10$xxx... | 2024-01-15
```

---

## ⚠️ If Something Goes Wrong

### Symptom: "Cannot connect to database on startup"

**Fix Steps:**
1. Click MySQL Service → Check Status = "Running"
2. Click Next.js Service → Variables tab
3. Verify DATABASE_URL is exactly correct:
   - No spaces
   - Host is `container-xyz.railway.internal` (internal, not external)
   - Port is `3306`
   - Database name is `budget_disburse`
4. Click "Redeploy" button when done

### Symptom: "Migration failed - table doesn't exist"

**Fix Steps:**
1. Run migrations manually
2. Open Railway MySQL Console
3. Execute:
   ```sql
   CREATE DATABASE budget_disburse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
4. Redeploy app

### Symptom: "Login page shows but can't log in"

**Fix Steps:**
1. Verify ADMIN_PASSWORD_HASH matches password you hashed
2. Check useradmin table has admin row:
   ```sql
   SELECT * FROM useradmin;
   ```
3. If empty, add admin manually (see below)

### Symptom: "No admin user in useradmin table after first deploy"

**Fix Steps:**
1. Open Railway MySQL Console or DBeaver
2. Run:
   ```sql
   USE budget_disburse;
   
   INSERT INTO useradmin (username, password, createdAt, updatedAt)
   VALUES (
     'admin',
     '$2b$10$your-bcrypt-hash-from-step-4.3',
     NOW(),
     NOW()
   );
   
   -- Verify
   SELECT * FROM useradmin;
   ```
3. Try logging in again

---

## 🎉 Success! You're Deployed

Your Budget-Disburse app is now running on Railway with:

- ✅ **MySQL Database** - Connected and running
- ✅ **Prisma Migrations** - Schema created automatically
- ✅ **Admin User** - In useradmin table
- ✅ **Authentication** - Login works
- ✅ **Public URL** - App accessible globally

### What's Next?

1. **Monitor Logs** - Railway Dashboard → Deployments → View Logs
2. **Manage Database** - Use DBeaver or MySQL Client for useradmin management
3. **Auto Deployments** - Push to GitHub → Railway auto-deploys
4. **Backups** - Railway handles MySQL backups automatically
5. **Scale** - Upgrade Railway plan if needed for more resources

---

## 📞 Helpful Resources

- **Railway Docs** - https://docs.railway.app/
- **Railway Dashboard** - https://railway.app/dashboard
- **Prisma Docs** - https://www.prisma.io/docs/
- **MySQL Docs** - https://dev.mysql.com/doc/
- **This Project Guide** - See RAILWAY_MYSQL_SETUP.md

---

**Questions?** Refer to the comprehensive guide: `RAILWAY_MYSQL_SETUP.md`

**Need quick SQL reference?** See: `USERADMIN_QUICK_REFERENCE.md`
