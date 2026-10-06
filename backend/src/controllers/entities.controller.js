const pool = require('../db');
const { asyncHandler, paginate, paginationMeta } = require('../utils/helpers');

const MOCK_EMPLOYERS = [
  { id: 'emp-1', organization_id: 'emp-1', organization_name: 'TechNova Nigeria Ltd', name: 'TechNova Nigeria Ltd', code: 'TECHNOVA', industry: 'Technology', address: 'Plot 12, Commercial Ave, Yaba', city: 'Lagos', state: 'Lagos', phone: '+234-1-2345678', email: 'corporate@technova.ng', contact_person: 'Chinedu Eze', contact_email: 'c.eze@technova.ng', contact_phone: '+234-802-1112233', employee_count: 350, premium_cycle: 'monthly', status: 'active', active_members: 342 },
  { id: 'emp-2', organization_id: 'emp-2', organization_name: 'First Bank Nigeria PLC', name: 'First Bank Nigeria PLC', code: 'FBN', industry: 'Banking', address: 'Samuel Asabia House, 35 Marina', city: 'Lagos', state: 'Lagos', phone: '+234-1-9052000', email: 'hmo-benefits@firstbank.ng', contact_person: 'Oluwakemi Adeleke', contact_email: 'kemi.adeleke@firstbank.ng', contact_phone: '+234-803-2223344', employee_count: 5000, premium_cycle: 'monthly', status: 'active', active_members: 4850 },
  { id: 'emp-3', organization_id: 'emp-3', organization_name: 'Dangote Group', name: 'Dangote Group', code: 'DANGOTE', industry: 'Manufacturing', address: '1 Alfred Rewane Road, Ikoyi', city: 'Lagos', state: 'Lagos', phone: '+234-1-4480811', email: 'healthservices@dangote.com', contact_person: 'Ibrahim Musa', contact_email: 'i.musa@dangote.com', contact_phone: '+234-805-3334455', employee_count: 12000, premium_cycle: 'quarterly', status: 'active', active_members: 11200 },
];

const MOCK_PROVIDERS = [
  { id: 'prv-1', organization_id: 'prv-1', name: 'Lagos University Teaching Hospital', provider_type: 'hospital', tier: 'Tier 1', code: 'LUTH', address: 'Ishaga Road, Idi-Araba', city: 'Surulere', state: 'Lagos', phone: '+234-1-8765432', email: 'claims@luth.gov.ng', status: 'active', bank_name: 'First Bank', account_number: '1029384756', total_claims: 320 },
  { id: 'prv-2', organization_id: 'prv-2', name: 'Reddington Hospital', provider_type: 'hospital', tier: 'Tier 1', code: 'REDDINGTON', address: '12 Idowu Martins St', city: 'Victoria Island', state: 'Lagos', phone: '+234-1-2715340', email: 'hmo@reddingtonhospital.com', status: 'active', bank_name: 'Zenith Bank', account_number: '2039485761', total_claims: 240 },
  { id: 'prv-3', organization_id: 'prv-3', name: 'HealthPlus Pharmacy', provider_type: 'pharmacy', tier: 'Tier 2', code: 'HEALTHPLUS', address: '15 Commercial Ave, Sabo', city: 'Yaba', state: 'Lagos', phone: '+234-809-1234567', email: 'dispensary@healthplus.com.ng', status: 'active', bank_name: 'GTBank', account_number: '0123456789', total_claims: 280 },
  { id: 'prv-4', organization_id: 'prv-4', name: 'Medview Diagnostics', provider_type: 'laboratory', tier: 'Tier 3', code: 'MEDVIEW', address: '44 Isaac John St, GRA', city: 'Ikeja', state: 'Lagos', phone: '+234-1-4970000', email: 'lab@medview.ng', status: 'active', bank_name: 'Access Bank', account_number: '0987654321', total_claims: 165 },
];

// ─── EMPLOYERS ───────────────────────────────────────────────────────────────

