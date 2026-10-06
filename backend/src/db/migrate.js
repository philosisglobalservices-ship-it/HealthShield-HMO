require('dotenv').config();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting database migration...');
    await client.query('BEGIN');

    // Enable UUID extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ─── ORGANIZATIONS ───────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── DEPARTMENTS ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── ROLES ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        permissions JSONB DEFAULT '[]',
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── PERMISSIONS ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) UNIQUE NOT NULL,
        module VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── ROLE_PERMISSIONS ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    // ─── USERS ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
        last_login TIMESTAMP,
        password_changed_at TIMESTAMP DEFAULT NOW(),
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── MEMBERS ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_number VARCHAR(50) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(10) CHECK (gender IN ('male','female','other')),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        national_id VARCHAR(100),
        passport_number VARCHAR(100),
        occupation VARCHAR(150),
        status VARCHAR(30) DEFAULT 'prospect' CHECK (status IN ('prospect','application','pending_verification','verified','enrolled','active','suspended','reactivated','expired','terminated')),
        employer_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── DEPENDANTS ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS dependants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(10) CHECK (gender IN ('male','female','other')),
        relationship VARCHAR(20) NOT NULL CHECK (relationship IN ('spouse','child','parent','sibling','other')),
        national_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','terminated')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── EMPLOYERS ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS employers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        industry VARCHAR(150),
        rc_number VARCHAR(100),
        contact_person VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        employee_count INTEGER DEFAULT 0,
        active_member_count INTEGER DEFAULT 0,
        premium_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (premium_cycle IN ('monthly','quarterly','semi_annual','annual')),
        bank_name VARCHAR(255),
        account_number VARCHAR(100),
        account_name VARCHAR(255),
        contract_start_date DATE,
        contract_end_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── PROVIDERS ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        provider_type VARCHAR(30) NOT NULL CHECK (provider_type IN ('hospital','clinic','pharmacy','laboratory','specialist','dental','optical','maternity','rehabilitation')),
        license_number VARCHAR(150),
        accreditation_number VARCHAR(150),
        tier VARCHAR(20) DEFAULT 'primary' CHECK (tier IN ('primary','secondary','tertiary')),
        rating DECIMAL(3,2) DEFAULT 0,
        bank_name VARCHAR(255),
        account_number VARCHAR(100),
        account_name VARCHAR(255),
        contract_start_date DATE,
        contract_end_date DATE,
        capitation_rate DECIMAL(15,2),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active','inactive','suspended','pending','terminated')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── PROVIDER LOCATIONS ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_locations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        address TEXT NOT NULL,
        city VARCHAR(100),
        state VARCHAR(100),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        phone VARCHAR(50),
        is_primary BOOLEAN DEFAULT false,
        operating_hours TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── HEALTH PLANS ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS health_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        plan_type VARCHAR(20) DEFAULT 'group' CHECK (plan_type IN ('individual','group','family','corporate')),
        premium_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'NGN',
        coverage_limit DECIMAL(15,2) DEFAULT 0,
        individual_limit DECIMAL(15,2) DEFAULT 0,
        family_limit DECIMAL(15,2) DEFAULT 0,
        deductible DECIMAL(15,2) DEFAULT 0,
        copay_percentage DECIMAL(5,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','discontinued')),
        effective_date DATE,
        expiry_date DATE,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── PLAN BENEFITS ───────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_benefits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_id UUID NOT NULL REFERENCES health_plans(id) ON DELETE CASCADE,
        service_category VARCHAR(100) NOT NULL,
        service_name VARCHAR(255) NOT NULL,
        benefit_type VARCHAR(20) DEFAULT 'covered' CHECK (benefit_type IN ('covered','partial','excluded','limited')),
        coverage_percentage DECIMAL(5,2) DEFAULT 100,
        annual_limit DECIMAL(15,2),
        per_visit_limit DECIMAL(15,2),
        max_visits_per_year INTEGER,
        waiting_period_days INTEGER DEFAULT 0,
        requires_authorization BOOLEAN DEFAULT false,
        requires_referral BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── ENROLLMENTS ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES health_plans(id),
        employer_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','expired','terminated','cancelled')),
        effective_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        premium_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        employer_contribution DECIMAL(15,2) DEFAULT 0,
        member_contribution DECIMAL(15,2) DEFAULT 0,
        renewal_count INTEGER DEFAULT 0,
        termination_reason TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── ELIGIBILITY CHECKS ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS eligibility_checks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
        service_category VARCHAR(100),
        is_eligible BOOLEAN NOT NULL,
        reason TEXT,
        enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
        checked_by UUID REFERENCES users(id) ON DELETE SET NULL,
        checked_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── AUTHORIZATIONS (PREAUTH) ─────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS authorizations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reference_number VARCHAR(50) UNIQUE NOT NULL,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES health_plans(id) ON DELETE SET NULL,
        enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
        service_category VARCHAR(100) NOT NULL,
        service_description TEXT,
        icd_code VARCHAR(50),
        procedure_code VARCHAR(50),
        requested_amount DECIMAL(15,2) DEFAULT 0,
        approved_amount DECIMAL(15,2),
        status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','under_review','approved','partially_approved','denied','expired','cancelled')),
        urgency VARCHAR(20) DEFAULT 'routine' CHECK (urgency IN ('routine','urgent','emergency')),
        requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        decision_date TIMESTAMP,
        expiry_date DATE,
        denial_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── CLAIMS ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS claims (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        claim_number VARCHAR(50) UNIQUE NOT NULL,
        authorization_id UUID REFERENCES authorizations(id) ON DELETE SET NULL,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES health_plans(id) ON DELETE SET NULL,
        enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
        service_date DATE NOT NULL,
        service_category VARCHAR(100),
        diagnosis_code VARCHAR(50),
        diagnosis_description TEXT,
        submitted_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        approved_amount DECIMAL(15,2),
        paid_amount DECIMAL(15,2),
        copay_amount DECIMAL(15,2) DEFAULT 0,
        deductible_amount DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','partially_approved','denied','paid','appealed','withdrawn')),
        submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        submission_date TIMESTAMP,
        review_date TIMESTAMP,
        decision_date TIMESTAMP,
        payment_date TIMESTAMP,
        rejection_reason TEXT,
        appeal_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── CLAIM ITEMS ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS claim_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
        service_name VARCHAR(255) NOT NULL,
        service_code VARCHAR(50),
        quantity INTEGER DEFAULT 1,
        unit_cost DECIMAL(15,2) NOT NULL,
        total_cost DECIMAL(15,2) NOT NULL,
        approved_amount DECIMAL(15,2),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','partially_approved','denied')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── PREMIUM INVOICES ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS premium_invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        employer_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        member_id UUID REFERENCES members(id) ON DELETE SET NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'NGN',
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled','partially_paid')),
        due_date DATE,
        paid_date TIMESTAMP,
        paid_amount DECIMAL(15,2) DEFAULT 0,
        notes TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── PAYMENTS ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        payment_reference VARCHAR(100) UNIQUE NOT NULL,
        invoice_id UUID REFERENCES premium_invoices(id) ON DELETE SET NULL,
        payer_type VARCHAR(20) NOT NULL CHECK (payer_type IN ('employer','member','provider')),
        payer_id UUID NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'NGN',
        payment_method VARCHAR(30) DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer','card','cash','direct_debit','cheque','ussd')),
        bank_name VARCHAR(255),
        account_number VARCHAR(100),
        transaction_reference VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','reversed')),
        transaction_date TIMESTAMP DEFAULT NOW(),
        processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── PROVIDER SETTLEMENTS ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS provider_settlements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        settlement_number VARCHAR(50) UNIQUE NOT NULL,
        provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        total_claims_amount DECIMAL(15,2) DEFAULT 0,
        approved_amount DECIMAL(15,2) DEFAULT 0,
        deductions DECIMAL(15,2) DEFAULT 0,
        net_amount DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','disputed','cancelled')),
        payment_date TIMESTAMP,
        payment_reference VARCHAR(255),
        notes TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── SERVICE CASES ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_cases (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_number VARCHAR(50) UNIQUE NOT NULL,
        member_id UUID REFERENCES members(id) ON DELETE SET NULL,
        employer_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
        case_type VARCHAR(30) NOT NULL CHECK (case_type IN ('complaint','inquiry','service_request','feedback','appeal','fraud_report')),
        subject VARCHAR(500) NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
        status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open','in_progress','pending_info','resolved','closed','duplicate','invalid')),
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        resolution_notes TEXT,
        resolved_at TIMESTAMP,
        closed_at TIMESTAMP,
        sla_due_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── CASE COMMUNICATIONS ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS case_communications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID REFERENCES service_cases(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        sender_type VARCHAR(20) DEFAULT 'staff' CHECK (sender_type IN ('staff','member','employer','provider','system')),
        message TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── COMMUNICATIONS / NOTIFICATIONS SENT ─────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS communications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID REFERENCES service_cases(id) ON DELETE SET NULL,
        member_id UUID REFERENCES members(id) ON DELETE SET NULL,
        channel VARCHAR(20) NOT NULL CHECK (channel IN ('email','sms','push','in_app','whatsapp')),
        recipient_type VARCHAR(20) CHECK (recipient_type IN ('member','employer','provider','internal','user')),
        recipient_id UUID,
        recipient_address VARCHAR(500),
        subject VARCHAR(500),
        body TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','bounced')),
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── AUDIT LOGS ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        action VARCHAR(150) NOT NULL,
        module VARCHAR(100),
        resource_type VARCHAR(100),
        resource_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        session_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success','failure','error')),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── SECURITY EVENTS ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        is_resolved BOOLEAN DEFAULT false,
        resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── NOTIFICATIONS ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        body TEXT,
        type VARCHAR(50) DEFAULT 'info',
        resource_type VARCHAR(100),
        resource_id UUID,
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── INDEXES ──────────────────────────────────────────────────────
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_members_member_number ON members(member_number)`,
      `CREATE INDEX IF NOT EXISTS idx_members_status ON members(status)`,
      `CREATE INDEX IF NOT EXISTS idx_members_employer_id ON members(employer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON claims(claim_number)`,
      `CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status)`,
      `CREATE INDEX IF NOT EXISTS idx_claims_member_id ON claims(member_id)`,
      `CREATE INDEX IF NOT EXISTS idx_claims_provider_id ON claims(provider_id)`,
      `CREATE INDEX IF NOT EXISTS idx_authorizations_ref ON authorizations(reference_number)`,
      `CREATE INDEX IF NOT EXISTS idx_authorizations_status ON authorizations(status)`,
      `CREATE INDEX IF NOT EXISTS idx_authorizations_member_id ON authorizations(member_id)`,
      `CREATE INDEX IF NOT EXISTS idx_enrollments_member_id ON enrollments(member_id)`,
      `CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_premium_invoices_status ON premium_invoices(status)`,
      `CREATE INDEX IF NOT EXISTS idx_service_cases_status ON service_cases(status)`,
    ];

    for (const idx of indexes) {
      await client.query(idx);
    }

    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
