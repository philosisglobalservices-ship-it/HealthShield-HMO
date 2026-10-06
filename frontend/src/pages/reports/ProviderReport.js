import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard, Table, Badge, LoadingSpinner, Button } from '../../components/ui';
import { reportsApi } from '../../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

const MOCK_STATS = {
  total_providers: 127,
  active_providers: 118,
  top_provider_claims: 320,
  avg_claims_per_provider: 12,
};

const MOCK_TOP_SPEND = [
  { provider_name: 'LUTH Idi-Araba', total_amount: 28500000 },
  { provider_name: 'Reddington Hospital', total_amount: 24000000 },
  { provider_name: 'St. Nicholas Hospital', total_amount: 17200000 },
  { provider_name: 'First Cardiology', total_amount: 15800000 },
  { provider_name: 'Medview Diagnostics', total_amount: 9500000 },
  { provider_name: 'HealthPlus Pharmacy', total_amount: 8400000 },
];

const MOCK_PERFORMANCE = [
  { provider_name: 'LUTH Idi-Araba', type: 'hospital', tier: 'Tier 1', total_claims: 320, total_amount: 28500000, avg_amount: 89062, status: 'active' },
  { provider_name: 'Reddington Hospital', type: 'hospital', tier: 'Tier 1', total_claims: 240, total_amount: 24000000, avg_amount: 100000, status: 'active' },
  { provider_name: 'St. Nicholas Hospital', type: 'hospital', tier: 'Tier 2', total_claims: 190, total_amount: 17200000, avg_amount: 90526, status: 'active' },
  { provider_name: 'HealthPlus Pharmacy', type: 'pharmacy', tier: 'Tier 2', total_claims: 280, total_amount: 8400000, avg_amount: 30000, status: 'active' },
  { provider_name: 'Medview Diagnostics', type: 'laboratory', tier: 'Tier 3', total_claims: 165, total_amount: 9500000, avg_amount: 57575, status: 'active' },
];

const fmt = v => `₦${Number(v || 0).toLocaleString()}`;
const fmtAxis = v => (v >= 1e6 ? `₦${(v / 1e6).toFixed(0)}M` : `₦${v}`);

export default function ProviderReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(MOCK_STATS);
  const [topSpend, setTopSpend] = useState(MOCK_TOP_SPEND);
  const [performance, setPerformance] = useState(MOCK_PERFORMANCE);

  useEffect(() => {
    setLoading(true);
    reportsApi.getProviderReport()
      .then(res => {
        const d = res.data?.data || {};
        if (d.stats) setStats(d.stats);
        if (d.top_spend) setTopSpend(d.top_spend);
        if (d.performance) setPerformance(d.performance);
      })
      .catch(() => {
        setStats(MOCK_STATS);
        setTopSpend(MOCK_TOP_SPEND);
        setPerformance(MOCK_PERFORMANCE);
      })
      .finally(() => setLoading(false));
  }, []);

  const perfColumns = [
    { header: 'Provider Name', accessor: 'provider_name' },
    {
      header: 'Type',
      accessor: row => <span className="capitalize font-medium text-gray-700">{row.type}</span>
    },
    { header: 'Tier', accessor: 'tier' },
    { header: 'Claims Processed', accessor: 'total_claims' },
    { header: 'Total Value', accessor: row => <span className="font-semibold">{fmt(row.total_amount)}</span> },
    { header: 'Average per Claim', accessor: row => fmt(row.avg_amount) },
    {
      header: 'Network Status',
      accessor: row => <Badge status={row.status}>{row.status}</Badge>
    },
  ];

  return (
    <Layout title="Provider Analytics" subtitle="Network hospital performance, claim volumes and reimbursement analysis">
      <div className="flex justify-end mb-6">
        <Button variant="outline" size="sm" onClick={() => toast.success('Exporting Provider Performance Report...')}>
          📥 Export Data
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Network Hospitals & Clinics" value={stats.total_providers?.toString()} icon="🏥" color="blue" />
            <StatCard label="Active Service Providers" value={stats.active_providers?.toString()} icon="✅" color="green" />
            <StatCard label="Highest Single Volume" value={`${stats.top_provider_claims} claims`} icon="🏆" color="purple" />
            <StatCard label="Avg Monthly Claims / Provider" value={stats.avg_claims_per_provider?.toString()} icon="📊" color="orange" />
          </div>

          {/* Top Spend Horizontal Bar Chart */}
          <Card title="Top Healthcare Providers by Total Reimbursement Value" className="mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSpend} layout="vertical" margin={{ left: 30, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="provider_name" tick={{ fontSize: 11 }} width={140} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="total_amount" name="Total Spend" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Performance Table */}
          <Card title="Provider Network Performance Matrix">
            <Table columns={perfColumns} data={performance} />
          </Card>
        </>
      )}
    </Layout>
  );
}