const getAllEmployers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const { limit: lim, offset } = paginate(page, limit);

  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;

    if (search) {
      where.push(`(o.name ILIKE $${idx} OR o.code ILIKE $${idx} OR o.email ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (status) { where.push(`em.status = $${idx}`); params.push(status); idx++; }

    const whereStr = where.join(' AND ');
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM employers em JOIN organizations o ON em.organization_id=o.id WHERE ${whereStr}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT em.*, o.name, o.code, o.address, o.city, o.state, o.phone, o.email, o.status as org_status,
              (SELECT COUNT(*) FROM members WHERE employer_id=o.id AND status='active') as active_members
       FROM employers em JOIN organizations o ON em.organization_id=o.id
       WHERE ${whereStr}
       ORDER BY o.name ASC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, lim, offset]
    );

    return res.json({ success: true, data: result.rows, pagination: paginationMeta(total, page, lim) });
  } catch (err) {
    let list = [...MOCK_EMPLOYERS];
    if (search) list = list.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.code.toLowerCase().includes(search.toLowerCase()));
    if (status) list = list.filter(e => e.status === status);
    return res.json({ success: true, data: list, pagination: paginationMeta(list.length, page, lim), _demo: true });
  }
});

const getEmployerById = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT em.*, o.name, o.code, o.address, o.city, o.state, o.phone, o.email, o.country, o.website
       FROM employers em JOIN organizations o ON em.organization_id=o.id
       WHERE em.organization_id=$1 OR em.id=$1`,
      [req.params.id]
    );
    if (result.rows[0]) return res.json({ success: true, data: result.rows[0] });
  } catch (err) {}

  const e = MOCK_EMPLOYERS.find(x => x.id === req.params.id || x.organization_id === req.params.id) || MOCK_EMPLOYERS[0];
  res.json({ success: true, data: e, _demo: true });
});

const createEmployer = asyncHandler(async (req, res) => {
  const { name, code, address, city, state, phone, email, industry, contact_person, contact_email, contact_phone, employee_count, premium_cycle } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'name is required' });

  try {
    const { v4: uuidv4 } = require('uuid');
    const orgId = uuidv4();
    await pool.query(
      `INSERT INTO organizations (id,name,type,code,status,address,city,state,phone,email)
       VALUES ($1,$2,'employer',$3,'active',$4,$5,$6,$7,$8)`,
      [orgId, name, code || null, address || null, city || null, state || null, phone || null, email || null]
    );
    const result = await pool.query(
      `INSERT INTO employers (id,organization_id,industry,contact_person,contact_email,contact_phone,employee_count,premium_cycle)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [orgId, industry || null, contact_person || null, contact_email || null, contact_phone || null, employee_count || 0, premium_cycle || 'monthly']
    );
    return res.status(201).json({ success: true, data: { ...result.rows[0], name, code, address, city, state, phone, email } });
  } catch (err) {
    const newEmp = { id: `emp-${Date.now()}`, organization_id: `emp-${Date.now()}`, name, code: code || name.slice(0, 4).toUpperCase(), industry, contact_person, contact_email, contact_phone, employee_count: employee_count || 50, premium_cycle: premium_cycle || 'monthly', status: 'active', active_members: 0 };
    MOCK_EMPLOYERS.unshift(newEmp);
    return res.status(201).json({ success: true, data: newEmp, _demo: true });
  }
});

const updateEmployer = asyncHandler(async (req, res) => {
  const { name, phone, email, address, city, state, industry, contact_person, contact_email, contact_phone, employee_count, premium_cycle, status } = req.body;
  try {
    await pool.query(
      `UPDATE organizations SET name=COALESCE($1,name), phone=COALESCE($2,phone), email=COALESCE($3,email), address=COALESCE($4,address), city=COALESCE($5,city), state=COALESCE($6,state), status=COALESCE($7,status), updated_at=NOW()
       WHERE id=(SELECT organization_id FROM employers WHERE id=$8 OR organization_id=$8)`,
      [name, phone, email, address, city, state, status, req.params.id]
    );
    const result = await pool.query(
      `UPDATE employers SET industry=COALESCE($1,industry), contact_person=COALESCE($2,contact_person), contact_email=COALESCE($3,contact_email), contact_phone=COALESCE($4,contact_phone), employee_count=COALESCE($5,employee_count), premium_cycle=COALESCE($6,premium_cycle), updated_at=NOW()
       WHERE id=$7 OR organization_id=$7 RETURNING *`,
      [industry, contact_person, contact_email, contact_phone, employee_count, premium_cycle, req.params.id]
    );
    if (result.rows[0]) return res.json({ success: true, data: result.rows[0] });
  } catch (err) {}

  const e = MOCK_EMPLOYERS.find(x => x.id === req.params.id || x.organization_id === req.params.id) || MOCK_EMPLOYERS[0];
  Object.assign(e, req.body);
  res.json({ success: true, data: e, _demo: true });
});

const getEmployerMembers = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, hp.name as plan_name, e.status as enrollment_status, e.effective_date
       FROM members m
       LEFT JOIN enrollments e ON e.member_id=m.id AND e.status='active'
       LEFT JOIN health_plans hp ON e.plan_id=hp.id
       WHERE m.employer_id=$1 OR m.employer_id=(SELECT organization_id FROM employers WHERE id=$1)
       ORDER BY m.created_at DESC`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {}

  res.json({
    success: true,
    data: [
      { id: 'mem-1', member_number: 'MBR-20261001-1000', first_name: 'Adaeze', last_name: 'Okonkwo', status: 'active', plan_name: 'Standard Care Plan', effective_date: '2026-01-01' },
      { id: 'mem-4', member_number: 'MBR-20261001-1003', first_name: 'Ngozi', last_name: 'Ibe', status: 'active', plan_name: 'Standard Care Plan', effective_date: '2026-02-01' },
    ],
    _demo: true,
  });
});

