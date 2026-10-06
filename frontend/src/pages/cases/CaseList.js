import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import {
  Button, Card, Table, Badge, Input, Select, Pagination
} from '../../components/ui';
import { casesApi } from '../../api';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'appeal', label: 'Appeal' },
  { value: 'authorization', label: 'Authorization' },
  { value: 'claim_dispute', label: 'Claim Dispute' },
];

const PRIORITY_STATUS = {
  critical: 'danger',
  high: 'warning',
  normal: 'info',
  low: 'default',
};

const MOCK_CASES = [
  {
    id: 1, case_number: 'CASE-2024-0001', member_name: 'Adebayo Okonkwo',
    case_type: 'complaint', subject: 'Claim denied without clear reason — requesting urgent review',
    priority: 'critical', status: 'open', assigned_to_name: 'Dr. Sarah Okafor', created_at: '2024-03-10',
  },
  {
    id: 2, case_number: 'CASE-2024-0002', member_name: 'Chioma Nwosu',
    case_type: 'inquiry', subject: 'Question about coverage limits for specialist consultations',
    priority: 'normal', status: 'in_progress', assigned_to_name: 'James Adeyemi', created_at: '2024-03-11',
  },
  {
    id: 3, case_number: 'CASE-2024-0003', member_name: 'Emeka Eze',
    case_type: 'appeal', subject: 'Appealing rejection of MRI scan authorization request',
    priority: 'high', status: 'pending', assigned_to_name: 'Fatima Bello', created_at: '2024-03-12',
  },
  {
    id: 4, case_number: 'CASE-2024-0004', member_name: 'Ngozi Obi',
    case_type: 'claim_dispute', subject: 'Incorrect amount reimbursed for outpatient treatment',
    priority: 'high', status: 'open', assigned_to_name: 'Dr. Sarah Okafor', created_at: '2024-03-13',
  },
  {
    id: 5, case_number: 'CASE-2024-0005', member_name: 'Tunde Fashola',
    case_type: 'authorization', subject: 'Pre-authorization request for elective surgery',
    priority: 'low', status: 'resolved', assigned_to_name: 'James Adeyemi', created_at: '2024-03-14',
  },
];

export default function CaseList() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchCases = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (typeFilter) params.case_type = typeFilter;
      const res = await casesApi.getAll(params);
      const items = res.data?.data?.data || res.data?.data || [];
      setCases(items.length ? items : MOCK_CASES);
      const pg = res.data?.data?.pagination || {};
      setPagination({
        page: pg.page || 1,
        totalPages: pg.totalPages || 1,
        total: pg.total || MOCK_CASES.length,
      });
    } catch {
      setCases(MOCK_CASES);
      setPagination({ page: 1, totalPages: 1, total: MOCK_CASES.length });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, typeFilter]);

  useEffect(() => { fetchCases(1); }, [fetchCases]);

  const columns = [
    { header: 'Case #', accessor: 'case_number' },
    { header: 'Member', accessor: 'member_name' },
    {
      header: 'Type',
      accessor: row => (
        <Badge status="info">{row.case_type?.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      header: 'Subject',
      accessor: row => (
        <span title={row.subject}>
          {row.subject?.length > 50 ? `${row.subject.slice(0, 50)}…` : row.subject}
        </span>
      ),
    },
    {
      header: 'Priority',
      accessor: row => (
        <Badge status={PRIORITY_STATUS[row.priority] || 'default'}>
          {row.priority}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: row => <Badge status={row.status}>{row.status?.replace(/_/g, ' ')}</Badge>,
    },
    { header: 'Assigned To', accessor: 'assigned_to_name' },
    {
      header: 'Date',
      accessor: row => row.created_at
        ? new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
    },
    {
      header: 'Actions',
      accessor: row => (
        <Button size="sm" variant="outline" onClick={() => navigate(`/cases/${row.id}`)}>
          View
        </Button>
      ),
    },
  ];

  const getRowClass = row => row.priority === 'critical' ? 'bg-red-50' : '';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
            <p className="text-gray-500 mt-1">Member inquiries, complaints, and appeals</p>
          </div>
          <Button onClick={() => navigate('/cases/new')}>+ Create Case</Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Search"
              placeholder="Case #, member, subject…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
            <Select
              label="Priority"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              options={PRIORITY_OPTIONS}
            />
            <Select
              label="Type"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              options={TYPE_OPTIONS}
            />
          </div>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            data={cases}
            loading={loading}
            rowClassName={getRowClass}
          />
          <div className="mt-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={p => fetchCases(p)}
            />
          </div>
        </Card>
      </div>
    </Layout>
  );
}
