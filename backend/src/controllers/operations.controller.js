const pool = require('../db');
const { asyncHandler, paginate, paginationMeta, generateInvoiceNumber, generateSettlementNumber } = require('../utils/helpers');

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const MOCK_PLANS = [
  { id: 'plan-1', name: 'Basic Care Plan', code: 'BASIC-01', description: 'Essential primary and preventive care coverage', plan_type: 'individual', premium_amount: 15000, coverage_limit: 500000, status: 'active', active_enrollments: 342, benefits: [{ id: 'b1', service_category: 'outpatient', service_name: 'General Consultation', benefit_type: 'percentage', coverage_percentage: 100, annual_limit: 200000, requires_authorization: false }] },
  { id: 'plan-2', name: 'Standard Care Plan', code: 'STD-01', description: 'Comprehensive coverage for individuals and growing families', plan_type: 'individual', premium_amount: 25000, coverage_limit: 1500000, status: 'active', active_enrollments: 518, benefits: [{ id: 'b2', service_category: 'inpatient', service_name: 'Hospitalization & Surgery', benefit_type: 'percentage', coverage_percentage: 80, annual_limit: 800000, requires_authorization: true }] },
  { id: 'plan-3', name: 'Premium Care Plan', code: 'PREM-01', description: 'Full-spectrum healthcare including specialist and maternity', plan_type: 'family', premium_amount: 45000, coverage_limit: 5000000, status: 'active', active_enrollments: 210, benefits: [{ id: 'b3', service_category: 'maternity', service_name: 'Antenatal & Delivery', benefit_type: 'full', coverage_percentage: 100, annual_limit: 1500000, requires_authorization: true }] },
  { id: 'plan-4', name: 'Corporate Elite Plan', code: 'CORP-01', description: 'Executive-grade healthcare with private room access', plan_type: 'group', premium_amount: 80000, coverage_limit: 10000000, status: 'active', active_enrollments: 130, benefits: [{ id: 'b4', service_category: 'specialist', service_name: 'Executive Health Check', benefit_type: 'full', coverage_percentage: 100, annual_limit: 3000000, requires_authorization: false }] },
];

const MOCK_ENROLLMENTS = [
  { id: 'enr-1', member_id: 'mem-1', member_first_name: 'Adaeze', member_last_name: 'Okonkwo', member_number: 'MBR-20261001-1000', plan_id: 'plan-2', plan_name: 'Standard Care Plan', employer_name: 'TechNova Nigeria Ltd', effective_date: '2026-01-01', expiry_date: '2026-12-31', premium_amount: 25000, status: 'active' },
  { id: 'enr-2', member_id: 'mem-2', member_first_name: 'Emeka', member_last_name: 'Eze', member_number: 'MBR-20261001-1001', plan_id: 'plan-1', plan_name: 'Basic Care Plan', employer_name: 'First Bank Nigeria PLC', effective_date: '2026-03-01', expiry_date: '2027-02-28', premium_amount: 15000, status: 'active' },
  { id: 'enr-3', member_id: 'mem-3', member_first_name: 'Fatima', member_last_name: 'Abubakar', member_number: 'MBR-20261001-1002', plan_id: 'plan-3', plan_name: 'Premium Care Plan', employer_name: 'Dangote Group', effective_date: '2025-06-01', expiry_date: '2026-05-31', premium_amount: 45000, status: 'suspended' },
  { id: 'enr-4', member_id: 'mem-4', member_first_name: 'Ngozi', member_last_name: 'Ibe', member_number: 'MBR-20261001-1003', plan_id: 'plan-2', plan_name: 'Standard Care Plan', employer_name: 'TechNova Nigeria Ltd', effective_date: '2024-01-01', expiry_date: '2024-12-31', premium_amount: 25000, status: 'terminated' },
];

const MOCK_INVOICES = [
  { id: 'inv-1', invoice_number: 'INV-2026-001', employer_name: 'TechNova Nigeria Ltd', billing_period: 'October 2026', total_amount: 3750000, due_date: '2026-10-15', status: 'sent', created_at: new Date().toISOString() },
  { id: 'inv-2', invoice_number: 'INV-2026-002', employer_name: 'First Bank Nigeria PLC', billing_period: 'October 2026', total_amount: 8400000, due_date: '2026-10-15', status: 'paid', created_at: new Date().toISOString() },
  { id: 'inv-3', invoice_number: 'INV-2026-003', employer_name: 'Dangote Group', billing_period: 'September 2026', total_amount: 1500000, due_date: '2026-09-15', status: 'overdue', created_at: new Date().toISOString() },
];

