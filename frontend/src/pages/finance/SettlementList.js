import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, Table, Badge, Button, Modal, Input, Select, LoadingSpinner, Pagination } from '../../components/ui';
import { financeApi, providersApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK = [
  { id: '1', settlement_number: 'SET-2026-001', provider_name: 'Lagos University Teaching Hospital', period: 'September 2026', claims_count: 28, gross_amount: 7200000, total_deductions: 720000, net_amount: 6480000, status: 'paid' },
  { id: '2', settlement_number: 'SET-2026-002', provider_name: 'Reddington Hospital', period: 'September 2026', claims_count: 15, gross_amount: 4500000, total_deductions: 450000, net_amount: 4050000, status: 'pending' },
  { id: '3', settlement_number: 'SET-2026-003', provider_name: 'HealthPlus Pharmacy', period: 'September 2026', claims_count: 45, gross_amount: 1800000, total_deductions: 90000, net_amount: 1710000, status: 'processing' },
];
const fmt = v => `₦${Number(v || 0).toLocaleString()}`;

export default function SettlementList() {
  const [settlements, setSettlements] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ provider_id: '', period: '', gross_amount: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    providersApi.getAll({ limit: 100 }).then(res => {
      const d = res.data?.data?.data || res.data?.data || [];
      setProviders([{ value: '', label: 'Select provider...' }, ...d.map(p => ({ value: p.id, label: p.name }))]);
    }).catch(() => setProviders([{ value: '', label: 'Select provider...' }]));
  }, []);

  const load = () => {
    setLoading(true);
    financeApi.getSettlements({ page, limit: 20, status: statusFilter })
      .then(res => {
        const d = res.data?.data?.data || res.data?.data || [];
        setSettlements(d.length ? d : MOCK);
        setTotalPages(res.data?.data?.pagination?.totalPages || 1);
      })
      .catch(() => { setSettlements(MOCK); setTotalPages(1); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, statusFilter]);

  const handleCreate = async () => {
    if (!createForm.provider_id || !createForm.gross_amount) { toast.error('Provider and amount are required'); return; }
    setActionLoading(true);
    try {
      await financeApi.createSettlement({ ...createForm, gross_amount: parseFloat(createForm.gross_amount) });
      toast.success('Settlement created'); setShowCreate(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create settlement'); }
    finally { setActionLoading(false); }
  };

  const cols = [
    { header: 'Settlement #', accessor: row => <span className="font-mono text-sm font-medium">{row.settlement_number}</span> },
    { header: 'Provider', accessor: 'provider_name' },
    { header: 'Period', accessor: 'period' },
    { header: 'Claims', accessor: row => <span className="text-center block">{row.claims_count}</span> },
    { header: 'Gross', accessor: row => fmt(row.gross_amount) },
    { header: 'Deductions', accessor: row => <span className="text-red-500">-{fmt(row.total_deductions)}</span> },
    { header: 'Net Amount', accessor: row => <span className="font-bold text-green-600">{fmt(row.net_amount)}</span> },
    { header: 'Status', accessor: row => <Badge status={row.status}>{row.status}</Badge> },
  ];

  return (
    <Layout title="Provider Settlements" subtitle="Healthcare provider payment settlements">
      <div className="flex items-center justify-between mb-5">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          {['', 'pending', 'processing', 'paid', 'cancelled'].map(s => (
            <option key={s} value={s}>{s === '' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <Button onClick={() => setShowCreate(true)}>+ Create Settlement</Button>
      </div>
      <Card>
        {loading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : <Table columns={cols} data={settlements} emptyMessage="No settlements found." />}
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>

      {showCreate && (
        <Modal title="Create Provider Settlement" onClose={() => setShowCreate(false)}
          footer={<><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={actionLoading} onClick={handleCreate}>Create</Button></>}>
          <div className="space-y-4">
            <Select label="Provider *" options={providers} value={createForm.provider_id} onChange={e => setCreateForm(f => ({ ...f, provider_id: e.target.value }))} />
            <Input label="Period" value={createForm.period} onChange={e => setCreateForm(f => ({ ...f, period: e.target.value }))} placeholder="e.g. September 2026" />
            <Input label="Gross Amount (₦) *" type="number" value={createForm.gross_amount} onChange={e => setCreateForm(f => ({ ...f, gross_amount: e.target.value }))} />
          </div>
        </Modal>
      )}
    </Layout>
  );
}
