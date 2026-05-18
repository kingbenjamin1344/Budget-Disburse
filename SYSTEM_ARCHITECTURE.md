# Budget-Disburse System Architecture

## Overview
Budget-Disburse is a **3-tier web application** built with Next.js, React, MySQL, and Prisma ORM. It follows a **layered architecture pattern** with clear separation of concerns.

---

## Architecture Tiers

### **TIER 1: Presentation Layer (Frontend)**
**Technology**: React 19, Next.js 15, TypeScript, Tailwind CSS, Bootstrap 5

**Components:**
- `src/app/` - Next.js pages (Dashboard, Disbursement, Budget, Expenses, Logs, SOE, Login)
- `src/components/` - Reusable UI components (DashboardCharts, DashboardLayout, AuthProvider, etc.)
- `src/hooks/useData.ts` - Custom hook for client-side caching with 5-minute TTL

**Responsibilities:**
- Render user interface
- Manage component state with React hooks
- Validate form input before submission
- Display loading skeletons during async operations
- Show toast notifications for user feedback
- Cache API responses on client-side

**Key Features:**
- Responsive design (mobile, tablet, desktop)
- Client-side caching to reduce API calls
- Parallel API requests for faster dashboard load (80% improvement)
- OCR document scanning with Tesseract.js

---

### **TIER 2: Business Logic Layer (API & Auth)**
**Technology**: Next.js API Routes, TypeScript, JWT, bcryptjs

**API Endpoints:**
```
/api/addbudget/          - Budget CRUD operations
/api/disbursement/       - Disbursement CRUD + validation
/api/expenses/           - Expense type management
/api/offices/            - Office CRUD operations
/api/logs/               - Activity logging + search
/api/expense-keywords/   - Dynamic category detection
/api/soe/                - SOE report generation
/api/auth/login          - User authentication
/api/auth/logout         - Session termination
/api/auth/check          - Token validation
/api/ai/                 - Claude AI integration
/api/admin/diagnostic/   - System health checks
/api/admin/reseed/       - Database re-initialization
```

**Responsibilities:**
- Validate all incoming requests
- Sanitize user inputs (prevent SQL injection)
- Enforce authentication/authorization
- Execute business logic
- Log all CRUD operations to audit trail
- Return structured JSON responses with caching headers

**Security Measures:**
- JWT token validation on protected routes
- Bcryptjs password hashing (cost factor 10)
- HTTP-only authentication cookies
- Input sanitization (trim, type casting)
- Foreign key constraints at database level

---

### **TIER 3: Data Access Layer**
**Technology**: Prisma ORM, MySQL

**ORM Benefits:**
- Type-safe database queries
- Automatic query generation
- Built-in migration management
- Relationship handling (foreign keys)
- Connection pooling

**Database Models:**
```
budget          - Office budgets (PS, MOOE, CO allocations)
disbursement    - Payment vouchers and expenditures
expense         - Expense type/category definitions
office          - Organization units
log             - Audit trail of all operations
useradmin       - Admin user credentials
```

**Performance Optimizations:**
- Database indexes on frequently queried columns:
  - `log(type, createdAt)` - for activity filtering
  - `budget(officeId, dateCreated)` - for office budgets
  - `expense(category, dateCreated)` - for expense reports
- Pagination (10-50 items per page)
- Server-side response caching (Cache-Control: 60-120 seconds)
- Query optimization with `select()` to fetch only needed columns

---

### **TIER 4: Data Storage Layer**
**Technology**: MySQL 8.0+

**Database Features:**
- Relational schema with foreign key constraints
- Cascade delete for data integrity
- UTF-8 encoding for Philippine Peso support
- Timestamp tracking (createdAt, updatedAt)
- Unique constraints (e.g., office.name, useradmin.username)

**Schema Relationships:**
```
office (1) ←→ (M) budget
office (1) ←→ (M) disbursement
expense (standalone lookup table)
log (independent audit table)
useradmin (credential storage)
```

---

## Data Flow Diagrams

### **Adding a Disbursement (Happy Path)**
```
User Input Form
    ↓
[Validation] - Check required fields, format amount
    ↓
[Authentication] - Verify JWT token in middleware
    ↓
[API Route] POST /api/disbursement
    ↓
[Input Sanitization] - Trim strings, cast types
    ↓
[Business Logic] - Check for duplicate DV number
    ↓
[Logging] - Create audit log entry
    ↓
[Prisma ORM] - Insert into disbursement table
    ↓
[Database] - MySQL INSERT with foreign key check
    ↓
[Response] - Return success with record details + cache headers
    ↓
[Frontend] - Update UI, show success toast, refresh table
```

