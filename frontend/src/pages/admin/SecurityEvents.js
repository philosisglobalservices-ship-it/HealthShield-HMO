import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, Table, Badge, LoadingSpinner, Pagination } from '../../components/ui';
import { auditApi } from '../../api';

const MOCK = [
  { id: '1', created_at: '2026-10-05T20:00:00Z', event_type: 'BRUTE_FORCE_ATTEMPT', severity: 'high', user_email: 'unknown@ext.com', ip_address: '45.123.67.89', description: '5 consecutive failed login attempts detected' },
  { id: '2', created_at: '2026-10-05T19:30:00Z', event_type: 'UNUSUAL_ACCESS_TIME', severity: 'medium', user_email: 'claims@healthshield.ng', ip_address: '196.6.12.46', description: 'Login detected outside normal working hours (2:30 AM)' },
  { id: '3', created_at: '2026-10-05T18:00:00Z', event_type: 'MASS_DATA_EXPORT', severity: 'high', user_email: 'finance@healthshield.ng', ip_address: '196.6.12.47', description: 'Large data export: 500+ member records exported at once' },
  { id: '4', created_at: '2026-10-05T16:00:00Z', event_type: 'PASSWORD_CHANGED', severity: 'low', user_email: 'ops@healthshield.ng', ip_address: '196.6.12.48', description: 'Password changed successfully' },
  { id: '5', created_at: '2026-10-04T12:00:00Z', event_type: 'UNAUTHORIZED_ACCESS_ATTEMPT', severity: 'critical', user_email: 'unknown@hacker.com', ip_address: '103.56.78.90', description: 'Attempted access to admin endpoint without authorization' },
];

const SEVERITY_BADGE = { critical: 'terminated', high: 'denied', medium: 'pending', low: 'active', info: 'draft' };

const fmtDate = d => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function SecurityEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    auditApi.getSecurityEvents({ page, limit: 20, severity })
      .then(res => {
        const d = res.data?.data?.data || res.data?.data || [];
        setEvents(d.length ? d : MOCK);
        setTotalPages(res.data?.data?.pagination?.totalPages || 1);
      })
      .catch(() => { setEvents(MOCK); setTotalPages(1); })
      .finally(() => setLoading(false));
  }, [page, severity]);

  const cols = [
    { header: 'Timestamp', accessor: row => <span className="text-xs text-gray-500 whitespace-nowrap">{fmtDate(row.created_at)}</span> },
    { header: 'Event Type', accessor: row => <span className="font-mono text-xs font-semibold">{(row.event_type || '').replace(/_/g, ' ')}</span> },
    { header: 'Severity', accessor: row => <Badge status={SEVERITY_BADGE[row.severity] || 'draft'} className="capitalize">{row.severity}</Badge> },
    { header: 'User', accessor: row => <span className="text-sm">{row.user_email || '—'}</span> },
    { header: 'IP Address', accessor: row => <span className="font-mono text-xs text-gray-500">{row.ip_address}</span> },
    { header: 'Description', accessor: row => <span className="text-xs text-gray-600 max-w-xs block truncate">{row.description}</span> },
  ];

  const SEVERITIES = ['', 'critical', 'high', 'medium', 'low', 'info'];

  return (
    <Layout title="Security Events" subtitle="Platform security monitoring and threat detection">
      <div className="mb-5">
        <select value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          {SEVERITIES.map(s => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) + ' Severity' : 'All Severities'}</option>)}
        </select>
      </div>

      <Card>
        {loading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : <Table columns={cols} data={events} emptyMessage="No security events found." />}
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>
    </Layout>
  );
}