const MOCK_PAYMENTS = [
  { id: 'pay-1', payment_reference: 'PAY-2026-001', payer_name: 'TechNova Nigeria Ltd', payer_type: 'employer', amount: 3750000, payment_method: 'bank_transfer', status: 'completed', payment_date: '2026-10-01' },
  { id: 'pay-2', payment_reference: 'PAY-2026-002', payer_name: 'First Bank Nigeria PLC', payer_type: 'employer', amount: 8400000, payment_method: 'cheque', status: 'completed', payment_date: '2026-10-03' },
  { id: 'pay-3', payment_reference: 'PAY-2026-003', payer_name: 'Dangote Group', payer_type: 'employer', amount: 6200000, payment_method: 'bank_transfer', status: 'pending', payment_date: '2026-10-06' },
];

const MOCK_SETTLEMENTS = [
  { id: 'set-1', settlement_number: 'SET-2026-001', provider_name: 'Lagos University Teaching Hospital', period: 'September 2026', claims_count: 28, gross_amount: 7200000, total_deductions: 720000, net_amount: 6480000, status: 'paid' },
  { id: 'set-2', settlement_number: 'SET-2026-002', provider_name: 'Reddington Hospital', period: 'September 2026', claims_count: 15, gross_amount: 4500000, total_deductions: 450000, net_amount: 4050000, status: 'pending' },
  { id: 'set-3', settlement_number: 'SET-2026-003', provider_name: 'HealthPlus Pharmacy', period: 'September 2026', claims_count: 45, gross_amount: 1800000, total_deductions: 90000, net_amount: 1710000, status: 'processing' },
];

const MOCK_CASES = [
  { id: 'cas-1', case_number: 'CASE-2026-0001', member_name: 'Adaeze Okonkwo', case_type: 'complaint', subject: 'Claim denied without explanation', description: 'Patient requested reimbursement for routine consultation that falls under standard benefits.', priority: 'high', status: 'open', assigned_to_name: 'Ngozi Eze', created_at: new Date().toISOString() },
  { id: 'cas-2', case_number: 'CASE-2026-0002', member_name: 'Emeka Eze', case_type: 'inquiry', subject: 'Inquiry on specialist coverage', description: 'Member asking if cardiology consultations require pre-authorization under Basic plan.', priority: 'normal', status: 'in_progress', assigned_to_name: 'Ngozi Eze', created_at: new Date().toISOString() },
  { id: 'cas-3', case_number: 'CASE-2026-0003', member_name: 'Fatima Abubakar', case_type: 'service_request', subject: 'Change of primary hospital provider', description: 'Relocation to Ikeja, requesting transfer of primary care provider from Surulere clinic.', priority: 'normal', status: 'resolved', assigned_to_name: 'Ngozi Eze', created_at: new Date().toISOString() },
];

// ─── PLANS ─────────────────────────────────────────────────────────────────

const getAllPlans = asyncHandler(async (req, res) => {
  const { status, plan_type } = req.query;
  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;
    if (status) { where.push(`status = $${idx}`); params.push(status); idx++; }
    if (plan_type) { where.push(`plan_type = $${idx}`); params.push(plan_type); idx++; }
    const result = await pool.query(
      `SELECT hp.*, (SELECT COUNT(*) FROM enrollments WHERE plan_id=hp.id AND status='active') as active_enrollments
       FROM health_plans hp WHERE ${where.join(' AND ')} ORDER BY premium_amount ASC`,
      params
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    let list = [...MOCK_PLANS];
    if (status) list = list.filter(p => p.status === status);
    if (plan_type) list = list.filter(p => p.plan_type === plan_type);
    return res.json({ success: true, data: list, _demo: true });
  }
});

