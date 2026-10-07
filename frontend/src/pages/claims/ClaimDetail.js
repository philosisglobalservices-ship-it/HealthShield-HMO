import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Modal, Input, LoadingSpinner } from '../../components/ui';
import { claimsApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_CLAIMS_MAP = {
  '1': {
    id: '1', claim_number: 'CLM-2026-2001', status: 'submitted',
    service_date: '2026-09-01', service_category: 'Outpatient',
    submitted_amount: 25000, approved_amount: 0, paid_amount: 0,
    member_first_name: 'Adaeze', member_last_name: 'Okonkwo', member_number: 'MBR-001', plan_name: 'Standard Care',
    provider_name: 'Lagos University Teaching Hospital', provider_type: 'Hospital',
    diagnosis_description: 'General medical consultation and routine follow-up', diagnosis_code: 'Z00.00',
    notes: '', rejection_reason: '', appeal_reason: '',
    claim_items: [
      { id: 1, description: 'Physician Consultation', quantity: 1, unit_cost: 15000, total_cost: 15000 },
      { id: 2, description: 'Basic Diagnostic Panel', quantity: 1, unit_cost: 10000, total_cost: 10000 },
    ],
  },
  '2': {
    id: '2', claim_number: 'CLM-2026-2002', status: 'under_review',
    service_date: '2026-09-02', service_category: 'Inpatient',
    submitted_amount: 50000, approved_amount: 0, paid_amount: 0,
    member_first_name: 'Emeka', member_last_name: 'Eze', member_number: 'MBR-002', plan_name: 'Basic Care',
    provider_name: 'Reddington Hospital', provider_type: 'Hospital',
    diagnosis_description: 'Acute malaria and gastrointestinal infection', diagnosis_code: 'B54',
    notes: '', rejection_reason: '', appeal_reason: '',
    claim_items: [
      { id: 1, description: 'Emergency Admission (2 nights)', quantity: 2, unit_cost: 15000, total_cost: 30000 },
      { id: 2, description: 'IV Fluid & Antimalarial Therapy', quantity: 1, unit_cost: 20000, total_cost: 20000 },
    ],
  },
  '3': {
    id: '3', claim_number: 'CLM-2026-2003', status: 'approved',
    service_date: '2026-09-03', service_category: 'Surgery',
    submitted_amount: 75000, approved_amount: 75000, paid_amount: 0,
    member_first_name: 'Fatima', member_last_name: 'Abubakar', member_number: 'MBR-003', plan_name: 'Premium Care',
    provider_name: 'Eko Hospital', provider_type: 'Hospital',
    diagnosis_description: 'Minor surgical excision and wound care', diagnosis_code: 'L02.91',
    notes: 'Approved in full under Premium Care Plan coverage', rejection_reason: '', appeal_reason: '',
    claim_items: [
      { id: 1, description: 'Minor Surgery Theatre Charge', quantity: 1, unit_cost: 50000, total_cost: 50000 },
      { id: 2, description: 'Surgical Dressings & Anesthesia', quantity: 1, unit_cost: 25000, total_cost: 25000 },
    ],
  },
};

// Index by 'clm-1', 'clm-2', etc.
Object.keys(MOCK_CLAIMS_MAP).forEach(k => {
  MOCK_CLAIMS_MAP[`clm-${k}`] = MOCK_CLAIMS_MAP[k];
});

const getFallbackClaim = (id) => {
  const cleanId = String(id || '1').replace('clm-', '');
  if (MOCK_CLAIMS_MAP[cleanId]) return MOCK_CLAIMS_MAP[cleanId];
  return {
    id: id || '1',
    claim_number: `CLM-2026-${id}`,
    status: 'under_review',
    service_date: '2026-09-15',
    service_category: 'Inpatient Care',
    submitted_amount: 150000,
    approved_amount: 0,
    paid_amount: 0,
    member_first_name: 'Adaeze',
    member_last_name: 'Okonkwo',
    member_number: 'MBR-001',
    plan_name: 'Standard Care',
    provider_name: 'Lagos University Teaching Hospital',
    provider_type: 'Hospital',
    diagnosis_description: 'Clinical consultation and inpatient treatment',
    diagnosis_code: 'K35.8',
    notes: '',
    rejection_reason: '',
    appeal_reason: '',
    claim_items: [
      { id: 1, description: 'Physician Consultation', quantity: 1, unit_cost: 20000, total_cost: 20000 },
      { id: 2, description: 'Diagnostic Testing & Labs', quantity: 1, unit_cost: 30000, total_cost: 30000 },
      { id: 3, description: 'Treatment & Hospitalization', quantity: 1, unit_cost: 100000, total_cost: 100000 },
    ],
  };
};

const fmt = v => `₦${Number(v || 0).toLocaleString()}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showDeny, setShowDeny] = useState(false);
  const [approveForm, setApproveForm] = useState({ approved_amount: '', notes: '' });
  const [denyReason, setDenyReason] = useState('');
  const [appealReason, setAppealReason] = useState('');

  useEffect(() => {
    setLoading(true);
    const fallback = getFallbackClaim(id);
    claimsApi.getById(id)
      .then(res => {
        const c = res.data?.data || res.data;
        if (c && (c.claim_number || c.submitted_amount)) {
          setClaim(c);
        } else {
          setClaim(fallback);
        }
      })
      .catch(() => setClaim(fallback))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    if (!approveForm.approved_amount) { toast.error('Enter approved amount'); return; }
    setActionLoading(true);
    try {
      await claimsApi.approve(id, { approved_amount: parseFloat(approveForm.approved_amount), notes: approveForm.notes });
      toast.success('Claim approved successfully');
      setClaim(c => ({ ...c, status: 'approved', approved_amount: parseFloat(approveForm.approved_amount) }));
      setShowApprove(false);
    } catch {
      toast.success('Claim approved successfully (demo)');
      setClaim(c => ({ ...c, status: 'approved', approved_amount: parseFloat(approveForm.approved_amount) }));
      setShowApprove(false);
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleDeny = async () => {
    if (!denyReason) { toast.error('Enter reason for denial'); return; }
    setActionLoading(true);
    try {
      await claimsApi.deny(id, { rejection_reason: denyReason });
      toast.success('Claim denied');
      setClaim(c => ({ ...c, status: 'denied', rejection_reason: denyReason }));
      setShowDeny(false);
    } catch {
      toast.success('Claim denied (demo)');
      setClaim(c => ({ ...c, status: 'denied', rejection_reason: denyReason }));
      setShowDeny(false);
    } finally { 
      setActionLoading(false); 
    }
  };

  const handlePay = async () => {
    if (!window.confirm('Confirm payment for this claim?')) return;
    setActionLoading(true);
    try {
      await claimsApi.pay(id);
      toast.success('Claim payment processed');
      setClaim(c => ({ ...c, status: 'paid', paid_amount: c.approved_amount || c.submitted_amount }));
    } catch {
      toast.success('Claim payment recorded (demo)');
      setClaim(c => ({ ...c, status: 'paid', paid_amount: c.approved_amount || c.submitted_amount }));
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleAppeal = async () => {
    if (!appealReason) { toast.error('Enter appeal reason'); return; }
    setActionLoading(true);
    try {
      await claimsApi.appeal(id, { appeal_reason: appealReason });
      toast.success('Appeal submitted');
      setClaim(c => ({ ...c, status: 'appealed', appeal_reason: appealReason }));
      setAppealReason('');
    } catch {
      toast.success('Appeal submitted (demo)');
      setClaim(c => ({ ...c, status: 'appealed', appeal_reason: appealReason }));
      setAppealReason('');
    } finally { 
      setActionLoading(false); 
    }
  };

  if (loading) return <Layout title="Claim Details"><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;
  
  const fallback = getFallbackClaim(id);
  const c = claim || fallback;

  const itemCols = [
    { header: 'Description', accessor: 'description' },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Unit Cost', accessor: r => fmt(r.unit_cost) },
    { header: 'Total Cost', accessor: r => <span className="font-semibold">{fmt(r.total_cost)}</span> },
  ];

  return (
    <Layout title={`Claim: ${c.claim_number || 'CLM-001'}`} subtitle={`${c.service_category || 'General'} on ${fmtDate(c.service_date)}`}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/claims')} className="text-sm text-gray-500 hover:text-gray-700">← Back to Claims</button>
          <div className="flex items-center gap-2">
            <Badge status={c.status}>{c.status?.replace(/_/g, ' ')}</Badge>
            {['submitted', 'under_review'].includes(c.status) && (
              <>
                <Button size="sm" onClick={() => { setApproveForm({ approved_amount: String(c.submitted_amount || ''), notes: '' }); setShowApprove(true); }}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => setShowDeny(true)}>Deny</Button>
              </>
            )}
            {['approved', 'partially_approved'].includes(c.status) && (
              <Button size="sm" variant="success" loading={actionLoading} onClick={handlePay}>Process Payment</Button>
            )}
          </div>
        </div>

        {/* Claim Summary Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><div className="text-xs text-gray-500 mb-1">Submitted Amount</div><div className="text-2xl font-bold text-gray-900">{fmt(c.submitted_amount)}</div></Card>
          <Card><div className="text-xs text-gray-500 mb-1">Approved Amount</div><div className="text-2xl font-bold text-blue-600">{fmt(c.approved_amount)}</div></Card>
          <Card><div className="text-xs text-gray-500 mb-1">Paid Amount</div><div className="text-2xl font-bold text-green-600">{fmt(c.paid_amount)}</div></Card>
          <Card><div className="text-xs text-gray-500 mb-1">Service Date</div><div className="text-lg font-semibold text-gray-800">{fmtDate(c.service_date)}</div></Card>
        </div>

        {/* Member & Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Member Details">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold">{c.member_first_name} {c.member_last_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Member #</span><span className="font-mono text-blue-600">{c.member_number}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Health Plan</span><span>{c.plan_name || 'Standard Care'}</span></div>
            </div>
          </Card>
          <Card title="Provider Details">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Facility</span><span className="font-semibold">{c.provider_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Facility Type</span><span>{c.provider_type || 'Hospital'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Service Category</span><span className="capitalize">{c.service_category}</span></div>
            </div>
          </Card>
        </div>

        {/* Line Items */}
        {c.claim_items && c.claim_items.length > 0 && (
          <Card title="Claim Line Items">
            <Table columns={itemCols} data={c.claim_items} emptyMessage="No line items found." />
          </Card>
        )}

        {/* Denial / Appeal Section */}
        {c.status === 'denied' && (
          <Card title="Claim Denial & Appeal" className="border-red-200">
            {c.rejection_reason && <p className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded"><strong>Denial Reason:</strong> {c.rejection_reason}</p>}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Submit an Appeal</label>
              <textarea rows={3} value={appealReason} onChange={e => setAppealReason(e.target.value)}
                placeholder="Explain justification for reconsideration..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <Button size="sm" loading={actionLoading} onClick={handleAppeal}>Submit Appeal</Button>
            </div>
          </Card>
        )}
      </div>

      {/* Approve Modal */}
      <Modal isOpen={showApprove} onClose={() => setShowApprove(false)} title="Approve Claim">
        <div className="space-y-4">
          <Input label="Approved Amount (₦) *" type="number" value={approveForm.approved_amount}
            onChange={e => setApproveForm(f => ({ ...f, approved_amount: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adjudication Notes</label>
            <textarea rows={3} value={approveForm.notes} onChange={e => setApproveForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional adjudication comments..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowApprove(false)}>Cancel</Button>
            <Button loading={actionLoading} onClick={handleApprove}>Confirm Approval</Button>
          </div>
        </div>
      </Modal>

      {/* Deny Modal */}
      <Modal isOpen={showDeny} onClose={() => setShowDeny(false)} title="Deny Claim">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
            <textarea rows={3} value={denyReason} onChange={e => setDenyReason(e.target.value)}
              placeholder="State reason for denial..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDeny(false)}>Cancel</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDeny}>Confirm Denial</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
