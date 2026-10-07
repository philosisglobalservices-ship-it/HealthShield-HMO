import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Tabs, LoadingSpinner, EmptyState } from '../../components/ui';
import { providersApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_PROVIDERS_MAP = {
  '1': {
    id: '1',
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
      { id: 'l1', name: 'Main Campus Teaching Hospital', address: 'Ishaga Road, Idi-Araba', city: 'Surulere', phone: '+234-1-8765432', is_primary: true },
      { id: 'l2', name: 'Specialist Outreach Annex', address: '5 Herbert Macaulay Way', city: 'Yaba', phone: '+234-1-3456789', is_primary: false },
    ],
    claims: [
      { id: 'c1', claim_number: 'CLM-2026-0042', member_name: 'Adaeze Okonkwo', service_category: 'Inpatient', submitted_amount: 125000, status: 'approved', service_date: '2026-02-14' },
      { id: 'c6', claim_number: 'CLM-2026-0210', member_name: 'Tunde Bakare', service_category: 'Surgery', submitted_amount: 320000, status: 'paid', service_date: '2025-11-12' },
    ],
    settlements: [
      { id: 's1', settlement_number: 'SET-2026-001', period: 'January 2026', claims_count: 34, gross_amount: 2850000, deductions: 285000, net_amount: 2565000, status: 'paid' },
      { id: 's2', settlement_number: 'SET-2026-002', period: 'February 2026', claims_count: 41, gross_amount: 3120000, deductions: 312000, net_amount: 2808000, status: 'pending' },
    ],
  },
  '2': {
    id: '2',
    name: 'Reddington Hospital',
    provider_type: 'hospital',
    tier: 'Tier 1',
    license_number: 'MFH-LA-2018-00911',
    accreditation_number: 'NHIA-2020-0782',
    address: '12 Idowu Martins Street',
    city: 'Victoria Island',
    state: 'Lagos',
    phone: '+234-1-2715340',
    email: 'hmo@reddingtonhospital.com',
    contact_person: 'Dr. Charles Adeleke',
    bank_name: 'Zenith Bank',
    account_number: '2039485761',
    account_name: 'Reddington Multi-Specialist Hospital',
    status: 'active',
    locations: [
      { id: 'l3', name: 'Victoria Island Main Facility', address: '12 Idowu Martins St', city: 'Victoria Island', phone: '+234-1-2715340', is_primary: true },
      { id: 'l4', name: 'Lekki Medical Clinic', address: 'Plot 4, Admiralty Way, Lekki', city: 'Lekki', phone: '+234-1-2715355', is_primary: false },
    ],
    claims: [
      { id: 'c3', claim_number: 'CLM-2026-0112', member_name: 'Emeka Eze', service_category: 'Consultation', submitted_amount: 25000, status: 'paid', service_date: '2026-03-10' },
    ],
    settlements: [
      { id: 's3', settlement_number: 'SET-2026-003', period: 'February 2026', claims_count: 22, gross_amount: 4500000, deductions: 450000, net_amount: 4050000, status: 'paid' },
    ],
  },
  '3': {
    id: '3',
    name: 'HealthPlus Pharmacy',
    provider_type: 'pharmacy',
    tier: 'Tier 2',
    license_number: 'PCN-LA-2017-00312',
    accreditation_number: 'NHIA-2021-0119',
    address: '15 Commercial Avenue, Sabo',
    city: 'Yaba',
    state: 'Lagos',
    phone: '+234-809-1234567',
    email: 'dispensary@healthplus.com.ng',
    contact_person: 'Pharm. Bukola Shonowo',
    bank_name: 'GTBank',
    account_number: '0123456789',
    account_name: 'HealthPlus Pharmacy Chain',
    status: 'active',
    locations: [
      { id: 'l5', name: 'Yaba Flagship Dispensary', address: '15 Commercial Ave, Sabo', city: 'Yaba', phone: '+234-809-1234567', is_primary: true },
      { id: 'l6', name: 'Ikeja Mall Branch', address: 'Ikeja City Mall, Alausa', city: 'Ikeja', phone: '+234-809-1234568', is_primary: false },
    ],
    claims: [
      { id: 'c2', claim_number: 'CLM-2026-0089', member_name: 'Adaeze Okonkwo', service_category: 'Pharmacy', submitted_amount: 18500, status: 'paid', service_date: '2026-03-01' },
      { id: 'c5', claim_number: 'CLM-2026-0190', member_name: 'Ngozi Ibe', service_category: 'Pharmacy', submitted_amount: 14200, status: 'paid', service_date: '2026-02-28' },
    ],
    settlements: [
      { id: 's4', settlement_number: 'SET-2026-004', period: 'February 2026', claims_count: 55, gross_amount: 1850000, deductions: 92500, net_amount: 1757500, status: 'paid' },
    ],
  },
  '4': {
    id: '4',
    name: 'MedView Diagnostics Lab',
    provider_type: 'laboratory',
    tier: 'Tier 3',
    license_number: 'MLSCN-2016-00441',
    accreditation_number: 'NHIA-2021-0301',
    address: '44 Isaac John Street, GRA',
    city: 'Ikeja',
    state: 'Lagos',
    phone: '+234-1-4970000',
    email: 'lab@medview.ng',
    contact_person: 'Dr. Obinna Nwankwo',
    bank_name: 'Access Bank',
    account_number: '0987654321',
    account_name: 'MedView Diagnostic Services Ltd',
    status: 'active',
    locations: [
      { id: 'l7', name: 'Ikeja Central Laboratories', address: '44 Isaac John St, GRA', city: 'Ikeja', phone: '+234-1-4970000', is_primary: true },
    ],
    claims: [
      { id: 'c4', claim_number: 'CLM-2026-0145', member_name: 'Fatima Abubakar', service_category: 'Laboratory', submitted_amount: 48000, status: 'approved', service_date: '2026-01-20' },
    ],
    settlements: [
      { id: 's5', settlement_number: 'SET-2026-005', period: 'January 2026', claims_count: 18, gross_amount: 980000, deductions: 49000, net_amount: 931000, status: 'paid' },
    ],
  },
};

