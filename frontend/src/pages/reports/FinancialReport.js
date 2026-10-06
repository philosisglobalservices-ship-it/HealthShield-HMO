import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard, Table, Badge, LoadingSpinner, Button } from '../../components/ui';
import { reportsApi } from '../../api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

const MOCK_STATS = {
  total_revenue: 187500000,
  total_expenditure: 142000000,
  net_position: 45500000,
  claims_ratio: 75.7,
};

const MOCK_TREND = [
  { month: 'May', revenue: 28000000, expenditure: 21000000 },
  { month: 'Jun', revenue: 31000000, expenditure: 23500000 },
  { month: 'Jul', revenue: 29500000, expenditure: 22800000 },
  { month: 'Aug', revenue: 33000000, expenditure: 25000000 },
  { month: 'Sep', revenue: 35500000, expenditure: 26500000 },
  { month: 'Oct', revenue: 30500000, expenditure: 23200000 },
];

const MOCK_INVOICE_BREAKDOWN = [
  { status: 'Paid', count: 48, total_amount: 145000000, percentage: '77.3%' },
  { status: 'Sent', count: 12, total_amount: 38000000, percentage: '20.3%' },
  { status: 'Overdue', count: 4, total_amount: 8750000, percentage: '4.7%' },
  { status: 'Draft', count: 6, total_amount: 15000000, percentage: '8.0%' },
];

const fmt = v => `₦${Number(v || 0).toLocaleString()}`;
const fmtAxis = v => (v >= 1e6 ? `₦${(v / 1e6).toFixed(0)}M` : `₦${v}`);

export default function FinancialReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(MOCK_STATS);
  const [trend, setTrend] = useState(MOCK_TREND);
  const [invoiceBreakdown, setInvoiceBreakdown] = useState(MOCK_INVOICE_BREAKDOWN);

  useEffect(() => {
    setLoading(true);
    reportsApi.getFinancialReport()
      .then(res => {
        const d = res.data?.data || {};
        if (d.stats) setStats(d.stats);
        if (d.trend) setTrend(d.trend);
        if (d.invoice_breakdown) setInvoiceBreakdown(d.invoice_breakdown);
      })
      .catch(() => {
        setStats(MOCK_STATS);
        setTrend(MOCK_TREND);
        setInvoiceBreakdown(MOCK_INVOICE_BREAKDOWN);
      })
      .finally(() => setLoading(false));
  }, []);

  const invColumns = [
    {
      header: 'Invoice Status',
      accessor: row => <Badge status={row.status.toLowerCase()}>{row.status}</Badge>
    },
    { header: 'Invoices Count', accessor: 'count' },
    { header: 'Total Value', accessor: row => <span className="font-semibold">{fmt(row.total_amount)}</span> },
    { header: 'Proportion of Total', accessor: 'percentage' },
  ];

  return (
    <Layout title="Financial Analysis" subtitle="Overview of premium revenues, claims expenditures, and underwriting margins">
      <div className="flex justify-end mb-6">
        <Button variant="outline" size="sm" onClick={() => toast.success('Exporting Financial Report...')}>
          📥 Export Report
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Premium Revenue" value={fmt(stats.total_revenue)} icon="💰" color="blue" />
            <StatCard label="Total Medical Costs" value={fmt(stats.total_expenditure)} icon="🏥" color="red" />
            <StatCard label="Net Underwriting Margin" value={fmt(stats.net_position)} icon="📈" color="green" />
            <StatCard label="Loss / Medical Loss Ratio" value={`${stats.claims_ratio}%`} icon="📊" color="orange" />
          </div>

          {/* Revenue vs Expenditure Trend Area Chart */}
          <Card title="Monthly Revenue vs Claims Expenditure Trend" className="mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trend} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={v => fmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Premium Revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenditure" name="Medical Expenditure" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Invoices Status Breakdown */}
          <Card title="Premium Invoice Collection Performance">
            <Table columns={invColumns} data={invoiceBreakdown} />
          </Card>
        </>
      )}
    </Layout>
  );
}
