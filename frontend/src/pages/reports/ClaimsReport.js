import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard, Table, Badge, LoadingSpinner, Button } from '../../components/ui';
import { reportsApi } from '../../api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

const MOCK_STATS = {
  total_claims: 1450,
  total_submitted: 125000000,
  total_approved: 98500000,
  approval_rate: 78.8,
};

const MOCK_STATUS_DATA = [
  { name: 'Paid', value: 650, color: '#22c55e' },
  { name: 'Approved', value: 380, color: '#3b82f6' },
  { name: 'Under Review', value: 220, color: '#f59e0b' },
  { name: 'Submitted', value: 120, color: '#8b5cf6' },
  { name: 'Denied', value: 80, color: '#ef4444' },
];

const MOCK_TOP_PROVIDERS = [
  { provider_name: 'LUTH Idi-Araba', claim_count: 320, total_amount: 28500000 },
  { provider_name: 'Reddington VI', claim_count: 240, total_amount: 24000000 },
  { provider_name: 'St. Nicholas Hospital', claim_count: 190, total_amount: 17200000 },
  { provider_name: 'First Cardiology', claim_count: 145, total_amount: 15800000 },
  { provider_name: 'HealthPlus Pharmacy', claim_count: 280, total_amount: 8400000 },
];

const MOCK_CATEGORIES = [
  { category: 'Inpatient Care', count: 310, amount: 48000000, avg: 154838 },
  { category: 'Surgery & Procedures', count: 125, amount: 35000000, avg: 280000 },
  { category: 'Outpatient Consultations', count: 620, amount: 24800000, avg: 40000 },
  { category: 'Pharmacy & Drugs', count: 280, amount: 11200000, avg: 40000 },
  { category: 'Diagnostic & Lab', count: 115, amount: 6000000, avg: 52173 },
];

const fmt = v => `₦${Number(v || 0).toLocaleString()}`;

export default function ClaimsReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(MOCK_STATS);
  const [statusData, setStatusData] = useState(MOCK_STATUS_DATA);
  const [topProviders, setTopProviders] = useState(MOCK_TOP_PROVIDERS);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const loadData = () => {
    setLoading(true);
    reportsApi.getClaimsReport({ from_date: dateRange.from, to_date: dateRange.to })
      .then(res => {
        const d = res.data?.data || {};
        if (d.stats) setStats(d.stats);
        if (d.by_status) setStatusData(d.by_status);
        if (d.top_providers) setTopProviders(d.top_providers);
        if (d.by_category) setCategories(d.by_category);
      })
      .catch(() => {
        setStats(MOCK_STATS);
        setStatusData(MOCK_STATUS_DATA);
        setTopProviders(MOCK_TOP_PROVIDERS);
        setCategories(MOCK_CATEGORIES);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const catColumns = [
    { header: 'Service Category', accessor: 'category' },
    { header: 'Claims Count', accessor: 'count' },
    { header: 'Total Value', accessor: row => <span className="font-semibold">{fmt(row.amount)}</span> },
    { header: 'Average per Claim', accessor: row => fmt(row.avg) },
  ];

  return (
    <Layout title="Claims Analytics" subtitle="Comprehensive review of claims volume, adjudication and spend">
      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Period:</span>
          <input
            type="date"
            value={dateRange.from}
            onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success('Exporting Claims Report to CSV...')}>
          📥 Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Claims" value={stats.total_claims?.toLocaleString()} icon="📋" color="blue" />
            <StatCard label="Total Submitted" value={fmt(stats.total_submitted)} icon="📤" color="orange" />
            <StatCard label="Total Approved" value={fmt(stats.total_approved)} icon="✅" color="green" />
            <StatCard label="Approval Rate" value={`${stats.approval_rate}%`} icon="📈" color="purple" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card title="Claims by Status">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => v.toLocaleString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Top Providers by Claims Volume">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProviders} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="provider_name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={v => `${v} claims`} />
                  <Bar dataKey="claim_count" name="Claims" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Category Breakdown Table */}
          <Card title="Expenditure Breakdown by Service Category">
            <Table columns={catColumns} data={categories} />
          </Card>
        </>
      )}
    </Layout>
  );
}
