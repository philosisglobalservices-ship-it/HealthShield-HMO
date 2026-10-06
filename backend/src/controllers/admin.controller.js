const pool = require('../db');
const { asyncHandler, paginate, paginationMeta } = require('../utils/helpers');

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const MOCK_USERS = [
  { id: 'usr-1', first_name: 'System', last_name: 'Administrator', email: 'admin@healthshield.ng', role_name: 'super_admin', role_id: 'r1', department: 'Management', status: 'active', last_login: new Date().toISOString() },
  { id: 'usr-2', first_name: 'Fatima', last_name: 'Bello', email: 'claims@healthshield.ng', role_name: 'claims_officer', role_id: 'r3', department: 'Claims', status: 'active', last_login: new Date().toISOString() },
  { id: 'usr-3', first_name: 'Chukwuemeka', last_name: 'Obi', email: 'finance@healthshield.ng', role_name: 'finance_officer', role_id: 'r4', department: 'Finance', status: 'active', last_login: new Date().toISOString() },
  { id: 'usr-4', first_name: 'Dr. Aisha', last_name: 'Mohammed', email: 'medical@healthshield.ng', role_name: 'medical_officer', role_id: 'r5', department: 'Medical', status: 'active', last_login: new Date().toISOString() },
  { id: 'usr-5', first_name: 'Tunde', last_name: 'Adeyemi', email: 'ops@healthshield.ng', role_name: 'operations_manager', role_id: 'r2', department: 'Operations', status: 'active', last_login: new Date().toISOString() },
  { id: 'usr-6', first_name: 'Ngozi', last_name: 'Eze', email: 'cs@healthshield.ng', role_name: 'customer_service', role_id: 'r6', department: 'Customer Service', status: 'active', last_login: new Date().toISOString() },
];

const MOCK_ROLES = [
  { id: 'r1', name: 'super_admin', description: 'Full access to all system features and administration', user_count: 2, is_system: true },
  { id: 'r2', name: 'operations_manager', description: 'Oversees enrollments, health plans, and employers', user_count: 5, is_system: true },
  { id: 'r3', name: 'claims_officer', description: 'Reviews, adjudicates, and approves healthcare claims', user_count: 8, is_system: true },
  { id: 'r4', name: 'finance_officer', description: 'Manages invoicing, premium collections, and provider settlements', user_count: 4, is_system: true },
  { id: 'r5', name: 'medical_officer', description: 'Handles clinical authorizations and hospital referrals', user_count: 6, is_system: true },
  { id: 'r6', name: 'customer_service', description: 'Resolves member inquiries, grievances, and service cases', user_count: 12, is_system: false },
];

const MOCK_AUDIT = [
  { id: '1', created_at: new Date().toISOString(), user_email: 'admin@healthshield.ng', module: 'Auth', action: 'LOGIN', resource_type: 'User', resource_id: 'U-001', ip_address: '196.6.12.45', status: 'success' },
  { id: '2', created_at: new Date(Date.now() - 3600000).toISOString(), user_email: 'claims@healthshield.ng', module: 'Claims', action: 'APPROVE', resource_type: 'Claim', resource_id: 'CLM-20261001-2001', ip_address: '196.6.12.46', status: 'success' },
  { id: '3', created_at: new Date(Date.now() - 7200000).toISOString(), user_email: 'finance@healthshield.ng', module: 'Finance', action: 'CREATE', resource_type: 'Invoice', resource_id: 'INV-2026-005', ip_address: '196.6.12.47', status: 'success' },
];

const MOCK_SECURITY = [
  { id: '1', created_at: new Date().toISOString(), event_type: 'BRUTE_FORCE_ATTEMPT', severity: 'high', user_email: 'unknown@ext.com', ip_address: '45.123.67.89', description: '5 consecutive failed login attempts detected' },
  { id: '2', created_at: new Date(Date.now() - 14400000).toISOString(), event_type: 'UNUSUAL_ACCESS_TIME', severity: 'medium', user_email: 'claims@healthshield.ng', ip_address: '196.6.12.46', description: 'Login detected outside normal working hours (2:30 AM)' },
];

