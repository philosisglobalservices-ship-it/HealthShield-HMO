require('dotenv').config();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 12;

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting database seed...');
    await client.query('BEGIN');

    // ─── 1. HMO ORGANIZATION ─────────────────────────────────────────
    const hmoOrgId = uuidv4();
    await client.query(`
      INSERT INTO organizations (id, name, type, code, status, address, city, state, phone, email, website)
      VALUES ($1,'HealthShield Nigeria HMO','hmo','HSHMO','active','Plot 14, Adeola Odeku Street, Victoria Island','Lagos','Lagos','+234-1-2345678','info@healthshield.ng','https://healthshield.ng')
      ON CONFLICT DO NOTHING
    `, [hmoOrgId]);

    // ─── 2. DEPARTMENTS ──────────────────────────────────────────────
    const deptIds = {};
    const depts = [
      ['Operations', 'OPS'], ['Claims', 'CLM'], ['Finance', 'FIN'],
      ['Medical', 'MED'], ['Customer Service', 'CS'], ['IT', 'IT'], ['Compliance', 'COMP']
    ];
    for (const [name, code] of depts) {
      const id = uuidv4();
      deptIds[code] = id;
      await client.query(`
        INSERT INTO departments (id, organization_id, name, code) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING
      `, [id, hmoOrgId, name, code]);
    }

    // ─── 3. ROLES ────────────────────────────────────────────────────
    const roleIds = {};
    const roles = [
      ['super_admin', 'Super Administrator - Full platform access', true],
      ['operations_manager', 'Operations Manager - Member & enrollment management', false],
      ['claims_officer', 'Claims Officer - Claims intake and processing', false],
      ['finance_officer', 'Finance Officer - Billing, payments, settlements', false],
      ['medical_officer', 'Medical Officer - Authorizations and clinical review', false],
      ['customer_service', 'Customer Service Representative', false],
      ['compliance_officer', 'Compliance Officer - Audit and regulatory', false],
    ];
    for (const [name, desc, isSystem] of roles) {
      const id = uuidv4();
      roleIds[name] = id;
      await client.query(`
        INSERT INTO roles (id, name, description, is_system, organization_id)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT (name) DO UPDATE SET description=$3
      `, [id, name, desc, isSystem, hmoOrgId]);
    }

    // ─── 4. ADMIN USER ────────────────────────────────────────────────
    const adminId = uuidv4();
    const adminHash = await bcrypt.hash('Admin@123', SALT_ROUNDS);
    await client.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, phone, status, role_id, organization_id, department_id)
      VALUES ($1,'admin@healthshield.ng',$2,'System','Administrator','+234-800-0000001','active',$3,$4,$5)
      ON CONFLICT (email) DO NOTHING
    `, [adminId, adminHash, roleIds['super_admin'], hmoOrgId, deptIds['IT']]);

    // Additional staff users
    const staffUsers = [
      ['claims@healthshield.ng', 'Fatima', 'Bello', roleIds['claims_officer'], deptIds['CLM']],
      ['finance@healthshield.ng', 'Chukwuemeka', 'Obi', roleIds['finance_officer'], deptIds['FIN']],
      ['medical@healthshield.ng', 'Dr. Aisha', 'Mohammed', roleIds['medical_officer'], deptIds['MED']],
      ['ops@healthshield.ng', 'Tunde', 'Adeyemi', roleIds['operations_manager'], deptIds['OPS']],
      ['cs@healthshield.ng', 'Ngozi', 'Eze', roleIds['customer_service'], deptIds['CS']],
    ];
    for (const [email, fn, ln, roleId, deptId] of staffUsers) {
      const id = uuidv4();
      const hash = await bcrypt.hash('Staff@123', SALT_ROUNDS);
      await client.query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, status, role_id, organization_id, department_id)
        VALUES ($1,$2,$3,$4,$5,'active',$6,$7,$8) ON CONFLICT (email) DO NOTHING
      `, [id, email, hash, fn, ln, roleId, hmoOrgId, deptId]);
    }

    // ─── 5. HEALTH PLANS ─────────────────────────────────────────────
    const planIds = {};
    const plans = [
      ['Basic Care Plan', 'BASIC-001', 'Essential health coverage for individuals', 'group', 15000, 500000, 200000],
      ['Standard Care Plan', 'STD-001', 'Comprehensive coverage for employees and families', 'group', 25000, 1500000, 600000],
      ['Premium Care Plan', 'PREM-001', 'Executive level comprehensive health coverage', 'corporate', 45000, 5000000, 2000000],
      ['Individual Basic', 'IND-BASIC-001', 'Individual health coverage - basic tier', 'individual', 18000, 600000, 250000],
    ];
    for (const [name, code, desc, type, premium, coverageLimit, individualLimit] of plans) {
      const id = uuidv4();
      planIds[code] = id;
      await client.query(`
        INSERT INTO health_plans (id, name, code, description, plan_type, premium_amount, coverage_limit, individual_limit, status, effective_date)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',NOW()) ON CONFLICT (code) DO NOTHING
      `, [id, name, code, desc, type, premium, coverageLimit, individualLimit]);

      // Benefits for each plan
      const benefits = [
        ['Outpatient', 'General Consultation', 'covered', 100, 50000, 0, false],
        ['Outpatient', 'Specialist Consultation', 'covered', 100, 80000, 0, type !== 'BASIC-001'],
        ['Inpatient', 'Hospitalization', 'covered', 80, individualLimit * 0.5, 0, true],
        ['Laboratory', 'Laboratory Tests', 'covered', 100, 30000, 0, false],
        ['Pharmacy', 'Prescribed Medications', 'covered', 70, 60000, 0, false],
        ['Emergency', 'Emergency Care', 'covered', 100, 200000, 0, false],
        ['Dental', 'Dental Care', premium > 20000 ? 'covered' : 'excluded', 100, 30000, 0, false],
        ['Optical', 'Eye Care', premium > 30000 ? 'covered' : 'excluded', 100, 25000, 0, false],
        ['Maternity', 'Maternity Services', premium > 20000 ? 'covered' : 'limited', 80, 150000, 270, true],
        ['Surgery', 'Surgical Procedures', 'covered', 80, coverageLimit * 0.3, 0, true],
      ];
      for (const [cat, svc, btype, pct, limit, wait, needsAuth] of benefits) {
        await client.query(`
          INSERT INTO plan_benefits (id, plan_id, service_category, service_name, benefit_type, coverage_percentage, annual_limit, waiting_period_days, requires_authorization)
          VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,$8)
        `, [id, cat, svc, btype, pct, limit, wait, needsAuth]);
      }
    }

    // ─── 6. EMPLOYER ORGANIZATIONS ───────────────────────────────────
    const empOrgIds = [];
    const employerOrgs = [
      ['TechNova Nigeria Ltd', 'TECHNO-001', 'Plot 7, Wuse Zone 5, Abuja', 'Abuja', 'Abuja', '+234-900-111-2222', 'hr@technova.ng'],
      ['Dangote Industries Ltd', 'DANG-001', '1 Bourdillon Road, Ikoyi, Lagos', 'Lagos', 'Lagos', '+234-1-4567890', 'hr@dangote.ng'],
      ['FirstBank of Nigeria Plc', 'FBNIG-001', '35 Marina Street, Lagos Island', 'Lagos', 'Lagos', '+234-1-2348001', 'hr@firstbank.ng'],
    ];
    for (const [name, code, addr, city, state, phone, email] of employerOrgs) {
      const orgId = uuidv4();
      empOrgIds.push(orgId);
      await client.query(`
        INSERT INTO organizations (id, name, type, code, status, address, city, state, phone, email)
        VALUES ($1,$2,'employer',$3,'active',$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING
      `, [orgId, name, code, addr, city, state, phone, email]);
      await client.query(`
        INSERT INTO employers (id, organization_id, industry, contact_person, contact_email, contact_phone, employee_count, premium_cycle, status)
        VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,'monthly','active') ON CONFLICT DO NOTHING
      `, [orgId,
        name.includes('Tech') ? 'Technology' : name.includes('Dangote') ? 'Manufacturing' : 'Banking',
        name.includes('Tech') ? 'Chidi Okeke' : name.includes('Dangote') ? 'Amina Musa' : 'Bola Adewale',
        email, phone, name.includes('Tech') ? 250 : name.includes('Dangote') ? 1200 : 3000
      ]);
    }

    // ─── 7. PROVIDER ORGANIZATIONS ───────────────────────────────────
    const providerData = [
      ['Lagos University Teaching Hospital', 'LUTH-001', 'hospital', 'Idiaraba, Mushin, Lagos', 'Lagos', 'Lagos', 'tertiary'],
      ['Reddington Hospital', 'REDD-001', 'hospital', '12 Idejo Street, Victoria Island, Lagos', 'Lagos', 'Lagos', 'secondary'],
      ['Medplus Pharmacy', 'MEDPLUS-001', 'pharmacy', '14 Allen Avenue, Ikeja, Lagos', 'Lagos', 'Lagos', 'primary'],
      ['Clina-Lancet Laboratories', 'CLINA-001', 'laboratory', '3 Mosley Road, Ikoyi, Lagos', 'Lagos', 'Lagos', 'secondary'],
      ['Eko Hospital', 'EKOH-001', 'hospital', 'Plot 31, Mobolaji Johnson Avenue, Lagos', 'Lagos', 'Lagos', 'secondary'],
      ['National Hospital Abuja', 'NATH-001', 'hospital', 'Central Business District, Abuja', 'Abuja', 'FCT', 'tertiary'],
      ['Smile 360 Dental', 'SMILE-001', 'dental', '5A Karimu Kotun Street, VI, Lagos', 'Lagos', 'Lagos', 'primary'],
      ['Total Health Trust Clinic', 'THT-001', 'clinic', '27 Kofo Abayomi Street, VI, Lagos', 'Lagos', 'Lagos', 'primary'],
    ];
    const providerOrgIds = [];
    for (const [name, code, ptype, addr, city, state, tier] of providerData) {
      const orgId = uuidv4();
      providerOrgIds.push(orgId);
      await client.query(`
        INSERT INTO organizations (id, name, type, code, status, address, city, state)
        VALUES ($1,$2,'provider',$3,'active',$4,$5,$6) ON CONFLICT DO NOTHING
      `, [orgId, name, code, addr, city, state]);
      const provId = uuidv4();
      await client.query(`
        INSERT INTO providers (id, organization_id, provider_type, license_number, tier, status, contract_start_date)
        VALUES ($1,$2,$3,$4,$5,'active',NOW()-INTERVAL '1 year') ON CONFLICT DO NOTHING
      `, [provId, orgId, ptype, `LIC-${code}`, tier]);
      await client.query(`
        INSERT INTO provider_locations (id, provider_id, address, city, state, is_primary)
        VALUES (uuid_generate_v4(),$1,$2,$3,$4,true)
      `, [provId, addr, city, state]);
    }

    // ─── 8. MEMBERS ──────────────────────────────────────────────────
    const memberNames = [
      ['Adaeze', 'Okonkwo', 'female', '1985-03-15', 'TechNova Nigeria Ltd'],
      ['Emeka', 'Eze', 'male', '1978-07-22', 'TechNova Nigeria Ltd'],
      ['Fatima', 'Abubakar', 'female', '1990-11-08', 'Dangote Industries Ltd'],
      ['Chukwudi', 'Nwachukwu', 'male', '1982-05-30', 'Dangote Industries Ltd'],
      ['Ngozi', 'Ibe', 'female', '1995-02-14', 'FirstBank of Nigeria Plc'],
      ['Tunde', 'Bakare', 'male', '1988-09-03', 'FirstBank of Nigeria Plc'],
      ['Amaka', 'Osei', 'female', '1975-12-20', 'TechNova Nigeria Ltd'],
      ['Biodun', 'Adeyemi', 'male', '1992-04-11', 'Dangote Industries Ltd'],
      ['Chioma', 'Okeke', 'female', '1986-08-25', 'FirstBank of Nigeria Plc'],
      ['Oluwaseun', 'Ayoola', 'male', '1993-01-17', 'TechNova Nigeria Ltd'],
      ['Hauwa', 'Musa', 'female', '1980-06-09', 'Dangote Industries Ltd'],
      ['Dele', 'Ogundimu', 'male', '1987-10-28', 'FirstBank of Nigeria Plc'],
      ['Ifeoma', 'Nweze', 'female', '1997-03-05', 'TechNova Nigeria Ltd'],
      ['Babatunde', 'Fashola', 'male', '1984-07-14', 'Dangote Industries Ltd'],
      ['Aisha', 'Yusuf', 'female', '1991-09-22', 'FirstBank of Nigeria Plc'],
    ];

    const memberIds = [];
    for (let i = 0; i < memberNames.length; i++) {
      const [fn, ln, gender, dob, empName] = memberNames[i];
      const empOrg = empOrgIds[i % empOrgIds.length];
      const mid = uuidv4();
      memberIds.push(mid);
      const memberNum = `MBR-${Date.now().toString().slice(-8)}-${1000 + i}`;
      await client.query(`
        INSERT INTO members (id, member_number, first_name, last_name, date_of_birth, gender, phone, email, address, city, state, status, employer_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Lagos','Lagos','active',$10) ON CONFLICT DO NOTHING
      `, [mid, memberNum, fn, ln, dob, gender,
        `+234-80${String(i).padStart(2,'0')}-${Math.floor(1000000 + Math.random()*9000000)}`,
        `${fn.toLowerCase()}.${ln.toLowerCase()}@email.ng`,
        `${i+1} ${['Awolowo Rd','Broad St','Marina','Bode Thomas','Ahmadu Bello Way'][i%5]}, Lagos`,
        empOrg
      ]);

      // Add dependants for some members
      if (i % 3 === 0) {
        await client.query(`
          INSERT INTO dependants (id, member_id, first_name, last_name, date_of_birth, gender, relationship, status)
          VALUES (uuid_generate_v4(),$1,$2,$3,'2010-05-${String((i%28)+1).padStart(2,'0')}','male','child','active')
        `, [mid, `Junior`, ln]);
      }

      // Enrollments
      const planId = Object.values(planIds)[i % Object.values(planIds).length];
      const enrollId = uuidv4();
      await client.query(`
        INSERT INTO enrollments (id, member_id, plan_id, employer_id, status, effective_date, expiry_date, premium_amount, created_by)
        VALUES ($1,$2,$3,$4,'active',NOW()-INTERVAL '${i} months',NOW()+INTERVAL '${12-i%12} months',$5,$6) ON CONFLICT DO NOTHING
      `, [enrollId, mid, planId, empOrg, [15000,25000,45000][i%3], adminId]);
    }

    // ─── 9. AUTHORIZATIONS ────────────────────────────────────────────
    const authStatuses = ['pending','approved','denied','under_review','approved','approved','expired','approved'];
    const serviceCategories = ['Outpatient','Inpatient','Surgery','Specialist','Laboratory','Pharmacy','Dental','Optical'];
    const authIds = [];

    for (let i = 0; i < 12; i++) {
      const authId = uuidv4();
      authIds.push(authId);
      const status = authStatuses[i % authStatuses.length];
      const provIdRow = await client.query(`SELECT id FROM providers LIMIT 1 OFFSET $1`, [i % providerOrgIds.length]);
      const provId = provIdRow.rows[0]?.id;
      const memberId = memberIds[i % memberIds.length];
      const planId = Object.values(planIds)[i % Object.values(planIds).length];
      const reqAmount = [50000, 120000, 350000, 80000, 25000, 15000][i % 6];

      await client.query(`
        INSERT INTO authorizations (id, reference_number, member_id, provider_id, plan_id, service_category, service_description, requested_amount, approved_amount, status, urgency, requested_by, reviewed_by, decision_date)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT DO NOTHING
      `, [
        authId,
        `AUTH-${Date.now().toString().slice(-8)}-${1000+i}`,
        memberId, provId, planId,
        serviceCategories[i % serviceCategories.length],
        `${serviceCategories[i % serviceCategories.length]} services for patient`,
        reqAmount,
        ['approved','partially_approved'].includes(status) ? reqAmount * 0.8 : null,
        status,
        ['routine','urgent','emergency'][i % 3],
        adminId,
        status !== 'pending' ? adminId : null,
        status !== 'pending' ? new Date() : null,
      ]);
    }

    // ─── 10. CLAIMS ───────────────────────────────────────────────────
    const claimStatuses = ['submitted','under_review','approved','paid','denied','partially_approved','submitted','paid','under_review','approved','paid','denied','submitted','paid','approved'];
    for (let i = 0; i < 20; i++) {
      const claimId = uuidv4();
      const status = claimStatuses[i % claimStatuses.length];
      const provIdRow = await client.query(`SELECT id FROM providers LIMIT 1 OFFSET $1`, [i % 4]);
      const provId = provIdRow.rows[0]?.id;
      const memberId = memberIds[i % memberIds.length];
      const planId = Object.values(planIds)[i % Object.values(planIds).length];
      const submittedAmount = [25000, 85000, 210000, 45000, 12000, 68000, 150000][i % 7];
      const approvedAmount = ['approved','paid','partially_approved'].includes(status) ? submittedAmount * 0.85 : null;
      const paidAmount = ['paid'].includes(status) ? approvedAmount : null;

      await client.query(`
        INSERT INTO claims (id, claim_number, member_id, provider_id, plan_id, service_date, service_category, diagnosis_code, diagnosis_description, submitted_amount, approved_amount, paid_amount, status, submitted_by, reviewed_by, approved_by, submission_date, decision_date, payment_date)
        VALUES ($1,$2,$3,$4,$5,NOW()-INTERVAL '${i*3} days',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()-INTERVAL '${i*3+2} days',$16,$17)
        ON CONFLICT DO NOTHING
      `, [
        claimId,
        `CLM-${Date.now().toString().slice(-8)}-${2000+i}`,
        memberId, provId, planId,
        serviceCategories[i % serviceCategories.length],
        ['J06.9','K59.1','I10','E11.9','N39.0','M54.5','R51','A09'][i % 8],
        ['Upper Respiratory Infection','Gastroenteritis','Hypertension','Diabetes','UTI','Back Pain','Headache','Diarrhea'][i % 8],
        submittedAmount, approvedAmount, paidAmount, status,
        adminId,
        status !== 'submitted' ? adminId : null,
        ['approved','paid'].includes(status) ? adminId : null,
        status !== 'submitted' && status !== 'under_review' ? new Date(Date.now() - i * 86400000) : null,
        status === 'paid' ? new Date(Date.now() - i * 43200000) : null,
      ]);

      // Claim items
      await client.query(`
        INSERT INTO claim_items (id, claim_id, service_name, service_code, quantity, unit_cost, total_cost, approved_amount, status)
        VALUES (uuid_generate_v4(),$1,$2,$3,1,$4,$4,$5,$6)
      `, [claimId,
        ['Consultation Fee','Hospital Admission','Surgical Procedure','Lab Tests','Medication','X-Ray'][i % 6],
        `SVC-${100+i}`, submittedAmount * 0.7,
        approvedAmount ? approvedAmount * 0.7 : null,
        ['approved','paid'].includes(status) ? 'approved' : status === 'denied' ? 'denied' : 'pending'
      ]);
    }

    // ─── 11. PREMIUM INVOICES ─────────────────────────────────────────
    for (let i = 0; i < 6; i++) {
      const amount = [375000, 625000, 1125000][i % 3];
      const invStatus = ['paid','paid','sent','overdue','paid','sent'][i];
      await client.query(`
        INSERT INTO premium_invoices (id, invoice_number, employer_id, period_start, period_end, amount, total_amount, status, due_date, paid_date, created_by)
        VALUES (uuid_generate_v4(),$1,$2,DATE_TRUNC('month',NOW()-INTERVAL '${i} months'),DATE_TRUNC('month',NOW()-INTERVAL '${i} months')+INTERVAL '1 month - 1 day',$3,$3,$4,DATE_TRUNC('month',NOW()-INTERVAL '${i} months')+INTERVAL '15 days',$5,$6)
        ON CONFLICT DO NOTHING
      `, [
        `INV-${Date.now().toString().slice(-8)}-${3000+i}`,
        empOrgIds[i % empOrgIds.length],
        amount, invStatus,
        invStatus === 'paid' ? new Date(Date.now() - i * 86400000 * 5) : null,
        adminId
      ]);
    }

    // ─── 12. SERVICE CASES ────────────────────────────────────────────
    const caseTypes = ['inquiry','complaint','service_request','inquiry','complaint','feedback'];
    const casePriorities = ['normal','high','low','critical','normal','high'];
    const caseStatuses = ['open','in_progress','resolved','open','in_progress','closed'];
    for (let i = 0; i < 8; i++) {
      await client.query(`
        INSERT INTO service_cases (id, case_number, member_id, case_type, subject, description, priority, status, created_by)
        VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT DO NOTHING
      `, [
        `CASE-${Date.now().toString().slice(-8)}-${4000+i}`,
        memberIds[i % memberIds.length],
        caseTypes[i % caseTypes.length],
        ['Claim status inquiry','Complaint about claim rejection','Request for new ID card','Provider not available','Benefit clarification','Enrollment issue'][i % 6],
        'Member is requesting assistance with the above matter.',
        casePriorities[i % casePriorities.length],
        caseStatuses[i % caseStatuses.length],
        adminId
      ]);
    }

    // ─── 13. AUDIT LOGS & SECURITY EVENTS ────────────────────────────
    await client.query(`
      INSERT INTO security_events (id, event_type, severity, user_email, description, metadata)
      VALUES
        (uuid_generate_v4(),'login_success','low','admin@healthshield.ng','Successful admin login','{"ip":"102.89.45.12"}'),
        (uuid_generate_v4(),'failed_login_attempt','medium','unknown@hacker.com','Multiple failed login attempts','{"attempts":5,"ip":"185.220.101.50"}'),
        (uuid_generate_v4(),'permission_escalation','high','ops@healthshield.ng','Unusual permission request detected','{"resource":"financial_reports"}'),
        (uuid_generate_v4(),'data_export','low','finance@healthshield.ng','Large data export initiated','{"records":500}')
    `);

    await client.query(`
      INSERT INTO audit_logs (id, user_id, user_email, action, module, resource_type)
      VALUES
        (uuid_generate_v4(),$1,'admin@healthshield.ng','CREATE','Members','member'),
        (uuid_generate_v4(),$1,'admin@healthshield.ng','CREATE','Claims','claim'),
        (uuid_generate_v4(),$1,'admin@healthshield.ng','APPROVE','Authorizations','authorization'),
        (uuid_generate_v4(),$1,'admin@healthshield.ng','UPDATE','Enrollments','enrollment')
    `, [adminId]);

    await client.query('COMMIT');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('📋 Login credentials:');
    console.log('  Admin:    admin@healthshield.ng / Admin@123');
    console.log('  Claims:   claims@healthshield.ng / Staff@123');
    console.log('  Finance:  finance@healthshield.ng / Staff@123');
    console.log('  Medical:  medical@healthshield.ng / Staff@123');
    console.log('  Ops:      ops@healthshield.ng / Staff@123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
