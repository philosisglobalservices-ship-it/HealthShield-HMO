import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import {
  Button, Card, Table, Badge, Input, Select, Pagination, LoadingSpinner, EmptyState
} from '../../components/ui';
import { employersApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_EMPLOYERS = [
  {
    id: '1',
    organization_name: 'TechNova Nigeria Ltd',
    code: 'TNN-001',
    industry: 'Technology',
    contact_person: 'Emeka Okafor',
    contact_phone: '08012345678',
    status: 'active',
  },
  {
    id: '2',
    organization_name: 'First Bank Nigeria PLC',
    code: 'FBN-002',
    industry: 'Banking',
    contact_person: 'Amina Bello',
    contact_phone: '08023456789',
    status: 'active',
  },
  {
    id: '3',
    organization_name: 'Dangote Group',
    code: 'DNG-003',
    industry: 'Manufacturing',
    contact_person: 'Chidi Nwosu',
    contact_phone: '08034567890',
    status: 'active',
  },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

export default function EmployerList() {
  const navigate = useNavigate();
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employersApi.getAll({ page, limit, search: search || undefined, status: status || undefined });
      const items = res.data?.data?.data || res.data?.data || [];
      const pagination = res.data?.data?.pagination || {};
      setEmployers(items);
      setTotalPages(pagination.totalPages || 1);
      setTotal(pagination.total || items.length);
    } catch (err) {
      console.error('Using mock employer data:', err);
      const filtered = MOCK_EMPLOYERS.filter(e => {
        const matchSearch = !search || e.organization_name.toLowerCase().includes(search.toLowerCase()) || e.code.toLowerCase().includes(search.toLowerCase());
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
    const t = setTimeout(fetchEmployers, 300);
    return () => clearTimeout(t);
  }, [fetchEmployers]);

  const columns = [
    { header: 'Organization Name', accessor: 'organization_name' },
    { header: 'Code', accessor: 'code' },
    { header: 'Industry', accessor: 'industry' },
    { header: 'Contact Person', accessor: 'contact_person' },
    { header: 'Phone', accessor: 'contact_phone' },
    {
      header: 'Status',
      accessor: row => (
        <Badge status={row.status}>
          {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: row => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/employers/${row.id}`)}>
            View
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/employers/${row.id}/edit`)}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employers</h1>
            <p className="text-sm text-gray-500 mt-1">{total} employer{total !== 1 ? 's' : ''} registered</p>
          </div>
          <Button onClick={() => navigate('/employers/new')}>+ Add Employer</Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or code..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="w-48">
              <Select
                value={status}
                onChange={e => { setStatus(e.target.value); setPage(1); }}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : employers.length === 0 ? (
            <EmptyState
              title="No employers found"
              description="Try adjusting your search or filters, or add a new employer."
              action={<Button onClick={() => navigate('/employers/new')}>Add Employer</Button>}
            />
          ) : (
            <>
              <Table columns={columns} data={employers} />
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
}
