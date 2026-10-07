import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, LoadingSpinner, Pagination } from '../../components/ui';
import { membersApi, employersApi } from '../../api';

const MOCK_MEMBERS = [
  { id: '1', member_number: 'MBR-001', first_name: 'Adaeze', last_name: 'Okonkwo', email: 'adaeze.o@technova.ng', phone: '+234-801-2345678', plan_name: 'Standard Care', employer_name: 'TechNova Nigeria Ltd', status: 'active' },
  { id: '2', member_number: 'MBR-002', first_name: 'Emeka', last_name: 'Eze', email: 'emeka.eze@firstbank.ng', phone: '+234-802-3456789', plan_name: 'Basic Care', employer_name: 'First Bank Nigeria PLC', status: 'active' },
  { id: '3', member_number: 'MBR-003', first_name: 'Fatima', last_name: 'Abubakar', email: 'fatima.a@dangote.com', phone: '+234-803-4567890', plan_name: 'Premium Care', employer_name: 'Dangote Group', status: 'suspended' },
  { id: '4', member_number: 'MBR-004', first_name: 'Ngozi', last_name: 'Ibe', email: 'ngozi.ibe@technova.ng', phone: '+234-804-5678901', plan_name: 'Standard Care', employer_name: 'TechNova Nigeria Ltd', status: 'active' },
  { id: '5', member_number: 'MBR-005', first_name: 'Tunde', last_name: 'Bakare', email: 'tunde.b@dangote.com', phone: '+234-805-6789012', plan_name: 'Corporate Elite', employer_name: 'Dangote Group', status: 'terminated' },
];

export default function MemberList() {
  const navigate = useNavigate();
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [employers, setEmployers] = useState([{ value: '', label: 'All Employers' }]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [employerId, setEmployerId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(MOCK_MEMBERS.length);
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
        if (data.length) {
          setEmployers([{ value: '', label: 'All Employers' }, ...data.map(e => ({ value: e.id || e.organization_id, label: e.organization_name || e.name }))]);
        } else {
          setEmployers([
            { value: '', label: 'All Employers' },
            { value: '1', label: 'TechNova Nigeria Ltd' },
            { value: '2', label: 'First Bank Nigeria PLC' },
            { value: '3', label: 'Dangote Group' },
          ]);
        }
      }).catch(() => {
        setEmployers([
          { value: '', label: 'All Employers' },
          { value: '1', label: 'TechNova Nigeria Ltd' },
          { value: '2', label: 'First Bank Nigeria PLC' },
          { value: '3', label: 'Dangote Group' },
        ]);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    membersApi.getAll({ page, limit: 20, search, status, employer_id: employerId })
      .then(res => {
        const data = res.data?.data?.data || res.data?.data || [];
        const pagination = res.data?.pagination || res.data?.data?.pagination || {};
        if (data && data.length > 0) {
          setMembers(data);
          setTotalPages(pagination.totalPages || 1);
          setTotal(pagination.total || data.length);
        } else {
          // Fallback to filtered mock
          const filtered = MOCK_MEMBERS.filter(m => {
            const matchesSearch = !search || 
              `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
              m.member_number?.toLowerCase().includes(search.toLowerCase()) ||
              m.phone?.includes(search);
            const matchesStatus = !status || m.status === status;
            return matchesSearch && matchesStatus;
          });
          setMembers(filtered);
          setTotalPages(1);
          setTotal(filtered.length);
        }
      })
      .catch(() => {
        const filtered = MOCK_MEMBERS.filter(m => {
          const matchesSearch = !search || 
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
            m.member_number?.toLowerCase().includes(search.toLowerCase()) ||
            m.phone?.includes(search);
          const matchesStatus = !status || m.status === status;
          return matchesSearch && matchesStatus;
        });
        setMembers(filtered);
        setTotalPages(1);
        setTotal(filtered.length);
      })
      .finally(() => setLoading(false));
  }, [page, search, status, employerId]);

  const columns = [
    { 
      header: 'Member #', 
      accessor: row => <span className="font-mono text-sm font-medium text-blue-600">{row.member_number || `MBR-00${row.id}`}</span> 
    },
    { 
      header: 'Full Name', 
      accessor: row => (
        <div>
          <div className="font-medium text-gray-900">{row.first_name} {row.last_name}</div>
          <div className="text-xs text-gray-400">{row.email || '—'}</div>
        </div>
      ) 
    },
    { header: 'Phone', accessor: row => row.phone || '—' },
    { header: 'Plan', accessor: row => row.plan_name || 'Standard Care' },
    { header: 'Employer', accessor: row => row.employer_name || 'Individual' },
    { 
      header: 'Status', 
      accessor: row => <Badge status={row.status || 'active'}>{(row.status || 'active').replace(/_/g, ' ')}</Badge> 
    },
    { 
      header: 'Actions', 
      accessor: row => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => navigate(`/members/${row.id}`)}>View</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/members/${row.id}/edit`)}>Edit</Button>
        </div>
      )
    },
  ];

  return (
    <Layout title="Members" subtitle={`${total.toLocaleString()} total members`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="flex-1 min-w-[200px]">
            <input 
              value={searchInput} 
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search name, member#, phone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <select 
            value={status} 
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </select>
          <select 
            value={employerId} 
            onChange={e => { setEmployerId(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {employers.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
        <Button onClick={() => navigate('/members/new')}>+ Add Member</Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : (
          <Table 
            columns={columns} 
            data={members} 
            emptyMessage="No members found." 
            onRowClick={row => navigate(`/members/${row.id}`)} 
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
