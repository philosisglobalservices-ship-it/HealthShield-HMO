const pool = require('../db');
const { asyncHandler, paginate, paginationMeta, generateMemberNumber } = require('../utils/helpers');

const MOCK_MEMBERS = [
  { id: 'mem-1', member_number: 'MBR-20261001-1000', first_name: 'Adaeze', last_name: 'Okonkwo', date_of_birth: '1985-06-15', gender: 'female', phone: '+234-801-2345678', email: 'adaeze.okonkwo@technova.ng', address: '123 Victoria Island', city: 'Lagos', state: 'Lagos', status: 'active', employer_name: 'TechNova Nigeria Ltd', plan_name: 'Standard Care Plan', created_at: new Date().toISOString() },
  { id: 'mem-2', member_number: 'MBR-20261001-1001', first_name: 'Emeka', last_name: 'Eze', date_of_birth: '1990-03-22', gender: 'male', phone: '+234-802-3456789', email: 'emeka.eze@firstbank.ng', address: '45 Marina', city: 'Lagos', state: 'Lagos', status: 'active', employer_name: 'First Bank Nigeria PLC', plan_name: 'Basic Care Plan', created_at: new Date().toISOString() },
  { id: 'mem-3', member_number: 'MBR-20261001-1002', first_name: 'Fatima', last_name: 'Abubakar', date_of_birth: '1988-11-05', gender: 'female', phone: '+234-803-4567890', email: 'f.abubakar@dangote.com', address: '1 Alfred Rewane Rd', city: 'Ikoyi', state: 'Lagos', status: 'suspended', employer_name: 'Dangote Group', plan_name: 'Premium Care Plan', created_at: new Date().toISOString() },
  { id: 'mem-4', member_number: 'MBR-20261001-1003', first_name: 'Ngozi', last_name: 'Ibe', date_of_birth: '1995-08-19', gender: 'female', phone: '+234-804-5678901', email: 'ngozi.ibe@technova.ng', address: '77 Awolowo Road', city: 'Ikoyi', state: 'Lagos', status: 'active', employer_name: 'TechNova Nigeria Ltd', plan_name: 'Standard Care Plan', created_at: new Date().toISOString() },
  { id: 'mem-5', member_number: 'MBR-20261001-1004', first_name: 'Tunde', last_name: 'Bakare', date_of_birth: '1982-12-30', gender: 'male', phone: '+234-805-6789012', email: 'tunde.bakare@dangote.com', address: '12 Kofo Abayomi', city: 'Victoria Island', state: 'Lagos', status: 'terminated', employer_name: 'Dangote Group', plan_name: 'Corporate Elite Plan', created_at: new Date().toISOString() },
];

/** GET /api/members */
const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, employer_id } = req.query;
  const { limit: lim, offset } = paginate(page, limit);

  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;

    if (search) {
      where.push(`(m.first_name ILIKE $${idx} OR m.last_name ILIKE $${idx} OR m.member_number ILIKE $${idx} OR m.email ILIKE $${idx} OR m.phone ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (status) { where.push(`m.status = $${idx}`); params.push(status); idx++; }
    if (employer_id) { where.push(`m.employer_id = $${idx}`); params.push(employer_id); idx++; }

    const whereStr = where.join(' AND ');
    const countResult = await pool.query(`SELECT COUNT(*) FROM members m WHERE ${whereStr}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT m.*, o.name as employer_name,
              e.plan_id, hp.name as plan_name, e.status as enrollment_status, e.effective_date, e.expiry_date
       FROM members m
       LEFT JOIN organizations o ON m.employer_id = o.id
       LEFT JOIN enrollments e ON e.member_id = m.id AND e.status = 'active'
       LEFT JOIN health_plans hp ON e.plan_id = hp.id
       WHERE ${whereStr}
       ORDER BY m.created_at DESC
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, lim, offset]
    );

    return res.json({
      success: true,
      data: result.rows,
      pagination: paginationMeta(total, page, lim),
    });
  } catch (err) {
    // Graceful demo-mode fallback
    let filtered = [...MOCK_MEMBERS];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(m => m.first_name.toLowerCase().includes(q) || m.last_name.toLowerCase().includes(q) || m.member_number.toLowerCase().includes(q));
    }
    if (status) filtered = filtered.filter(m => m.status === status);
    return res.json({
      success: true,
      data: filtered,
      pagination: paginationMeta(filtered.length, page, lim),
      _demo: true,
    });
  }
});

/** GET /api/members/:id */
const getById = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, o.name as employer_name, o.code as employer_code
       FROM members m LEFT JOIN organizations o ON m.employer_id = o.id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (result.rows[0]) return res.json({ success: true, data: result.rows[0] });
  } catch (err) {}

  const mock = MOCK_MEMBERS.find(m => m.id === req.params.id) || MOCK_MEMBERS[0];
  res.json({ success: true, data: mock, _demo: true });
});

