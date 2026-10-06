import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import {
  Button, Card, Table, Badge, Input, Select, Pagination, LoadingSpinner, EmptyState
} from '../../components/ui';
import { providersApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_PROVIDERS = [
  {
    id: 'p1',
    name: 'Lagos University Teaching Hospital',
    provider_type: 'hospital',
    tier: 1,
    city: 'Lagos',
    state: 'Lagos',
    total_claims: 428,
    status: 'active',
  },
  {
    id: 'p2',
    name: 'Reddington Hospital',
    provider_type: 'hospital',
    tier: 2,
    city: 'Victoria Island',
    state: 'Lagos',
    total_claims: 215,
    status: 'active',
  },
  {
    id: 'p3',
    name: 'HealthPlus Pharmacy',
    provider_type: 'pharmacy',
    tier: 2,
    city: 'Ikeja',
    state: 'Lagos',
    total_claims: 892,
    status: 'active',
  },
  {
    id: 'p4',
    name: 'MedView Diagnostics Lab',
    provider_type: 'laboratory',
    tier: 2,
    city: 'Abuja',
    state: 'FCT',
    total_claims: 143,
    status: 'active',
  },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'dental', label: 'Dental' },
  { value: 'optical', label: 'Optical' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const TYPE_BADGE_MAP = {
  hospital: 'active',
  clinic: 'pending',
  pharmacy: 'info',
  laboratory: 'warning',
  specialist: 'active',
  dental: 'info',
  optical: 'pending',
};

const TIER_LABEL = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

export default function ProviderList() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [providerType, setProviderType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await providersApi.getAll({
        page,
        limit,
        search: search || undefined,
        provider_type: providerType || undefined,
        status: status || undefined,
      });
      const items = res.data?.data?.data || res.data?.data || [];
      const pagination = res.data?.data?.pagination || {};
      setProviders(items);
      setTotalPages(pagination.totalPages || 1);
      setTotal(pagination.total || items.length);
    } catch (err) {
      console.error('Using mock provider data:', err);
      const filtered = MOCK_PROVIDERS.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const matchType = !providerType || p.provider_type === providerType;
        const matchStatus = !status || p.status === status;
        return matchSearch && matchType && matchStatus;
      });
      setProviders(filtered);
      setTotalPages(1);
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, search, providerType, status]);

  useEffect(() => {
    const t = setTimeout(fetchProviders, 300);
    return () => clearTimeout(t);
  }, [fetchProviders]);

  const columns = [
    { header: 'Name', accessor: 'name' },
    {
      header: 'Type',
      accessor: row => (
        <Badge status={TYPE_BADGE_MAP[row.provider_type] || 'pending'}>
          {row.provider_type?.charAt(0).toUpperCase() + row.provider_type?.slice(1)}
        </Badge>
      ),
    },
    {
      header: 'Tier',
      accessor: row => (
        <Badge status={row.tier === 1 ? 'active' : row.tier === 2 ? 'pending' : 'warning'}>
          {TIER_LABEL[row.tier] || `Tier ${row.tier}`}
        </Badge>
      ),
    },
    {
      header: 'City / State',
      accessor: row => `${row.city || ''}${row.city && row.state ? ', ' : ''}${row.state || ''}`,
    },
    {
      header: 'Total Claims',
      accessor: row => (row.total_claims ?? 0).toLocaleString(),
    },
    {
      header: 'Status',
      accessor: row => (
        <Badge status={row.status}>{row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}</Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: row => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/providers/${row.id}`)}>
            View
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/providers/${row.id}/edit`)}>
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
            <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
            <p className="text-sm text-gray-500 mt-1">{total} provider{total !== 1 ? 's' : ''} registered</p>
          </div>
          <Button onClick={() => navigate('/providers/new')}>+ Add Provider</Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by provider name..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="w-44">
              <Select
                value={providerType}
                onChange={e => { setProviderType(e.target.value); setPage(1); }}
                options={TYPE_OPTIONS}
              />
            </div>
            <div className="w-44">
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
          ) : providers.length === 0 ? (
            <EmptyState
              title="No providers found"
              description="Try adjusting your filters, or add a new provider."
              action={<Button onClick={() => navigate('/providers/new')}>Add Provider</Button>}
            />
          ) : (
            <>
              <Table columns={columns} data={providers} />
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