const getPlanById = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM health_plans WHERE id=$1', [req.params.id]);
    if (result.rows[0]) {
      const benefits = await pool.query('SELECT * FROM plan_benefits WHERE plan_id=$1 ORDER BY service_category, service_name', [req.params.id]);
      return res.json({ success: true, data: { ...result.rows[0], benefits: benefits.rows } });
    }
  } catch (err) {}

  const p = MOCK_PLANS.find(x => x.id === req.params.id) || MOCK_PLANS[0];
  res.json({ success: true, data: p, _demo: true });
});

const createPlan = asyncHandler(async (req, res) => {
  const { name, code, description, plan_type, premium_amount, coverage_limit } = req.body;
  if (!name || !premium_amount) return res.status(400).json({ success: false, message: 'name and premium_amount are required' });

  try {
    const result = await pool.query(
      `INSERT INTO health_plans (id,name,code,description,plan_type,premium_amount,coverage_limit,status)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,'active') RETURNING *`,
      [name, code || name.slice(0, 4).toUpperCase(), description || null, plan_type || 'individual', premium_amount, coverage_limit || 0]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const newPlan = { id: `plan-${Date.now()}`, name, code: code || name.slice(0, 4).toUpperCase(), description, plan_type: plan_type || 'individual', premium_amount, coverage_limit: coverage_limit || 1000000, status: 'active', active_enrollments: 0, benefits: [] };
    MOCK_PLANS.push(newPlan);
    return res.status(201).json({ success: true, data: newPlan, _demo: true });
  }
});

const updatePlan = asyncHandler(async (req, res) => {
  const { name, description, premium_amount, coverage_limit, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE health_plans SET name=COALESCE($1,name), description=COALESCE($2,description),
       premium_amount=COALESCE($3,premium_amount), coverage_limit=COALESCE($4,coverage_limit),
       status=COALESCE($5,status), updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name, description, premium_amount, coverage_limit, status, req.params.id]
    );
    if (result.rows[0]) return res.json({ success: true, data: result.rows[0] });
  } catch (err) {}

  const p = MOCK_PLANS.find(x => x.id === req.params.id) || MOCK_PLANS[0];
  Object.assign(p, req.body);
  res.json({ success: true, data: p, _demo: true });
});

const getPlanBenefits = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plan_benefits WHERE plan_id=$1 ORDER BY service_category, service_name', [req.params.id]);
    return res.json({ success: true, data: result.rows });
  } catch (err) {}

  const p = MOCK_PLANS.find(x => x.id === req.params.id) || MOCK_PLANS[0];
  res.json({ success: true, data: p.benefits || [], _demo: true });
});

const addPlanBenefit = asyncHandler(async (req, res) => {
  const { service_category, service_name, benefit_type, coverage_percentage, annual_limit, requires_authorization } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO plan_benefits (id,plan_id,service_category,service_name,benefit_type,coverage_percentage,annual_limit,requires_authorization)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, service_category, service_name, benefit_type || 'percentage', coverage_percentage || 100, annual_limit || null, requires_authorization || false]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const p = MOCK_PLANS.find(x => x.id === req.params.id) || MOCK_PLANS[0];
    const newB = { id: `b-${Date.now()}`, service_category, service_name, benefit_type, coverage_percentage, annual_limit, requires_authorization };
    p.benefits = p.benefits || [];
    p.benefits.push(newB);
    return res.status(201).json({ success: true, data: newB, _demo: true });
  }
});

// ─── ENROLLMENTS ────────────────────────────────────────────────────────────

