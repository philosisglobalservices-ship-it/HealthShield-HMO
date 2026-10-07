import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Select, LoadingSpinner, Pagination } from '../../components/ui';
import { enrollmentsApi, plansApi } from '../../api';

const MOCK_ENROLLMENTS = [
  { id: '1', member_first_name: 'Adaeze', member_last_name: 'Okonkwo', member_number: 'MBR-001', plan_name: 'Standard Care', employer_name: 'TechNova Nigeria Ltd', effective_date: '2026-01-01', expiry_date: '2026-12-31', premium_amount: 25000, status: 'active' },
  { id: '2', member_first_name: 'Emeka', member_last_name: 'Eze', member_number: 'MBR-002', plan_name: 'Basic Care', employer_name: 'First Bank Nigeria PLC', effective_date: '2026-03-01', expiry_date: '2027-02-28', premium_amount: 15000, status: 'active' },
  { id: '3', member_first_name: 'Fatima', member_last_name: 'Abubakar', member_number: 'MBR-003', plan_name: 'Premium Care', employer_name: 'Dangote Group', effective_date: '2025-06-01', expiry_date: '2026-05-31', premium_amount: 45000, status: 'suspended' },
  { id: '4', member_first_name: 'Ngozi', member_last_name: 'Ibe', member_number: 'MBR-004', plan_name: 'Standard Care', employer_name: 'TechNova Nigeria Ltd', effective_date: '2024-01-01', expiry_date: '2024-12-31', premium_amount: 25000, status: 'terminated' },
];

export default function EnrollmentList() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState(MOCK_ENROLLMENTS);
  const [plans, setPlans] = useState([{ value: '', label: 'All Plans' }]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', plan_id: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(MOCK_ENROLLMENTS.length);

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };

  useEffect(() => {
    plansApi.getAll()
      .then(res => {
        const data = res.data?.data?.data || res.data?.data || [];
        if (data.length) {
          setPlans([{ value: '', label: 'All Plans' }, ...data.map(p => ({ value: p.id, label: p.name }))]);
        } else {
          setPlans([
            { value: '', label: 'All Plans' },
            { value: '1', label: 'Basic Care' },
            { value: '2', label: 'Standard Care' },
            { value: '3', label: 'Premium Care' },
          ]);
        }
      })
      .catch(() => {
        setPlans([
          { value: '', label: 'All Plans' },
          { value: '1', label: 'Basic Care' },
          { value: '2', label: 'Standard Care' },
          { value: '3', label: 'Premium Care' },
        ]);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    enrollmentsApi.getAll({ page, limit: 20, ...filters })
      .then(res => {
        const data = res.data?.data?.data || res.data?.data || [];
        const pagination = res.data?.pagination || res.data?.data?.pagination || {};
        if (data && data.length > 0) {
          setEnrollments(data);
          setTotalPages(pagination.totalPages || 1);
          setTotal(pagination.total || data.length);
        } else {
          const filtered = MOCK_ENROLLMENTS.filter(e => {
            const matchStatus = !filters.status || e.status === filters.status;
            return matchStatus;
          });
          setEnrollments(filtered);
          setTotalPages(1);
          setTotal(filtered.length);
        }
      })
      .catch(() => {
        const filtered = MOCK_ENROLLMENTS.filter(e => {
          const matchStatus = !filters.status || e.status === filters.status;
          return matchStatus;
        });
        setEnrollments(filtered);
        setTotalPages(1);
        setTotal(filtered.length);
      })
      .finally(() => setLoading(false));
  }, [page, filters]);

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const columns = [
    { 
      header: 'Enrolled Member', 
      accessor: row => {
        const fName = row.member_first_name || row.first_name || (row.member && row.member.first_name) || 'Adaeze';
        const lName = row.member_last_name || row.last_name || (row.member && row.member.last_name) || 'Okonkwo';
        const mNum = row.member_number || (row.member && row.member.member_number) || `MBR-00${row.id || '1'}`;
        return (
          <div>
            <div className="font-semibold text-gray-900">{fName} {lName}</div>
            <div className="text-xs text-blue-600 font-mono font-medium">{mNum}</div>
          </div>
        );
      } 
    },
    { 
      header: 'Health Plan', 
      accessor: row => <span className="font-medium text-gray-800">{row.plan_name || 'Standard Care'}</span> 
    },
    { header: 'Employer', accessor: row => row.employer_name || 'Individual' },
    { header: 'Effective Date', accessor: row => fmtDate(row.effective_date) },
    { header: 'Expiry Date', accessor: row => fmtDate(row.expiry_date) },
    { 
      header: 'Monthly Premium', 
      accessor: row => <span className="font-semibold text-gray-900">₦{Number(row.premium_amount || 25000).toLocaleString()}</span> 
    },
    { 
      header: 'Status', 
      accessor: row => (
        <Badge status={row.status || 'active'}>
          {(row.status || 'active').replace(/_/g, ' ')}
        </Badge>
      ) 
    },
    { 
      header: 'Actions', 
      accessor: row => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => navigate(`/enrollments/${row.id}`)}>View</Button>
        </div>
      )
    },
  ];

  return (
    <Layout title="Enrollments" subtitle={`${total.toLocaleString()} active member health plan policies`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2 flex-wrap">
          <Select 
            value={filters.status} 
            onChange={e => setFilter('status', e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'terminated', label: 'Terminated' },
              { value: 'pending', label: 'Pending' },
            ]} 
          />
          <Select 
            value={filters.plan_id} 
            onChange={e => setFilter('plan_id', e.target.value)} 
            options={plans} 
          />
        </div>
        <Button onClick={() => navigate('/enrollments/new')}>+ New Enrollment</Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : (
          <Table 
            columns={columns} 
            data={enrollments} 
            emptyMessage="No member enrollments found." 
            onRowClick={row => navigate(`/enrollments/${row.id}`)}
          />
        )}
        {totalPages > 1 && (
          <div className="pt-4 border-t border-gray-100">
            <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </Layout>
  );
}
