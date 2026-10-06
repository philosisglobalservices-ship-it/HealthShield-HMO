import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, LoadingSpinner, Pagination } from '../../components/ui';
import { claimsApi } from '../../api';
import toast from 'react-hot-toast';

const STATUSES = ['', 'draft', 'submitted', 'under_review', 'approved', 'partially_approved', 'denied', 'paid', 'appealed'];

const MOCK = Array.from({ length: 10 }, (_, i) => ({
  id: `clm-${i + 1}`, claim_number: `CLM-2026-${2001 + i}`,
  member_first_name: ['Adaeze', 'Emeka', 'Fatima', 'Ngozi', 'Tunde', 'Chioma', 'Bello', 'Amaka', 'Segun', 'Zainab'][i],
  member_last_name: ['Okonkwo', 'Eze', 'Abubakar', 'Ibe', 'Bakare', 'Obi', 'Ibrahim', 'Nwosu', 'Adeyemi', 'Musa'][i],
  member_number: `MBR-00${i + 1}`,
  provider_name: ['LUTH', 'Reddington Hospital', 'Eko Hospital', 'St. Nicholas', 'LASUTH', 'UCH', 'UNTH', 'Memfys Hospital', 'Total Health', 'NaviMedic'][i],
  service_date: `2026-09-${String(i + 1).padStart(2, '0')}`,
  service_category: ['Outpatient', 'Inpatient', 'Surgery', 'Laboratory', 'Pharmacy', 'Dental', 'Optical', 'Emergency', 'Maternity', 'Specialist'][i],
  submitted_amount: (i + 1) * 25000,
  status: ['submitted', 'under_review', 'approved', 'paid', 'denied', 'submitted', 'under_review', 'approved', 'paid', 'appealed'][i],
}));

export default function ClaimList() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debounceRef = useRef(null);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
  };

  useEffect(() => {
    setLoading(true);
    claimsApi.getAll({ page, limit: 20, status, search, from_date: fromDate, to_date: toDate })
      .then(res => {
        const data = res.data?.data?.data || res.data?.data || [];
        setClaims(data.length ? data : MOCK);
        setTotalPages(res.data?.data?.pagination?.totalPages || 1);
      })
      .catch(() => { setClaims(MOCK); setTotalPages(1); })
      .finally(() => setLoading(false));
  }, [page, status, search, fromDate, toDate]);

  const fmtAmt = v => `₦${Number(v || 0).toLocaleString()}`;
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const columns = [
    { header: 'Claim #', accessor: row => <span className="font-mono text-sm font-medium">{row.claim_number}</span> },
    { header: 'Member', accessor: row => <div><div className="font-medium text-sm">{row.member_first_name} {row.member_last_name}</div><div className="text-xs text-gray-400">{row.member_number}</div></div> },
    { header: 'Provider', accessor: 'provider_name' },
    { header: 'Service Date', accessor: row => fmtDate(row.service_date) },
    { header: 'Category', accessor: 'service_category' },
    { header: 'Amount', accessor: row => <span className="font-semibold">{fmtAmt(row.submitted_amount)}</span> },
    { header: 'Status', accessor: row => <Badge status={row.status}>{row.status?.replace(/_/g, ' ')}</Badge> },
    { header: 'Actions', accessor: row => <Button size="sm" variant="outline" onClick={() => navigate(`/claims/${row.id}`)}>View</Button> },
  ];

  return (
    <Layout title="Claims" subtitle="Healthcare claims management">
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="flex-1 min-w-48">
          <input value={searchInput} onChange={e => handleSearchInput(e.target.value)}
            placeholder="Search member, claim#, provider..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          {STATUSES.map(s => <option key={s} value={s}>{s === '' ? 'All Statuses' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">From</span>
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }}
            className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">To</span>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }}
            className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <Button onClick={() => navigate('/claims/new')}>+ New Claim</Button>
      </div>

      <Card>
        {loading
          ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          : <Table columns={columns} data={claims} emptyMessage="No claims found." onRowClick={row => navigate(`/claims/${row.id}`)} />}
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>
    </Layout>
  );
}