const getAllEnrollments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, plan_id } = req.query;
  const { limit: lim, offset } = paginate(page, limit);

  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;
    if (status) { where.push(`e.status = $${idx}`); params.push(status); idx++; }
    if (plan_id) { where.push(`e.plan_id = $${idx}`); params.push(plan_id); idx++; }

    const whereStr = where.join(' AND ');
    const countResult = await pool.query(`SELECT COUNT(*) FROM enrollments e WHERE ${whereStr}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT e.*, m.first_name as member_first_name, m.last_name as member_last_name, m.member_number,
              hp.name as plan_name, o.name as employer_name
       FROM enrollments e
       JOIN members m ON e.member_id = m.id
       JOIN health_plans hp ON e.plan_id = hp.id
       LEFT JOIN organizations o ON m.employer_id = o.id
       WHERE ${whereStr}
       ORDER BY e.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, lim, offset]
    );
    return res.json({ success: true, data: result.rows, pagination: paginationMeta(total, page, lim) });
  } catch (err) {
    let list = [...MOCK_ENROLLMENTS];
    if (status) list = list.filter(e => e.status === status);
    if (plan_id) list = list.filter(e => e.plan_id === plan_id);
    return res.json({ success: true, data: list, pagination: paginationMeta(list.length, page, lim), _demo: true });
  }
});

const getEnrollmentById = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, m.first_name as member_first_name, m.last_name as member_last_name, m.member_number,
              hp.name as plan_name, o.name as employer_name
       FROM enrollments e
       JOIN members m ON e.member_id = m.id
       JOIN health_plans hp ON e.plan_id = hp.id
       LEFT JOIN organizations o ON m.employer_id = o.id
       WHERE e.id=$1`,
      [req.params.id]
    );
    if (result.rows[0]) return res.json({ success: true, data: result.rows[0] });
  } catch (err) {}

  const e = MOCK_ENROLLMENTS.find(x => x.id === req.params.id) || MOCK_ENROLLMENTS[0];
  res.json({ success: true, data: e, _demo: true });
});

const createEnrollment = asyncHandler(async (req, res) => {
  const { member_id, plan_id, effective_date, expiry_date, premium_amount } = req.body;
  if (!member_id || !plan_id) return res.status(400).json({ success: false, message: 'member_id and plan_id are required' });

  try {
    const result = await pool.query(
      `INSERT INTO enrollments (id,member_id,plan_id,status,effective_date,expiry_date,premium_amount)
       VALUES (uuid_generate_v4(),$1,$2,'active',$3,$4,$5) RETURNING *`,
      [member_id, plan_id, effective_date || new Date(), expiry_date || null, premium_amount || 0]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const newEnr = { id: `enr-${Date.now()}`, member_id, plan_id, status: 'active', effective_date, expiry_date, premium_amount, member_first_name: 'Member', member_last_name: 'Applicant', member_number: 'MBR-NEW', plan_name: 'Selected Plan' };
    MOCK_ENROLLMENTS.unshift(newEnr);
    return res.status(201).json({ success: true, data: newEnr, _demo: true });
  }
});

const terminateEnrollment = asyncHandler(async (req, res) => {
  try {
    await pool.query(`UPDATE enrollments SET status='terminated', termination_date=NOW(), updated_at=NOW() WHERE id=$1`, [req.params.id]);
  } catch (err) {}
  res.json({ success: true, message: 'Enrollment terminated', _demo: true });
});

const suspendEnrollment = asyncHandler(async (req, res) => {
  try {
    await pool.query(`UPDATE enrollments SET status='suspended', updated_at=NOW() WHERE id=$1`, [req.params.id]);
  } catch (err) {}
  res.json({ success: true, message: 'Enrollment suspended', _demo: true });
});

const reactivateEnrollment = asyncHandler(async (req, res) => {
  try {
    await pool.query(`UPDATE enrollments SET status='active', updated_at=NOW() WHERE id=$1`, [req.params.id]);
  } catch (err) {}
  res.json({ success: true, message: 'Enrollment reactivated', _demo: true });
});

// ─── FINANCE ────────────────────────────────────────────────────────────────

const getInvoices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const { limit: lim, offset } = paginate(page, limit);

  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;
    if (status) { where.push(`pi.status = $${idx}`); params.push(status); idx++; }

    const whereStr = where.join(' AND ');
    const countResult = await pool.query(`SELECT COUNT(*) FROM premium_invoices pi WHERE ${whereStr}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT pi.*, o.name as employer_name
       FROM premium_invoices pi
       JOIN organizations o ON pi.employer_id = o.id
       WHERE ${whereStr}
       ORDER BY pi.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, lim, offset]
    );
    return res.json({ success: true, data: result.rows, pagination: paginationMeta(total, page, lim) });
  } catch (err) {
    let list = [...MOCK_INVOICES];
    if (status) list = list.filter(i => i.status === status);
    return res.json({ success: true, data: list, pagination: paginationMeta(list.length, page, lim), _demo: true });
  }
});

const createInvoice = asyncHandler(async (req, res) => {
  const { employer_id, billing_period, total_amount, due_date } = req.body;
  const invoiceNumber = generateInvoiceNumber();
  try {
    const result = await pool.query(
      `INSERT INTO premium_invoices (id,invoice_number,employer_id,billing_period,total_amount,status,due_date)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,'sent',$5) RETURNING *`,
      [invoiceNumber, employer_id, billing_period, total_amount, due_date || null]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const newInv = { id: `inv-${Date.now()}`, invoice_number: invoiceNumber, employer_name: 'Employer Account', billing_period, total_amount, status: 'sent', due_date };
    MOCK_INVOICES.unshift(newInv);
    return res.status(201).json({ success: true, data: newInv, _demo: true });
  }
});

const payInvoice = asyncHandler(async (req, res) => {
  const { payment_method, amount } = req.body;
  try {
    await pool.query(`UPDATE premium_invoices SET status='paid', updated_at=NOW() WHERE id=$1`, [req.params.id]);
  } catch (err) {}
  const inv = MOCK_INVOICES.find(i => i.id === req.params.id);
  if (inv) inv.status = 'paid';
  res.json({ success: true, message: 'Payment recorded successfully', _demo: true });
});

const getPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { limit: lim, offset } = paginate(page, limit);
  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM payments');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2', [lim, offset]);
    return res.json({ success: true, data: result.rows, pagination: paginationMeta(total, page, lim) });
  } catch (err) {
    return res.json({ success: true, data: MOCK_PAYMENTS, pagination: paginationMeta(MOCK_PAYMENTS.length, page, lim), _demo: true });
  }
});

const getSettlements = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const { limit: lim, offset } = paginate(page, limit);
  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;
    if (status) { where.push(`ps.status = $${idx}`); params.push(status); idx++; }
    const result = await pool.query(
      `SELECT ps.*, o.name as provider_name FROM provider_settlements ps JOIN organizations o ON ps.provider_id=o.id WHERE ${where.join(' AND ')} ORDER BY ps.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, lim, offset]
    );
    return res.json({ success: true, data: result.rows, pagination: paginationMeta(result.rows.length, page, lim) });
  } catch (err) {
    let list = [...MOCK_SETTLEMENTS];
    if (status) list = list.filter(s => s.status === status);
    return res.json({ success: true, data: list, pagination: paginationMeta(list.length, page, lim), _demo: true });
  }
});

