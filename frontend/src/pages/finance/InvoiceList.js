import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Card, Table, Badge, Select, Button, LoadingSpinner, Pagination, Modal, Input } from '../../components/ui';
import { financeApi, employersApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK = [
  { id: '1', invoice_number: 'INV-2026-001', employer_name: 'TechNova Nigeria Ltd', billing_period: 'October 2026', total_amount: 3750000, due_date: '2026-10-15', status: 'sent' },
  { id: '2', invoice_number: 'INV-2026-002', employer_name: 'First Bank Nigeria PLC', billing_period: 'October 2026', total_amount: 8400000, due_date: '2026-10-15', status: 'paid' },
  { id: '3', invoice_number: 'INV-2026-003', employer_name: 'Dangote Group', billing_period: 'September 2026', total_amount: 1500000, due_date: '2026-09-15', status: 'overdue' },
];

const fmtAmt = v => `₦${Number(v || 0).toLocaleString()}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPay, setShowPay] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [payForm, setPayForm] = useState({ payment_method: 'bank_transfer', amount: '' });
  const [createForm, setCreateForm] = useState({ employer_id: '', billing_period: '', total_amount: '', due_date: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    employersApi.getAll({ limit: 100 }).then(res => {
      const d = res.data?.data?.data || res.data?.data || [];
      setEmployers(d.map(e => ({ value: e.id, label: e.organization_name || e.name })));
    }).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    financeApi.getInvoices({ page, limit: 20, status: statusFilter })
      .then(res => {
        const d = res.data?.data?.data || res.data?.data || [];
        setInvoices(d.length ? d : MOCK);
        setTotalPages(res.data?.data?.pagination?.totalPages || 1);
      })
      .catch(() => { setInvoices(MOCK); setTotalPages(1); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, statusFilter]);

  const handlePay = async () => {
    setActionLoading(true);
    try {
      await financeApi.payInvoice(showPay.id, { payment_method: payForm.payment_method, amount: parseFloat(payForm.amount) || showPay.total_amount });
      toast.success('Payment recorded');
      setShowPay(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to record payment'); }
    finally { setActionLoading(false); }
  };

  const handleCreate = async () => {
    if (!createForm.employer_id || !createForm.total_amount) { toast.error('Employer and amount are required'); return; }
    setActionLoading(true);
    try {
      await financeApi.createInvoice({ ...createForm, total_amount: parseFloat(createForm.total_amount) });
      toast.success('Invoice created'); setShowCreate(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create invoice'); }
    finally { setActionLoading(false); }
  };

  const paymentMethods = [{ value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'cheque', label: 'Cheque' }, { value: 'cash', label: 'Cash' }, { value: 'online', label: 'Online Payment' }];

  const cols = [
    { header: 'Invoice #', accessor: row => <span className="font-mono text-sm font-semibold">{row.invoice_number}</span> },
    { header: 'Employer', accessor: 'employer_name' },
    { header: 'Period', accessor: 'billing_period' },
    { header: 'Amount', accessor: row => <span className="font-bold">{fmtAmt(row.total_amount)}</span> },
    { header: 'Due Date', accessor: row => <span className={row.status === 'overdue' ? 'text-red-600 font-medium' : ''}>{fmtDate(row.due_date)}</span> },
    { header: 'Status', accessor: row => <Badge status={row.status}>{row.status}</Badge> },
    { header: 'Actions', accessor: row => (
      <div className="flex gap-1">
        {['sent', 'overdue'].includes(row.status) && (
          <Button size="sm" variant="success" onClick={() => { setPayForm({ payment_method: 'bank_transfer', amount: row.total_amount }); setShowPay(row); }}>Pay</Button>
        )}
      </div>
    )},
  ];

  return (
    <Layout title="Invoices" subtitle="Premium invoices management">
      <div className="flex items-center justify-between mb-5">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          {['', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => <option key={s} value={s}>{s === '' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <Button onClick={() => setShowCreate(true)}>+ Create Invoice</Button>
      </div>

      <Card>
        {loading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : <Table columns={cols} data={invoices} emptyMessage="No invoices found." />}
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>

      {showPay && (
        <Modal title={`Pay Invoice ${showPay.invoice_number}`} onClose={() => setShowPay(null)}
          footer={<><Button variant="outline" onClick={() => setShowPay(null)}>Cancel</Button><Button variant="success" loading={actionLoading} onClick={handlePay}>Record Payment</Button></>}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Invoice Amount: <strong>{fmtAmt(showPay.total_amount)}</strong></p>
            <Select label="Payment Method" options={paymentMethods} value={payForm.payment_method} onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))} />
            <Input label="Amount Paid (₦)" type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
        </Modal>
      )}

      {showCreate && (
        <Modal title="Create Invoice" onClose={() => setShowCreate(false)}
          footer={<><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={actionLoading} onClick={handleCreate}>Create Invoice</Button></>}>
          <div className="space-y-4">
            <Select label="Employer *" options={[{ value: '', label: 'Select employer...' }, ...employers]} value={createForm.employer_id} onChange={e => setCreateForm(f => ({ ...f, employer_id: e.target.value }))} />
            <Input label="Billing Period" value={createForm.billing_period} onChange={e => setCreateForm(f => ({ ...f, billing_period: e.target.value }))} placeholder="e.g. October 2026" />
            <Input label="Total Amount (₦) *" type="number" value={createForm.total_amount} onChange={e => setCreateForm(f => ({ ...f, total_amount: e.target.value }))} />
            <Input label="Due Date" type="date" value={createForm.due_date} onChange={e => setCreateForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
        </Modal>
      )}
    </Layout>
  );
}