const getEmployerInvoices = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM premium_invoices
       WHERE employer_id=$1 OR employer_id=(SELECT organization_id FROM employers WHERE id=$1)
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {}

  res.json({
    success: true,
    data: [
      { id: 'inv-1', invoice_number: 'INV-2026-001', billing_period: 'October 2026', total_amount: 3750000, due_date: '2026-10-15', status: 'sent' },
      { id: 'inv-2', invoice_number: 'INV-2026-002', billing_period: 'September 2026', total_amount: 3750000, due_date: '2026-09-15', status: 'paid' },
    ],
    _demo: true,
  });
});

// ─── PROVIDERS ───────────────────────────────────────────────────────────────

const getAllProviders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, provider_type, status } = req.query;
  const { limit: lim, offset } = paginate(page, limit);

  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;

    if (search) {
      where.push(`(o.name ILIKE $${idx} OR o.code ILIKE $${idx} OR o.city ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (provider_type) { where.push(`pr.provider_type = $${idx}`); params.push(provider_type); idx++; }
    if (status) { where.push(`pr.status = $${idx}`); params.push(status); idx++; }

    const whereStr = where.join(' AND ');
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM providers pr JOIN organizations o ON pr.organization_id=o.id WHERE ${whereStr}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT pr.*, o.name, o.code, o.address, o.city, o.state, o.phone, o.email, o.status as org_status,
              (SELECT COUNT(*) FROM claims WHERE provider_id=o.id) as total_claims
       FROM providers pr JOIN organizations o ON pr.organization_id=o.id
       WHERE ${whereStr}
       ORDER BY o.name ASC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, lim, offset]
    );

    return res.json({ success: true, data: result.rows, pagination: paginationMeta(total, page, lim) });
  } catch (err) {
    let list = [...MOCK_PROVIDERS];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase()));
    if (provider_type) list = list.filter(p => p.provider_type === provider_type);
    if (status) list = list.filter(p => p.status === status);
    return res.json({ success: true, data: list, pagination: paginationMeta(list.length, page, lim), _demo: true });
  }
});

const getProviderById = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pr.*, o.name, o.code, o.address, o.city, o.state, o.phone, o.email, o.country, o.website
       FROM providers pr JOIN organizations o ON pr.organization_id=o.id
       WHERE pr.organization_id=$1 OR pr.id=$1`,
      [req.params.id]
    );
    if (result.rows[0]) {
      const locs = await pool.query(`SELECT * FROM provider_locations WHERE provider_id=$1`, [result.rows[0].organization_id]);
      return res.json({ success: true, data: { ...result.rows[0], locations: locs.rows } });
    }
  } catch (err) {}

  const p = MOCK_PROVIDERS.find(x => x.id === req.params.id || x.organization_id === req.params.id) || MOCK_PROVIDERS[0];
  res.json({
    success: true,
    data: {
      ...p,
      locations: [
        { id: 'loc-1', name: 'Main Campus', address: p.address, city: p.city, state: p.state, phone: p.phone, is_primary: true }
      ]
    },
    _demo: true,
  });
});

