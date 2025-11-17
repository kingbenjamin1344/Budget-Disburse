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