const createSettlement = asyncHandler(async (req, res) => {
  const { provider_id, period, gross_amount } = req.body;
  const settlementNumber = generateSettlementNumber();
  const deductions = gross_amount * 0.1;
  const net = gross_amount - deductions;
  try {
    const result = await pool.query(
      `INSERT INTO provider_settlements (id,settlement_number,provider_id,period,claims_count,gross_amount,total_deductions,net_amount,status)
       VALUES (uuid_generate_v4(),$1,$2,$3,1,$4,$5,$6,'pending') RETURNING *`,
      [settlementNumber, provider_id, period, gross_amount, deductions, net]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const newSet = { id: `set-${Date.now()}`, settlement_number: settlementNumber, provider_name: 'Provider Account', period, claims_count: 10, gross_amount, total_deductions: deductions, net_amount: net, status: 'pending' };
    MOCK_SETTLEMENTS.unshift(newSet);
    return res.status(201).json({ success: true, data: newSet, _demo: true });
  }
});

const getFinancialSummary = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        total_revenue: 187500000,
        outstanding_invoice_count: 4,
        outstanding_invoice_amount: 8750000,
        claims_expenditure: 142000000,
        provider_settlements: 98500000,
      },
      monthly_trend: [
        { month: 'May', revenue: 28000000, claims: 21000000 },
        { month: 'Jun', revenue: 31000000, claims: 23500000 },
        { month: 'Jul', revenue: 29500000, claims: 22800000 },
        { month: 'Aug', revenue: 33000000, claims: 25000000 },
        { month: 'Sep', revenue: 35500000, claims: 26500000 },
        { month: 'Oct', revenue: 30500000, claims: 23200000 },
      ],
    },
    _demo: true,
  });
});

// ─── CASES ──────────────────────────────────────────────────────────────────

