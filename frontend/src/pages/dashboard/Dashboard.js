import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, ShieldCheck, DollarSign, Stethoscope, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Layout } from '../../components/layout/Layout';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { dashboardApi } from '../../api';

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

function fmt(n) {
  if (n >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₦${(n / 1000).toFixed(0)}K`;
  return `₦${n?.toLocaleString() || 0}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then((res) => setStats({ ...MOCK_STATS, ...res.data }))
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Dashboard" subtitle="Platform overview and key metrics">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Members" value={stats.totalMembers?.toLocaleString()} icon={Users} iconColor="blue" loading={loading} onClick={() => navigate('/members')} trendLabel={`${stats.activeMembers?.toLocaleString()} active`} />
        <StatCard label="Pending Claims" value={stats.pendingClaims} icon={ClipboardList} iconColor="amber" loading={loading} onClick={() => navigate('/claims')} />
        <StatCard label="Pending Auths" value={stats.pendingAuthorizations} icon={ShieldCheck} iconColor="purple" loading={loading} onClick={() => navigate('/authorizations')} />
        <StatCard label="Monthly Revenue" value={fmt(stats.monthlyRevenue)} icon={DollarSign} iconColor="green" loading={loading} />
        <StatCard label="Active Providers" value={stats.activeProviders} icon={Stethoscope} iconColor="indigo" loading={loading} onClick={() => navigate('/providers')} />
        <StatCard label="Open Cases" value={stats.openCases} icon={MessageSquare} iconColor="red" loading={loading} onClick={() => navigate('/cases')} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Claims trend */}
        <Card title="Claims Trend" subtitle="Last 6 months" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.monthlyTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="claimsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="claims" stroke="#3b82f6" fill="url(#claimsGrad)" strokeWidth={2} name="Claims" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Claims by status pie */}
        <Card title="Claims by Status">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.claimsByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {stats.claimsByStatus?.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Revenue vs Expenditure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Revenue vs Expenditure" subtitle="Monthly comparison (₦)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.monthlyTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `₦${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₦${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="claims" fill="#ef4444" name="Claims Cost" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Claims table */}
        <Card title="Recent Claims" action={
          <button onClick={() => navigate('/claims')} className="text-sm text-blue-600 hover:underline">View all →</button>
        } padding={false}>
          <div className="divide-y divide-gray-100">
            {(stats.recentClaims || []).slice(0, 5).map((claim) => (
              <div key={claim.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/claims/${claim.id}`)}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{claim.member_first_name} {claim.member_last_name}</p>
                  <p className="text-xs text-gray-500">{claim.claim_number} • {claim.service_category}</p>
                </div>
                <div className="ml-4 flex flex-col items-end gap-1 flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">₦{Number(claim.submitted_amount).toLocaleString()}</p>
                  <Badge status={claim.status}>{claim.status?.replace(/_/g, ' ')}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {stats.outstandingInvoices > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <span>
            <strong>{stats.outstandingInvoices} invoices</strong> are outstanding totalling{' '}
            <strong>₦{Number(stats.outstandingAmount).toLocaleString()}</strong>.{' '}
            <button onClick={() => navigate('/finance/invoices')} className="underline font-medium">Review invoices →</button>
          </span>
        </div>
      )}
    </Layout>
  );
}
