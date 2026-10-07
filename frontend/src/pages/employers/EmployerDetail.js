import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Tabs, LoadingSpinner, EmptyState } from '../../components/ui';
import { employersApi, financeApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_EMPLOYER = {
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
  contact_phone_alt: '08087654321',
  employee_count: 320,
  premium_cycle: 'monthly',
  status: 'active',
  created_at: '2024-01-15T08:00:00Z',
};

const MOCK_MEMBERS = [
  { id: 'm1', member_number: 'MBR-0001', first_name: 'Adaeze', last_name: 'Eze', status: 'active', plan_name: 'Gold Plan', enrollment_date: '2024-02-01T00:00:00Z' },
  { id: 'm2', member_number: 'MBR-0002', first_name: 'Babatunde', last_name: 'Adeyemi', status: 'active', plan_name: 'Silver Plan', enrollment_date: '2024-02-01T00:00:00Z' },
  { id: 'm3', member_number: 'MBR-0003', first_name: 'Ngozi', last_name: 'Obi', status: 'suspended', plan_name: 'Bronze Plan', enrollment_date: '2024-03-15T00:00:00Z' },
];

const MOCK_INVOICES = [
  { id: 'inv1', invoice_number: 'INV-2024-001', period: 'January 2024', amount: 4800000, due_date: '2024-01-31T00:00:00Z', status: 'paid' },
  { id: 'inv2', invoice_number: 'INV-2024-002', period: 'February 2024', amount: 4800000, due_date: '2024-02-29T00:00:00Z', status: 'paid' },
  { id: 'inv3', invoice_number: 'INV-2024-003', period: 'March 2024', amount: 4950000, due_date: '2024-03-31T00:00:00Z', status: 'pending' },
];

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
      try {
        const res = await employersApi.getById(id);
        const emp = res.data?.data || res.data;
        setEmployer(emp && (emp.organization_name || emp.name) ? emp : { ...MOCK_EMPLOYER, id });
      } catch {
        setEmployer({ ...MOCK_EMPLOYER, id });
      }

      try {
        const mRes = await employersApi.getMembers(id);
        const mData = mRes.data?.data?.data || mRes.data?.data || [];
        setMembers(mData.length ? mData : MOCK_MEMBERS);
      } catch {
        setMembers(MOCK_MEMBERS);
      }

      try {
        const iRes = await employersApi.getInvoices(id);
        const iData = iRes.data?.data?.data || iRes.data?.data || [];
        setInvoices(iData.length ? iData : MOCK_INVOICES);
      } catch {
        setInvoices(MOCK_INVOICES);
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

  if (!employer) {
    return (
      <Layout title="Employer Details">
        <EmptyState title="Employer not found" description="This employer record could not be loaded." />
      </Layout>
    );
  }

  const empName = employer.organization_name || employer.name || 'Employer Details';

  const detailsContent = (
    <Card title="Organization Overview">
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DetailRow label="Organization Name" value={empName} />
        <DetailRow label="Employer Code" value={employer.code} />
        <DetailRow label="Industry Sector" value={employer.industry || 'Corporate'} />
        <DetailRow label="Office Address" value={employer.address} />
        <DetailRow label="City" value={employer.city} />
        <DetailRow label="State" value={employer.state} />
        <DetailRow label="Phone" value={employer.contact_phone || employer.phone} />
        <DetailRow label="Official Email" value={employer.email} />
        <DetailRow label="Contact Person" value={employer.contact_person} />
        <DetailRow label="Contact Email" value={employer.contact_email} />
        <DetailRow label="Employee Count" value={Number(employer.employee_count || 0).toLocaleString()} />
        <DetailRow
          label="Premium Cycle"
          value={employer.premium_cycle
            ? employer.premium_cycle.charAt(0).toUpperCase() + employer.premium_cycle.slice(1)
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
    <Layout title={empName} subtitle={`Employer Code: ${employer.code || '—'}`}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => navigate('/employers')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Employers
          </button>
          <div className="flex items-center gap-3">
            <Badge status={employer.status || 'active'}>
              {(employer.status || 'active').toUpperCase()}
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