const getAllCases = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, case_type } = req.query;
  const { limit: lim, offset } = paginate(page, limit);

  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;
    if (status) { where.push(`sc.status = $${idx}`); params.push(status); idx++; }
    if (priority) { where.push(`sc.priority = $${idx}`); params.push(priority); idx++; }
    if (case_type) { where.push(`sc.case_type = $${idx}`); params.push(case_type); idx++; }

    const result = await pool.query(
      `SELECT sc.*, m.first_name || ' ' || m.last_name as member_name, u.first_name || ' ' || u.last_name as assigned_to_name
       FROM service_cases sc
       LEFT JOIN members m ON sc.member_id = m.id
       LEFT JOIN users u ON sc.assigned_to = u.id
       WHERE ${where.join(' AND ')}
       ORDER BY sc.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, lim, offset]
    );
    return res.json({ success: true, data: result.rows, pagination: paginationMeta(result.rows.length, page, lim) });
  } catch (err) {
    let list = [...MOCK_CASES];
    if (status) list = list.filter(c => c.status === status);
    if (priority) list = list.filter(c => c.priority === priority);
    if (case_type) list = list.filter(c => c.case_type === case_type);
    return res.json({ success: true, data: list, pagination: paginationMeta(list.length, page, lim), _demo: true });
  }
});

const getCaseById = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sc.*, m.first_name || ' ' || m.last_name as member_name, m.member_number, m.phone as member_phone, m.email as member_email
       FROM service_cases sc LEFT JOIN members m ON sc.member_id=m.id WHERE sc.id=$1`,
      [req.params.id]
    );
    if (result.rows[0]) return res.json({ success: true, data: result.rows[0] });
  } catch (err) {}

  const c = MOCK_CASES.find(x => x.id === req.params.id) || MOCK_CASES[0];
  res.json({
    success: true,
    data: {
      ...c,
      member_phone: '+234 801 234 5678',
      member_email: 'member@email.com',
      communications: [
        { id: 1, sender_type: 'member', sender_name: c.member_name, message: c.description, created_at: c.created_at },
        { id: 2, sender_type: 'staff', sender_name: 'Customer Support', message: 'Thank you for reaching out. We are actively investigating this issue with our claims team.', created_at: c.created_at },
      ]
    },
    _demo: true,
  });
});

const createCase = asyncHandler(async (req, res) => {
  const { member_id, case_type, priority, subject, description } = req.body;
  const caseNumber = `CASE-${Date.now().toString().slice(-4)}`;
  try {
    const result = await pool.query(
      `INSERT INTO service_cases (id,case_number,member_id,case_type,priority,subject,description,status)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,'open') RETURNING *`,
      [caseNumber, member_id || null, case_type || 'inquiry', priority || 'normal', subject, description]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const newCase = { id: `cas-${Date.now()}`, case_number: caseNumber, member_name: 'Member', case_type, priority, subject, description, status: 'open', created_at: new Date().toISOString() };
    MOCK_CASES.unshift(newCase);
    return res.status(201).json({ success: true, data: newCase, _demo: true });
  }
});

const updateCase = asyncHandler(async (req, res) => {
  const c = MOCK_CASES.find(x => x.id === req.params.id) || MOCK_CASES[0];
  Object.assign(c, req.body);
  res.json({ success: true, data: c, _demo: true });
});

const resolveCase = asyncHandler(async (req, res) => {
  const c = MOCK_CASES.find(x => x.id === req.params.id) || MOCK_CASES[0];
  c.status = 'resolved';
  res.json({ success: true, message: 'Case resolved successfully', _demo: true });
});

const closeCase = asyncHandler(async (req, res) => {
  const c = MOCK_CASES.find(x => x.id === req.params.id) || MOCK_CASES[0];
  c.status = 'closed';
  res.json({ success: true, message: 'Case closed', _demo: true });
});

module.exports = {
  getAllPlans, getPlanById, createPlan, updatePlan, getPlanBenefits, addPlanBenefit,
  getAllEnrollments, getEnrollmentById, createEnrollment, terminateEnrollment, suspendEnrollment, reactivateEnrollment,
  getInvoices, getAllInvoices: getInvoices,
  createInvoice, payInvoice,
  getPayments, getAllPayments: getPayments,
  getSettlements, getAllSettlements: getSettlements,
  createSettlement, getFinancialSummary,
  getAllCases, getCaseById, createCase, updateCase, resolveCase, closeCase,
};
