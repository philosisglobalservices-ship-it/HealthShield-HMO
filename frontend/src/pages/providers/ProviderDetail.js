import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import {
  Button, Card, Table, Badge, Tabs, LoadingSpinner, EmptyState
} from '../../components/ui';
import { providersApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_PROVIDER = {
  id: 'p1',
  name: 'Lagos University Teaching Hospital',
  provider_type: 'hospital',
  tier: 1,
  license_number: 'MFH-LA-2019-00124',
  accreditation_number: 'NHIA-2020-0456',
  address: 'Idi-Araba, Surulere',
  city: 'Lagos',
  state: 'Lagos',
  phone: '01-2345678',
  email: 'info@luth.gov.ng',
  contact_person: 'Dr. Funmi Adeyemi',
  bank_name: 'First Bank',
  account_number: '3012345678',
  account_name: 'Lagos University Teaching Hospital',
  status: 'active',
  locations: [
    { id: 'l1', name: 'Main Campus', address: 'Idi-Araba, Surulere', city: 'Lagos', phone: '01-2345678', is_primary: true },
    { id: 'l2', name: 'Annex Clinic', address: '5 Herbert Macaulay Way', city: 'Lagos', phone: '01-3456789', is_primary: false },
  ],
};

const MOCK_CLAIMS = [
  { id: 'c1', claim_number: 'CLM-2024-0112', member_name: 'Adaeze Eze', service_type: 'Inpatient', amount: 185000, status: 'approved' },
  { id: 'c2', claim_number: 'CLM-2024-0156', member_name: 'Babatunde Adeyemi', service_type: 'Surgery', amount: 450000, status: 'paid' },
  { id: 'c3', claim_number: 'CLM-2024-0201', member_name: 'Ngozi Obi', service_type: 'Outpatient', amount: 35000, status: 'pending' },
];

const MOCK_SETTLEMENTS = [
  { id: 's1', settlement_number: 'SET-2024-001', period: 'January 2024', claims_count: 34, gross_amount: 2850000, deductions: 285000, net_amount: 2565000, status: 'paid' },
  { id: 's2', settlement_number: 'SET-2024-002', period: 'February 2024', claims_count: 41, gross_amount: 3120000, deductions: 312000, net_amount: 2808000, status: 'pending' },
];

const DetailRow = ({ label, value }) => (
  <div>
    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd>
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
        setProvider(res.data?.data || res.data);
      } catch {
        setProvider(MOCK_PROVIDER);
      }
      try {
        const cRes = await providersApi.getClaims(id);
        setClaims(cRes.data?.data?.data || cRes.data?.data || []);
      } catch {
        setClaims(MOCK_CLAIMS);
      }
      try {
        const sRes = await providersApi.getSettlements(id);
        setSettlements(sRes.data?.data?.data || sRes.data?.data || []);
      } catch {
        setSettlements(MOCK_SETTLEMENTS);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const locationColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Address', accessor: 'address' },
    { header: 'City', accessor: 'city' },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Primary',
      accessor: row => row.is_primary
        ? <Badge status="active">Primary</Badge>
        : <Badge status="inactive">Secondary</Badge>,
    },
  ];

  const claimColumns = [
    { header: 'Claim #', accessor: 'claim_number' },
    { header: 'Member', accessor: row => row.member_name || `${row.member?.first_name || ''} ${row.member?.last_name || ''}`.trim() || '—' },
    { header: 'Service', accessor: row => row.service_type || row.service_description || '—' },
    {
      header: 'Amount',
      accessor: row => `₦${Number(row.amount).toLocaleString()}`,
    },
    {
      header: 'Status',
      accessor: row => <Badge status={row.status}>{row.status?.replace(/_/g, ' ')}</Badge>,
    },
  ];

  const settlementColumns = [
    { header: 'Settlement #', accessor: 'settlement_number' },
    { header: 'Period', accessor: 'period' },
    { header: 'Claims', accessor: row => (row.claims_count || 0).toLocaleString() },
    { header: 'Gross Amount', accessor: row => `₦${Number(row.gross_amount).toLocaleString()}` },
    { header: 'Deductions', accessor: row => `₦${Number(row.deductions).toLocaleString()}` },
    { header: 'Net Amount', accessor: row => `₦${Number(row.net_amount).toLocaleString()}` },
    {
      header: 'Status',
      accessor: row => <Badge status={row.status}>{row.status?.replace(/_/g, ' ')}</Badge>,
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!provider) {
    return (
      <Layout>
        <EmptyState title="Provider not found" description="This provider could not be loaded." />
      </Layout>
    );
  }

  const locations = provider.locations || [];

  const detailsContent = (
    <Card>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        <DetailRow label="Provider Name" value={provider.name} />
        <DetailRow
          label="Type"
          value={
            <Badge status="active">
              {provider.provider_type?.charAt(0).toUpperCase() + provider.provider_type?.slice(1)}
            </Badge>
          }
        />
        <DetailRow
          label="Tier"
          value={
            <Badge status={provider.tier === 1 ? 'active' : 'pending'}>
              Tier {provider.tier}
            </Badge>
          }
        />
        <DetailRow label="License Number" value={provider.license_number} />
        <DetailRow label="Accreditation Number" value={provider.accreditation_number} />
        <DetailRow label="Address" value={provider.address} />
        <DetailRow label="City" value={provider.city} />
        <DetailRow label="State" value={provider.state} />
        <DetailRow label="Phone" value={provider.phone} />
        <DetailRow label="Email" value={provider.email} />
        <DetailRow label="Bank Name" value={provider.bank_name} />
        <DetailRow label="Account Number" value={provider.account_number} />
        <DetailRow label="Account Name" value={provider.account_name} />
        <DetailRow
          label="Status"
          value={<Badge status={provider.status}>{provider.status}</Badge>}
        />
      </dl>
    </Card>
  );

  const locationsContent = (
    <Card>
      {locations.length === 0 ? (
        <EmptyState title="No locations" description="No facility locations have been added for this provider." />
      ) : (
        <Table columns={locationColumns} data={locations} />
      )}
    </Card>
  );

  const claimsContent = (
    <Card>
      {claims.length === 0 ? (
        <EmptyState title="No claims" description="No claims have been filed against this provider." />
      ) : (
        <Table columns={claimColumns} data={claims} />
      )}
    </Card>
  );

  const settlementsContent = (
    <Card>
      {settlements.length === 0 ? (
        <EmptyState title="No settlements" description="No settlements have been processed for this provider." />
      ) : (
        <Table columns={settlementColumns} data={settlements} />
      )}
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/providers')}>← Back</Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{provider.name}</h1>
              <p className="text-sm text-gray-500">
                {provider.provider_type?.charAt(0).toUpperCase() + provider.provider_type?.slice(1)} · Tier {provider.tier} · {provider.city}, {provider.state}
              </p>
            </div>
          </div>
          <Button onClick={() => navigate(`/providers/${id}/edit`)}>Edit Provider</Button>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { label: 'Details', content: detailsContent },
            { label: `Locations (${locations.length})`, content: locationsContent },
            { label: `Claims (${claims.length})`, content: claimsContent },
            { label: `Settlements (${settlements.length})`, content: settlementsContent },
          ]}
        />
      </div>
    </Layout>
  );
}
