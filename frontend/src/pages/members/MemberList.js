import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Select, LoadingSpinner, Pagination } from '../../components/ui';
import { membersApi, employersApi } from '../../api';

const MOCK = [
  { id: '1', member_number: 'MBR-001', first_name: 'Adaeze', last_name: 'Okonkwo', phone: '+234-801-2345678', plan_name: 'Standard Care', employer_name: 'TechNova Nigeria', status: 'active' },
  { id: '2', member_number: 'MBR-002', first_name: 'Emeka', last_name: 'Eze', phone: '+234-802-3456789', plan_name: 'Basic Care', employer_name: 'First Bank PLC', status: 'active' },
  { id: '3', member_number: 'MBR-003', first_name: 'Fatima', last_name: 'Abubakar', phone: '+234-803-4567890', plan_name: 'Premium Care', employer_name: 'Dangote Group', status: 'suspended' },
  { id: '4', member_number: 'MBR-004', first_name: 'Ngozi', last_name: 'Ibe', phone: '+234-804-5678901', plan_name: 'Standard Care', employer_name: 'TechNova Nigeria', status: 'active' },
  { id: '5', member_number: 'MBR-005', first_name: 'Tunde', last_name: 'Bakare', phone: '+234-805-6789012', plan_name: 'Corporate Elite', employer_name: 'Dangote Group', status: 'terminated' },
];

export default function MemberList() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [employers, setEmployers] = useState([{ value: '', label: 'All Employers' }]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [employerId, setEmployerId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef(null);

  const handleSearch = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
  };

  useEffect(() => {
    employersApi.getAll({ limit: 100 })
      .then(res => {
        const data = res.data?.data?.data || res.data?.data || [];
        setEmployers([{ value: '', label: 'All Employers' }, ...data.map(e => ({ value: e.id, label: e.organization_name || e.name }))]);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    membersApi.getAll({ page, limit: 20, search, status, employer_id: employerId })
      .then(res => {
        const data = res.data?.data?.data || res.data?.data || [];
        const pagination = res.data?.data?.pagination || {};
        setMembers(data.length ? data : MOCK);
        setTotalPages(pagination.totalPages || 1);
        setTotal(pagination.total || MOCK.length);
      })
      .catch(() => { setMembers(MOCK); setTotalPages(1); setTotal(MOCK.length); })
      .finally(() => setLoading(false));
  }, [page, search, status, employerId]);

  const columns = [
    { header: 'Member #', accessor: row => <span className="font-mono text-sm font-medium text-blue-600">{row.member_number}</span> },
    { header: 'Full Name', accessor: row => <div><div className="font-medium">{row.first_name} {row.last_name}</div><div className="text-xs text-gray-400">{row.email || ''}</div></div> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Plan', accessor: row => row.plan_name || '—' },
    { header: 'Employer', accessor: row => row.employer_name || 'Individual' },
    { header: 'Status', accessor: row => <Badge status={row.status}>{row.status?.replace(/_/g, ' ')}</Badge> },
    { header: 'Actions', accessor: row => (
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); navigate(`/members/${row.id}`); }}>View</Button>
        <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); navigate(`/members/${row.id}/edit`); }}>Edit</Button>
      </div>
    )},
  ];

  return (
    <Layout title="Members" subtitle={`${total.toLocaleString()} total members`}>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-52">
          <input value={searchInput} onChange={e => handleSearch(e.target.value)}
            placeholder="Search name, member#, phone..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="terminated">Terminated</option>
        </select>
        <select value={employerId} onChange={e => { setEmployerId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          {employers.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <Button onClick={() => navigate('/members/new')}>+ Add Member</Button>
      </div>

      <Card>
        {loading
          ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          : <Table columns={columns} data={members} emptyMessage="No members found." onRowClick={row => navigate(`/members/${row.id}`)} />}
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />}
      </Card>
    </Layout>
  );
}