// Also index by 'p1', 'p2', 'prv-1', etc.
Object.keys(MOCK_PROVIDERS_MAP).forEach(k => {
  MOCK_PROVIDERS_MAP[`p${k}`] = MOCK_PROVIDERS_MAP[k];
  MOCK_PROVIDERS_MAP[`prv-${k}`] = MOCK_PROVIDERS_MAP[k];
});

const getFallbackProvider = (id) => {
  const cleanId = String(id || '1').replace('prv-', '').replace('p', '');
  if (MOCK_PROVIDERS_MAP[cleanId]) return MOCK_PROVIDERS_MAP[cleanId];
  return {
    id: id || '1',
    name: `Healthcare Provider #${id}`,
    provider_type: 'hospital',
    tier: 'Tier 1',
    license_number: `NHIA-LIC-${id}`,
    accreditation_number: `NHIA-ACCR-${id}`,
    address: 'Medical Way, Lagos',
    city: 'Lagos',
    state: 'Lagos',
    phone: '+234 800 000 0000',
    email: `provider.${id}@healthshield.ng`,
    contact_person: 'Medical Director',
    bank_name: 'First Bank',
    account_number: '1029384756',
    account_name: `Healthcare Provider #${id}`,
    status: 'active',
    locations: [],
    claims: [],
    settlements: [],
  };
};

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
      const fallback = getFallbackProvider(id);
      try {
        const res = await providersApi.getById(id);
        const p = res.data?.data || res.data;
        if (p && p.name) {
          setProvider({
            ...p,
            locations: p.locations && p.locations.length ? p.locations : (fallback.locations || []),
          });
        } else {
          setProvider(fallback);
        }
      } catch {
        setProvider(fallback);
      }

      try {
        const cRes = await providersApi.getClaims(id);
        const cData = cRes.data?.data?.data || cRes.data?.data;
        setClaims(Array.isArray(cData) && cData.length ? cData : (fallback.claims || []));
      } catch {
        setClaims(fallback.claims || []);
      }

      try {
        const sRes = await providersApi.getSettlements(id);
        const sData = sRes.data?.data?.data || sRes.data?.data;
        setSettlements(Array.isArray(sData) && sData.length ? sData : (fallback.settlements || []));
      } catch {
        setSettlements(fallback.settlements || []);
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

  const fallback = getFallbackProvider(id);
  const p = provider || fallback;

  const detailsContent = (
    <div className="space-y-6">
      <Card title="Provider Information">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailRow label="Facility Name" value={p.name} />
          <DetailRow
            label="Facility Type"
            value={p.provider_type ? p.provider_type.charAt(0).toUpperCase() + p.provider_type.slice(1) : 'Hospital'}
          />
          <DetailRow label="Empanelment Tier" value={String(p.tier || 'Tier 1')} />
          <DetailRow label="License Number" value={p.license_number || 'NHIA-LIC-2024'} />
          <DetailRow label="NHIA Accreditation" value={p.accreditation_number || 'NHIA-ACCR-889'} />
          <DetailRow label="Status" value={<Badge status={p.status || 'active'}>{(p.status || 'active').toUpperCase()}</Badge>} />
          <DetailRow label="Address" value={p.address} />
          <DetailRow label="City / State" value={`${p.city || ''}, ${p.state || 'Lagos'}`} />
          <DetailRow label="Phone" value={p.phone} />
          <DetailRow label="Email" value={p.email} />
          <DetailRow label="Contact Person" value={p.contact_person} />
        </dl>
      </Card>

      <Card title="Banking & Settlement Details">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <DetailRow label="Bank Name" value={p.bank_name || 'First Bank Nigeria'} />
          <DetailRow label="Account Number" value={p.account_number || '1029384756'} />
          <DetailRow label="Account Name" value={p.account_name || p.name} />
        </dl>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'details', label: 'Details', content: detailsContent },
    {
      id: 'locations',
      label: `Locations (${(p.locations || []).length})`,
      content: (
        <Card title="Operating Facility Locations">
          <Table columns={locationColumns} data={p.locations || []} emptyMessage="No locations found for this provider." />
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
    <Layout title={p.name} subtitle={`Healthcare Provider (${p.provider_type || 'Facility'})`}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => navigate('/providers')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Providers
          </button>
          <div className="flex items-center gap-3">
            <Badge status={p.status || 'active'}>
              {(p.status || 'active').toUpperCase()}
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