const createProvider = asyncHandler(async (req, res) => {
  const { name, code, provider_type, tier, license_number, address, city, state, phone, email, bank_name, account_number, account_name } = req.body;
  if (!name || !provider_type) return res.status(400).json({ success: false, message: 'name and provider_type are required' });

  try {
    const { v4: uuidv4 } = require('uuid');
    const orgId = uuidv4();
    await pool.query(
      `INSERT INTO organizations (id,name,type,code,status,address,city,state,phone,email)
       VALUES ($1,$2,'provider',$3,'active',$4,$5,$6,$7,$8)`,
      [orgId, name, code || null, address || null, city || null, state || null, phone || null, email || null]
    );
    const result = await pool.query(
      `INSERT INTO providers (id,organization_id,provider_type,tier,license_number,bank_name,account_number,account_name)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [orgId, provider_type, tier || '1', license_number || null, bank_name || null, account_number || null, account_name || null]
    );
    return res.status(201).json({ success: true, data: { ...result.rows[0], name, code, address, city, state, phone, email } });
  } catch (err) {
    const newPrv = { id: `prv-${Date.now()}`, organization_id: `prv-${Date.now()}`, name, code: code || name.slice(0, 4).toUpperCase(), provider_type, tier: tier || '1', license_number, address, city, state, phone, email, bank_name, account_number, account_name, status: 'active', total_claims: 0 };
    MOCK_PROVIDERS.unshift(newPrv);
    return res.status(201).json({ success: true, data: newPrv, _demo: true });
  }
});

const updateProvider = asyncHandler(async (req, res) => {
  const { name, phone, email, address, city, state, provider_type, tier, license_number, bank_name, account_number, account_name, status } = req.body;
  try {
    await pool.query(
      `UPDATE organizations SET name=COALESCE($1,name), phone=COALESCE($2,phone), email=COALESCE($3,email), address=COALESCE($4,address), city=COALESCE($5,city), state=COALESCE($6,state), status=COALESCE($7,status), updated_at=NOW()
       WHERE id=(SELECT organization_id FROM providers WHERE id=$8 OR organization_id=$8)`,
      [name, phone, email, address, city, state, status, req.params.id]
    );
    const result = await pool.query(
      `UPDATE providers SET provider_type=COALESCE($1,provider_type), tier=COALESCE($2,tier), license_number=COALESCE($3,license_number), bank_name=COALESCE($4,bank_name), account_number=COALESCE($5,account_number), account_name=COALESCE($6,account_name), updated_at=NOW()
       WHERE id=$7 OR organization_id=$7 RETURNING *`,
      [provider_type, tier, license_number, bank_name, account_number, account_name, req.params.id]
    );
    if (result.rows[0]) return res.json({ success: true, data: result.rows[0] });
  } catch (err) {}

  const p = MOCK_PROVIDERS.find(x => x.id === req.params.id || x.organization_id === req.params.id) || MOCK_PROVIDERS[0];
  Object.assign(p, req.body);
  res.json({ success: true, data: p, _demo: true });
});

const getProviderClaims = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, m.first_name || ' ' || m.last_name as member_name, m.member_number
       FROM claims c LEFT JOIN members m ON c.member_id=m.id
       WHERE c.provider_id=$1 OR c.provider_id=(SELECT organization_id FROM providers WHERE id=$1)
       ORDER BY c.created_at DESC`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {}

  res.json({
    success: true,
    data: [
      { id: 'clm-1', claim_number: 'CLM-20261001-2001', member_name: 'Adaeze Okonkwo', member_number: 'MBR-1000', service_category: 'Inpatient', submitted_amount: 150000, approved_amount: 150000, status: 'approved' },
      { id: 'clm-2', claim_number: 'CLM-20261001-2002', member_name: 'Emeka Eze', member_number: 'MBR-1001', service_category: 'Outpatient', submitted_amount: 25000, approved_amount: 25000, status: 'paid' },
    ],
    _demo: true,
  });
});

const getProviderSettlements = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM provider_settlements
       WHERE provider_id=$1 OR provider_id=(SELECT organization_id FROM providers WHERE id=$1)
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {}

  res.json({
    success: true,
    data: [
      { id: 'set-1', settlement_number: 'SET-2026-001', period: 'September 2026', claims_count: 28, gross_amount: 7200000, total_deductions: 720000, net_amount: 6480000, status: 'paid' },
    ],
    _demo: true,
  });
});

module.exports = {
  getAllEmployers, getEmployerById, createEmployer, updateEmployer, getEmployerMembers, getEmployerInvoices,
  getAllProviders, getProviderById, createProvider, updateProvider, getProviderClaims, getProviderSettlements,
};
