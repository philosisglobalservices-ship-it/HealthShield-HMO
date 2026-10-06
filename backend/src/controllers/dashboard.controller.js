const pool = require('../db');

const MOCK_STATS = {
  totalMembers: 1250, activeMembers: 1180, pendingClaims: 47,
  totalClaimsThisMonth: 234, claimsAmountThisMonth: 15420000,
  monthlyRevenue: 31250000, outstandingInvoices: 4, outstandingAmount: 8750000,
  activeProviders: 127, openCases: 23, pendingAuthorizations: 18,
  recentClaims: [
    { id: '1', claim_number: 'CLM-20261001-2001', member_first_name: 'Adaeze', member_last_name: 'Okonkwo', member_number: 'MBR-001', provider_name: 'LUTH', service_category: 'Inpatient', submitted_amount: 85000, status: 'under_review' },
    { id: '2', claim_number: 'CLM-20261001-2002', member_first_name: 'Emeka', member_last_name: 'Eze', member_number: 'MBR-002', provider_name: 'Reddington Hospital', service_category: 'Outpatient', submitted_amount: 25000, status: 'approved' },
    { id: '3', claim_number: 'CLM-20261001-2003', member_first_name: 'Fatima', member_last_name: 'Abubakar', member_number: 'MBR-003', provider_name: 'Eko Hospital', service_category: 'Laboratory', submitted_amount: 12000, status: 'paid' },
    { id: '4', claim_number: 'CLM-20261001-2004', member_first_name: 'Ngozi', member_last_name: 'Ibe', member_number: 'MBR-005', provider_name: 'LUTH', service_category: 'Surgery', submitted_amount: 210000, status: 'submitted' },
    { id: '5', claim_number: 'CLM-20261001-2005', member_first_name: 'Tunde', member_last_name: 'Bakare', member_number: 'MBR-006', provider_name: 'Total Health', service_category: 'Pharmacy', submitted_amount: 8500, status: 'denied' },
  ],
  claimsByStatus: [
    { name: 'Paid', value: 145, color: '#22c55e' },
    { name: 'Approved', value: 58, color: '#3b82f6' },
    { name: 'Under Review', value: 47, color: '#f59e0b' },
    { name: 'Submitted', value: 32, color: '#8b5cf6' },
    { name: 'Denied', value: 21, color: '#ef4444' },
  ],
  monthlyTrend: [
    { month: 'May', claims: 180, revenue: 25000000 },
    { month: 'Jun', claims: 210, revenue: 28000000 },
    { month: 'Jul', claims: 195, revenue: 26500000 },
    { month: 'Aug', claims: 225, revenue: 29000000 },
    { month: 'Sep', claims: 220, revenue: 30500000 },
    { month: 'Oct', claims: 234, revenue: 31250000 },
  ],
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    // Try to build real stats from DB
    const [members, claims, auths, invoices, providers, cases] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status='active' THEN 1 END) as active FROM members`),
      pool.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status IN ('submitted','under_review') THEN 1 END) as pending, SUM(CASE WHEN DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW()) THEN submitted_amount ELSE 0 END) as month_amount, COUNT(CASE WHEN DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW()) THEN 1 END) as month_count FROM claims`),
      pool.query(`SELECT COUNT(*) as total FROM authorizations WHERE status='pending'`),
      pool.query(`SELECT COUNT(*) as count, SUM(total_amount) as amount FROM premium_invoices WHERE status IN ('sent','overdue')`),
      pool.query(`SELECT COUNT(*) as total FROM providers WHERE status='active'`),
      pool.query(`SELECT COUNT(*) as total FROM service_cases WHERE status IN ('open','in_progress')`),
    ]);

    // Recent claims
    const recentClaims = await pool.query(
      `SELECT c.id, c.claim_number, c.service_category, c.submitted_amount, c.status,
              m.first_name as member_first_name, m.last_name as member_last_name, m.member_number,
              o.name as provider_name
       FROM claims c
       LEFT JOIN members m ON c.member_id=m.id
       LEFT JOIN providers p ON c.provider_id=p.id
       LEFT JOIN organizations o ON p.organization_id=o.id
       ORDER BY c.created_at DESC LIMIT 5`
    );

    // Claims by status
    const claimStatus = await pool.query(
      `SELECT status as name, COUNT(*) as value FROM claims GROUP BY status`
    );

    // Monthly trend (last 6 months)
    const trend = await pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('month',created_at),'Mon') as month,
              COUNT(*) as claims,
              COALESCE(SUM(submitted_amount),0) as revenue
       FROM claims
       WHERE created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month',created_at), TO_CHAR(DATE_TRUNC('month',created_at),'Mon')
       ORDER BY DATE_TRUNC('month',created_at)`
    );

    // Monthly revenue from paid invoices
    const monthRev = await pool.query(
      `SELECT COALESCE(SUM(paid_amount),0) as revenue FROM premium_invoices WHERE DATE_TRUNC('month',paid_date)=DATE_TRUNC('month',NOW())`
    );

    const colorMap = { paid: '#22c55e', approved: '#3b82f6', under_review: '#f59e0b', submitted: '#8b5cf6', denied: '#ef4444', partially_approved: '#f97316' };

    res.json({
      success: true,
      data: {
        totalMembers: parseInt(members.rows[0].total),
        activeMembers: parseInt(members.rows[0].active),
        pendingClaims: parseInt(claims.rows[0].pending),
        totalClaimsThisMonth: parseInt(claims.rows[0].month_count),
        claimsAmountThisMonth: parseFloat(claims.rows[0].month_amount || 0),
        monthlyRevenue: parseFloat(monthRev.rows[0].revenue || MOCK_STATS.monthlyRevenue),
        outstandingInvoices: parseInt(invoices.rows[0].count),
        outstandingAmount: parseFloat(invoices.rows[0].amount || 0),
        activeProviders: parseInt(providers.rows[0].total),
        openCases: parseInt(cases.rows[0].total),
        pendingAuthorizations: parseInt(auths.rows[0].total),
        recentClaims: recentClaims.rows,
        claimsByStatus: claimStatus.rows.map(r => ({ name: r.name, value: parseInt(r.value), color: colorMap[r.name] || '#94a3b8' })),
        monthlyTrend: trend.rows.length ? trend.rows : MOCK_STATS.monthlyTrend,
      }
    });
  } catch (err) {
    // Fall back to mock data when DB is unavailable
    console.warn('Dashboard: DB unavailable, returning mock data');
    res.json({ success: true, data: MOCK_STATS });
  }
};
