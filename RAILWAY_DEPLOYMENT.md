# Budget-Disburse Railway Deployment Guide

A complete step-by-step guide to deploy your Budget-Disburse application to Railway with MySQL database and authentication.

---

## 📋 Prerequisites

Before starting, ensure you have:
- A [Railway account](https://railway.app) (free tier available)
- Git installed and your code committed
- A GitHub account connected to Railway (for automatic deployments)

---

## 🚀 Step 1: Prepare Your Repository

### 1.1 Commit All Changes
```bash
git add .
git commit -m "Ready for Railway deployment"
git push
```

### 1.2 Verify Node Version
Railway uses Node.js automatically. The project requires Node.js 18+. Your `package.json` is configured correctly.

---

## 🗄️ Step 2: Create Railway Project

### 2.1 Create New Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Choose your repository `Budget-Disburse`
5. Click **"Deploy Now"**

### 2.2 Add MySQL Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"MySQL"**
3. Wait for MySQL container to start (2-3 minutes)

---

## 🔐 Step 3: Configure Environment Variables

### 3.1 Get MySQL Connection Details
1. Click on the **MySQL** service in Railway
2. Go to **"Connect"** tab
3. Copy the **MySQL URL** (it looks like `mysql://user:password@host:port/dbname`)

### 3.2 Set Environment Variables in Railway
Click on your **Next.js** service and go to **"Variables"** tab. Add these variables:

#### **Database Connection**
```
DATABASE_URL=mysql://user:password@host:port/budget_disburse
```
*(Copy from MySQL service connection string and update with `budget_disburse` database name)*

#### **Authentication Secret**
Generate a secure random string using one of these commands:

**Option A: PowerShell (Windows)**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) | Find-Object
```

**Option B: Use an online generator**
Go to https://generate-random.org/ and generate a 32-byte random string

Then add:
```
AUTH_SECRET=<your-generated-random-string>
```

#### **Admin Password Hash**
Generate a bcrypt hash for your admin password.

**Option A: Using Node.js**
```bash
node -e "console.log(require('bcryptjs').hashSync('your-secure-password', 10))"
```
*(Replace `your-secure-password` with your desired admin password)*

**Option B: Online bcrypt generator**
Visit https://bcrypt-generator.com/ and hash your password

Then add:
```
ADMIN_PASSWORD_HASH=$2b$10$... (your generated hash)
```

#### **Application Settings**
```
ADMIN_USERNAME=admin
NODE_ENV=production
```

### 3.3 Complete Environment Variables Summary
Your variables should look like:
```
DATABASE_URL=mysql://root:password@mysql.railway.internal:3306/budget_disburse
AUTH_SECRET=abc123def456ghi789...
ADMIN_PASSWORD_HASH=$2b$10$...
ADMIN_USERNAME=admin
NODE_ENV=production
```

---

## 💾 Step 4: Initialize Database

### 4.1 Create Database Schema
Once the Next.js service is deployed and variables are set:

1. Go to your Railway Next.js **service**
2. Click **"Deployments"** tab
3. Click the **latest deployment** to view logs
4. Once deployment completes, you need to run Prisma migration

### 4.2 Run Prisma Migration via SSH

**Option A: Using Railway CLI (Recommended)**

Install Railway CLI:
```bash
npm install -g @railway/cli
```

Login and run migration:
```bash
railway login
railway connect
npm run prisma:migrate
```

**Option B: Manual via Railway Dashboard**

1. Go to your service → **"Command Palette"** (top right)
2. Run the following commands in sequence:

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4.3 Verify Database Connection
Check Railway logs to ensure:
- ✅ Migration completed successfully
- ✅ Prisma client connected to MySQL
- ✅ No connection errors

---

## 📝 Step 5: First Login & Admin Setup

### 5.1 Access Your Application
1. In Railway project, click the **Next.js** service
2. Go to **"Deployments"** tab
3. Click on the **Public URL** (your domain like `budget-disburse-production.up.railway.app`)

### 5.2 Login with Admin Credentials
- **Username:** `admin`
- **Password:** *(the password you used to generate the bcrypt hash)*

### 5.3 Verify Admin Access
Once logged in, you should see:
- ✅ Dashboard loads successfully
- ✅ All menu options accessible
- ✅ Database queries working

---

## 🔄 Step 6: Custom Domain (Optional)

### 6.1 Connect Your Domain
1. In Railway project, click the **Next.js** service
2. Go to **"Settings"** tab
3. Under **"Domains"**, click **"+ New"**
4. Enter your custom domain (e.g., `budget.yourcompany.com`)
5. Update your DNS records with Railway's provided CNAME

### 6.2 SSL Certificate
Railway automatically provides free SSL certificates via Let's Encrypt.

---

## ✅ Step 7: Verification Checklist

After deployment, verify everything works:

- [ ] **Application loads** at Railway URL
- [ ] **Admin login works** with credentials
- [ ] **Dashboard displays** without errors
- [ ] **Add Budget** page functions
- [ ] **Disbursement** page loads data
- [ ] **Expense tracking** works
- [ ] **Logs display** correctly
- [ ] **PDF generation** works (for reports)

Check logs for any errors:
```
Login → click service → "Logs" tab → review for errors
```

---

## 🐛 Troubleshooting

### **Build Fails**
```
Solution: Check logs for missing dependencies
- Ensure package.json has all required packages
- Run locally: npm install && npm run build
- Commit and push changes
```

### **Can't Connect to Database**
```
Solution:
1. Verify DATABASE_URL is correct
2. Check MySQL service is running (green in Railway)
3. Ensure ADMIN_USERNAME and ADMIN_PASSWORD_HASH are set
4. Restart the application in Railway
```

### **Login Page Won't Load**
```
Solution:
1. Check AUTH_SECRET is set and has sufficient length
2. Verify NODE_ENV=production is set
3. Check application logs for errors
```

### **Database Migration Failed**
```
Solution:
1. Check MySQL has sufficient permissions
2. Verify database exists: budget_disburse
3. Run: npx prisma migrate status
4. Check Prisma schema syntax in prisma/schema.prisma
```

### **502 Bad Gateway Error**
```
Solution:
1. Service failed to start. Check logs.
2. Verify all required environment variables are set
3. Check for TypeScript compilation errors
4. Restart the application
```

---

## 🔄 Automatic Deployments

Railway automatically deploys on every push to your main branch:

1. **Push code:**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

2. **Watch Railway Dashboard** - deployment starts automatically
3. **Services deploy in order:**
   - MySQL updates (if schema changes)
   - Next.js rebuilds and redeploys

---

## 📚 Useful Railway Commands

```bash
# View logs
railway logs

