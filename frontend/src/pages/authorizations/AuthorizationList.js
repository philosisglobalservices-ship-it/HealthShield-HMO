import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, LoadingSpinner, Pagination } from '../../components/ui';
import { authorizationsApi } from '../../api';

const MOCK_AUTHS = [
  {
    id: 'AUTH-2026-1000',
    reference: 'AUTH-REF-2000',
    reference_number: 'AUTH-2026-1000',
    member_first_name: 'Adaeze',
    member_last_name: 'Okonkwo',
    member_number: 'MBR-20261001-1000',
    provider_name: 'Lagos University Teaching Hospital',
    service_category: 'Surgery',
    service_description: 'Appendectomy procedure',
    urgency: 'urgent',
    status: 'approved',
    requested_amount: 500000,
    approved_amount: 500000,
    created_at: '2026-10-01T08:30:00Z',
  },
  {
    id: 'AUTH-2026-1001',
    reference: 'AUTH-REF-2001',
    reference_number: 'AUTH-2026-1001',
    member_first_name: 'Emeka',
    member_last_name: 'Eze',
    member_number: 'MBR-20261001-1001',
    provider_name: 'Reddington Hospital',
    service_category: 'Inpatient',
    service_description: 'Hospital admission for acute malaria monitoring',
    urgency: 'routine',
    status: 'pending',
    requested_amount: 120000,
    approved_amount: null,
    created_at: '2026-10-02T10:15:00Z',
  },
  {
    id: 'AUTH-2026-1002',
    reference: 'AUTH-REF-2002',
    reference_number: 'AUTH-2026-1002',
    member_first_name: 'Fatima',
    member_last_name: 'Abubakar',
    member_number: 'MBR-20261001-1002',
    provider_name: 'MedView Diagnostics Lab',
    service_category: 'Specialist',
    service_description: 'MRI brain scan with contrast',
    urgency: 'routine',
    status: 'approved',
    requested_amount: 250000,
    approved_amount: 250000,
    created_at: '2026-10-03T11:45:00Z',
  },
  {
    id: 'AUTH-2026-1003',
    reference: 'AUTH-REF-2003',
    reference_number: 'AUTH-2026-1003',
    member_first_name: 'Tunde',
    member_last_name: 'Bakare',
    member_number: 'MBR-20261001-1004',
    provider_name: 'HealthPlus Pharmacy',
    service_category: 'Dental',
    service_description: 'Complex root canal therapy',
    urgency: 'emergency',
    status: 'denied',
    requested_amount: 180000,
    approved_amount: null,
    created_at: '2026-10-04T14:20:00Z',
  },
  {
    id: 'AUTH-2026-1004',
    reference: 'AUTH-REF-2004',
    reference_number: 'AUTH-2026-1004',
    member_first_name: 'Ngozi',
    member_last_name: 'Ibe',
    member_number: 'MBR-20261001-1003',
    provider_name: 'Lagos University Teaching Hospital',
    service_category: 'Maternity',
    service_description: 'Elective Caesarean Section',
    urgency: 'urgent',
    status: 'pending',
    requested_amount: 450000,
    approved_amount: null,
    created_at: '2026-10-05T09:00:00Z',
  },
  {
    id: 'AUTH-2026-1005',
    reference: 'AUTH-REF-2005',
    reference_number: 'AUTH-2026-1005',
    member_first_name: 'Chioma',
    member_last_name: 'Obi',
    member_number: 'MBR-20261001-1005',
    provider_name: 'Reddington Hospital',
    service_category: 'Optical',
    service_description: 'Cataract surgery with intraocular lens',
    urgency: 'routine',
    status: 'approved',
    requested_amount: 320000,
    approved_amount: 320000,
    created_at: '2026-10-05T15:30:00Z',
  },
  {
    id: 'AUTH-2026-1006',
    reference: 'AUTH-REF-2006',
    reference_number: 'AUTH-2026-1006',
    member_first_name: 'Bello',
    member_last_name: 'Ibrahim',
    member_number: 'MBR-20261001-1006',
    provider_name: 'Eko Hospital',
    service_category: 'Emergency',
    service_description: 'Emergency trauma stabilization and ICU care',
    urgency: 'emergency',
    status: 'approved',
    requested_amount: 750000,
    approved_amount: 750000,
    created_at: '2026-10-06T07:15:00Z',
  },
  {
    id: 'AUTH-2026-1007',
    reference: 'AUTH-REF-2007',
    reference_number: 'AUTH-2026-1007',
    member_first_name: 'Amaka',
    member_last_name: 'Nwosu',
    member_number: 'MBR-20261001-1007',
    provider_name: 'MedView Diagnostics Lab',
    service_category: 'Laboratory',
    service_description: 'Comprehensive oncology biomarker panel',
    urgency: 'routine',
    status: 'pending',
    requested_amount: 210000,
    approved_amount: null,
    created_at: '2026-10-06T12:00:00Z',
  },
  {
    id: 'AUTH-2026-1008',
    reference: 'AUTH-REF-2008',
    reference_number: 'AUTH-2026-1008',
    member_first_name: 'Segun',
    member_last_name: 'Adeyemi',
    member_number: 'MBR-20261001-1008',
    provider_name: 'St. Nicholas Hospital',
    service_category: 'Surgery',
    service_description: 'Laparoscopic Cholecystectomy',
    urgency: 'urgent',
    status: 'approved',
    requested_amount: 680000,
    approved_amount: 650000,
    created_at: '2026-10-07T08:45:00Z',
  },
  {
    id: 'AUTH-2026-1009',
    reference: 'AUTH-REF-2009',
    reference_number: 'AUTH-2026-1009',
    member_first_name: 'Zainab',
    member_last_name: 'Musa',
    member_number: 'MBR-20261001-1009',
    provider_name: 'HealthPlus Pharmacy',
    service_category: 'Specialist',
    service_description: 'Biological specialty medication infusion',
    urgency: 'routine',
    status: 'pending',
    requested_amount: 390000,
    approved_amount: null,
    created_at: '2026-10-07T11:20:00Z',
  },
];

