# Budget-Disburse: Simple Architecture Overview

## 3-Tier Architecture

### 1. **Frontend (React + Next.js)**
- User interface pages (Dashboard, Disbursement, Budget, Logs, Reports)
- Forms for data entry
- Charts and tables for data display
- Client-side caching

### 2. **Backend API (Next.js Routes)**
- CRUD operations for all entities
- User authentication & authorization
- Input validation
- Audit logging
- Response caching

### 3. **Database (MySQL)**
- Stores all business data:
  - `budget` - Budget allocations by office
  - `disbursement` - Payment vouchers
  - `office` - Organization units
  - `expense` - Expense types
  - `logs` - Audit trail
  - `useradmin` - User credentials

## Key Features

| Feature | Details |
|---------|---------|
| **Authentication** | JWT tokens + HTTP-only cookies |
| **Authorization** | Admin-only access via middleware |
| **Performance** | Parallel API calls, client caching (5 min), server caching (60 sec) |
| **Security** | Password hashing, input validation, SQL injection prevention |
| **Scalability** | Pagination, database indexing, lazy loading |
| **Offline OCR** | Tesseract.js for document scanning |
| **Reporting** | PDF export for SOE reports |
| **Audit Trail** | All operations logged with timestamp and user |

## Technology Stack

- **Frontend**: React 19, Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, TypeScript
- **Database**: MySQL 8.0+
- **ORM**: Prisma
- **Auth**: JWT + bcryptjs
- **Charts**: Recharts
- **OCR**: Tesseract.js
- **PDF**: jsPDF + html2canvas

## Data Flow

```
User Input → Validation → API Route → Prisma ORM → MySQL → Response → Frontend Cache
```

## Deployment

- **Local**: `npm install` → `.env setup` → `npm run dev`
- **Production**: `npm run build` → `npm start`
- **Cloud**: Railway, Docker, or traditional Node.js hosting
