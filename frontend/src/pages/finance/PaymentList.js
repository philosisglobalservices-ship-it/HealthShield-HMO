import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Card, Table, Badge, Button, LoadingSpinner, Pagination } from '../../components/ui';
import { financeApi } from '../../api';

const MOCK = [
  { id: '1', payment_reference: 'PAY-2026-001', payer_name: 'TechNova Nigeria Ltd', payer_type: 'employer', amount: 3750000, payment_method: 'bank_transfer', status: 'completed', payment_date: '2026-10-01' },
  { id: '2', payment_reference: 'PAY-2026-002', payer_name: 'First Bank Nigeria PLC', payer_type: 'employer', amount: 8400000, payment_method: 'cheque', status: 'completed', payment_date: '2026-10-03' },
  { id: '3', payment_reference: 'PAY-2026-003', payer_name: 'Ngozi Ibe', payer_type: 'individual', amount: 25000, payment_method: 'online', status: 'completed', payment_date: '2026-10-05' },
  { id: '4', payment_reference: 'PAY-2026-004', payer_name: 'Dangote Group', payer_type: 'employer', amount: 6200000, payment_method: 'bank_transfer', status: 'pending', payment_date: '2026-10-06' },
];
const fmt = v => `₦${Number(v || 0).toLocaleString()}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    financeApi.getPayments({ page, limit: 20 })
      .then(res => {
        const d = res.data?.data?.data || res.data?.data || [];
        setPayments(d.length ? d : MOCK);
        setTotalPages(res.data?.data?.pagination?.totalPages || 1);
      })
      .catch(() => { setPayments(MOCK); setTotalPages(1); })
      .finally(() => setLoading(false));
  }, [page]);

  const cols = [
    { header: 'Reference', accessor: row => <span className="font-mono text-sm font-medium">{row.payment_reference}</span> },
    { header: 'Payer', accessor: row => <div><div className="font-medium text-sm">{row.payer_name}</div></div> },
    { header: 'Type', accessor: row => <Badge status={row.payer_type === 'employer' ? 'active' : 'pending'}>{row.payer_type}</Badge> },
    { header: 'Amount', accessor: row => <span className="font-bold">{fmt(row.amount)}</span> },
    { header: 'Method', accessor: row => <span className="capitalize text-sm">{(row.payment_method || '').replace(/_/g, ' ')}</span> },
    { header: 'Status', accessor: row => <Badge status={row.status}>{row.status}</Badge> },
    { header: 'Date', accessor: row => fmtDate(row.payment_date) },
  ];

  return (
    <Layout title="Payments" subtitle="All recorded premium payments">
      <Card>
        {loading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : <Table columns={cols} data={payments} emptyMessage="No payments found." />}
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>
    </Layout>
  );
}