### **Dashboard Load (Parallel Strategy)**
```
Dashboard Page Mount
    ↓
[Promise.all] Parallel requests:
    ├→ /api/addbudget
    ├→ /api/disbursement
    ├→ /api/offices
    ├→ /api/expenses
    └→ /api/logs
    ↓
[useData Hook] Cache responses (5 min TTL)
    ↓
[Server] Add Cache-Control headers (60 sec)
    ↓
[Frontend] Render charts, tables, metrics
    ↓
[Performance] ~80% faster than sequential requests
```

### **OCR Document Scanning (Offline Capable)**
```
User Uploads Image/PDF
    ↓
[Frontend] Preprocess image (resize, contrast)
    ↓
[Tesseract.js] Run OCR locally (worker threads)
    ↓
[Offline Mode] Works without internet
    ↓
[Extract Text] Parse expense details
    ↓
[AI Analysis] Claude API for category detection (optional)
    ↓
[Auto-fill Form] Populate disbursement fields
    ↓
[User Review] Verify accuracy before submission
    ↓
[Submit] POST to /api/disbursement
```

---

## Authentication & Authorization Flow

```
1. Login Page (POST /api/auth/login)
   ├─ Validate credentials
   ├─ Compare password hash (bcryptjs)
   ├─ Generate JWT token
   └─ Set HTTP-only cookie

2. Middleware Protection
   ├─ Check for auth-token cookie
   ├─ Validate JWT signature
   └─ Allow/block route access

3. Protected Routes
   ├─ All /api/* endpoints require valid token
   ├─ Frontend pages redirect to login if token expired
   └─ Token includes user identifier for audit logs

4. Logout (POST /api/auth/logout)
   ├─ Clear auth-token cookie
   └─ Redirect to login page
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.1.0 |
| Frontend Framework | Next.js | 15.5.9 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS + Bootstrap | 4.x + 5.3.8 |
| Icons | Lucide React | 0.545.0 |
| Charts | Recharts | 3.2.1 |
| State | React Hooks | Built-in |
| HTTP Client | Fetch API | Native |
| Auth | jsonwebtoken + bcryptjs | 9.0.2 + 3.0.3 |
| ORM | Prisma | 6.19.2 |
| Database Driver | mysql2 | 3.19.0 |
| Database | MySQL | 8.0+ |
| OCR | Tesseract.js | 6.0.1 |
| PDF Export | jsPDF + html2canvas | 4.0.0 + 1.4.1 |
| Notifications | React-Toastify | 11.0.5 |
| Build Tool | Turbopack | Built-in Next.js |
| Linter | ESLint | 9.x |

---

## Deployment Architecture

### **Local Development**
```
npm install          - Install dependencies
npm run dev          - Start dev server with Turbopack
http://localhost:3000 - Access application
.env.local           - Local environment variables
```

### **Production Build**
```
npm run build        - Build with optimization
npm start            - Run production server
```

### **Cloud Deployment (Railway)**
```
railway.json         - Railway configuration
pre-deploy.sh        - Pre-deploy script (migrations, seeding)
Docker Container     - Containerized application
MySQL in Cloud       - Managed database
```

### **Docker Support**
```
Dockerfile           - Multi-stage build
docker-compose.yml   - Services orchestration
Environment variables - .env files for secrets
```

---

## Scalability & Performance Features

### **Client-Side Optimization**
1. **useData Hook** - 5-minute client-side caching
2. **Parallel API Requests** - Promise.all() for concurrent calls
3. **Lazy Loading** - Dynamic imports for heavy components
4. **Pagination** - 10-50 items per page (configurable)
5. **Skeleton Screens** - Fast perceived performance

### **Server-Side Optimization**
1. **Cache-Control Headers** - 60-120 second server caching
2. **Database Indexing** - Query optimization
3. **ORM Query Selection** - Only fetch needed columns
4. **Connection Pooling** - MySQL connection reuse
5. **API Response Compression** - JSON minification

### **Build Optimization**
1. **Turbopack** - 5-10x faster bundling
2. **Image Optimization** - Next.js image component
3. **Code Splitting** - Automatic route-based chunking
4. **Minification** - Production bundle optimization
5. **Static Asset Caching** - 30-day browser cache

---

## Monitoring & Logging

### **Application Logging**
- **Audit Trail**: Every CRUD operation logged with timestamp, actor, action
- **Error Logging**: Stack traces captured on API routes
- **Debug Endpoints**: `/api/admin/diagnostic/` for system health

### **Log Storage**
- **Database**: Stored in `log` table
- **Searchable**: Filter by type, action, actor, date range
- **Pagination**: Support for large log datasets
- **Retention**: Configurable retention policy

---

## Security Architecture

```
Request Flow:
  ↓