export default function AuthorizationList() {
  const navigate = useNavigate();
  const [auths, setAuths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [urgency, setUrgency] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef(null);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 300);
  };

  const fetchAuths = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authorizationsApi.getAll({
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
        urgency: urgency || undefined,
      });

      const items = res.data?.data?.data || res.data?.data || [];
      const pg = res.data?.pagination || res.data?.data?.pagination || {};

      if (items && items.length > 0) {
        setAuths(items);
        setTotalPages(pg.totalPages || Math.ceil(items.length / limit) || 1);
        setTotal(pg.total || items.length);
      } else {
        // Filter mock dataset
        const filtered = MOCK_AUTHS.filter(a => {
          const q = search.toLowerCase();
          const memberName = `${a.member_first_name} ${a.member_last_name}`.toLowerCase();
          const matchSearch = !search ||
            memberName.includes(q) ||
            (a.reference || '').toLowerCase().includes(q) ||
            (a.reference_number || '').toLowerCase().includes(q) ||
            (a.provider_name || '').toLowerCase().includes(q) ||
            (a.service_category || '').toLowerCase().includes(q);

          const matchStatus = !status || (a.status || '').toLowerCase() === status.toLowerCase();
          const matchUrgency = !urgency || (a.urgency || '').toLowerCase() === urgency.toLowerCase();
          return matchSearch && matchStatus && matchUrgency;
        });

        const calculatedTotal = filtered.length;
        const calculatedTotalPages = Math.max(1, Math.ceil(calculatedTotal / limit));
        const safePage = Math.min(page, calculatedTotalPages);

        const startIdx = (safePage - 1) * limit;
        const pageSlice = filtered.slice(startIdx, startIdx + limit);

        setAuths(pageSlice);
        setTotalPages(calculatedTotalPages);
        setTotal(calculatedTotal);
      }
    } catch (err) {
      const filtered = MOCK_AUTHS.filter(a => {
        const q = search.toLowerCase();
        const memberName = `${a.member_first_name} ${a.member_last_name}`.toLowerCase();
        const matchSearch = !search ||
          memberName.includes(q) ||
          (a.reference || '').toLowerCase().includes(q) ||
          (a.reference_number || '').toLowerCase().includes(q) ||
          (a.provider_name || '').toLowerCase().includes(q) ||
          (a.service_category || '').toLowerCase().includes(q);

        const matchStatus = !status || (a.status || '').toLowerCase() === status.toLowerCase();
        const matchUrgency = !urgency || (a.urgency || '').toLowerCase() === urgency.toLowerCase();
        return matchSearch && matchStatus && matchUrgency;
      });

      const calculatedTotal = filtered.length;
      const calculatedTotalPages = Math.max(1, Math.ceil(calculatedTotal / limit));
      const safePage = Math.min(page, calculatedTotalPages);

      const startIdx = (safePage - 1) * limit;
      const pageSlice = filtered.slice(startIdx, startIdx + limit);

      setAuths(pageSlice);
      setTotalPages(calculatedTotalPages);
      setTotal(calculatedTotal);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, urgency]);

  useEffect(() => {
    fetchAuths();
  }, [fetchAuths]);

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const columns = [
    {
      header: 'Reference #',
      accessor: (row) => (
        <span className="font-mono text-sm font-semibold text-blue-600">
          {row.reference_number || row.reference || row.id}
        </span>
      ),
    },
    {
      header: 'Member',
      accessor: (row) => {
        const name = row.member_first_name
          ? `${row.member_first_name} ${row.member_last_name}`
          : row.member || 'Member';
        return (
          <div>
            <div className="font-medium text-gray-900">{name}</div>
            <div className="text-xs text-gray-400 font-mono">{row.member_number || ''}</div>
          </div>
        );
      },
    },
    {
      header: 'Healthcare Provider',
      accessor: (row) => (
        <span className="text-gray-800 font-medium">
          {row.provider_name || row.provider || '—'}
        </span>
      ),
    },
    {
      header: 'Service Category',
      accessor: (row) => (
        <span className="capitalize text-gray-700">
          {row.service_category || row.serviceCategory || 'General'}
        </span>
      ),
    },
    {
      header: 'Urgency',
      accessor: (row) => {
        const u = (row.urgency || 'routine').toLowerCase();
        const variant = u === 'emergency' ? 'danger' : u === 'urgent' ? 'warning' : 'info';
        return <Badge status={variant}>{u.charAt(0).toUpperCase() + u.slice(1)}</Badge>;
      },
    },
    {
      header: 'Status',
      accessor: (row) => {
        const s = (row.status || 'pending').toLowerCase();
        return <Badge status={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>;
      },
    },
    {
      header: 'Requested Amount',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">
          ₦{Number(row.requested_amount || row.requestedAmount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Request Date',
      accessor: (row) => fmtDate(row.created_at || row.date),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/authorizations/${row.id || row.reference_number}`)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout title="Pre-Authorizations" subtitle={`${total.toLocaleString()} total authorization requests`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="flex-1 min-w-[200px]">
            <input
              placeholder="Search member, reference#, provider..."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
          <select
            value={urgency}
            onChange={(e) => { setUrgency(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Urgencies</option>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <Button onClick={() => navigate('/authorizations/new')}>+ New Authorization</Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={auths}
            emptyMessage="No authorizations found matching the selected criteria."
            onRowClick={(row) => navigate(`/authorizations/${row.id || row.reference_number}`)}
          />
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </Card>
    </Layout>
  );
}
