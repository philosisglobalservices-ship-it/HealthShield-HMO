const pool = require('../db');
const { asyncHandler, paginate, paginationMeta, generateClaimNumber } = require('../utils/helpers');

const MOCK_CLAIMS = [
  { id: 'clm-1', claim_number: 'CLM-20261001-2001', member_id: 'mem-1', member_first_name: 'Adaeze', member_last_name: 'Okonkwo', member_number: 'MBR-20261001-1000', provider_name: 'Lagos University Teaching Hospital', provider_type: 'Hospital', service_date: '2026-09-25', service_category: 'Inpatient', diagnosis_code: 'K35.8', diagnosis_description: 'Acute appendicitis', submitted_amount: 150000, approved_amount: 150000, paid_amount: 150000, status: 'paid', plan_name: 'Standard Care Plan', created_at: new Date().toISOString() },
  { id: 'clm-2', claim_number: 'CLM-20261001-2002', member_id: 'mem-2', member_first_name: 'Emeka', member_last_name: 'Eze', member_number: 'MBR-20261001-1001', provider_name: 'Reddington Hospital', provider_type: 'Hospital', service_date: '2026-09-28', service_category: 'Outpatient', diagnosis_code: 'B54', diagnosis_description: 'Unspecified malaria', submitted_amount: 25000, approved_amount: 25000, paid_amount: 0, status: 'approved', plan_name: 'Basic Care Plan', created_at: new Date().toISOString() },
  { id: 'clm-3', claim_number: 'CLM-20261001-2003', member_id: 'mem-3', member_first_name: 'Fatima', member_last_name: 'Abubakar', member_number: 'MBR-20261001-1002', provider_name: 'HealthPlus Pharmacy', provider_type: 'Pharmacy', service_date: '2026-10-01', service_category: 'Pharmacy', diagnosis_code: 'I10', diagnosis_description: 'Essential hypertension', submitted_amount: 45000, approved_amount: 0, paid_amount: 0, status: 'under_review', plan_name: 'Premium Care Plan', created_at: new Date().toISOString() },
  { id: 'clm-4', claim_number: 'CLM-20261001-2004', member_id: 'mem-4', member_first_name: 'Ngozi', member_last_name: 'Ibe', member_number: 'MBR-20261001-1003', provider_name: 'Medview Diagnostics', provider_type: 'Laboratory', service_date: '2026-10-02', service_category: 'Laboratory', diagnosis_code: 'Z00.0', diagnosis_description: 'General medical exam', submitted_amount: 35000, approved_amount: 0, paid_amount: 0, status: 'submitted', plan_name: 'Standard Care Plan', created_at: new Date().toISOString() },
  { id: 'clm-5', claim_number: 'CLM-20261001-2005', member_id: 'mem-5', member_first_name: 'Tunde', last_name: 'Bakare', member_number: 'MBR-20261001-1004', provider_name: 'Smile Dental Clinic', provider_type: 'Dental', service_date: '2026-10-03', service_category: 'Dental', diagnosis_code: 'K02.9', diagnosis_description: 'Dental caries', submitted_amount: 85000, approved_amount: 0, paid_amount: 0, status: 'denied', rejection_reason: 'Annual dental limit exceeded', plan_name: 'Corporate Elite Plan', created_at: new Date().toISOString() },
];