// ─── USERS ─────────────────────────────────────────────────────────────────

const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, role_id } = req.query;
  const { limit: lim, offset } = paginate(page, limit);

  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;

    if (search) {
      where.push(`(u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (status) { where.push(`u.status = $${idx}`); params.push(status); idx++; }
    if (role_id) { where.push(`u.role_id = $${idx}`); params.push(role_id); idx++; }

    const whereStr = where.join(' AND ');
    const countResult = await pool.query(`SELECT COUNT(*) FROM users u WHERE ${whereStr}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.status, u.mfa_enabled, u.last_login, u.created_at,
              r.name as role_name, o.name as org_name, d.name as dept_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE ${whereStr}
       ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, lim, offset]
    );
    return res.json({ success: true, data: result.rows, pagination: paginationMeta(total, page, lim) });
  } catch (err) {
    let list = [...MOCK_USERS];
    if (search) list = list.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    if (status) list = list.filter(u => u.status === status);
    if (role_id) list = list.filter(u => u.role_id === role_id);
    return res.json({ success: true, data: list, pagination: paginationMeta(list.length, page, lim), _demo: true });
  }
});

const getUserById = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.status, u.mfa_enabled, u.last_login, u.created_at,
              r.name as role_name, r.id as role_id, o.name as org_name, d.name as dept_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows[0]) return res.json({ success: true, data: result.rows[0] });
  } catch (err) {}

  const u = MOCK_USERS.find(x => x.id === req.params.id) || MOCK_USERS[0];
  res.json({ success: true, data: u, _demo: true });
});

const createUser = asyncHandler(async (req, res) => {
  const { email, password, first_name, last_name, phone, role_id, department } = req.body;
  if (!email || !first_name || !last_name) return res.status(400).json({ success: false, message: 'email, first_name and last_name are required' });

  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password || 'Staff@123', 10);
    const result = await pool.query(
      `INSERT INTO users (id,email,password_hash,first_name,last_name,phone,role_id,status)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,'active') RETURNING id,email,first_name,last_name,status`,
      [email.toLowerCase(), hash, first_name, last_name, phone || null, role_id || null]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const newUser = { id: `usr-${Date.now()}`, email, first_name, last_name, phone, role_name: 'staff', role_id, department, status: 'active' };
    MOCK_USERS.unshift(newUser);
    return res.status(201).json({ success: true, data: newUser, _demo: true });
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const u = MOCK_USERS.find(x => x.id === req.params.id) || MOCK_USERS[0];
  Object.assign(u, req.body);
  res.json({ success: true, data: u, _demo: true });
});

const disableUser = asyncHandler(async (req, res) => {
  const u = MOCK_USERS.find(x => x.id === req.params.id);
  if (u) u.status = 'inactive';
  res.json({ success: true, message: 'User disabled', _demo: true });
});

// ─── ROLES ─────────────────────────────────────────────────────────────────

const getAllRoles = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(`SELECT r.*, (SELECT COUNT(*) FROM users WHERE role_id=r.id) as user_count FROM roles r ORDER BY name ASC`);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.json({ success: true, data: MOCK_ROLES, _demo: true });
  }
});

const createRole = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const newR = { id: `r-${Date.now()}`, name, description, user_count: 0, is_system: false };
  MOCK_ROLES.push(newR);
  res.status(201).json({ success: true, data: newR, _demo: true });
});

// ─── AUDIT & SECURITY ───────────────────────────────────────────────────────

const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, module } = req.query;
  const { limit: lim, offset } = paginate(page, limit);
  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;
    if (module) { where.push(`module = $${idx}`); params.push(module); idx++; }
    const result = await pool.query(`SELECT * FROM audit_logs WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`, [...params, lim, offset]);
    return res.json({ success: true, data: result.rows, pagination: paginationMeta(result.rows.length, page, lim) });
  } catch (err) {
    return res.json({ success: true, data: MOCK_AUDIT, pagination: paginationMeta(MOCK_AUDIT.length, page, lim), _demo: true });
  }
});

const getSecurityEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, severity } = req.query;
  const { limit: lim, offset } = paginate(page, limit);
  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;
    if (severity) { where.push(`severity = $${idx}`); params.push(severity); idx++; }
    const result = await pool.query(`SELECT * FROM security_events WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`, [...params, lim, offset]);
    return res.json({ success: true, data: result.rows, pagination: paginationMeta(result.rows.length, page, lim) });
  } catch (err) {
    return res.json({ success: true, data: MOCK_SECURITY, pagination: paginationMeta(MOCK_SECURITY.length, page, lim), _demo: true });
  }
});

const getNotifications = asyncHandler(async (req, res) => {
  res.json({ success: true, data: [], _demo: true });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Notification marked as read', _demo: true });
});

// ─── REPORTS ────────────────────────────────────────────────────────────────

const getMemberReport = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      stats: { total: 1250, active: 1180, new_this_month: 28, terminated_this_month: 5 },
      by_employer: [
        { employer_name: 'Zenith Bank Plc', member_count: 210 },
        { employer_name: 'MTN Nigeria', member_count: 185 },
        { employer_name: 'Dangote Group', member_count: 162 },
        { employer_name: 'GTBank Plc', member_count: 140 },
        { employer_name: 'Access Bank', member_count: 118 },
      ],
      monthly: [
        { month: 'May', count: 22 },
        { month: 'Jun', count: 31 },
        { month: 'Jul', count: 19 },
        { month: 'Aug', count: 28 },
        { month: 'Sep', count: 35 },
        { month: 'Oct', count: 28 },
      ],
      status_table: [
        { status: 'Active', count: 1180, percentage: '94.4%' },
        { status: 'Suspended', count: 42, percentage: '3.4%' },
        { status: 'Terminated', count: 28, percentage: '2.2%' },
      ],
    },
    _demo: true,
  });
});

const getClaimsReport = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      stats: { total_claims: 1450, total_submitted: 125000000, total_approved: 98500000, approval_rate: 78.8 },
      by_status: [
        { name: 'Paid', value: 650, color: '#22c55e' },
        { name: 'Approved', value: 380, color: '#3b82f6' },
        { name: 'Under Review', value: 220, color: '#f59e0b' },
        { name: 'Submitted', value: 120, color: '#8b5cf6' },
        { name: 'Denied', value: 80, color: '#ef4444' },
      ],
      top_providers: [
        { provider_name: 'LUTH Idi-Araba', claim_count: 320, total_amount: 28500000 },
        { provider_name: 'Reddington VI', claim_count: 240, total_amount: 24000000 },
        { provider_name: 'St. Nicholas Hospital', claim_count: 190, total_amount: 17200000 },
        { provider_name: 'First Cardiology', claim_count: 145, total_amount: 15800000 },
        { provider_name: 'HealthPlus Pharmacy', claim_count: 280, total_amount: 8400000 },
      ],
      by_category: [
        { category: 'Inpatient Care', count: 310, amount: 48000000, avg: 154838 },
        { category: 'Surgery & Procedures', count: 125, amount: 35000000, avg: 280000 },
        { category: 'Outpatient Consultations', count: 620, amount: 24800000, avg: 40000 },
        { category: 'Pharmacy & Drugs', count: 280, amount: 11200000, avg: 40000 },
        { category: 'Diagnostic & Lab', count: 115, amount: 6000000, avg: 52173 },
      ],
    },
    _demo: true,
  });
});

const getFinancialReport = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      stats: { total_revenue: 187500000, total_expenditure: 142000000, net_position: 45500000, claims_ratio: 75.7 },
      trend: [
        { month: 'May', revenue: 28000000, expenditure: 21000000 },
        { month: 'Jun', revenue: 31000000, expenditure: 23500000 },
        { month: 'Jul', revenue: 29500000, expenditure: 22800000 },
        { month: 'Aug', revenue: 33000000, expenditure: 25000000 },
        { month: 'Sep', revenue: 35500000, expenditure: 26500000 },
        { month: 'Oct', revenue: 30500000, expenditure: 23200000 },
      ],
      invoice_breakdown: [
        { status: 'Paid', count: 48, total_amount: 145000000, percentage: '77.3%' },
        { status: 'Sent', count: 12, total_amount: 38000000, percentage: '20.3%' },
        { status: 'Overdue', count: 4, total_amount: 8750000, percentage: '4.7%' },
        { status: 'Draft', count: 6, total_amount: 15000000, percentage: '8.0%' },
      ],
    },
    _demo: true,
  });
});

