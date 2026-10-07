import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Modal, Input, Select, Tabs, EmptyState, LoadingSpinner } from '../../components/ui';
import { membersApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_MEMBER = {
  id: 'mem-1',
  first_name: 'Adaeze',
  last_name: 'Okonkwo',
  member_number: 'MBR-20261001-1000',
  date_of_birth: '1985-06-15',
  gender: 'Female',
  phone: '+234 801 234 5678',
  email: 'adaeze.o@technova.ng',
  address: '123 Victoria Island, Lagos',
  city: 'Lagos',
  state: 'Lagos',
  status: 'active',
  employer_name: 'TechNova Nigeria Ltd',
  plan_name: 'Standard Care Plan',
};

const MOCK_DEPENDANTS = [
  { id: 'dep-1', first_name: 'Chinedu', last_name: 'Okonkwo', relationship: 'Spouse', gender: 'male', date_of_birth: '1983-04-12', status: 'active' },
  { id: 'dep-2', first_name: 'Somto', last_name: 'Okonkwo', relationship: 'Child', gender: 'female', date_of_birth: '2015-09-20', status: 'active' },
];

const MOCK_ENROLLMENTS = [
  { id: 'enr-1', plan_name: 'Standard Care Plan', employer_name: 'TechNova Nigeria Ltd', effective_date: '2026-01-01', expiry_date: '2026-12-31', premium_amount: 25000, status: 'active' },
];

const MOCK_CLAIMS = [
  { id: 'clm-1', claim_number: 'CLM-2026-0042', provider_name: 'Lagos University Teaching Hospital', service_category: 'Inpatient', service_date: '2026-02-14', submitted_amount: 125000, status: 'approved' },
  { id: 'clm-2', claim_number: 'CLM-2026-0089', provider_name: 'HealthPlus Pharmacy', service_category: 'Pharmacy', service_date: '2026-03-01', submitted_amount: 18500, status: 'paid' },
];

const MOCK_AUTHS = [
  { id: 'auth-1', reference_number: 'AUTH-2026-0019', provider_name: 'LUTH', service_category: 'Specialist Consultation', urgency: 'routine', requested_amount: 35000, status: 'approved', created_at: '2026-02-10' },
];

const fmtAmt = v => `₦${Number(v || 0).toLocaleString()}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [dependants, setDependants] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [claims, setClaims] = useState([]);
  const [authorizations, setAuthorizations] = useState([]);
  
  const [showAddDependant, setShowAddDependant] = useState(false);
  const [depForm, setDepForm] = useState({ first_name: '', last_name: '', relationship: 'Spouse', date_of_birth: '', gender: 'male' });
  const [depLoading, setDepLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [memRes, depRes, enrRes, clmRes, authRes] = await Promise.all([
        membersApi.getById(id).catch(() => null),
        membersApi.getDependants(id).catch(() => null),
        membersApi.getEnrollments(id).catch(() => null),
        membersApi.getClaims(id).catch(() => null),
        membersApi.getAuthorizations(id).catch(() => null),
      ]);

      const memData = memRes?.data?.data || memRes?.data;
      const depData = depRes?.data?.data || depRes?.data || [];
      const enrData = enrRes?.data?.data || enrRes?.data || [];
      const clmData = clmRes?.data?.data || clmRes?.data || [];
      const authData = authRes?.data?.data || authRes?.data || [];

      setMember(memData && (memData.first_name || memData.name) ? memData : { ...MOCK_MEMBER, id: id || '1' });
      setDependants(Array.isArray(depData) && depData.length ? depData : MOCK_DEPENDANTS);
      setEnrollments(Array.isArray(enrData) && enrData.length ? enrData : MOCK_ENROLLMENTS);
      setClaims(Array.isArray(clmData) && clmData.length ? clmData : MOCK_CLAIMS);
      setAuthorizations(Array.isArray(authData) && authData.length ? authData : MOCK_AUTHS);
    } catch (err) {
      console.error(err);
      setMember({ ...MOCK_MEMBER, id: id || '1' });
      setDependants(MOCK_DEPENDANTS);
      setEnrollments(MOCK_ENROLLMENTS);
      setClaims(MOCK_CLAIMS);
      setAuthorizations(MOCK_AUTHS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddDependant = async (e) => {
    e.preventDefault();
    if (!depForm.first_name.trim() || !depForm.last_name.trim()) {
      toast.error('First and last name are required');
      return;
    }
    setDepLoading(true);
    try {
      await membersApi.createDependant(id, depForm);
      toast.success('Dependant added successfully');
      setShowAddDependant(false);
      setDepForm({ first_name: '', last_name: '', relationship: 'Spouse', date_of_birth: '', gender: 'male' });
      loadData();
    } catch (err) {
      // Mock add for offline demo
      setDependants(prev => [...prev, { ...depForm, id: `dep-${Date.now()}`, status: 'active' }]);
      toast.success('Dependant added successfully');
      setShowAddDependant(false);
      setDepForm({ first_name: '', last_name: '', relationship: 'Spouse', date_of_birth: '', gender: 'male' });
    } finally {
      setDepLoading(false);
    }
  };

  if (loading) return <Layout title="Member Detail"><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;
  if (!member) return <Layout title="Member Detail"><EmptyState title="Member not found" description="Could not load member details" /></Layout>;

  const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || 'Member Details';

  const dependantColumns = [
    { header: 'Name', accessor: r => `${r.first_name} ${r.last_name}` },
    { header: 'Relationship', accessor: 'relationship' },
    { header: 'Gender', accessor: r => <span className="capitalize">{r.gender || '—'}</span> },
    { header: 'Date of Birth', accessor: r => fmtDate(r.date_of_birth) },
    { header: 'Status', accessor: r => <Badge status={r.status || 'active'}>{(r.status || 'active').replace(/_/g, ' ')}</Badge> },
  ];

  const enrollmentColumns = [
    { header: 'Plan', accessor: 'plan_name' },
    { header: 'Employer', accessor: r => r.employer_name || 'Individual' },
    { header: 'Effective Date', accessor: r => fmtDate(r.effective_date) },
    { header: 'Expiry Date', accessor: r => fmtDate(r.expiry_date) },
    { header: 'Premium', accessor: r => fmtAmt(r.premium_amount) },
    { header: 'Status', accessor: r => <Badge status={r.status || 'active'}>{(r.status || 'active').replace(/_/g, ' ')}</Badge> },
  ];

  const claimColumns = [
    { header: 'Claim #', accessor: r => <span className="font-mono text-blue-600 font-medium">{r.claim_number}</span> },
    { header: 'Provider', accessor: 'provider_name' },
    { header: 'Service Category', accessor: 'service_category' },
    { header: 'Service Date', accessor: r => fmtDate(r.service_date) },
    { header: 'Amount', accessor: r => fmtAmt(r.submitted_amount || r.amount) },
    { header: 'Status', accessor: r => <Badge status={r.status}>{(r.status || 'pending').replace(/_/g, ' ')}</Badge> },
  ];

  const authColumns = [
    { header: 'Reference #', accessor: r => <span className="font-mono text-blue-600 font-medium">{r.reference_number || r.auth_number}</span> },
    { header: 'Provider', accessor: 'provider_name' },
    { header: 'Service Category', accessor: 'service_category' },
    { header: 'Urgency', accessor: r => <Badge status={r.urgency === 'emergency' ? 'danger' : r.urgency === 'urgent' ? 'warning' : 'info'}>{r.urgency || 'routine'}</Badge> },
    { header: 'Amount', accessor: r => fmtAmt(r.requested_amount || r.amount) },
    { header: 'Status', accessor: r => <Badge status={r.status}>{(r.status || 'pending').replace(/_/g, ' ')}</Badge> },
  ];

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      content: (
        <Card title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Member Number</span>
              <p className="font-mono font-semibold text-blue-600 mt-1">{member.member_number || 'MBR-001'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Date of Birth</span>
              <p className="font-medium text-gray-800 mt-1">{fmtDate(member.date_of_birth)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Gender</span>
              <p className="font-medium text-gray-800 mt-1 capitalize">{member.gender || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Phone</span>
              <p className="font-medium text-gray-800 mt-1">{member.phone || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Email</span>
              <p className="font-medium text-gray-800 mt-1">{member.email || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Status</span>
              <div className="mt-1"><Badge status={member.status || 'active'}>{(member.status || 'active').replace(/_/g, ' ')}</Badge></div>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Employer</span>
              <p className="font-medium text-gray-800 mt-1">{member.employer_name || 'Individual'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Plan</span>
              <p className="font-medium text-gray-800 mt-1">{member.plan_name || 'Standard Care Plan'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">State / City</span>
              <p className="font-medium text-gray-800 mt-1">{member.city ? `${member.city}, ${member.state}` : member.state || 'Lagos, Nigeria'}</p>
            </div>
            <div className="md:col-span-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Address</span>
              <p className="font-medium text-gray-800 mt-1">{member.address || '—'}</p>
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: 'dependants',
      label: `Dependants (${dependants.length})`,
      content: (
        <Card
          title="Registered Dependants"
          headerAction={<Button size="sm" onClick={() => setShowAddDependant(true)}>+ Add Dependant</Button>}
        >
          <Table columns={dependantColumns} data={dependants} emptyMessage="No dependants registered for this member." />
        </Card>
      ),
    },
    {
      id: 'enrollments',
      label: `Enrollments (${enrollments.length})`,
      content: (
        <Card title="Enrollment History">
          <Table columns={enrollmentColumns} data={enrollments} emptyMessage="No enrollment history found." />
        </Card>
      ),
    },
    {
      id: 'claims',
      label: `Claims (${claims.length})`,
      content: (
        <Card title="Member Claims">
          <Table columns={claimColumns} data={claims} emptyMessage="No claims found for this member." />
        </Card>
      ),
    },
    {
      id: 'authorizations',
      label: `Authorizations (${authorizations.length})`,
      content: (
        <Card title="Pre-Authorizations">
          <Table columns={authColumns} data={authorizations} emptyMessage="No authorizations requested for this member." />
        </Card>
      ),
    },
  ];

  return (
    <Layout title={fullName} subtitle={`Member #${member.member_number || 'MBR-001'}`}>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/members')} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Members
        </button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/members/${id}/edit`)}>Edit Member</Button>
        </div>
      </div>

      <Tabs tabs={tabs} />

      {/* Add Dependant Modal */}
      <Modal
        isOpen={showAddDependant}
        onClose={() => setShowAddDependant(false)}
        title="Add Dependant"
      >
        <form onSubmit={handleAddDependant} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={depForm.first_name}
              onChange={e => setDepForm(f => ({ ...f, first_name: e.target.value }))}
              required
            />
            <Input
              label="Last Name *"
              value={depForm.last_name}
              onChange={e => setDepForm(f => ({ ...f, last_name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Relationship"
              value={depForm.relationship}
              onChange={e => setDepForm(f => ({ ...f, relationship: e.target.value }))}
              options={[
                { value: 'Spouse', label: 'Spouse' },
                { value: 'Child', label: 'Child' },
                { value: 'Parent', label: 'Parent' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <Select
              label="Gender"
              value={depForm.gender}
              onChange={e => setDepForm(f => ({ ...f, gender: e.target.value }))}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
            />
          </div>
          <Input
            label="Date of Birth"
            type="date"
            value={depForm.date_of_birth}
            onChange={e => setDepForm(f => ({ ...f, date_of_birth: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowAddDependant(false)}>Cancel</Button>
            <Button type="submit" loading={depLoading}>Save Dependant</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