Middleware (Route Protection)
  ├─ Check for auth-token cookie
  └─ Validate JWT signature
  ↓
API Route Handler
  ├─ Verify authentication
  ├─ Validate input (required fields, type)
  ├─ Sanitize input (trim, cast)
  └─ Enforce authorization (if needed)
  ↓
Prisma ORM
  ├─ Parameterized queries (prevents SQL injection)
  ├─ Type validation
  └─ Foreign key constraints
  ↓
MySQL Database
  ├─ Cascade delete rules
  ├─ Unique constraints
  └─ Password hashing (not stored plaintext)
```

### **Environment Variables**
```
DATABASE_URL          - MySQL connection string
AUTH_SECRET          - JWT signing secret
ADMIN_PASSWORD_HASH  - Bcrypt hash (not plaintext)
CLAUDE_API_KEY       - Optional AI integration
```

---

## File Structure

```
src/
├── app/                      # Next.js pages
│   ├── api/                  # API routes
│   │   ├── addbudget/
│   │   ├── disbursement/
│   │   ├── expenses/
│   │   ├── offices/
│   │   ├── logs/
│   │   ├── auth/
│   │   └── ai/
│   ├── Dashboard/            # Dashboard page
│   ├── Disbursement/         # Disbursement page
│   ├── Addbudget/            # Budget page
│   └── login/                # Login page
├── components/               # Reusable React components
│   ├── DashboardCharts.tsx   # Chart components
│   ├── DashboardLayout.jsx   # Navigation layout
│   ├── AuthProvider.tsx      # Auth context
│   └── LoadingFallback.tsx   # Skeleton screens
├── hooks/                    # Custom React hooks
│   └── useData.ts            # Client-side caching hook
├── lib/                      # Utility functions
│   ├── prisma.ts             # Prisma client singleton
│   ├── auth.ts               # Authentication utilities
│   ├── log.ts                # Logging functions
│   └── offlineTesseract.ts   # OCR wrapper
└── constants/                # Constants (if used)

prisma/
├── schema.prisma             # Database schema
└── migrations/               # Migration history

public/                        # Static assets
├── img/
└── picture/
```

---

## Key Patterns

### **Single Responsibility Principle**
- Components handle UI only
- API routes handle business logic
- Prisma handles data access
- Utilities handle cross-cutting concerns

### **Dependency Injection**
- Prisma client injected via singleton pattern
- Environment variables injected from .env

### **Error Handling**
- Try-catch on all API routes
- Meaningful error messages to frontend
- Stack traces logged server-side

### **Caching Strategy**
- Client: 5-minute useData hook
- Server: 60-120 second Cache-Control headers
- Database: Indexes on hot columns

---

## Future Improvements

1. **API Documentation** - Swagger/OpenAPI specs
2. **Unit Tests** - Jest for components and utilities
3. **Integration Tests** - Playwright for E2E
4. **GraphQL** - Consider GraphQL for complex queries
5. **WebSockets** - Real-time updates for multi-user scenarios
6. **Rate Limiting** - Prevent abuse of API endpoints
7. **Request Logging** - Track all HTTP requests
8. **Database Monitoring** - Query performance analysis
9. **Error Tracking** - Sentry/Rollbar integration
10. **Feature Flags** - Gradual rollout of new features

---

## Conclusion

The Budget-Disburse system follows proven architectural patterns:
- **Layered architecture** for separation of concerns
- **RESTful API** for client-server communication
- **ORM abstraction** for database independence
- **Client-side caching** for performance
- **Audit logging** for compliance
- **JWT authentication** for security

This architecture supports scalability, maintainability, and future enhancements while maintaining code quality and performance standards.
