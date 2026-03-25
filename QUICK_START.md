# 🚀 Budget-Disburse: Railway Deployment Quick Start

**Get your app live in 15 minutes!**

---

## 📝 What You Need

- Railway account (free at railway.app)
- GitHub account linked to Railway  
- This project committed to GitHub

---

## ⚡ 3-Minute Summary

1. **Generate secrets** (auth + password hash)
2. **Deploy from GitHub** in Railway dashboard
3. **Add MySQL database**
4. **Set environment variables**
5. **Done!**

---

## 🎯 Step-by-Step

### 1️⃣ Generate Your Secrets (2 min)

Open **PowerShell** and run:

```powershell
# Generate AUTH_SECRET (random security key)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Copy the output** - you'll need it later.

```powershell
# Generate admin password hash
# Replace 'MyPassword123' with your actual admin password
node -e "console.log(require('bcryptjs').hashSync('MyPassword123', 10))"
```
**Copy the output** too - it starts with `$2b$10$...`

### 2️⃣ Commit & Push Code (1 min)

```powershell
cd c:\Projects\Budget-Disburse
git add .
git commit -m "Ready for Railway"
git push
```

### 3️⃣ Deploy in Railway (5 min)

1. Go to https://railway.app/dashboard
2. **New Project** → **Deploy from GitHub**
3. Select `Budget-Disburse` repo
4. Click **Deploy** (wait for green checkmark)

### 4️⃣ Add Database (2 min)

1. In Railway: Click **+ New**
2. Select **Database** → **MySQL**
3. Wait for it to start

### 5️⃣ Configure Variables (3 min)

1. Click on **Next.js service** (the main app)
2. Go to **Variables** tab
3. Click **Raw Editor** and paste:

```
DATABASE_URL=mysql://root:YOUR_PASSWORD@mysql.railway.internal:3306/budget_disburse
NODE_ENV=production
AUTH_SECRET=YOUR_SECRET_FROM_STEP_1
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=YOUR_HASH_FROM_STEP_1
```

Replace:
- `YOUR_PASSWORD` - Get from MySQL "Variables" tab, copy the password part
- `YOUR_SECRET_FROM_STEP_1` - Paste your random string
- `YOUR_HASH_FROM_STEP_1` - Paste your bcrypt hash

4. **Deploy** (Railway auto-redeploys)

### 6️⃣ Test It Works

1. Wait 2 min for deployment
2. Click the **URL** under Next.js service
3. Login with:
   - Username: `admin`
   - Password: *(the one you hashed)*

✅ **Done!**

---

## 📖 Detailed Guides

- **Full setup with troubleshooting:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Advanced configuration:** [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)

---

## 🆘 Something Not Working?

| Problem | Solution |
|---------|----------|
| Build failed | Check your `git push` - Railway auto-rebuilds |
| Can't log in | Verify `ADMIN_PASSWORD_HASH` variable is set |
| Database error | Ensure `DATABASE_URL` contains correct password |
| 502 error | Check app logs in Railway - click **Logs** tab |

**Still stuck?** Check the logs:
- Railway → Your service → **Logs** tab → Look for red errors

---

## 🔄 After Deployment

Every time you update code:

```powershell
git add .
git commit -m "Your changes"
git push
```

Railway automatically redeploysin 2-3 minutes ✅

---

## 📚 What's Been Set Up

✅ Node.js version specified (.node-version)  
✅ Railway configuration file (railway.json)  
✅ Environment variables template (.env.example)  
✅ Database migration scripts in package.json  
✅ Full deployment guides  

Everything is ready to deploy! 🎉
