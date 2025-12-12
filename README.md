Project: Budget-Disburse

Environment variables required for secure admin-only login:

- `AUTH_SECRET` or `NEXTAUTH_SECRET` - secret used to sign JWT tokens. Set to a long random string in production.
- `ADMIN_PASSWORD_HASH` - bcrypt hash of the admin password. Recommended: generate using `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"` and set in env.
- `ADMIN_USERNAME` (optional) - admin username, defaults to `admin`.
- `ADMIN_PASSWORD` (optional) - plaintext fallback for development only. Do NOT set in production.

Notes:
- The app issues an HTTP-only `auth-token` cookie containing a signed JWT on successful login.
- The middleware protects routes by checking for the presence of `auth-token`. `/api/auth/check` validates the token signature.
- For hardening, use `ADMIN_PASSWORD_HASH` and a proper `AUTH_SECRET` in production.




# Requirements 
````
MYSQL
HeidiSQL
Prisma
````

# Powershell
````bash
npm install
npm run dev
````

## to migrate db
step 1 run this command in terminal
````bash
npm install prisma @prisma/client mysql2
````

## make a .env file and copy-paste
````
DATABASE_URL="mysql://root:password@localhost:3306/budget_disburse"
````

## open Heidi Sql 
- create session
- user:root
- password:password
- port:3306

## create db name
budget_disburse and run finaldisburse.sql in query

## run terminal
````bash
npm run dev
````









