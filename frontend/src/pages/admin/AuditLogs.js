import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, Table, Badge, LoadingSpinner, Pagination } from '../../components/ui';
import { auditApi } from '../../api';

const MOCK = [
  { id: '1', created_at: '2026-10-05T20:15:00Z', user_email: 'admin@healthshield.ng', module: 'Auth', action: 'LOGIN', resource_type: 'User', resource_id: 'U-001', ip_address: '196.6.12.45', status: 'success' },
  { id: '2', created_at: '2026-10-05T19:45:00Z', user_email: 'claims@healthshield.ng', module: 'Claims', action: 'APPROVE', resource_type: 'Claim', resource_id: 'CLM-20261001-2001', ip_address: '196.6.12.46', status: 'success' },
  { id: '3', created_at: '2026-10-05T18:30:00Z', user_email: 'finance@healthshield.ng', module: 'Finance', action: 'CREATE', resource_type: 'Invoice', resource_id: 'INV-2026-005', ip_address: '196.6.12.47', status: 'success' },
  { id: '4', created_at: '2026-10-05T17:00:00Z', user_email: 'ops@healthshield.ng', module: 'Members', action: 'UPDATE', resource_type: 'Member', resource_id: 'MBR-001', ip_address: '196.6.12.48', status: 'success' },
  { id: '5', created_at: '2026-10-05T16:00:00Z', user_email: 'unknown@ext.com', module: 'Auth', action: 'LOGIN_FAILED', resource_type: null, resource_id: null, ip_address: '45.123.67.89', status: 'failure' },
  { id: '6', created_at: '2026-10-05T15:30:00Z', user_email: 'medical@healthshield.ng', module: 'Authorizations', action: 'DENY', resource_type: 'Authorization', resource_id: 'AUTH-2026-1003', ip_address: '196.6.12.49', status: 'success' },
];

const fmtDate = d => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    auditApi.getLogs({ page, limit: 50, module, from_date: fromDate, to_date: toDate })
      .then(res => {
        const d = res.data?.data?.data || res.data?.data || [];
        setLogs(d.length ? d : MOCK);
        setTotalPages(res.data?.data?.pagination?.totalPages || 1);
      })
      .catch(() => { setLogs(MOCK); setTotalPages(1); })
      .finally(() => setLoading(false));
  }, [page, module, fromDate, toDate]);

  const MODULES = ['', 'Auth', 'Members', 'Claims', 'Authorizations', 'Finance', 'Providers', 'Employers', 'Plans', 'Admin'];

  const cols = [
    { header: 'Timestamp', accessor: row => <span className="text-xs text-gray-500 whitespace-nowrap">{fmtDate(row.created_at)}</span> },
    { header: 'User', accessor: row => <span className="text-sm">{row.user_email || '—'}</span> },
    { header: 'Module', accessor: row => <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">{row.module}</span> },
    { header: 'Action', accessor: row => <span className="font-mono text-xs font-semibold">{row.action}</span> },
    { header: 'Resource', accessor: row => row.resource_type ? <span className="text-xs">{row.resource_type}: <span className="font-mono">{row.resource_id}</span></span> : '—' },
    { header: 'IP', accessor: row => <span className="font-mono text-xs text-gray-500">{row.ip_address}</span> },
    { header: 'Status', accessor: row => <Badge status={row.status === 'success' ? 'active' : 'terminated'}>{row.status}</Badge> },
  ];

  return (
    <Layout title="Audit Logs" subtitle="System activity and compliance trail">
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={module} onChange={e => { setModule(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          {MODULES.map(m => <option key={m} value={m}>{m || 'All Modules'}</option>)}
        </select>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">From</span>
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }}
            className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">To</span>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }}
            className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      <Card>
        {loading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : <Table columns={cols} data={logs} emptyMessage="No audit logs found." />}
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>
    </Layout>
  );
}
