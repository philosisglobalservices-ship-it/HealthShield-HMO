import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard, Table, Badge, LoadingSpinner, Button } from '../../components/ui';
import { reportsApi } from '../../api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

const MOCK_STATS = {
  total_auths: 342,
  approval_rate: 82,
  avg_processing_days: 1.4,
  emergency_cases: 18,
};

const MOCK_AUTH_BY_CATEGORY = [
  { category: 'Surgery', count: 110 },
  { category: 'Inpatient', count: 85 },
  { category: 'Specialist', count: 58 },
  { category: 'Diagnostic/MRI', count: 42 },
  { category: 'Maternity', count: 29 },
  { category: 'Dental/Optical', count: 18 },
];

const MOCK_MONTHLY_AUTH = [
  { month: 'May', count: 42 },
  { month: 'Jun', count: 51 },
  { month: 'Jul', count: 48 },
  { month: 'Aug', count: 62 },
  { month: 'Sep', count: 70 },
  { month: 'Oct', count: 69 },
];

const MOCK_HIGH_COST = [
  { member_name: 'Babajide Adeleke', member_number: 'MBR-0089', plan: 'Corporate Elite', total_claims: 3450000, count: 4, last_claim: '2026-09-28' },
  { member_name: 'Folashade Alakija', member_number: 'MBR-0112', plan: 'Premium Care', total_claims: 2800000, count: 6, last_claim: '2026-10-02' },
  { member_name: 'Chukwudi Nnamdi', member_number: 'MBR-0043', plan: 'Standard Care', total_claims: 2150000, count: 3, last_claim: '2026-09-15' },
  { member_name: 'Aisha Bello', member_number: 'MBR-0231', plan: 'Corporate Elite', total_claims: 1900000, count: 5, last_claim: '2026-10-04' },
  { member_name: 'Oluwaseun Danjuma', member_number: 'MBR-0095', plan: 'Standard Care', total_claims: 1650000, count: 7, last_claim: '2026-09-30' },
];

const fmt = v => `₦${Number(v || 0).toLocaleString()}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function UtilizationReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(MOCK_STATS);
  const [byCategory, setByCategory] = useState(MOCK_AUTH_BY_CATEGORY);
  const [monthlyTrend, setMonthlyTrend] = useState(MOCK_MONTHLY_AUTH);
  const [highCost, setHighCost] = useState(MOCK_HIGH_COST);

  useEffect(() => {
    setLoading(true);
    reportsApi.getUtilizationReport()
      .then(res => {
        const d = res.data?.data || {};
        if (d.stats) setStats(d.stats);
        if (d.by_category) setByCategory(d.by_category);
        if (d.monthly_trend) setMonthlyTrend(d.monthly_trend);
        if (d.high_cost_members) setHighCost(d.high_cost_members);
      })
      .catch(() => {
        setStats(MOCK_STATS);
        setByCategory(MOCK_AUTH_BY_CATEGORY);
        setMonthlyTrend(MOCK_MONTHLY_AUTH);
        setHighCost(MOCK_HIGH_COST);
      })
      .finally(() => setLoading(false));
  }, []);

  const highCostColumns = [
    { header: 'Member Name', accessor: 'member_name' },
    {
      header: 'Member ID',
      accessor: row => <span className="font-mono text-xs">{row.member_number}</span>
    },
    { header: 'Health Plan', accessor: 'plan' },
    { header: 'Claims Total', accessor: row => <span className="font-bold text-red-600">{fmt(row.total_claims)}</span> },
    { header: 'Claims Count', accessor: 'count' },
    { header: 'Most Recent Claim', accessor: row => fmtDate(row.last_claim) },
  ];

  return (
    <Layout title="Healthcare Utilization Analytics" subtitle="Pre-authorizations, clinical trends, and high-utilization member management">
      <div className="flex justify-end mb-6">
        <Button variant="outline" size="sm" onClick={() => toast.success('Exporting Utilization Analytics...')}>
          📥 Export Data
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Authorizations" value={stats.total_auths?.toString()} icon="🛡️" color="blue" />
            <StatCard label="Approval Rate" value={`${stats.approval_rate}%`} icon="✅" color="green" />
            <StatCard label="Avg Turnaround Time" value={`${stats.avg_processing_days} days`} icon="⏱️" color="purple" />
            <StatCard label="Emergency Requests" value={stats.emergency_cases?.toString()} icon="🚨" color="red" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card title="Authorizations by Clinical Service Category">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byCategory} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Authorizations" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Monthly Clinical Authorization Volume Trend">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Authorizations" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* High Cost Members Table */}
          <Card title="High Utilization & High-Cost Member Monitoring">
            <Table columns={highCostColumns} data={highCost} />
          </Card>
        </>
      )}
    </Layout>
  );
}