# Connect to service
railway connect

# Get service status
railway status

# View environment variables
railway variables

# Set a variable
railway variables set KEY=value
```

---

## 🛡️ Security Recommendations

### ✅ Already Implemented
- HTTP-only cookies for auth tokens
- JWT token signing with AUTH_SECRET
- Password hashing with bcryptjs
- Middleware route protection

### 🔒 Additional Steps
1. **Enable Railway Private Networking** (if needed)
2. **Setup backups** in Railway MySQL settings
3. **Monitor logs** regularly for suspicious activity
4. **Rotate AUTH_SECRET** periodically
5. **Use strong admin password** (especially for production)

---

## 📊 Monitoring & Logs

### View Application Logs
```
Railway Dashboard → Next.js service → Logs tab
```

### Key Logs to Monitor
- ✅ `Listening on port` - server started
- ✅ `PrismaClient connected` - database ready
- ✅ `Build complete` - deployment successful
- ❌ `Error: connect ECONNREFUSED` - database issue
- ❌ `jwt malformed` - auth secret issue

---

## 🆘 Need Help?

- **Railway Support:** https://railway.app/support
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Project README:** See `README.md` in the root directory

---

## 📝 Deployment Record

After successful deployment, document:

| Item | Value |
|------|-------|
| Deployment Date | [Your Date] |
| Railway Project URL | [Your URL] |
| Custom Domain | [Your Domain] |
| Database Version | MySQL 8.0+ |
| Node Version | 18+ (Auto-detected) |
| Next.js Version | 16.2.1 |

---

**Last Updated:** March 2026  
**Status:** Ready for Production Deployment
