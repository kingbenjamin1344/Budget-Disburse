# Railway Deployment Checklist - Simple Instructions

## 📋 Pre-Deployment Checklist

### 1. **Get Your Credentials Ready**
- [ ] Have your Railway Dashboard open: https://railway.app/dashboard
- [ ] Have your GitHub account connected to Railway
- [ ] Have Node.js 20.11.0 or higher installed locally

---

## 🚀 Deployment Steps (5 Minutes)

### **Step 1: Prepare Your Code**
```bash
# Navigate to your project directory
cd c:\Projects\Budget-Disburse

# Commit all changes
git add .
git commit -m "Prepare for Railway deployment"

# Push to GitHub
git push origin main
```

### **Step 2: Create Railway Project**
1. Go to https://railway.app/dashboard
2. Click **"+ New Project"**
3. Click **"Deploy from GitHub"**
4. Select your `Budget-Disburse` repository
5. Click **"Deploy"** and wait for the build to complete (2-3 minutes)

### **Step 3: Add MySQL Database** 
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"MySQL"**
3. Wait for MySQL to start (look for green checkmark)

### **Step 4: Configure Environment Variables**

#### **4.1: Get MySQL Connection String**
1. Click on **MySQL** service in Railway
2. Go to **"Variables"** tab (or **"Connect"**)
3. Copy the `DATABASE_URL` (format: `mysql://user:password@host:port/database`)
4. Update the database name from `railway` to `budget_disburse`

**Example:**
```
mysql://root:aBcD1234@mysql.railway.internal:3306/budget_disburse
```

#### **4.2: Generate Required Secrets**

**Generate AUTH_SECRET:**
```powershell
# Run in PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output (example: `a1b2c3d4e5f6...`)

**Generate Admin Password Hash:**
1. Decide your admin password (example: `MySecurePassword123`)
2. Run:
```powershell
node -e "console.log(require('bcryptjs').hashSync('MySecurePassword123', 10))"
```
3. Copy the hash (example: `$2b$10$...`)

#### **4.3: Set Variables in Railway**
1. Click on your **Next.js** service
2. Go to **"Variables"** tab
3. Add these variables one by one:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `mysql://root:password@mysql.railway.internal:3306/budget_disburse` |
| `NODE_ENV` | `production` |
| `AUTH_SECRET` | (paste your random string from step 4.2) |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD_HASH` | (paste your bcrypt hash from step 4.2) |

✅ **Railway will auto-redeploy after variables are saved**

### **Step 5: Initialize Database**

Once deployment is complete:

1. Go to **Next.js** service → **"Deploy"** tab
2. Click the latest deployment
3. Open the **Public URL** in your browser
4. If you see a connection error, run migrations:
   ```bash
   # From your local machine:
   railway login
   railway link
   npm run prisma:migrate
   ```

### **Step 6: Test Your Login**
1. Open your Railway app URL from the deployment
2. Login with:
   - **Username:** `admin`
   - **Password:** (the one you hashed in step 4.2)
3. Check if Dashboard loads without errors

---

## ✅ Verification Checklist

After everything is deployed, verify:

- [ ] Application loads at Railway URL
- [ ] Admin login works
- [ ] Dashboard displays
- [ ] Can add budget
- [ ] Can view disbursements
- [ ] Database queries work

---

## 🛠️ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| **Build fails** | Check package.json for correct dependencies |
| **Database won't connect** | Verify `DATABASE_URL` and MySQL service is running (green icon) |
| **Login fails** | Ensure `AUTH_SECRET` and `ADMIN_PASSWORD_HASH` are set |
| **502 Error** | Check application logs in Railway dashboard |
| **Application won't start** | Check if all environment variables are set |

---

## 📱 View Logs in Railway

If something goes wrong:
1. Go to your service in Railway
2. Click **"Logs"** tab
3. Look for red error messages
4. Copy the error and search the [troubleshooting guide](RAILWAY_DEPLOYMENT.md)

---

## 🔄 After Deployment: How to Update

Every time you make code changes:

```bash
# From your local machine:
cd c:\Projects\Budget-Disburse
git add .
git commit -m "Your changes"
git push origin main
```

Railway will **automatically redeploy** in 2-3 minutes.

---

## 📚 Need Help?

- Full guide: See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)
- Railway docs: https://docs.railway.app
- Next.js guide: https://nextjs.org/docs/deployment/railway

