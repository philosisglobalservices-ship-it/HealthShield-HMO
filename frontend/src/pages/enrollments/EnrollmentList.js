import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Select, LoadingSpinner, Pagination } from '../../components/ui';
import { enrollmentsApi, plansApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK = [
  { id: '1', member_first_name: 'Adaeze', member_last_name: 'Okonkwo', member_number: 'MBR-001', plan_name: 'Standard Care', employer_name: 'TechNova Nigeria', effective_date: '2026-01-01', expiry_date: '2026-12-31', premium_amount: 25000, status: 'active' },
  { id: '2', member_first_name: 'Emeka', member_last_name: 'Eze', member_number: 'MBR-002', plan_name: 'Basic Care', employer_name: 'First Bank PLC', effective_date: '2026-03-01', expiry_date: '2027-02-28', premium_amount: 15000, status: 'active' },
  { id: '3', member_first_name: 'Fatima', member_last_name: 'Abubakar', member_number: 'MBR-003', plan_name: 'Premium Care', employer_name: 'Dangote Group', effective_date: '2025-06-01', expiry_date: '2026-05-31', premium_amount: 45000, status: 'suspended' },
  { id: '4', member_first_name: 'Ngozi', member_last_name: 'Ibe', member_number: 'MBR-004', plan_name: 'Standard Care', employer_name: 'TechNova Nigeria', effective_date: '2024-01-01', expiry_date: '2024-12-31', premium_amount: 25000, status: 'terminated' },
];

export default function EnrollmentList() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', plan_id: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };

  useEffect(() => {
    plansApi.getAll()
      .then(res => {
        const data = res.data?.data?.data || res.data?.data || [];
        setPlans([{ value: '', label: 'All Plans' }, ...data.map(p => ({ value: p.id, label: p.name }))]);
      })
      .catch(() => setPlans([{ value: '', label: 'All Plans' }]));
  }, []);

  useEffect(() => {
    setLoading(true);
    enrollmentsApi.getAll({ page, limit: 20, ...filters })
      .then(res => {
        const data = res.data?.data?.data || res.data?.data || [];
        setEnrollments(data.length ? data : MOCK);
        setTotalPages(res.data?.data?.pagination?.totalPages || 1);
      })
      .catch(() => { setEnrollments(MOCK); setTotalPages(1); })
      .finally(() => setLoading(false));
  }, [page, filters]);

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const columns = [
    { header: 'Member', accessor: row => <div><div className="font-medium">{row.member_first_name} {row.member_last_name}</div><div className="text-xs text-gray-400 font-mono">{row.member_number}</div></div> },
    { header: 'Plan', accessor: 'plan_name' },
    { header: 'Employer', accessor: row => row.employer_name || 'Individual' },
    { header: 'Effective', accessor: row => fmtDate(row.effective_date) },
    { header: 'Expiry', accessor: row => fmtDate(row.expiry_date) },
    { header: 'Premium', accessor: row => <span className="font-semibold">₦{Number(row.premium_amount || 0).toLocaleString()}</span> },
    { header: 'Status', accessor: row => <Badge status={row.status}>{row.status?.replace(/_/g, ' ')}</Badge> },
    { header: 'Actions', accessor: row => (
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => navigate(`/enrollments/${row.id}`)}>View</Button>
      </div>
    )},
  ];

  return (
    <Layout title="Enrollments" subtitle="Member health plan enrollments">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2 flex-wrap">
          <Select value={filters.status} onChange={e => setFilter('status', e.target.value)}
            options={[{ value: '', label: 'All Statuses' }, { value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }, { value: 'terminated', label: 'Terminated' }, { value: 'pending', label: 'Pending' }]} />
          <Select value={filters.plan_id} onChange={e => setFilter('plan_id', e.target.value)} options={plans} />
        </div>
        <Button onClick={() => navigate('/enrollments/new')}>+ New Enrollment</Button>
      </div>

      <Card>
        {loading ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          : <Table columns={columns} data={enrollments} emptyMessage="No enrollments found." />}
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>
    </Layout>
  );
}