/** GET /api/claims */
const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, provider_id, member_id, from_date, to_date } = req.query;
  const { limit: lim, offset } = paginate(page, limit);

  try {
    let where = ['1=1'];
    const params = [];
    let idx = 1;

    if (search) {
      where.push(`(c.claim_number ILIKE $${idx} OR m.first_name ILIKE $${idx} OR m.last_name ILIKE $${idx} OR m.member_number ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (status) { where.push(`c.status = $${idx}`); params.push(status); idx++; }
    if (provider_id) { where.push(`c.provider_id = $${idx}`); params.push(provider_id); idx++; }
    if (member_id) { where.push(`c.member_id = $${idx}`); params.push(member_id); idx++; }
    if (from_date) { where.push(`c.service_date >= $${idx}`); params.push(from_date); idx++; }
    if (to_date) { where.push(`c.service_date <= $${idx}`); params.push(to_date); idx++; }

    const whereStr = where.join(' AND ');
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM claims c LEFT JOIN members m ON c.member_id=m.id WHERE ${whereStr}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT c.*,
              m.first_name as member_first_name, m.last_name as member_last_name, m.member_number,
              po.name as provider_name,
              hp.name as plan_name
       FROM claims c
       LEFT JOIN members m ON c.member_id=m.id
       LEFT JOIN providers p ON c.provider_id=p.id
       LEFT JOIN organizations po ON p.organization_id=po.id
       LEFT JOIN health_plans hp ON c.plan_id=hp.id
       WHERE ${whereStr}
       ORDER BY c.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, lim, offset]
    );

    return res.json({ success: true, data: result.rows, pagination: paginationMeta(total, page, lim) });
  } catch (err) {
    let list = [...MOCK_CLAIMS];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => `${c.member_first_name} ${c.member_last_name}`.toLowerCase().includes(q) || c.claim_number.toLowerCase().includes(q) || c.provider_name.toLowerCase().includes(q));
    }
    if (status) list = list.filter(c => c.status === status);
    return res.json({ success: true, data: list, pagination: paginationMeta(list.length, page, lim), _demo: true });
  }
});

/** GET /api/claims/:id */
const getById = asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              m.first_name as member_first_name, m.last_name as member_last_name, m.member_number, m.phone as member_phone,
              po.name as provider_name, po.city as provider_city,
              hp.name as plan_name
       FROM claims c
       LEFT JOIN members m ON c.member_id=m.id
       LEFT JOIN providers p ON c.provider_id=p.id
       LEFT JOIN organizations po ON p.organization_id=po.id
       LEFT JOIN health_plans hp ON c.plan_id=hp.id
       WHERE c.id=$1`,
      [req.params.id]
    );
    if (result.rows[0]) {
      const items = await pool.query('SELECT * FROM claim_items WHERE claim_id=$1', [req.params.id]);
      return res.json({ success: true, data: { ...result.rows[0], claim_items: items.rows } });
    }
  } catch (err) {}

  const c = MOCK_CLAIMS.find(x => x.id === req.params.id) || MOCK_CLAIMS[0];
  res.json({
    success: true,
    data: {
      ...c,
      claim_items: [
        { id: 1, description: 'Medical Consultation', quantity: 1, unit_cost: 25000, total_cost: 25000 },
        { id: 2, description: 'Prescribed Drugs', quantity: 1, unit_cost: 35000, total_cost: 35000 },
        { id: 3, description: 'Diagnostic Test', quantity: 1, unit_cost: 90000, total_cost: 90000 },
      ]
    },
    _demo: true,
  });
});

/** POST /api/claims */
const create = asyncHandler(async (req, res) => {
  const { member_id, provider_id, plan_id, authorization_id, service_date, service_category, diagnosis_code, diagnosis_description, submitted_amount, items } = req.body;
  const claimNumber = generateClaimNumber();

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const claimResult = await client.query(
        `INSERT INTO claims (id,claim_number,member_id,provider_id,plan_id,authorization_id,service_date,service_category,diagnosis_code,diagnosis_description,submitted_amount,status)
         VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'submitted') RETURNING *`,
        [claimNumber, member_id, provider_id, plan_id || null, authorization_id || null, service_date, service_category || 'outpatient', diagnosis_code || null, diagnosis_description || null, submitted_amount]
      );
      const claim = claimResult.rows[0];
      if (items && items.length > 0) {
        for (const item of items) {
          await client.query(
            `INSERT INTO claim_items (id,claim_id,item_type,description,procedure_code,quantity,unit_cost,total_cost,approved_amount,status)
             VALUES (uuid_generate_v4(),$1,$2,$3,$4,$5,$6,$7,$8,'submitted')`,
            [claim.id, item.item_type || 'service', item.description, item.procedure_code || null, item.quantity || 1, item.unit_cost, item.total_cost || (item.quantity * item.unit_cost), item.unit_cost]
          );
        }
      }
      await client.query('COMMIT');
      return res.status(201).json({ success: true, data: claim });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    const newClaim = { id: `clm-${Date.now()}`, claim_number: claimNumber, member_id, provider_id, service_date, service_category, submitted_amount, approved_amount: 0, status: 'submitted', created_at: new Date().toISOString() };
    MOCK_CLAIMS.unshift(newClaim);
    return res.status(201).json({ success: true, data: newClaim, _demo: true });
  }
});

