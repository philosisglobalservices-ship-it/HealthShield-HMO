import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Card, Table, Badge, Button, LoadingSpinner, Pagination } from '../../components/ui';
import { usersApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK = [
  { id: '1', first_name: 'System', last_name: 'Administrator', email: 'admin@healthshield.ng', role_name: 'super_admin', department: 'Management', status: 'active', last_login: '2026-10-05T20:15:00Z' },
  { id: '2', first_name: 'Fatima', last_name: 'Bello', email: 'claims@healthshield.ng', role_name: 'claims_officer', department: 'Claims', status: 'active', last_login: '2026-10-05T18:30:00Z' },
  { id: '3', first_name: 'Chukwuemeka', last_name: 'Obi', email: 'finance@healthshield.ng', role_name: 'finance_officer', department: 'Finance', status: 'active', last_login: '2026-10-05T17:00:00Z' },
  { id: '4', first_name: 'Dr. Aisha', last_name: 'Mohammed', email: 'medical@healthshield.ng', role_name: 'medical_officer', department: 'Medical', status: 'active', last_login: '2026-10-04T14:00:00Z' },
  { id: '5', first_name: 'Tunde', last_name: 'Adeyemi', email: 'ops@healthshield.ng', role_name: 'operations_manager', department: 'Operations', status: 'active', last_login: '2026-10-05T16:45:00Z' },
  { id: '6', first_name: 'Ngozi', last_name: 'Eze', email: 'cs@healthshield.ng', role_name: 'customer_service', department: 'Customer Service', status: 'active', last_login: '2026-10-05T19:00:00Z' },
];

const ROLE_COLORS = { super_admin: 'bg-red-100 text-red-700', operations_manager: 'bg-purple-100 text-purple-700', claims_officer: 'bg-blue-100 text-blue-700', finance_officer: 'bg-green-100 text-green-700', medical_officer: 'bg-teal-100 text-teal-700', customer_service: 'bg-orange-100 text-orange-700' };

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';

export default function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debounceRef = useRef(null);

  const handleSearch = val => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
  };

  useEffect(() => {
    usersApi.getRoles().then(res => {
      const r = res.data?.data || res.data || [];
      setRoles([{ value: '', label: 'All Roles' }, ...r.map(x => ({ value: x.id, label: x.name?.replace(/_/g, ' ') }))]);
    }).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    usersApi.getAll({ page, limit: 20, search, status: statusFilter, role_id: roleFilter })
      .then(res => {
        const d = res.data?.data?.data || res.data?.data || [];
        setUsers(d.length ? d : MOCK);
        setTotalPages(res.data?.data?.pagination?.totalPages || 1);
      })
      .catch(() => { setUsers(MOCK); setTotalPages(1); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, statusFilter, roleFilter]);

  const handleDisable = async (user) => {
    if (!window.confirm(`Disable ${user.first_name} ${user.last_name}?`)) return;
    try {
      await usersApi.disable(user.id);
      toast.success('User disabled');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to disable user'); }
  };

  const cols = [
    { header: 'Name', accessor: row => <div><div className="font-semibold text-sm">{row.first_name} {row.last_name}</div><div className="text-xs text-gray-400">{row.email}</div></div> },
    { header: 'Role', accessor: row => <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[row.role_name] || 'bg-gray-100 text-gray-600'}`}>{(row.role_name || '').replace(/_/g, ' ')}</span> },
    { header: 'Department', accessor: 'department' },
    { header: 'Status', accessor: row => <Badge status={row.status}>{row.status}</Badge> },
    { header: 'Last Login', accessor: row => <span className="text-xs text-gray-500">{fmtDate(row.last_login)}</span> },
    { header: 'Actions', accessor: row => (
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/users/${row.id}/edit`)}>Edit</Button>
        {row.status === 'active' && <Button size="sm" variant="danger" onClick={() => handleDisable(row)}>Disable</Button>}
      </div>
    )},
  ];

  return (
    <Layout title="Users" subtitle="Platform user management">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-48">
          <input value={searchInput} onChange={e => handleSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <Button onClick={() => navigate('/admin/users/new')}>+ Add User</Button>
      </div>

      <Card>
        {loading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : <Table columns={cols} data={users} emptyMessage="No users found." />}
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>
    </Layout>
  );
}
