const pool = require('../db');
const { asyncHandler, paginate, paginationMeta, generateAuthNumber } = require('../utils/helpers');

const MOCK_AUTHS = [
  { id: 'auth-1', reference: 'AUTH-2026-1000', reference_number: 'AUTH-2026-1000', member_first_name: 'Adaeze', member_last_name: 'Okonkwo', member_number: 'MBR-20261001-1000', provider_name: 'Lagos University Teaching Hospital', provider_type: 'Hospital', service_category: 'Surgery', service_description: 'Appendectomy procedure', diagnosis_code: 'K35.8', procedure_code: '47.09', urgency: 'urgent', status: 'approved', requested_amount: 500000, approved_amount: 500000, expiry_date: '2026-11-01', created_at: new Date().toISOString() },
  { id: 'auth-2', reference: 'AUTH-2026-1001', reference_number: 'AUTH-2026-1001', member_first_name: 'Emeka', member_last_name: 'Eze', member_number: 'MBR-20261001-1001', provider_name: 'Reddington Hospital', provider_type: 'Hospital', service_category: 'Inpatient', service_description: 'Hospital admission for malaria monitoring', diagnosis_code: 'B54', procedure_code: '89.01', urgency: 'routine', status: 'pending', requested_amount: 120000, approved_amount: null, expiry_date: '2026-10-30', created_at: new Date().toISOString() },
  { id: 'auth-3', reference: 'AUTH-2026-1002', reference_number: 'AUTH-2026-1002', member_first_name: 'Fatima', member_last_name: 'Abubakar', member_number: 'MBR-20261001-1002', provider_name: 'Medview Diagnostics', provider_type: 'Laboratory', service_category: 'Specialist', service_description: 'MRI brain scan with contrast', diagnosis_code: 'R51', procedure_code: '88.91', urgency: 'routine', status: 'approved', requested_amount: 250000, approved_amount: 250000, expiry_date: '2026-11-15', created_at: new Date().toISOString() },
  { id: 'auth-4', reference: 'AUTH-2026-1003', reference_number: 'AUTH-2026-1003', member_first_name: 'Tunde', member_last_name: 'Bakare', member_number: 'MBR-20261001-1004', provider_name: 'Smile Dental Clinic', provider_type: 'Dental', service_category: 'Dental', service_description: 'Complex root canal surgery', diagnosis_code: 'K04.0', procedure_code: '23.70', urgency: 'emergency', status: 'denied', requested_amount: 180000, approved_amount: null, denial_reason: 'Requires prior referral from general dentist', expiry_date: null, created_at: new Date().toISOString() },
];

/** GET /api/authorizations */
const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, urgency, member_id, provider_id } = req.query;
  const { limit: lim, offset } = paginate(page, limit);

  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;

    if (search) {
      where.push(`(a.reference_number ILIKE $${idx} OR m.first_name ILIKE $${idx} OR m.last_name ILIKE $${idx} OR m.member_number ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (status) { where.push(`a.status = $${idx}`); params.push(status); idx++; }
    if (urgency) { where.push(`a.urgency = $${idx}`); params.push(urgency); idx++; }
    if (member_id) { where.push(`a.member_id = $${idx}`); params.push(member_id); idx++; }
    if (provider_id) { where.push(`a.provider_id = $${idx}`); params.push(provider_id); idx++; }

    const whereStr = where.join(' AND ');
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM authorizations a LEFT JOIN members m ON a.member_id=m.id WHERE ${whereStr}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT a.*,
              m.first_name as member_first_name, m.last_name as member_last_name, m.member_number,
              po.name as provider_name,
              hp.name as plan_name
       FROM authorizations a
       LEFT JOIN members m ON a.member_id=m.id
       LEFT JOIN providers p ON a.provider_id=p.id
       LEFT JOIN organizations po ON p.organization_id=po.id
       LEFT JOIN health_plans hp ON a.plan_id=hp.id
       WHERE ${whereStr}
       ORDER BY a.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, lim, offset]
    );

    return res.json({ success: true, data: result.rows, pagination: paginationMeta(total, page, lim) });
  } catch (err) {
    let list = [...MOCK_AUTHS];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => `${a.member_first_name} ${a.member_last_name}`.toLowerCase().includes(q) || a.reference.toLowerCase().includes(q) || a.provider_name.toLowerCase().includes(q));
    }
    if (status) list = list.filter(a => a.status === status);
    if (urgency) list = list.filter(a => a.urgency === urgency);
    return res.json({ success: true, data: list, pagination: paginationMeta(list.length, page, lim), _demo: true });
  }
});

/** GET /api/authorizations/:id */
const getById = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*,
              m.first_name as member_first_name, m.last_name as member_last_name, m.member_number, m.phone as member_phone,
              po.name as provider_name, po.city as provider_city,
              hp.name as plan_name
       FROM authorizations a
       LEFT JOIN members m ON a.member_id=m.id
       LEFT JOIN providers p ON a.provider_id=p.id
       LEFT JOIN organizations po ON p.organization_id=po.id
       LEFT JOIN health_plans hp ON a.plan_id=hp.id
       WHERE a.id=$1`,
      [req.params.id]
    );
    if (result.rows[0]) return res.json({ success: true, data: result.rows[0] });
  } catch (err) {}

  const a = MOCK_AUTHS.find(x => x.id === req.params.id) || MOCK_AUTHS[0];
  res.json({ success: true, data: a, _demo: true });
});