/** POST /api/claims/:id/submit */
const submitClaim = asyncHandler(async (req, res) => {
  const c = MOCK_CLAIMS.find(x => x.id === req.params.id) || MOCK_CLAIMS[0];
  c.status = 'submitted';
  res.json({ success: true, message: 'Claim submitted', data: c, _demo: true });
});

/** POST /api/claims/:id/approve */
const approveClaim = asyncHandler(async (req, res) => {
  const { approved_amount, notes } = req.body;
  try {
    await pool.query(`UPDATE claims SET status='approved', approved_amount=$1, notes=$2, updated_at=NOW() WHERE id=$3`, [approved_amount, notes || null, req.params.id]);
  } catch (err) {}
  const c = MOCK_CLAIMS.find(x => x.id === req.params.id) || MOCK_CLAIMS[0];
  c.status = 'approved';
  c.approved_amount = approved_amount;
  res.json({ success: true, message: 'Claim approved', data: c, _demo: true });
});

/** POST /api/claims/:id/deny */
const denyClaim = asyncHandler(async (req, res) => {
  const { rejection_reason } = req.body;
  try {
    await pool.query(`UPDATE claims SET status='denied', rejection_reason=$1, updated_at=NOW() WHERE id=$2`, [rejection_reason, req.params.id]);
  } catch (err) {}
  const c = MOCK_CLAIMS.find(x => x.id === req.params.id) || MOCK_CLAIMS[0];
  c.status = 'denied';
  c.rejection_reason = rejection_reason;
  res.json({ success: true, message: 'Claim denied', data: c, _demo: true });
});

/** POST /api/claims/:id/pay */
const payClaim = asyncHandler(async (req, res) => {
  try {
    await pool.query(`UPDATE claims SET status='paid', paid_amount=approved_amount, updated_at=NOW() WHERE id=$1`, [req.params.id]);
  } catch (err) {}
  const c = MOCK_CLAIMS.find(x => x.id === req.params.id) || MOCK_CLAIMS[0];
  c.status = 'paid';
  c.paid_amount = c.approved_amount;
  res.json({ success: true, message: 'Claim paid', data: c, _demo: true });
});

/** POST /api/claims/:id/appeal */
const appealClaim = asyncHandler(async (req, res) => {
  const { appeal_reason } = req.body;
  try {
    await pool.query(`UPDATE claims SET status='appealed', notes=$1, updated_at=NOW() WHERE id=$2`, [appeal_reason, req.params.id]);
  } catch (err) {}
  const c = MOCK_CLAIMS.find(x => x.id === req.params.id) || MOCK_CLAIMS[0];
  c.status = 'appealed';
  res.json({ success: true, message: 'Appeal submitted', data: c, _demo: true });
});

module.exports = {
  getAll, getById, create,
  submitClaim, submit: submitClaim,
  approveClaim, approve: approveClaim,
  denyClaim, deny: denyClaim,
  payClaim, pay: payClaim,
  appealClaim, appeal: appealClaim,
};
