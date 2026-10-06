-- =============================================================================
-- HEALTHSHIELD NIGERIA HMO - COMPLETE SUPABASE DATABASE SCHEMA & SEED DATA
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rywfmocrdpygovckkarv/sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up any existing conflicting tables in proper order
DROP TABLE IF EXISTS service_cases CASCADE;
DROP TABLE IF EXISTS provider_settlements CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS premium_invoices CASCADE;
DROP TABLE IF EXISTS claim_items CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS authorizations CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS dependants CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS plan_benefits CASCADE;
DROP TABLE IF EXISTS health_plans CASCADE;
DROP TABLE IF EXISTS provider_locations CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS employers CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 1. ORGANIZATIONS
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('hmo','employer','provider')),
  code VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Nigeria',
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DEPARTMENTS
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ROLES
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PERMISSIONS
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) UNIQUE NOT NULL,
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended','locked')),
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  last_login TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EMPLOYERS
CREATE TABLE employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  industry VARCHAR(100),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  employee_count INTEGER DEFAULT 0,
  premium_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (premium_cycle IN ('monthly','quarterly','biannually','annually')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PROVIDERS
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('hospital','clinic','pharmacy','laboratory','specialist','dental','optical')),
  tier VARCHAR(20) DEFAULT '1' CHECK (tier IN ('1','2','3','primary','secondary','tertiary')),
  license_number VARCHAR(100),
  accreditation_number VARCHAR(100),
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PROVIDER LOCATIONS
CREATE TABLE provider_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. HEALTH PLANS
CREATE TABLE health_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('individual','family','group','corporate','custom')),
  premium_amount NUMERIC(12,2) NOT NULL,
  coverage_limit NUMERIC(12,2),
  individual_limit NUMERIC(12,2),
  family_limit NUMERIC(12,2),
  deductible NUMERIC(12,2) DEFAULT 0,
  copay_percentage NUMERIC(5,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  effective_date DATE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. PLAN BENEFITS
CREATE TABLE plan_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES health_plans(id) ON DELETE CASCADE,
  service_category VARCHAR(100) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  benefit_type VARCHAR(50) DEFAULT 'percentage' CHECK (benefit_type IN ('percentage','fixed','full','not_covered')),
  coverage_percentage NUMERIC(5,2) DEFAULT 100,
  annual_limit NUMERIC(12,2),
  per_visit_limit NUMERIC(12,2),
  max_visits_per_year INTEGER,
  waiting_period_days INTEGER DEFAULT 0,
  requires_authorization BOOLEAN DEFAULT false,
  requires_referral BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. MEMBERS
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male','female','other','Male','Female','Other')),
  marital_status VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Nigeria',
  national_id VARCHAR(50),
  blood_group VARCHAR(10),
  genotype VARCHAR(10),
  occupation VARCHAR(100),
  employer_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended','terminated','pending')),
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. DEPENDANTS
CREATE TABLE dependants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(10),
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. ENROLLMENTS
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES health_plans(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','pending','suspended','terminated','expired')),
  effective_date DATE NOT NULL,
  expiry_date DATE,
  premium_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. AUTHORIZATIONS (PRE-AUTH)
CREATE TABLE authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES health_plans(id) ON DELETE SET NULL,
  service_category VARCHAR(100) NOT NULL,
  service_description TEXT,
  diagnosis_code VARCHAR(50),
  procedure_code VARCHAR(50),
  requested_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved_amount NUMERIC(12,2),
  urgency VARCHAR(20) DEFAULT 'routine' CHECK (urgency IN ('routine','urgent','emergency')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','partially_approved','denied','cancelled','expired')),
  denial_reason TEXT,
  notes TEXT,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. CLAIMS
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES health_plans(id) ON DELETE SET NULL,
  authorization_id UUID REFERENCES authorizations(id) ON DELETE SET NULL,
  service_date DATE NOT NULL,
  service_category VARCHAR(100) NOT NULL,
  diagnosis_code VARCHAR(50),
  diagnosis_description TEXT,
  submitted_amount NUMERIC(12,2) NOT NULL,
  approved_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft','submitted','under_review','approved','partially_approved','denied','paid','appealed')),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. CLAIM ITEMS
CREATE TABLE claim_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  item_type VARCHAR(50) DEFAULT 'service',
  description VARCHAR(255) NOT NULL,
  procedure_code VARCHAR(50),
  quantity NUMERIC(6,2) DEFAULT 1,
  unit_cost NUMERIC(12,2) NOT NULL,
  total_cost NUMERIC(12,2) NOT NULL,
  approved_amount NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. PREMIUM INVOICES
CREATE TABLE premium_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  employer_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  billing_period VARCHAR(50) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference VARCHAR(100) UNIQUE NOT NULL,
  invoice_id UUID REFERENCES premium_invoices(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. PROVIDER SETTLEMENTS
CREATE TABLE provider_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_number VARCHAR(50) UNIQUE NOT NULL,
  provider_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period VARCHAR(50) NOT NULL,
  claims_count INTEGER DEFAULT 0,
  gross_amount NUMERIC(12,2) NOT NULL,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. SERVICE CASES
CREATE TABLE service_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(50) UNIQUE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  case_type VARCHAR(50) NOT NULL CHECK (case_type IN ('complaint','inquiry','service_request','feedback','appeal')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','pending','resolved','closed')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. AUDIT LOGS & SECURITY EVENTS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255),
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  ip_address VARCHAR(50),
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  user_email VARCHAR(255),
  ip_address VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SEED INITIAL SYSTEM DATA
-- =============================================================================

-- 1. HMO Organization
INSERT INTO organizations (id, name, type, code, status, address, city, state, phone, email, website)
VALUES ('00000000-0000-0000-0000-000000000001', 'HealthShield Nigeria HMO', 'hmo', 'HSHMO', 'active', 'Plot 14, Adeola Odeku Street, Victoria Island', 'Lagos', 'Lagos', '+234-1-2345678', 'info@healthshield.ng', 'https://healthshield.ng');

-- 2. Roles
INSERT INTO roles (id, name, description, is_system, organization_id) VALUES
('00000000-0000-0000-0000-000000000010', 'super_admin', 'Super Administrator - Full access', true, '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000011', 'operations_manager', 'Operations Manager', false, '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000012', 'claims_officer', 'Claims Adjudication Officer', false, '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000013', 'finance_officer', 'Finance & Settlements Officer', false, '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000014', 'medical_officer', 'Clinical Pre-Authorization Officer', false, '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000015', 'customer_service', 'Customer Care Representative', false, '00000000-0000-0000-0000-000000000001');

-- 3. Users (Password: Admin@123 for admin, Staff@123 for staff)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, status, role_id, organization_id) VALUES
('00000000-0000-0000-0000-000000000100', 'admin@healthshield.ng', '$2a$10$7Z2vA4XF2Q2C9e1L6tQ8j.k8mX1p0N2R3T4V5X6Z7A8B9C0D1E2F3', 'System', 'Administrator', '+234-800-0000001', 'active', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000101', 'claims@healthshield.ng', '$2a$10$7Z2vA4XF2Q2C9e1L6tQ8j.k8mX1p0N2R3T4V5X6Z7A8B9C0D1E2F3', 'Fatima', 'Bello', '+234-800-0000002', 'active', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000102', 'finance@healthshield.ng', '$2a$10$7Z2vA4XF2Q2C9e1L6tQ8j.k8mX1p0N2R3T4V5X6Z7A8B9C0D1E2F3', 'Chukwuemeka', 'Obi', '+234-800-0000003', 'active', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000103', 'medical@healthshield.ng', '$2a$10$7Z2vA4XF2Q2C9e1L6tQ8j.k8mX1p0N2R3T4V5X6Z7A8B9C0D1E2F3', 'Dr. Aisha', 'Mohammed', '+234-800-0000004', 'active', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000104', 'ops@healthshield.ng', '$2a$10$7Z2vA4XF2Q2C9e1L6tQ8j.k8mX1p0N2R3T4V5X6Z7A8B9C0D1E2F3', 'Tunde', 'Adeyemi', '+234-800-0000005', 'active', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000105', 'cs@healthshield.ng', '$2a$10$7Z2vA4XF2Q2C9e1L6tQ8j.k8mX1p0N2R3T4V5X6Z7A8B9C0D1E2F3', 'Ngozi', 'Eze', '+234-800-0000006', 'active', '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001');

-- 4. Health Plans
INSERT INTO health_plans (id, name, code, description, plan_type, premium_amount, coverage_limit, status) VALUES
('00000000-0000-0000-0000-000000000201', 'Basic Care Plan', 'BASIC-001', 'Essential healthcare coverage', 'individual', 15000.00, 500000.00, 'active'),
('00000000-0000-0000-0000-000000000202', 'Standard Care Plan', 'STD-001', 'Comprehensive individual and family coverage', 'individual', 25000.00, 1500000.00, 'active'),
('00000000-0000-0000-0000-000000000203', 'Premium Care Plan', 'PREM-001', 'Full-spectrum executive medical coverage', 'family', 45000.00, 5000000.00, 'active'),
('00000000-0000-0000-0000-000000000204', 'Corporate Elite Plan', 'CORP-001', 'Enterprise coverage with private hospital suites', 'group', 80000.00, 10000000.00, 'active');

-- 5. Employers
INSERT INTO organizations (id, name, type, code, status, address, city, state, phone, email) VALUES
('00000000-0000-0000-0000-000000000301', 'TechNova Nigeria Ltd', 'employer', 'TECHNOVA', 'active', 'Plot 12, Commercial Ave, Yaba', 'Lagos', 'Lagos', '+234-1-2345678', 'corporate@technova.ng'),
('00000000-0000-0000-0000-000000000302', 'First Bank Nigeria PLC', 'employer', 'FBN', 'active', 'Samuel Asabia House, 35 Marina', 'Lagos', 'Lagos', '+234-1-9052000', 'hmo@firstbank.ng'),
('00000000-0000-0000-0000-000000000303', 'Dangote Group', 'employer', 'DANGOTE', 'active', '1 Alfred Rewane Road, Ikoyi', 'Lagos', 'Lagos', '+234-1-4480811', 'health@dangote.com');

INSERT INTO employers (organization_id, industry, contact_person, employee_count) VALUES
('00000000-0000-0000-0000-000000000301', 'Technology', 'Chinedu Eze', 350),
('00000000-0000-0000-0000-000000000302', 'Banking', 'Oluwakemi Adeleke', 5000),
('00000000-0000-0000-0000-000000000303', 'Manufacturing', 'Ibrahim Musa', 12000);

-- 6. Healthcare Providers
INSERT INTO organizations (id, name, type, code, status, address, city, state, phone, email) VALUES
('00000000-0000-0000-0000-000000000401', 'Lagos University Teaching Hospital', 'provider', 'LUTH', 'active', 'Ishaga Road, Idi-Araba', 'Surulere', 'Lagos', '+234-1-8765432', 'claims@luth.gov.ng'),
('00000000-0000-0000-0000-000000000402', 'Reddington Hospital', 'provider', 'REDDINGTON', 'active', '12 Idowu Martins St', 'Victoria Island', 'Lagos', '+234-1-2715340', 'hmo@reddington.com'),
('00000000-0000-0000-0000-000000000403', 'HealthPlus Pharmacy', 'provider', 'HEALTHPLUS', 'active', '15 Commercial Ave, Sabo', 'Yaba', 'Lagos', '+234-809-1234567', 'dispensary@healthplus.ng');

INSERT INTO providers (organization_id, provider_type, tier, license_number, bank_name, account_number) VALUES
('00000000-0000-0000-0000-000000000401', 'hospital', '1', 'MDCN-10293', 'First Bank', '1029384756'),
('00000000-0000-0000-0000-000000000402', 'hospital', '1', 'MDCN-20485', 'Zenith Bank', '2039485761'),
('00000000-0000-0000-0000-000000000403', 'pharmacy', '2', 'PCN-30495', 'GTBank', '0123456789');

-- 7. Members
INSERT INTO members (id, member_number, first_name, last_name, gender, date_of_birth, phone, email, employer_id, status) VALUES
('00000000-0000-0000-0000-000000000501', 'MBR-20261001-1000', 'Adaeze', 'Okonkwo', 'female', '1985-06-15', '+234-801-2345678', 'adaeze@technova.ng', '00000000-0000-0000-0000-000000000301', 'active'),
('00000000-0000-0000-0000-000000000502', 'MBR-20261001-1001', 'Emeka', 'Eze', 'male', '1990-03-22', '+234-802-3456789', 'emeka@firstbank.ng', '00000000-0000-0000-0000-000000000302', 'active'),
('00000000-0000-0000-0000-000000000503', 'MBR-20261001-1002', 'Fatima', 'Abubakar', 'female', '1988-11-05', '+234-803-4567890', 'f.abubakar@dangote.com', '00000000-0000-0000-0000-000000000303', 'suspended');

-- 8. Enrollments
INSERT INTO enrollments (member_id, plan_id, status, effective_date, expiry_date, premium_amount) VALUES
('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000202', 'active', '2026-01-01', '2026-12-31', 25000.00),
('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000201', 'active', '2026-03-01', '2027-02-28', 15000.00),
('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000203', 'suspended', '2025-06-01', '2026-05-31', 45000.00);
