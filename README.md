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

Run locally:

```powershell
npm install
npm run dev
```

## New: Logging (Audit trail)

This project now includes a `log` Prisma model and a server-side logging utility that records create/update/delete operations for budgets, disbursements, expenses, and offices.

To enable the new `log` table in your database, run:

```powershell
npx prisma migrate dev --name add_log_model
npx prisma generate
```

This creates the new table and regenerates the Prisma client so the TypeScript types for `log` are available.

When the addition `performedBy` is required to capture who performed an action, the migration will also add the `performedBy` field to `log` table automatically.