/** POST /api/members */
const create = asyncHandler(async (req, res) => {
  const { first_name, last_name, date_of_birth, gender, phone, email, address, city, state, national_id, employer_id, occupation } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ success: false, message: 'First name and last name are required' });
  }

  const memberNumber = generateMemberNumber();
  try {
    const result = await pool.query(
      `INSERT INTO members (id, member_number, first_name, last_name, date_of_birth, gender, phone, email, address, city, state, national_id, employer_id, occupation)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [memberNumber, first_name, last_name, date_of_birth || null, gender || null, phone || null, email || null, address || null, city || null, state || null, national_id || null, employer_id || null, occupation || null]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const newMember = { id: `mem-${Date.now()}`, member_number: memberNumber, first_name, last_name, phone, email, status: 'active', created_at: new Date().toISOString() };
    MOCK_MEMBERS.unshift(newMember);
    return res.status(201).json({ success: true, data: newMember, _demo: true });
  }
});

/** PUT /api/members/:id */
const update = asyncHandler(async (req, res) => {
  const { first_name, last_name, phone, email, address, city, state, occupation, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE members
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           city = COALESCE($6, city),
           state = COALESCE($7, state),
           occupation = COALESCE($8, occupation),
           status = COALESCE($9, status),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [first_name, last_name, phone, email, address, city, state, occupation, status, req.params.id]
    );
    if (result.rows[0]) return res.json({ success: true, data: result.rows[0] });
  } catch (err) {}

  const m = MOCK_MEMBERS.find(x => x.id === req.params.id) || MOCK_MEMBERS[0];
  Object.assign(m, req.body);
  res.json({ success: true, data: m, _demo: true });
});

/** POST /api/members/:id/terminate */
const terminate = asyncHandler(async (req, res) => {
  try {
    await pool.query(
      `UPDATE members SET status = 'terminated', termination_date = NOW(), termination_reason = $1, updated_at = NOW() WHERE id = $2`,
      [req.body.reason || 'Terminated by admin', req.params.id]
    );
  } catch (err) {}
  res.json({ success: true, message: 'Member terminated successfully', _demo: true });
});

/** GET /api/members/:id/dependants */
const getDependants = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM dependants WHERE member_id = $1 ORDER BY created_at ASC`, [req.params.id]);
    return res.json({ success: true, data: result.rows });
  } catch (err) {}
  res.json({
    success: true,
    data: [
      { id: 'dep-1', first_name: 'Chima', last_name: 'Okonkwo', relationship: 'Spouse', date_of_birth: '1982-04-10', gender: 'male', status: 'active' },
      { id: 'dep-2', first_name: 'Ngozi', last_name: 'Okonkwo', relationship: 'Child', date_of_birth: '2015-09-22', gender: 'female', status: 'active' },
    ],
    _demo: true,
  });
});

/** POST /api/members/:id/dependants */
const createDependant = asyncHandler(async (req, res) => {
  const { first_name, last_name, relationship, date_of_birth, gender } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO dependants (id, member_id, first_name, last_name, relationship, date_of_birth, gender)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.params.id, first_name, last_name, relationship, date_of_birth || null, gender || null]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {}
  res.status(201).json({
    success: true,
    data: { id: `dep-${Date.now()}`, member_id: req.params.id, first_name, last_name, relationship, date_of_birth, gender, status: 'active' },
    _demo: true,
  });
});

/** GET /api/members/:id/claims */
const getClaims = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(`SELECT c.*, p.name as provider_name FROM claims c LEFT JOIN organizations p ON c.provider_id = p.id WHERE c.member_id = $1 ORDER BY c.created_at DESC`, [req.params.id]);
    return res.json({ success: true, data: result.rows });
  } catch (err) {}
  res.json({
    success: true,
    data: [
      { id: 'clm-1', claim_number: 'CLM-20261001-2001', service_category: 'Outpatient', service_date: '2026-09-25', submitted_amount: 25000, approved_amount: 25000, status: 'paid' },
      { id: 'clm-2', claim_number: 'CLM-20261001-2002', service_category: 'Pharmacy', service_date: '2026-09-28', submitted_amount: 15000, approved_amount: 15000, status: 'approved' },
    ],
    _demo: true,
  });
});

/** GET /api/members/:id/authorizations */
const getAuthorizations = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(`SELECT a.*, p.name as provider_name FROM authorizations a LEFT JOIN organizations p ON a.provider_id = p.id WHERE a.member_id = $1 ORDER BY a.created_at DESC`, [req.params.id]);
    return res.json({ success: true, data: result.rows });
  } catch (err) {}
  res.json({
    success: true,
    data: [
      { id: 'auth-1', reference: 'AUTH-REF-2000', service_category: 'Surgery', urgency: 'urgent', requested_amount: 450000, approved_amount: 450000, status: 'approved' }
    ],
    _demo: true,
  });
});

/** GET /api/members/:id/enrollments */
const getEnrollments = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(`SELECT e.*, hp.name as plan_name, hp.premium_amount FROM enrollments e LEFT JOIN health_plans hp ON e.plan_id = hp.id WHERE e.member_id = $1 ORDER BY e.created_at DESC`, [req.params.id]);
    return res.json({ success: true, data: result.rows });
  } catch (err) {}
  res.json({
    success: true,
    data: [
      { id: 'enr-1', plan_name: 'Standard Care Plan', status: 'active', effective_date: '2026-01-01', expiry_date: '2026-12-31', premium_amount: 25000 }
    ],
    _demo: true,
  });
});

module.exports = {
  getAll, getById, create, update, terminate,
  getDependants, createDependant,
  getClaims, getMemberClaims: getClaims,
  getAuthorizations, getMemberAuthorizations: getAuthorizations,
  getEnrollments,
};
