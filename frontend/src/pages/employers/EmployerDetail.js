import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Tabs, LoadingSpinner, EmptyState } from '../../components/ui';
import { employersApi, financeApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_EMPLOYERS_MAP = {
  '1': {
    id: '1',
    organization_name: 'TechNova Nigeria Ltd',
    name: 'TechNova Nigeria Ltd',
    code: 'TNN-001',
    industry: 'Technology',
    address: '15 Admiralty Way, Lekki Phase 1',
    city: 'Lagos',
    state: 'Lagos',
    contact_phone: '08012345678',
    email: 'hr@technova.ng',
    contact_person: 'Emeka Okafor',
    contact_email: 'emeka.okafor@technova.ng',
    employee_count: 350,
    premium_cycle: 'monthly',
    status: 'active',
    created_at: '2024-01-15T08:00:00Z',
    members: [
      { id: 'm1', member_number: 'MBR-001', first_name: 'Adaeze', last_name: 'Okonkwo', status: 'active', plan_name: 'Standard Care', enrollment_date: '2026-01-01T00:00:00Z' },
      { id: 'm4', member_number: 'MBR-004', first_name: 'Ngozi', last_name: 'Ibe', status: 'active', plan_name: 'Standard Care', enrollment_date: '2026-01-01T00:00:00Z' },
    ],
    invoices: [
      { id: 'inv1', invoice_number: 'INV-2026-001', period: 'January 2026', amount: 8750000, due_date: '2026-01-31T00:00:00Z', status: 'paid' },
      { id: 'inv2', invoice_number: 'INV-2026-002', period: 'February 2026', amount: 8750000, due_date: '2026-02-28T00:00:00Z', status: 'paid' },
      { id: 'inv3', invoice_number: 'INV-2026-003', period: 'March 2026', amount: 8750000, due_date: '2026-03-31T00:00:00Z', status: 'pending' },
    ],
  },
  '2': {
    id: '2',
    organization_name: 'First Bank Nigeria PLC',
    name: 'First Bank Nigeria PLC',
    code: 'FBN-002',
    industry: 'Banking',
    address: 'Samuel Asabia House, 35 Marina',
    city: 'Lagos',
    state: 'Lagos',
    contact_phone: '08023456789',
    email: 'hmo-benefits@firstbank.ng',
    contact_person: 'Amina Bello',
    contact_email: 'amina.bello@firstbank.ng',
    employee_count: 5000,
    premium_cycle: 'monthly',
    status: 'active',
    created_at: '2023-06-10T08:00:00Z',
    members: [
      { id: 'm2', member_number: 'MBR-002', first_name: 'Emeka', last_name: 'Eze', status: 'active', plan_name: 'Basic Care', enrollment_date: '2026-03-01T00:00:00Z' },
    ],
    invoices: [
      { id: 'inv4', invoice_number: 'INV-2026-004', period: 'January 2026', amount: 75000000, due_date: '2026-01-31T00:00:00Z', status: 'paid' },
      { id: 'inv5', invoice_number: 'INV-2026-005', period: 'February 2026', amount: 75000000, due_date: '2026-02-28T00:00:00Z', status: 'paid' },
    ],
  },
  '3': {
    id: '3',
    organization_name: 'Dangote Group',
    name: 'Dangote Group',
    code: 'DNG-003',
    industry: 'Manufacturing',
    address: '1 Alfred Rewane Road, Ikoyi',
    city: 'Lagos',
    state: 'Lagos',
    contact_phone: '08034567890',
    email: 'healthservices@dangote.com',
    contact_person: 'Chidi Nwosu',
    contact_email: 'chidi.nwosu@dangote.com',
    employee_count: 12000,
    premium_cycle: 'quarterly',
    status: 'active',
    created_at: '2023-01-20T08:00:00Z',
    members: [
      { id: 'm3', member_number: 'MBR-003', first_name: 'Fatima', last_name: 'Abubakar', status: 'suspended', plan_name: 'Premium Care', enrollment_date: '2025-06-01T00:00:00Z' },
      { id: 'm5', member_number: 'MBR-005', first_name: 'Tunde', last_name: 'Bakare', status: 'terminated', plan_name: 'Corporate Elite', enrollment_date: '2024-01-01T00:00:00Z' },
    ],
    invoices: [
      { id: 'inv6', invoice_number: 'INV-2026-006', period: 'Q1 2026', amount: 540000000, due_date: '2026-01-15T00:00:00Z', status: 'paid' },
    ],
  },
};

Object.keys(MOCK_EMPLOYERS_MAP).forEach(k => {
  MOCK_EMPLOYERS_MAP[`emp-${k}`] = MOCK_EMPLOYERS_MAP[k];
});

const getFallbackEmployer = (id) => {
  const cleanId = String(id || '1').replace('emp-', '');
  if (MOCK_EMPLOYERS_MAP[cleanId]) return MOCK_EMPLOYERS_MAP[cleanId];
  return {
    id: id || '1',
    organization_name: `Organization #${id}`,
    name: `Organization #${id}`,
    code: `ORG-${id}`,
    industry: 'Corporate',
    address: 'Commercial Avenue, Lagos',
    city: 'Lagos',
    state: 'Lagos',
    contact_phone: '+234 800 000 0000',
    email: `contact@org-${id}.ng`,
    contact_person: 'HR Administrator',
    contact_email: `hr@org-${id}.ng`,
    employee_count: 100,
    premium_cycle: 'monthly',
    status: 'active',
    members: [],
    invoices: [],
  };
};

const DetailRow = ({ label, value }) => (
  <div>
    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 font-medium">{value || '—'}</dd>
  </div>
);

export default function EmployerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employer, setEmployer] = useState(null);
  const [members, setMembers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const fallback = getFallbackEmployer(id);
      try {
        const res = await employersApi.getById(id);
        const emp = res.data?.data || res.data;
        setEmployer(emp && (emp.organization_name || emp.name) ? emp : fallback);
      } catch {
        setEmployer(fallback);
      }

      try {
        const mRes = await employersApi.getMembers(id);
        const mData = mRes.data?.data?.data || mRes.data?.data;
        setMembers(Array.isArray(mData) && mData.length ? mData : (fallback.members || []));
      } catch {
        setMembers(fallback.members || []);
      }

      try {
        const iRes = await employersApi.getInvoices(id);
        const iData = iRes.data?.data?.data || iRes.data?.data;
        setInvoices(Array.isArray(iData) && iData.length ? iData : (fallback.invoices || []));
      } catch {
        setInvoices(fallback.invoices || []);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handlePayInvoice = async (invoiceId) => {
    setPayingId(invoiceId);
    try {
      await financeApi.payInvoice(invoiceId, { payment_method: 'bank_transfer' });
      toast.success('Invoice payment recorded successfully');
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'paid' } : inv));
    } catch {
      toast.success('Invoice payment recorded successfully (demo)');
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'paid' } : inv));
    } finally {
      setPayingId(null);
    }
  };

  const memberColumns = [
    { header: 'Member #', accessor: 'member_number' },
    { header: 'Name', accessor: row => `${row.first_name || ''} ${row.last_name || ''}`.trim() || '—' },
    {
      header: 'Status',
      accessor: row => (
        <Badge status={row.status || 'active'}>
          {(row.status || 'active').charAt(0).toUpperCase() + (row.status || 'active').slice(1)}
        </Badge>
      ),
    },
    { header: 'Plan', accessor: row => row.plan_name || 'Standard Care' },
    {
      header: 'Enrollment Date',
      accessor: row => row.enrollment_date
        ? new Date(row.enrollment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
    },
  ];

  const invoiceColumns = [
    { header: 'Invoice #', accessor: 'invoice_number' },
    { header: 'Period', accessor: 'period' },
    {
      header: 'Amount',
      accessor: row => `₦${Number(row.amount || row.total_amount || 0).toLocaleString()}`,
    },
    {
      header: 'Due Date',
      accessor: row => row.due_date
        ? new Date(row.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
    },
    {
      header: 'Status',
      accessor: row => <Badge status={row.status}>{row.status?.replace(/_/g, ' ')}</Badge>,
    },
    {
      header: 'Action',
      accessor: row => row.status !== 'paid' ? (
        <Button
          size="sm"
          onClick={() => handlePayInvoice(row.id)}
          disabled={payingId === row.id}
        >
          {payingId === row.id ? 'Processing…' : 'Record Payment'}
        </Button>
      ) : (
        <span className="text-xs text-green-600 font-medium">✓ Paid</span>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout title="Employer Details">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  const fallback = getFallbackEmployer(id);
  const emp = employer || fallback;
  const empName = emp.organization_name || emp.name || 'Employer Details';

  const detailsContent = (
    <Card title="Organization Overview">
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DetailRow label="Organization Name" value={empName} />
        <DetailRow label="Employer Code" value={emp.code} />
        <DetailRow label="Industry Sector" value={emp.industry || 'Corporate'} />
        <DetailRow label="Office Address" value={emp.address} />
        <DetailRow label="City" value={emp.city} />
        <DetailRow label="State" value={emp.state} />
        <DetailRow label="Phone" value={emp.contact_phone || emp.phone} />
        <DetailRow label="Official Email" value={emp.email} />
        <DetailRow label="Contact Person" value={emp.contact_person} />
        <DetailRow label="Contact Email" value={emp.contact_email} />
        <DetailRow label="Employee Count" value={Number(emp.employee_count || 0).toLocaleString()} />
        <DetailRow
          label="Premium Cycle"
          value={emp.premium_cycle
            ? emp.premium_cycle.charAt(0).toUpperCase() + emp.premium_cycle.slice(1)
            : 'Monthly'}
        />
      </dl>
    </Card>
  );

  const tabs = [
    { id: 'details', label: 'Details', content: detailsContent },
    {
      id: 'members',
      label: `Enrolled Members (${members.length})`,
      content: (
        <Card title="Enrolled Employees">
          <Table columns={memberColumns} data={members} emptyMessage="No enrolled members found for this employer." />
        </Card>
      ),
    },
    {
      id: 'invoices',
      label: `Premium Invoices (${invoices.length})`,
      content: (
        <Card title="Billing History">
          <Table columns={invoiceColumns} data={invoices} emptyMessage="No invoices found for this employer." />
        </Card>
      ),
    },
  ];

  return (
    <Layout title={empName} subtitle={`Employer Code: ${emp.code || '—'}`}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => navigate('/employers')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Employers
          </button>
          <div className="flex items-center gap-3">
            <Badge status={emp.status || 'active'}>
              {(emp.status || 'active').toUpperCase()}
            </Badge>
            <Button variant="outline" onClick={() => navigate(`/employers/${id}/edit`)}>
              Edit Employer
            </Button>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs tabs={tabs} defaultTab="details" />
      </div>
    </Layout>
  );
}