const getProviderReport = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      stats: { total_providers: 127, active_providers: 118, top_provider_claims: 320, avg_claims_per_provider: 12 },
      top_spend: [
        { provider_name: 'LUTH Idi-Araba', total_amount: 28500000 },
        { provider_name: 'Reddington Hospital', total_amount: 24000000 },
        { provider_name: 'St. Nicholas Hospital', total_amount: 17200000 },
        { provider_name: 'First Cardiology', total_amount: 15800000 },
        { provider_name: 'Medview Diagnostics', total_amount: 9500000 },
        { provider_name: 'HealthPlus Pharmacy', total_amount: 8400000 },
      ],
      performance: [
        { provider_name: 'LUTH Idi-Araba', type: 'hospital', tier: 'Tier 1', total_claims: 320, total_amount: 28500000, avg_amount: 89062, status: 'active' },
        { provider_name: 'Reddington Hospital', type: 'hospital', tier: 'Tier 1', total_claims: 240, total_amount: 24000000, avg_amount: 100000, status: 'active' },
        { provider_name: 'St. Nicholas Hospital', type: 'hospital', tier: 'Tier 2', total_claims: 190, total_amount: 17200000, avg_amount: 90526, status: 'active' },
        { provider_name: 'HealthPlus Pharmacy', type: 'pharmacy', tier: 'Tier 2', total_claims: 280, total_amount: 8400000, avg_amount: 30000, status: 'active' },
        { provider_name: 'Medview Diagnostics', type: 'laboratory', tier: 'Tier 3', total_claims: 165, total_amount: 9500000, avg_amount: 57575, status: 'active' },
      ],
    },
    _demo: true,
  });
});

const getUtilizationReport = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      stats: { total_auths: 342, approval_rate: 82, avg_processing_days: 1.4, emergency_cases: 18 },
      by_category: [
        { category: 'Surgery', count: 110 },
        { category: 'Inpatient', count: 85 },
        { category: 'Specialist', count: 58 },
        { category: 'Diagnostic/MRI', count: 42 },
        { category: 'Maternity', count: 29 },
        { category: 'Dental/Optical', count: 18 },
      ],
      monthly_trend: [
        { month: 'May', count: 42 },
        { month: 'Jun', count: 51 },
        { month: 'Jul', count: 48 },
        { month: 'Aug', count: 62 },
        { month: 'Sep', count: 70 },
        { month: 'Oct', count: 69 },
      ],
      high_cost_members: [
        { member_name: 'Babajide Adeleke', member_number: 'MBR-0089', plan: 'Corporate Elite', total_claims: 3450000, count: 4, last_claim: '2026-09-28' },
        { member_name: 'Folashade Alakija', member_number: 'MBR-0112', plan: 'Premium Care', total_claims: 2800000, count: 6, last_claim: '2026-10-02' },
        { member_name: 'Chukwudi Nnamdi', member_number: 'MBR-0043', plan: 'Standard Care', total_claims: 2150000, count: 3, last_claim: '2026-09-15' },
        { member_name: 'Aisha Bello', member_number: 'MBR-0231', plan: 'Corporate Elite', total_claims: 1900000, count: 5, last_claim: '2026-10-04' },
        { member_name: 'Oluwaseun Danjuma', member_number: 'MBR-0095', plan: 'Standard Care', total_claims: 1650000, count: 7, last_claim: '2026-09-30' },
      ],
    },
    _demo: true,
  });
});

module.exports = {
  getAllUsers, getUserById, createUser, updateUser, disableUser,
  getAllRoles, createRole,
  getAuditLogs, getSecurityEvents, getNotifications, markNotificationRead,
  getMemberReport, getClaimsReport, getFinancialReport, getProviderReport, getUtilizationReport,
};