/** POST /api/authorizations */
const create = asyncHandler(async (req, res) => {
  const { member_id, provider_id, plan_id, service_category, service_description, diagnosis_code, procedure_code, requested_amount, urgency, notes } = req.body;
  const ref = generateAuthNumber();

  try {
    const result = await pool.query(
      `INSERT INTO authorizations (id,reference_number,member_id,provider_id,plan_id,service_category,service_description,diagnosis_code,procedure_code,requested_amount,urgency,notes,status)
       VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending') RETURNING *`,
      [ref, member_id, provider_id, plan_id || null, service_category || 'outpatient', service_description || null, diagnosis_code || null, procedure_code || null, requested_amount || 0, urgency || 'routine', notes || null]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const newAuth = { id: `auth-${Date.now()}`, reference: ref, reference_number: ref, member_id, provider_id, service_category, service_description, diagnosis_code, procedure_code, requested_amount, urgency, notes, status: 'pending', created_at: new Date().toISOString() };
    MOCK_AUTHS.unshift(newAuth);
    return res.status(201).json({ success: true, data: newAuth, _demo: true });
  }
});

/** POST /api/authorizations/:id/approve */
const approveAuth = asyncHandler(async (req, res) => {
  const { approved_amount, notes, expiry_date } = req.body;
  try {
    await pool.query(
      `UPDATE authorizations SET status='approved', approved_amount=$1, notes=COALESCE($2,notes), expiry_date=$3, approved_at=NOW(), updated_at=NOW() WHERE id=$4`,
      [approved_amount, notes || null, expiry_date || null, req.params.id]
    );
  } catch (err) {}
  const a = MOCK_AUTHS.find(x => x.id === req.params.id) || MOCK_AUTHS[0];
  a.status = 'approved';
  a.approved_amount = approved_amount;
  res.json({ success: true, message: 'Authorization approved', data: a, _demo: true });
});

/** POST /api/authorizations/:id/deny */
const denyAuth = asyncHandler(async (req, res) => {
  const { denial_reason } = req.body;
  try {
    await pool.query(
      `UPDATE authorizations SET status='denied', denial_reason=$1, updated_at=NOW() WHERE id=$2`,
      [denial_reason, req.params.id]
    );
  } catch (err) {}
  const a = MOCK_AUTHS.find(x => x.id === req.params.id) || MOCK_AUTHS[0];
  a.status = 'denied';
  a.denial_reason = denial_reason;
  res.json({ success: true, message: 'Authorization denied', data: a, _demo: true });
});

/** POST /api/authorizations/:id/cancel */
const cancelAuth = asyncHandler(async (req, res) => {
  try {
    await pool.query(`UPDATE authorizations SET status='cancelled', updated_at=NOW() WHERE id=$1`, [req.params.id]);
  } catch (err) {}
  const a = MOCK_AUTHS.find(x => x.id === req.params.id) || MOCK_AUTHS[0];
  a.status = 'cancelled';
  res.json({ success: true, message: 'Authorization cancelled', data: a, _demo: true });
});

const update = asyncHandler(async (req, res) => {
  const a = MOCK_AUTHS.find(x => x.id === req.params.id) || MOCK_AUTHS[0];
  Object.assign(a, req.body);
  res.json({ success: true, data: a, _demo: true });
});

module.exports = {
  getAll, getById, create, update,
  approveAuth, approve: approveAuth,
  denyAuth, deny: denyAuth,
  cancelAuth, cancel: cancelAuth,
};
