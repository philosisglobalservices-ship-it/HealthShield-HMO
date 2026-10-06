import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Input, Select, Pagination, LoadingSpinner } from '../../components/ui';

const mockAuths = Array.from({ length: 8 }, (_, i) => ({
  id: `AUTH-2026-${1000 + i}`,
  reference: `REF-${2000 + i}`,
  member: `Member ${i + 1}`,
  provider: `Provider ${i % 3 + 1}`,
  serviceCategory: i % 2 === 0 ? 'Surgery' : 'Inpatient',
  urgency: ['Routine', 'Urgent', 'Emergency'][i % 3],
  status: ['Pending', 'Approved', 'Denied'][i % 3],
  requestedAmount: (i + 1) * 50000,
  date: `2026-10-${(i + 1).toString().padStart(2, '0')}`
}));

export default function AuthorizationList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [auths, setAuths] = useState([]);
  
  const [filters, setFilters] = useState({ search: '', status: '', urgency: '' });

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setAuths(mockAuths);
      setLoading(false);
    }, 500);
  }, [filters]);

  const columns = [
    { header: 'Ref #', accessor: 'reference' },
    { header: 'Member', accessor: 'member' },
    { header: 'Provider', accessor: 'provider' },
    { header: 'Category', accessor: 'serviceCategory' },
    { header: 'Urgency', accessor: (row) => <Badge status={row.urgency.toLowerCase()}>{row.urgency}</Badge> },
    { header: 'Status', accessor: (row) => <Badge status={row.status.toLowerCase()}>{row.status}</Badge> },
    { header: 'Amount', accessor: (row) => `₦${Number(row.requestedAmount).toLocaleString()}` },
    { header: 'Date', accessor: 'date' },
    { 
      header: 'Actions', 
      accessor: (row) => (
        <Button variant="outline" size="sm" onClick={() => navigate(`/authorizations/${row.id}`)}>View</Button>
      ) 
    }
  ];

  return (
    <Layout title="Authorizations">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input 
            placeholder="Search member or ref..." 
            value={filters.search} 
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))} 
          />
          <Select 
            value={filters.status} 
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Denied', label: 'Denied' }
            ]} 
          />
          <Select 
            value={filters.urgency} 
            onChange={e => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
            options={[
              { value: '', label: 'All Urgencies' },
              { value: 'Routine', label: 'Routine' },
              { value: 'Urgent', label: 'Urgent' },
              { value: 'Emergency', label: 'Emergency' }
            ]} 
          />
        </div>
        <Button onClick={() => navigate('/authorizations/new')}>Add Authorization</Button>
      </div>

      <Card>
        {loading ? <div className="p-8"><LoadingSpinner /></div> : <Table columns={columns} data={auths} />}
      </Card>
      <div className="mt-4">
        <Pagination currentPage={1} totalPages={3} onPageChange={() => {}} />
      </div>
    </Layout>
  );
}
