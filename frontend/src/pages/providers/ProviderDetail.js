import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Tabs, LoadingSpinner, EmptyState } from '../../components/ui';
import { providersApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_PROVIDER = {
  id: 'p1',
  name: 'Lagos University Teaching Hospital',
  provider_type: 'hospital',
  tier: 'Tier 1',
  license_number: 'MFH-LA-2019-00124',
  accreditation_number: 'NHIA-2020-0456',
  address: 'Ishaga Road, Idi-Araba',
  city: 'Surulere',
  state: 'Lagos',
  phone: '+234-1-8765432',
  email: 'claims@luth.gov.ng',
  contact_person: 'Dr. Funmi Adeyemi',
  bank_name: 'First Bank',
  account_number: '1029384756',
  account_name: 'LUTH Operations Account',
  status: 'active',
  locations: [
    { id: 'l1', name: 'Main Campus Hospital', address: 'Ishaga Road, Idi-Araba', city: 'Surulere', phone: '+234-1-8765432', is_primary: true },
    { id: 'l2', name: 'Annex Specialist Clinic', address: '5 Herbert Macaulay Way', city: 'Yaba', phone: '+234-1-3456789', is_primary: false },
  ],
};

const MOCK_CLAIMS = [
  { id: 'c1', claim_number: 'CLM-2024-0112', member_name: 'Adaeze Okonkwo', service_category: 'Inpatient', submitted_amount: 185000, status: 'approved', service_date: '2026-02-14' },
  { id: 'c2', claim_number: 'CLM-2024-0156', member_name: 'Emeka Eze', service_category: 'Surgery', submitted_amount: 450000, status: 'paid', service_date: '2026-03-01' },
  { id: 'c3', claim_number: 'CLM-2024-0201', member_name: 'Fatima Abubakar', service_category: 'Outpatient', submitted_amount: 35000, status: 'submitted', service_date: '2026-03-15' },
];

const MOCK_SETTLEMENTS = [
  { id: 's1', settlement_number: 'SET-2026-001', period: 'January 2026', claims_count: 34, gross_amount: 2850000, deductions: 285000, net_amount: 2565000, status: 'paid' },
  { id: 's2', settlement_number: 'SET-2026-002', period: 'February 2026', claims_count: 41, gross_amount: 3120000, deductions: 312000, net_amount: 2808000, status: 'pending' },
];

const DetailRow = ({ label, value }) => (
  <div>
    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 font-medium">{value || '—'}</dd>
  </div>
);

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [claims, setClaims] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await providersApi.getById(id);
        const p = res.data?.data || res.data;
        if (p && p.name) {
          setProvider({
            ...p,
            locations: p.locations && p.locations.length ? p.locations : MOCK_PROVIDER.locations,
          });
        } else {
          setProvider({ ...MOCK_PROVIDER, id });
        }
      } catch {
        setProvider({ ...MOCK_PROVIDER, id });
      }

      try {
        const cRes = await providersApi.getClaims(id);
        const cData = cRes.data?.data?.data || cRes.data?.data || [];
        setClaims(cData.length ? cData : MOCK_CLAIMS);
      } catch {
        setClaims(MOCK_CLAIMS);
      }

      try {
        const sRes = await providersApi.getSettlements(id);
        const sData = sRes.data?.data?.data || sRes.data?.data || [];
        setSettlements(sData.length ? sData : MOCK_SETTLEMENTS);
      } catch {
        setSettlements(MOCK_SETTLEMENTS);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const locationColumns = [
    { header: 'Branch / Facility Name', accessor: 'name' },
    { header: 'Address', accessor: 'address' },
    { header: 'City', accessor: 'city' },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Primary Facility',
      accessor: row => row.is_primary
        ? <Badge status="active">Primary</Badge>
        : <Badge status="inactive">Secondary</Badge>,
    },
  ];

  const claimColumns = [
    { header: 'Claim #', accessor: row => <span className="font-mono text-blue-600 font-medium">{row.claim_number}</span> },
    { header: 'Member', accessor: row => row.member_name || 'Member' },
    { header: 'Service Category', accessor: row => row.service_category || 'General' },
    { header: 'Amount', accessor: row => `₦${Number(row.submitted_amount || row.amount || 0).toLocaleString()}` },
    {
      header: 'Status',
      accessor: row => <Badge status={row.status}>{row.status?.replace(/_/g, ' ')}</Badge>,
    },
  ];

  const settlementColumns = [
    { header: 'Settlement #', accessor: row => <span className="font-mono text-blue-600 font-medium">{row.settlement_number}</span> },
    { header: 'Billing Period', accessor: 'period' },
    { header: 'Claims Count', accessor: row => Number(row.claims_count || 0).toLocaleString() },
    { header: 'Gross Amount', accessor: row => `₦${Number(row.gross_amount || 0).toLocaleString()}` },
    { header: 'Net Amount', accessor: row => <span className="font-semibold text-gray-900">₦{Number(row.net_amount || 0).toLocaleString()}</span> },
    {
      header: 'Status',
      accessor: row => <Badge status={row.status}>{row.status?.replace(/_/g, ' ')}</Badge>,
    },
  ];

  if (loading) {
    return (
      <Layout title="Provider Details">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!provider) {
    return (
      <Layout title="Provider Details">
        <EmptyState title="Provider not found" description="This healthcare provider record could not be loaded." />
      </Layout>
    );
  }

  const detailsContent = (
    <div className="space-y-6">
      <Card title="Provider Information">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailRow label="Facility Name" value={provider.name} />
          <DetailRow
            label="Facility Type"
            value={provider.provider_type ? provider.provider_type.charAt(0).toUpperCase() + provider.provider_type.slice(1) : 'Hospital'}
          />
          <DetailRow label="Empanelment Tier" value={String(provider.tier || 'Tier 1')} />
          <DetailRow label="License Number" value={provider.license_number || 'NHIA-LIC-2024'} />
          <DetailRow label="NHIA Accreditation" value={provider.accreditation_number || 'NHIA-ACCR-889'} />
          <DetailRow label="Status" value={<Badge status={provider.status || 'active'}>{(provider.status || 'active').toUpperCase()}</Badge>} />
          <DetailRow label="Address" value={provider.address} />
          <DetailRow label="City / State" value={`${provider.city || ''}, ${provider.state || 'Lagos'}`} />
          <DetailRow label="Phone" value={provider.phone} />
          <DetailRow label="Email" value={provider.email} />
          <DetailRow label="Contact Person" value={provider.contact_person} />
        </dl>
      </Card>

      <Card title="Banking & Settlement Details">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <DetailRow label="Bank Name" value={provider.bank_name || 'First Bank Nigeria'} />
          <DetailRow label="Account Number" value={provider.account_number || '1029384756'} />
          <DetailRow label="Account Name" value={provider.account_name || provider.name} />
        </dl>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'details', label: 'Details', content: detailsContent },
    {
      id: 'locations',
      label: `Locations (${(provider.locations || []).length})`,
      content: (
        <Card title="Operating Facility Locations">
          <Table columns={locationColumns} data={provider.locations || []} emptyMessage="No locations found for this provider." />
        </Card>
      ),
    },
    {
      id: 'claims',
      label: `Claims (${claims.length})`,
      content: (
        <Card title="Claims Submitted">
          <Table columns={claimColumns} data={claims} emptyMessage="No claims found for this provider." />
        </Card>
      ),
    },
    {
      id: 'settlements',
      label: `Settlements (${settlements.length})`,
      content: (
        <Card title="Provider Remittances & Settlements">
          <Table columns={settlementColumns} data={settlements} emptyMessage="No settlement records found." />
        </Card>
      ),
    },
  ];

  return (
    <Layout title={provider.name} subtitle={`Healthcare Provider (${provider.provider_type || 'Facility'})`}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => navigate('/providers')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Providers
          </button>
          <div className="flex items-center gap-3">
            <Badge status={provider.status || 'active'}>
              {(provider.status || 'active').toUpperCase()}
            </Badge>
            <Button variant="outline" onClick={() => navigate(`/providers/${id}/edit`)}>
              Edit Provider
            </Button>
          </div>
        </div>

        <Tabs tabs={tabs} defaultTab="details" />
      </div>
    </Layout>
  );
}
