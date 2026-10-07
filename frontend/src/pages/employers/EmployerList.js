import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, LoadingSpinner, Pagination } from '../../components/ui';
import { employersApi } from '../../api';

const MOCK_EMPLOYERS = [
  {
    id: '1',
    organization_name: 'TechNova Nigeria Ltd',
    name: 'TechNova Nigeria Ltd',
    code: 'TNN-001',
    industry: 'Technology',
    contact_person: 'Emeka Okafor',
    contact_phone: '08012345678',
    employee_count: 350,
    status: 'active',
  },
  {
    id: '2',
    organization_name: 'First Bank Nigeria PLC',
    name: 'First Bank Nigeria PLC',
    code: 'FBN-002',
    industry: 'Banking',
    contact_person: 'Amina Bello',
    contact_phone: '08023456789',
    employee_count: 5000,
    status: 'active',
  },
  {
    id: '3',
    organization_name: 'Dangote Group',
    name: 'Dangote Group',
    code: 'DNG-003',
    industry: 'Manufacturing',
    contact_person: 'Chidi Nwosu',
    contact_phone: '08034567890',
    employee_count: 12000,
    status: 'active',
  },
];

export default function EmployerList() {
  const navigate = useNavigate();
  const [employers, setEmployers] = useState(MOCK_EMPLOYERS);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(MOCK_EMPLOYERS.length);
  const debounceRef = useRef(null);

  const handleSearch = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
  };

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employersApi.getAll({ 
        page, 
        limit: 20, 
        search: search || undefined, 
        status: status || undefined 
      });
      const items = res.data?.data?.data || res.data?.data || [];
      const pagination = res.data?.pagination || res.data?.data?.pagination || {};
      
      if (items && items.length > 0) {
        setEmployers(items);
        setTotalPages(pagination.totalPages || 1);
        setTotal(pagination.total || items.length);
      } else {
        const filtered = MOCK_EMPLOYERS.filter(e => {
          const matchSearch = !search || 
            (e.organization_name || e.name || '').toLowerCase().includes(search.toLowerCase()) || 
            (e.code || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.contact_person || '').toLowerCase().includes(search.toLowerCase());
          const matchStatus = !status || e.status === status;
          return matchSearch && matchStatus;
        });
        setEmployers(filtered);
        setTotalPages(1);
        setTotal(filtered.length);
      }
    } catch (err) {
      const filtered = MOCK_EMPLOYERS.filter(e => {
        const matchSearch = !search || 
          (e.organization_name || e.name || '').toLowerCase().includes(search.toLowerCase()) || 
          (e.code || '').toLowerCase().includes(search.toLowerCase()) ||
          (e.contact_person || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = !status || e.status === status;
        return matchSearch && matchStatus;
      });
      setEmployers(filtered);
      setTotalPages(1);
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  const columns = [
    { 
      header: 'Organization Name', 
      accessor: row => (
        <div>
          <div className="font-semibold text-gray-900">{row.organization_name || row.name || '—'}</div>
          <div className="text-xs text-gray-400">{row.email || ''}</div>
        </div>
      )
    },
    { 
      header: 'Code', 
      accessor: row => <span className="font-mono text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{row.code || '—'}</span> 
    },
    { header: 'Industry', accessor: row => row.industry || 'Corporate' },
    { header: 'Contact Person', accessor: row => row.contact_person || '—' },
    { header: 'Phone', accessor: row => row.contact_phone || row.phone || '—' },
    { 
      header: 'Status', 
      accessor: row => (
        <Badge status={row.status || 'active'}>
          {(row.status || 'active').charAt(0).toUpperCase() + (row.status || 'active').slice(1)}
        </Badge>
      ) 
    },
    { 
      header: 'Actions', 
      accessor: row => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => navigate(`/employers/${row.id || row.organization_id}`)}>View</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/employers/${row.id || row.organization_id}/edit`)}>Edit</Button>
        </div>
      ) 
    },
  ];

  return (
    <Layout title="Employers" subtitle={`${total.toLocaleString()} registered corporate employers`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="flex-1 min-w-[200px]">
            <input 
              value={searchInput} 
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search company name, code, contact..."
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
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <Button onClick={() => navigate('/employers/new')}>+ Add Employer</Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : (
          <Table 
            columns={columns} 
            data={employers} 
            emptyMessage="No employers found." 
            onRowClick={row => navigate(`/employers/${row.id || row.organization_id}`)} 
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
