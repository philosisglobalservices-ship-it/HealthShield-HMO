import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard, Table, Badge, LoadingSpinner } from '../../components/ui';
import { financeApi } from '../../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MOCK_SUMMARY = {
  total_revenue: 187500000, outstanding_invoice_count: 4, outstanding_invoice_amount: 8750000,
  claims_expenditure: 142000000, provider_settlements: 98500000,
};
const MOCK_CHART = [
  { month: 'May', revenue: 28000000, claims: 21000000 },
  { month: 'Jun', revenue: 31000000, claims: 23500000 },
  { month: 'Jul', revenue: 29500000, claims: 22800000 },
  { month: 'Aug', revenue: 33000000, claims: 25000000 },
  { month: 'Sep', revenue: 35500000, claims: 26500000 },
  { month: 'Oct', revenue: 30500000, claims: 23200000 },
];
const MOCK_OVERDUE = [
  { id: '1', invoice_number: 'INV-2026-003', employer_name: 'Green Farms Ltd', billing_period: 'Sep 2026', total_amount: 1500000, due_date: '2026-09-15', days_overdue: 20 },
  { id: '2', invoice_number: 'INV-2026-007', employer_name: 'Lagos Motors Co', billing_period: 'Aug 2026', total_amount: 2800000, due_date: '2026-08-15', days_overdue: 51 },
];
const MOCK_PENDING_SETTLE = [
  { id: '1', settlement_number: 'SET-001', provider_name: 'LUTH', period: 'Sep 2026', net_amount: 4500000 },
  { id: '2', settlement_number: 'SET-002', provider_name: 'Reddington Hospital', period: 'Sep 2026', net_amount: 3200000 },
];

const fmt = v => `₦${Number(v || 0).toLocaleString()}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function fmtAxis(v) { return v >= 1e6 ? `₦${(v / 1e6).toFixed(0)}M` : `₦${v.toLocaleString()}`; }

export default function FinancialDashboard() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState(MOCK_CHART);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [pendingSettlements, setPendingSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      financeApi.getSummary().catch(() => ({ data: {} })),
      financeApi.getInvoices({ status: 'overdue', limit: 5 }).catch(() => ({ data: {} })),
      financeApi.getSettlements({ status: 'pending', limit: 5 }).catch(() => ({ data: {} })),
    ]).then(([sum, inv, set]) => {
      const s = sum.data?.data || sum.data;
      setSummary(s?.stats || MOCK_SUMMARY);
      setChartData(s?.monthly_trend || MOCK_CHART);
      const invData = inv.data?.data?.data || inv.data?.data || [];
      setOverdueInvoices(invData.length ? invData : MOCK_OVERDUE);
      const setData = set.data?.data?.data || set.data?.data || [];
      setPendingSettlements(setData.length ? setData : MOCK_PENDING_SETTLE);
    }).finally(() => setLoading(false));
  }, []);

  const s = summary || MOCK_SUMMARY;

  if (loading) return <Layout title="Financial Dashboard"><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;

  return (
    <Layout title="Financial Dashboard" subtitle="Revenue, expenditure, and settlements overview">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={fmt(s.total_revenue)} icon="💰" color="blue" />
        <StatCard label="Outstanding Invoices" value={`${s.outstanding_invoice_count || 0}`} sub={fmt(s.outstanding_invoice_amount)} icon="⚠️" color="orange" />
        <StatCard label="Claims Expenditure" value={fmt(s.claims_expenditure)} icon="🏥" color="red" />
        <StatCard label="Provider Settlements" value={fmt(s.provider_settlements)} icon="🤝" color="green" />
      </div>

      {/* Chart */}
      <Card title="Monthly Revenue vs Claims Expenditure" className="mb-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} width={80} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="claims" name="Claims Expenditure" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Bottom tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Overdue Invoices" action={<span className="text-sm text-red-500 font-medium">{overdueInvoices.length} overdue</span>}>
          <Table
            columns={[
              { header: 'Invoice #', accessor: 'invoice_number' },
              { header: 'Employer', accessor: 'employer_name' },
              { header: 'Amount', accessor: row => <span className="font-semibold text-red-600">{fmt(row.total_amount)}</span> },
              { header: 'Due Date', accessor: row => <span className="text-red-500">{fmtDate(row.due_date)}</span> },
            ]}
            data={overdueInvoices}
            emptyMessage="No overdue invoices — great!"
          />
        </Card>

        <Card title="Pending Settlements" action={<span className="text-sm text-orange-500 font-medium">{pendingSettlements.length} pending</span>}>
          <Table
            columns={[
              { header: 'Settlement #', accessor: 'settlement_number' },
              { header: 'Provider', accessor: 'provider_name' },
              { header: 'Period', accessor: 'period' },
              { header: 'Net Amount', accessor: row => <span className="font-semibold">{fmt(row.net_amount)}</span> },
            ]}
            data={pendingSettlements}
            emptyMessage="No pending settlements."
          />
        </Card>
      </div>
    </Layout>
  );
}
