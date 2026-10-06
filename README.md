# HealthShield Nigeria — Enterprise HMO Management Platform

> Built from the **Complete HMO Master Blueprint** — a comprehensive enterprise specification covering 13 operational domains.

---

## 🏥 Overview

HealthShield HMO is a full-stack, API-first enterprise Health Maintenance Organization management platform designed for the Nigerian market. It manages the entire HMO ecosystem including members, providers, employers, claims, authorizations, finance, and compliance.

**Currency:** Nigerian Naira (₦)  
**Architecture:** React + Node.js/Express + PostgreSQL  
**Auth:** JWT + RBAC + ABAC

---

## 📁 Project Structure

```
Complete HMO/
├── backend/          # Node.js/Express REST API
├── frontend/         # React web application
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Database Setup
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE hmo_platform;"
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials

npm install
npm run db:migrate   # Create all tables
npm run db:seed      # Seed demo data
npm run dev          # Start on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start            # Start on http://localhost:3000
```

### 4. Login
| Email | Password | Role |
|-------|----------|------|
| admin@healthshield.ng | Admin@123 | Super Admin |

---

## 📋 Platform Modules (13 Parts)

| Part | Module | Status |
|------|--------|--------|
| I | Product & Business Foundation | ✅ |
| II | HMO Core Modules | ✅ |
| III | Financial Operations | ✅ |
| IV | Enterprise Access Control & Identity | ✅ |
| V | Member, Employer, Provider & Enrollment Architecture | ✅ |
| VI | Healthcare Operations & Medical Management | ✅ |
| VII | Claims Management & Adjudication | ✅ |
| VIII | Customer Experience & Communication | ✅ |
| IX | Data Architecture & Master Data Management | ✅ |
| X | Enterprise Technical Architecture & Infrastructure | ✅ |
| XI | Security Architecture, Cybersecurity & Compliance | ✅ |
| XII | Reporting, BI, Analytics & Decision Intelligence | ✅ |
| XIII | Integration Architecture & Interoperability | ✅ |

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Super Admin** | Full platform access |
| **Operations Manager** | Members, Enrollment, Providers |
| **Claims Officer** | Claims intake, review, adjudication |
| **Finance Officer** | Invoices, payments, settlements |
| **Medical Officer** | Authorizations, medical review |
| **Customer Service** | Cases, communications, member queries |

---

## 🔗 Key API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user
- `POST /api/auth/logout` — Logout

### Dashboard
- `GET /api/dashboard/stats` — Platform-wide statistics

### Members
- `GET /api/members` — List (paginated, filterable)
- `POST /api/members` — Create
- `GET /api/members/:id` — Detail
- `PUT /api/members/:id` — Update

### Claims
- `GET /api/claims` — List claims
- `POST /api/claims` — Submit claim
- `POST /api/claims/:id/approve` — Approve
- `POST /api/claims/:id/deny` — Deny
- `POST /api/claims/:id/pay` — Process payment

### Authorizations
- `GET /api/authorizations` — List preauths
- `POST /api/authorizations` — Request preauth
- `POST /api/authorizations/:id/approve` — Approve
- `POST /api/authorizations/:id/deny` — Deny

### Finance
- `GET /api/finance/invoices` — Premium invoices
- `GET /api/finance/payments` — Payment records
- `GET /api/finance/settlements` — Provider settlements
- `GET /api/finance/reports/summary` — Financial summary

---

## 🔒 Security Features

- JWT authentication with expiry
- RBAC (Role-Based Access Control)
- ABAC (Attribute-Based Access Control)
- Rate limiting (100 req/15min)
- SQL injection prevention (parameterized queries)
- Helmet.js security headers
- Comprehensive audit logging
- Security event monitoring
- Segregation of duties enforcement

---

## 📊 Database Schema

Key entities and their relationships:

```
organizations
    └── departments
    └── users (roles, permissions)

members ──────────── employers
    └── dependants   └── premium_invoices
    └── enrollments      └── payments
        └── plans
            └── plan_benefits

providers
    └── provider_locations
    └── provider_settlements

authorizations (preauth)
    └── claims
        └── claim_items

service_cases
    └── communications

audit_logs
security_events
notifications
```

---

## 🏗️ Architecture Principles

1. **Least Privilege** — Users only get what they need
2. **Deny by Default** — Access denied unless explicitly granted
3. **Separation of Duties** — Critical processes split across roles
4. **No Frontend Authorization** — Every operation verified server-side
5. **Every Sensitive Action Is Traceable** — Full audit trail
6. **Historical Integrity** — No destructive modifications
7. **Unknown Failure = Safe Failure** — Controlled degradation

---

## 📈 Supported Workflows

### Member Enrollment
```
PROSPECT → APPLICATION → PENDING_VERIFICATION → VERIFIED → ENROLLED → ACTIVE
```

### Claim Lifecycle
```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → PAID
                                 └→ PARTIALLY_APPROVED → PAID
                                 └→ DENIED → APPEALED
```

### Authorization Lifecycle
```
PENDING → UNDER_REVIEW → APPROVED → (used in claims)
                       └→ PARTIALLY_APPROVED
                       └→ DENIED
```

### Provider Settlement
```
PENDING → PROCESSING → PAID
       └→ DISPUTED
```

---

## 📞 Support

For technical issues or questions about the platform, contact your system administrator.

---

*Built on the Complete HMO Master Blueprint v1.0 — Enterprise HMO Management Platform*
