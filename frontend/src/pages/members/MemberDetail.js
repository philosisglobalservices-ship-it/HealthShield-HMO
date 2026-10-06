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
  phone: '+234 800 123 4567',
  email: 'adaeze@example.com',
  address: '123 Victoria Island, Lagos',
  city: 'Lagos',
  state: 'Lagos',
  status: 'active',
  employer_name: 'TechNova Nigeria Ltd',
  plan_name: 'Standard Care Plan',
};

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

      const memData = memRes?.data?.data || memRes?.data || MOCK_MEMBER;
      const depData = depRes?.data?.data || depRes?.data || [];
      const enrData = enrRes?.data?.data || enrRes?.data || [];
      const clmData = clmRes?.data?.data || clmRes?.data || [];
      const authData = authRes?.data?.data || authRes?.data || [];

      setMember(memData);
      setDependants(Array.isArray(depData) ? depData : []);
      setEnrollments(Array.isArray(enrData) ? enrData : []);
      setClaims(Array.isArray(clmData) ? clmData : []);
      setAuthorizations(Array.isArray(authData) ? authData : []);
    } catch (err) {
      console.error(err);
      setMember(MOCK_MEMBER);
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
      toast.error(err.response?.data?.message || 'Failed to add dependant');
    } finally {
      setDepLoading(false);
    }
  };

  if (loading) return <Layout title="Member Detail"><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;
  if (!member) return <Layout title="Member Detail"><EmptyState message="Member not found" /></Layout>;

  const fullName = member.first_name && member.last_name 
    ? `${member.first_name} ${member.last_name}` 
    : (member.name || 'Member Details');

  const memberNumber = member.member_number || member.memberNumber || '—';
  const employerName = member.employer_name || member.employer || 'Individual / Independent';
  const dob = member.date_of_birth || member.dob || '—';
  const gender = member.gender || '—';
  const phone = member.phone || '—';
  const email = member.email || '—';
  const status = member.status || 'active';

  return (
    <Layout title={`Member: ${fullName}`} subtitle={memberNumber}>
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/members')} className="text-blue-600 hover:underline text-sm">← Back to Members</button>
        <Button onClick={() => navigate(`/members/${id}/edit`)}>Edit Member</Button>
      </div>

      <Card className="mb-6 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-gray-500 text-xs uppercase tracking-wide">Full Name</p><p className="font-semibold text-gray-900 mt-0.5">{fullName}</p></div>
          <div><p className="text-gray-500 text-xs uppercase tracking-wide">Member ID</p><p className="font-mono text-sm font-semibold text-blue-600 mt-0.5">{memberNumber}</p></div>
          <div><p className="text-gray-500 text-xs uppercase tracking-wide">Status</p><div className="mt-0.5"><Badge status={status}>{status}</Badge></div></div>
          <div><p className="text-gray-500 text-xs uppercase tracking-wide">Employer</p><p className="font-semibold text-gray-900 mt-0.5">{employerName}</p></div>
          <div><p className="text-gray-500 text-xs uppercase tracking-wide">Date of Birth</p><p className="text-sm mt-0.5">{fmtDate(dob)}</p></div>
          <div><p className="text-gray-500 text-xs uppercase tracking-wide">Gender</p><p className="capitalize text-sm mt-0.5">{gender}</p></div>
          <div><p className="text-gray-500 text-xs uppercase tracking-wide">Phone</p><p className="text-sm mt-0.5">{phone}</p></div>
          <div><p className="text-gray-500 text-xs uppercase tracking-wide">Email</p><p className="text-sm mt-0.5">{email}</p></div>
        </div>
      </Card>

      <Tabs 
        tabs={[
          {
            label: 'Profile & Address',
            content: (
              <Card title="Residential Address">
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Street:</strong> {member.address || '—'}</p>
                  <p><strong>City:</strong> {member.city || '—'}</p>
                  <p><strong>State:</strong> {member.state || '—'}</p>
                  <p><strong>Occupation:</strong> {member.occupation || '—'}</p>
                  <p><strong>National ID:</strong> {member.national_id || '—'}</p>
                </div>
              </Card>
            )
          },
          {
            label: `Dependants (${dependants.length})`,
            content: (
              <div>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setShowAddDependant(true)}>+ Add Dependant</Button>
                </div>
                <Table 
                  columns={[
                    { header: 'Full Name', accessor: row => row.first_name ? `${row.first_name} ${row.last_name}` : (row.name || '—') },
                    { header: 'Relationship', accessor: row => row.relationship || row.relation || '—' },
                    { header: 'DOB', accessor: row => fmtDate(row.date_of_birth || row.dob) },
                    { header: 'Gender', accessor: row => <span className="capitalize">{row.gender || '—'}</span> },
                    { header: 'Status', accessor: row => <Badge status={row.status || 'active'}>{row.status || 'Active'}</Badge> }
                  ]}
                  data={dependants}
                  emptyMessage="No dependants added yet."
                />
              </div>
            )
          },
          {
            label: `Enrollments (${enrollments.length})`,
            content: (
              <Table 
                columns={[
                  { header: 'Plan Name', accessor: row => row.plan_name || row.plan || '—' },
                  { header: 'Effective Date', accessor: row => fmtDate(row.effective_date || row.effectiveDate) },
                  { header: 'Expiry Date', accessor: row => fmtDate(row.expiry_date || row.expiryDate) },
                  { header: 'Monthly Premium', accessor: row => row.premium_amount ? fmtAmt(row.premium_amount) : '—' },
                  { header: 'Status', accessor: row => <Badge status={row.status || 'active'}>{row.status || 'Active'}</Badge> },
                ]}
                data={enrollments}
                emptyMessage="No active health plan enrollments."
              />
            )
          },
          {
            label: `Claims (${claims.length})`,
            content: (
              <Table 
                columns={[
                  { header: 'Claim #', accessor: row => <span className="font-mono text-sm font-medium">{row.claim_number || row.id}</span> },
                  { header: 'Service Category', accessor: row => row.service_category || row.service || '—' },
                  { header: 'Date', accessor: row => fmtDate(row.service_date) },
                  { header: 'Amount', accessor: row => fmtAmt(row.submitted_amount || row.amount) },
                  { header: 'Status', accessor: row => <Badge status={row.status || 'submitted'}>{row.status || 'Submitted'}</Badge> },
                  { header: 'Action', accessor: row => <Button size="sm" variant="outline" onClick={() => navigate(`/claims/${row.id}`)}>View</Button> }
                ]}
                data={claims}
                emptyMessage="No claims recorded for this member."
              />
            )
          },
          {
            label: `Authorizations (${authorizations.length})`,
            content: (
              <Table 
                columns={[
                  { header: 'Ref #', accessor: row => <span className="font-mono text-sm font-medium">{row.reference || row.reference_number || row.id}</span> },
                  { header: 'Service', accessor: row => row.service_category || row.service || '—' },
                  { header: 'Requested Amount', accessor: row => fmtAmt(row.requested_amount || row.requestedAmount) },
                  { header: 'Urgency', accessor: row => <Badge status={row.urgency || 'routine'}>{row.urgency || 'Routine'}</Badge> },
                  { header: 'Status', accessor: row => <Badge status={row.status || 'pending'}>{row.status || 'Pending'}</Badge> },
                  { header: 'Action', accessor: row => <Button size="sm" variant="outline" onClick={() => navigate(`/authorizations/${row.id}`)}>View</Button> }
                ]}
                data={authorizations}
                emptyMessage="No clinical authorizations requested."
              />
            )
          }
        ]}
      />

      {showAddDependant && (
        <Modal 
          title="Add New Dependant" 
          onClose={() => setShowAddDependant(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowAddDependant(false)}>Cancel</Button>
              <Button loading={depLoading} onClick={handleAddDependant}>Save Dependant</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="First Name *" 
                value={depForm.first_name} 
                onChange={e => setDepForm({ ...depForm, first_name: e.target.value })} 
                placeholder="e.g. Chima"
              />
              <Input 
                label="Last Name *" 
                value={depForm.last_name} 
                onChange={e => setDepForm({ ...depForm, last_name: e.target.value })} 
                placeholder="e.g. Okonkwo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Relationship" 
                value={depForm.relationship} 
                onChange={e => setDepForm({ ...depForm, relationship: e.target.value })}
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
                onChange={e => setDepForm({ ...depForm, gender: e.target.value })}
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
              onChange={e => setDepForm({ ...depForm, date_of_birth: e.target.value })} 
            />
          </div>
        </Modal>
      )}
    </Layout>
  );
}
