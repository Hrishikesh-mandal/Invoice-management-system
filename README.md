# Invoice Management System

A full-stack invoice management app built as a course assignment — React/Tailwind frontend, Express/PostgreSQL backend, JWT auth with role-based access control.

## Features

**Dashboard**
- Total invoices, paid invoices, pending amount, overdue invoices (live aggregated stats)

**Invoice Listing**
- Table view with search, status filter, date range filter
- Sortable columns (invoice number, customer, status, date, amount)
- Server-side pagination
- Bulk selection with bulk delete
- CSV export (filtered or selected rows)

**Invoice Details**
- Invoice summary + line items
- Download invoice (browser print dialog — can "Save as PDF")
- Status update (paid / pending / overdue)

**Create Invoice**
- Customer selection, dynamic line items, live total calculation
- Full server-side validation

**Role-Based Access Control**
- Three roles: `admin`, `accountant`, `viewer`
- Enforced **server-side** via middleware (not just hidden UI buttons)

| Action | Admin | Accountant | Viewer |
|---|---|---|---|
| View invoices/dashboard | ✅ | ✅ | ✅ |
| Create/edit invoices | ✅ | ✅ | ❌ |
| Update invoice status | ✅ | ✅ | ❌ |
| Export CSV | ✅ | ✅ | ❌ |
| Delete invoices | ✅ | ❌ | ❌ |

## Tech Stack

- **Frontend**: React, React Router, Tailwind CSS, Vite, Axios
- **Backend**: Node.js, Express, JWT, bcrypt
- **Database**: PostgreSQL (hosted on [Neon](https://neon.tech))
- **Testing**: Jest, Supertest (53 tests — API architecture, form handling, table performance)

## Project Structure

```
invoice-management-system/
├── client/          # React frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/         # Route-level pages
│       ├── hooks/         # useInvoices, useRole, useDebounce
│       ├── context/       # AuthContext
│       ├── services/      # API layer (axios)
│       └── routes/        # React Router setup
├── server/          # Express backend
│   ├── src/
│   │   ├── models/        # SQL queries
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # Route definitions
│   │   ├── middleware/    # Auth + role-check
│   │   ├── services/      # CSV export
│   │   └── db/             # Migrations + seed script
│   └── tests/        # Jest/Supertest suite
└── README.md
```

## Prerequisites

- Node.js (v18+)
- A PostgreSQL database — this project uses [Neon](https://neon.tech) (free tier, no local install needed). Any Postgres instance works if you'd rather run one locally, but the setup below assumes Neon.

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/invoice-management-system.git
cd invoice-management-system
```

### 2. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) and create a new project
2. Copy the connection string from your project dashboard (looks like `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`)

### 3. Backend setup

```bash
cd server
npm install
```

Create `server/.env`:

```
PORT=4000
DATABASE_URL=your_neon_connection_string_here
JWT_SECRET=replace_with_a_long_random_string
```

Run the schema migration against your Neon database:

```bash
psql "your_neon_connection_string_here" -f src/db/migrations/001_init_schema.sql
```

(If you don't have `psql` installed locally, you can instead paste the contents of `001_init_schema.sql` into Neon's built-in SQL Editor and run it there.)

Seed the database with test data (250 invoices, 8 customers, 3 role-based users):

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

Server runs at `http://localhost:4000`.

### 4. Frontend setup

In a new terminal:

```bash
cd client
npm install
```

Create `client/.env`:

```
VITE_API_URL=http://localhost:4000/api
```

Start the frontend:

```bash
npm run dev
```

App runs at `http://localhost:5173`.

## Test Users

All seeded with password `password123`:

| Email | Role |
|---|---|
| `admin@freightfox.test` | admin |
| `accountant@freightfox.test` | accountant |
| `viewer@freightfox.test` | viewer |

## Running Tests

```bash
cd server
npm test
```

53 tests covering:
- **API architecture** — auth, role enforcement, listing/filtering/sorting correctness
- **Form handling** — Create Invoice validation (client and server)
- **Table performance** — response time and pagination correctness at 250+ row scale

## Known Limitations

- "Download Invoice" uses the browser's print dialog (can save as PDF manually) rather than generating a formatted PDF server-side.
- No frontend test suite — backend is covered by Jest/Supertest; the React app has no Vitest/RTL tests.