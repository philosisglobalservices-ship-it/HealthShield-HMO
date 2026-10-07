import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, LoadingSpinner, Pagination } from '../../components/ui';
import { providersApi } from '../../api';

const MOCK_PROVIDERS = [
  {
    id: 'p1',
    name: 'Lagos University Teaching Hospital',
    provider_type: 'hospital',
    tier: 'Tier 1',
    city: 'Surulere',
    state: 'Lagos',
    phone: '+234-1-8765432',
    total_claims: 428,
    status: 'active',
  },
  {
    id: 'p2',
    name: 'Reddington Hospital',
    provider_type: 'hospital',
    tier: 'Tier 1',
    city: 'Victoria Island',
    state: 'Lagos',
    phone: '+234-1-2715340',
    total_claims: 215,
    status: 'active',
  },
  {
    id: 'p3',
    name: 'HealthPlus Pharmacy',
    provider_type: 'pharmacy',
    tier: 'Tier 2',
    city: 'Yaba',
    state: 'Lagos',
    phone: '+234-809-1234567',
    total_claims: 892,
    status: 'active',
  },
  {
    id: 'p4',
    name: 'MedView Diagnostics Lab',
    provider_type: 'laboratory',
    tier: 'Tier 3',
    city: 'Ikeja',
    state: 'Lagos',
    phone: '+234-1-4970000',
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

export default function ProviderList() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState(MOCK_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [providerType, setProviderType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(MOCK_PROVIDERS.length);
  const debounceRef = useRef(null);

  const handleSearch = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
  };

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await providersApi.getAll({
        page,
        limit: 20,
        search: search || undefined,
        provider_type: providerType || undefined,
        status: status || undefined,
      });
      const items = res.data?.data?.data || res.data?.data || [];
      const pagination = res.data?.pagination || res.data?.data?.pagination || {};
      
      if (items && items.length > 0) {
        setProviders(items);
        setTotalPages(pagination.totalPages || 1);
        setTotal(pagination.total || items.length);
      } else {
        const filtered = MOCK_PROVIDERS.filter(p => {
          const matchSearch = !search || 
            (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.city || '').toLowerCase().includes(search.toLowerCase());
          const matchType = !providerType || (p.provider_type || '').toLowerCase() === providerType.toLowerCase();
          const matchStatus = !status || (p.status || '').toLowerCase() === status.toLowerCase();
          return matchSearch && matchType && matchStatus;
        });
        setProviders(filtered);
        setTotalPages(1);
        setTotal(filtered.length);
      }
    } catch (err) {
      const filtered = MOCK_PROVIDERS.filter(p => {
        const matchSearch = !search || 
          (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (p.city || '').toLowerCase().includes(search.toLowerCase());
        const matchType = !providerType || (p.provider_type || '').toLowerCase() === providerType.toLowerCase();
        const matchStatus = !status || (p.status || '').toLowerCase() === status.toLowerCase();
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
    fetchProviders();
  }, [fetchProviders]);

  const columns = [
    { 
      header: 'Provider Name', 
      accessor: row => (
        <div>
          <div className="font-semibold text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-400">{row.email || row.phone || ''}</div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: row => {
        const t = (row.provider_type || 'hospital').toLowerCase();
        return (
          <Badge status={t === 'hospital' ? 'active' : t === 'pharmacy' ? 'info' : t === 'laboratory' ? 'warning' : 'pending'}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Badge>
        );
      },
    },
    {
      header: 'Tier',
      accessor: row => {
        const tStr = String(row.tier || '1');
        const badgeStatus = tStr.includes('1') ? 'active' : tStr.includes('2') ? 'pending' : 'warning';
        return <Badge status={badgeStatus}>{tStr.startsWith('Tier') ? tStr : `Tier ${tStr}`}</Badge>;
      },
    },
    {
      header: 'City / State',
      accessor: row => `${row.city || ''}${row.city && row.state ? ', ' : ''}${row.state || 'Lagos'}`,
    },
    {
      header: 'Total Claims',
      accessor: row => <span className="font-medium text-gray-700">{(Number(row.total_claims) || 0).toLocaleString()}</span>,
    },
    {
      header: 'Status',
      accessor: row => (
        <Badge status={row.status || 'active'}>
          {(row.status || 'active').charAt(0).toUpperCase() + (row.status || 'active').slice(1)}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: row => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
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
    <Layout title="Healthcare Providers" subtitle={`${total.toLocaleString()} empaneled hospitals, clinics & pharmacies`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="flex-1 min-w-[200px]">
            <input 
              value={searchInput} 
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search provider name, city..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <select 
            value={providerType} 
            onChange={e => { setProviderType(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select 
            value={status} 
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <Button onClick={() => navigate('/providers/new')}>+ Add Provider</Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : (
          <Table 
            columns={columns} 
            data={providers} 
            emptyMessage="No healthcare providers found." 
            onRowClick={row => navigate(`/providers/${row.id}`)} 
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
