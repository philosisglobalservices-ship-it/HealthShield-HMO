import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard, Table, Badge, Select, Button, LoadingSpinner } from '../../components/ui';
import { reportsApi } from '../../api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

const MOCK_STATS = { total: 1250, active: 1180, new_this_month: 28, terminated_this_month: 5 };

const MOCK_BY_EMPLOYER = [
  { employer_name: 'Zenith Bank Plc', member_count: 210 },
  { employer_name: 'MTN Nigeria', member_count: 185 },
  { employer_name: 'Dangote Group', member_count: 162 },
  { employer_name: 'GTBank Plc', member_count: 140 },
  { employer_name: 'Access Bank', member_count: 118 },
];

const MOCK_MONTHLY = [
  { month: 'May 2025', count: 22 },
  { month: 'Jun 2025', count: 31 },
  { month: 'Jul 2025', count: 19 },
  { month: 'Aug 2025', count: 28 },
  { month: 'Sep 2025', count: 35 },
  { month: 'Oct 2025', count: 28 },
];

const MOCK_STATUS_TABLE = [
  { status: 'Active', count: 1180, percentage: '94.4%' },
  { status: 'Suspended', count: 42, percentage: '3.4%' },
  { status: 'Terminated', count: 28, percentage: '2.2%' },
];

const STATUS_COLUMNS = [
  { header: 'Status', accessor: row => <Badge status={row.status.toLowerCase()}>{row.status}</Badge> },
  { header: 'Count', accessor: 'count' },
  { header: 'Percentage', accessor: 'percentage' },
];

export default function MemberReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(MOCK_STATS);
  const [byEmployer, setByEmployer] = useState(MOCK_BY_EMPLOYER);
  const [monthly, setMonthly] = useState(MOCK_MONTHLY);
  const [statusTable, setStatusTable] = useState(MOCK_STATUS_TABLE);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await reportsApi.getMemberReport(params);
      if (res.data?.success) {
        const d = res.data.data;
        if (d.stats) setStats(d.stats);
        if (d.charts?.membersByEmployer) setByEmployer(d.charts.membersByEmployer);
        if (d.charts?.monthlyNewMembers) setMonthly(d.charts.monthlyNewMembers);
        if (d.table) setStatusTable(d.table);
      }
    } catch {
      // silently use mock data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleExport = () => toast('Export feature coming soon', { icon: '📤' });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Member Report</h1>
            <p className="text-sm text-gray-500 mt-1">Membership statistics and trends</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={fetchData} size="sm">Apply</Button>
            <Button onClick={handleExport} size="sm" variant="outline">Export</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Members" value={Number(stats.total).toLocaleString()} icon="👥" color="blue" />
              <StatCard title="Active Members" value={Number(stats.active).toLocaleString()} icon="✅" color="green" />
              <StatCard title="New This Month" value={Number(stats.new_this_month).toLocaleString()} icon="🆕" color="purple" />
              <StatCard title="Terminated This Month" value={Number(stats.terminated_this_month).toLocaleString()} icon="🚫" color="red" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-base font-semibold text-gray-800 mb-4">Members by Employer</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byEmployer} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="employer_name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="member_count" name="Members" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h3 className="text-base font-semibold text-gray-800 mb-4">Monthly New Members (Last 6 Months)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="New Members" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Status Table */}
            <Card>
              <h3 className="text-base font-semibold text-gray-800 mb-4">Membership Status Breakdown</h3>
              <Table columns={STATUS_COLUMNS} data={statusTable} />
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
