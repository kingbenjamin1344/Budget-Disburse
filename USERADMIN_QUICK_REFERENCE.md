# UserAdmin Table - Quick Reference Guide

## 🎯 Quick Access Methods

### Method 1: DBeaver (Visual, Easiest for Windows Users)

1. **Download & Install** → https://dbeaver.io/download/
2. **Create MySQL Connection:**
   - **Database:** MySQL
   - **Host:** `gateway.railway.app`
   - **Port:** Get from Railway MySQL "Connect" tab (e.g., 12345)
   - **Username:** `root`
   - **Password:** Get from Railway MySQL "Connect" tab
   - **Database:** `budget_disburse`
3. **Test & Connect**
4. **Browse:** Databases → budget_disburse → Tables → useradmin
5. **Right-click useradmin** → View Table / Edit Data

### Method 2: Railway MySQL Console (Fastest from Railway)

1. Go to **Railway Dashboard**
2. Click **MySQL service**
3. Click **Plugins tab**
4. Install **MySQL Client**
5. Click plugin → Open console

```sql
USE budget_disburse;
SELECT id, username, createdAt, updatedAt FROM useradmin;
```

### Method 3: HeidiSQL (Windows Native)

1. **Download** → https://www.heidisql.com/
2. **New Connection:**
   - Host: `gateway.railway.app`
   - Port: Your external port from Railway (e.g., 12345)
   - User: `root`
   - Password: Your MySQL password
3. **Left panel:** budget_disburse → Tables → right-click useradmin
4. **Click "Open table" or "Edit table"**

### Method 4: Terminal/PowerShell (No GUI)

```powershell
# Windows PowerShell
mysql -h gateway.railway.app -P 12345 -u root -p

# Then in MySQL prompt:
USE budget_disburse;
SELECT * FROM useradmin;
```

---

## 📊 UserAdmin Table Structure

```sql
┌─────────┬───────────┬──────────┬──────────────┬──────────────┐
│   ID    │ USERNAME  │ PASSWORD │   CREATEDAT  │   UPDATEDAT  │
├─────────┼───────────┼──────────┼──────────────┼──────────────┤
│ 1       │ admin     │ $2b$10$  │ 2024-01-15   │ 2024-01-15   │
│         │           │ ...hash  │ 10:30:00     │ 10:30:00     │
└─────────┴───────────┴──────────┴──────────────┴──────────────┘
```

**Fields:**
- `id` - Auto-incrementing primary key
- `username` - Unique admin username (never change directly)
- `password` - Bcrypt hashed password (256 character hash)
- `createdAt` - When account was created
- `updatedAt` - When account was last updated

---

## 🔍 Essential SQL Queries

### View All Admins
```sql
USE budget_disburse;
SELECT id, username, createdAt, updatedAt FROM useradmin;
```

### Find Specific Admin
```sql
SELECT * FROM useradmin WHERE username = 'admin';
```

### Count Total Admins
```sql
SELECT COUNT(*) as admin_count FROM useradmin;
```

### See Full Hash (for verification)
```sql
SELECT username, password, createdAt FROM useradmin;
```

### Add New Admin
```sql
INSERT INTO useradmin (username, password, createdAt, updatedAt)
VALUES ('newadmin', '$2b$10$', NOW(), NOW());
```

Replace `$2b$10$` with actual bcrypt hash.

### Delete Admin (Be Careful!)
```sql
DELETE FROM useradmin WHERE username = 'oldadmin';
```

### Check Table Structure
```sql
DESCRIBE useradmin;
```

---

## 🚀 First-Time Setup Checklist

After Railway MySQL deploys:

- [ ] 1. Migrations run successfully: `npx prisma migrate deploy`
- [ ] 2. useradmin table exists: `SHOW TABLES LIKE 'useradmin';`
- [ ] 3. Create initial admin user or verify exists
- [ ] 4. Can connect with credentials locally
- [ ] 5. Can query the table with DBeaver or MySQL client
- [ ] 6. Test login on production app
- [ ] 7. Verify admin session persists

---

## ⚠️ Troubleshooting Connection

### "Access denied for user 'root'@'..'"
- Check password in DATABASE_URL is correct
- Verify credentials from Railway MySQL "Connect" tab
- Test locally first with external host

### "Can't resolve host gateway.railway.app"
- Check internet connection
- Verify host is spelled correctly: `gateway.railway.app`
- Try with IP instead: Get from Railway Connect tab

### "Table doesn't exist"
- Run: `npx prisma migrate deploy`
- This creates all tables from schema.prisma
- Verify with: `SHOW TABLES;` in MySQL

### "Connection timeout"
- MySQL service might be starting (takes 2-3 min)
- Check Railway MySQL service status = "Running"
- Try again after waiting

---

## 💡 Common Operations

### Add Admin If Table Empty
```sql
INSERT INTO useradmin (username, password)
VALUES ('admin', '$2b$10$your-bcrypt-hash-here');
```

### Change Admin Password
```sql
UPDATE useradmin 
SET password = '$2b$10$new-bcrypt-hash-here'
WHERE username = 'admin';
```

### Reset Admin Password (Step-by-step)
1. Generate new bcrypt hash locally:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('NewPassword123', 10))"
   ```
2. Copy the hash
3. Run in MySQL:
   ```sql
   UPDATE useradmin 
   SET password = '$2b$10$...paste-hash...'
   WHERE username = 'admin';
   ```
4. Log in with new password

### View All Columns
```sql
SELECT * FROM useradmin\G  -- \G formats output vertically
```

---

## 🔐 Security Notes

1. **Never log passwords** - Only hashes are stored
2. **Use strong passwords** - Requirements should be enforced in app
3. **Bcrypt hashes are one-way** - Can't reverse them (that's the point)
4. **Restrict external MySQL access** - Use internal network when possible
5. **Audit trails** - Check `log` table for admin actions

---

## Railway Configuration Reference

### Getting MySQL Details in Railway

```
Dashboard → MySQL Service → Connect Tab
↓
Shows:
- MySQL URL (for code)
- Host (internal): container-xyz.railway.internal
- Host (external): gateway.railway.app
- Port (internal): 3306
- Port (external): 12345 (changes per deployment)
- User: root
- Password: xxxxxxxxxxxxx
- Database: railway (create budget_disburse)
```

### Next.js Service Configuration

```
Dashboard → Next.js Service → Variables Tab
↓
Set:
- DATABASE_URL = mysql://root:pass@container-xyz.railway.internal:3306/budget_disburse
- AUTH_SECRET = {32-byte-base64}
- ADMIN_PASSWORD_HASH = {bcrypt-hash}
- ADMIN_USERNAME = admin
- NODE_ENV = production
```

---

## 📞 When Things Go Wrong

### Step 1: Check Deployment Logs
```
Railway Dashboard → Your App → Deployments
↓
Click latest deployment → View Logs
Look for: ERROR, FAIL, refused connection
```

### Step 2: Verify Variables
```
Railway Dashboard → Your App → Variables
↓
Verify each value is set correctly
Check DATABASE_URL has all components
```

### Step 3: Test Locally
```bash
# Copy DATABASE_URL from Railway
set DATABASE_URL=mysql://root:pass@gateway.railway.app:12345/budget_disburse

# Test connection
npx prisma db execute --stdin < /dev/null

# Or run migrations
npx prisma migrate deploy
```

### Step 4: Restart Service
```
Railway Dashboard → Your App → Settings → Restart Deployment
```

---

**All set!** You can now access and manage the useradmin table in production. 🎉
