-- ============================================================
-- Invoice Management System — Initial Schema
-- Database: PostgreSQL
-- ============================================================

-- Roles are kept in their own table rather than a plain enum column
-- so new roles (e.g. "auditor") can be added later without a migration
-- that touches the users table itself.
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL   -- 'admin', 'accountant', 'viewer'
);

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id     INTEGER NOT NULL REFERENCES roles(id),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE customers (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    email       VARCHAR(150),
    phone       VARCHAR(30),
    address     TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Status is modelled as its own lookup table (not a free-text column)
-- so dashboard aggregation (COUNT/SUM by status) stays cheap and typo-proof.
CREATE TABLE invoice_statuses (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(20) UNIQUE NOT NULL   -- 'paid', 'pending', 'overdue'
);

CREATE TABLE invoices (
    id              SERIAL PRIMARY KEY,
    invoice_number  VARCHAR(20) UNIQUE NOT NULL,   -- e.g. FF-1024
    customer_id     INTEGER NOT NULL REFERENCES customers(id),
    status_id       INTEGER NOT NULL REFERENCES invoice_statuses(id),
    issue_date      DATE NOT NULL,
    due_date        DATE NOT NULL,
    total_amount    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_by      INTEGER REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE line_items (
    id              SERIAL PRIMARY KEY,
    invoice_id      INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description     VARCHAR(255) NOT NULL,
    quantity        NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price      NUMERIC(12, 2) NOT NULL,
    line_total      NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ---------- Indexes for the operations the UI actually performs ----------

-- Filtering/sorting by status and date is the #1 thing the Invoice Listing does
CREATE INDEX idx_invoices_status ON invoices(status_id);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);

-- Search box matches on invoice_number and customer name
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_customers_name ON customers(name);

CREATE INDEX idx_line_items_invoice ON line_items(invoice_id);

-- ---------- Seed lookup tables ----------
INSERT INTO roles (name) VALUES ('admin'), ('accountant'), ('viewer');
INSERT INTO invoice_statuses (name) VALUES ('paid'), ('pending'), ('overdue');