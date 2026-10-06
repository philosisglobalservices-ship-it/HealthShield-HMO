import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Modal, Input, LoadingSpinner } from '../../components/ui';
import { claimsApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK = {
  id: 'mock-1', claim_number: 'CLM-20261001-2001', status: 'under_review',
  service_date: '2026-09-25', service_category: 'Inpatient',
  submitted_amount: 150000, approved_amount: 0, paid_amount: 0,
  member_first_name: 'Adaeze', member_last_name: 'Okonkwo',
  member_number: 'MBR-001', plan_name: 'Standard Care',
  provider_name: 'Lagos University Teaching Hospital', provider_type: 'Hospital',
  diagnosis_description: 'Acute appendicitis', diagnosis_code: 'K35.8',
  notes: '', rejection_reason: '', appeal_reason: '',
  claim_items: [
    { id: 1, description: 'Consultation', quantity: 1, unit_cost: 20000, total_cost: 20000 },
    { id: 2, description: 'Laboratory Tests', quantity: 1, unit_cost: 30000, total_cost: 30000 },
    { id: 3, description: 'Surgery - Appendectomy', quantity: 1, unit_cost: 100000, total_cost: 100000 },
  ],
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
    claimsApi.getById(id)
      .then(res => setClaim(res.data?.data || res.data))
      .catch(() => setClaim(MOCK))
      .finally(() => setLoading(false));
  }, [id]);

  const refresh = () => claimsApi.getById(id).then(res => setClaim(res.data?.data || res.data)).catch(() => {});

  const handleApprove = async () => {
    if (!approveForm.approved_amount) { toast.error('Enter approved amount'); return; }
    setActionLoading(true);
    try {
      await claimsApi.approve(id, { approved_amount: parseFloat(approveForm.approved_amount), notes: approveForm.notes });
      toast.success('Claim approved');
      setClaim(c => ({ ...c, status: 'approved', approved_amount: parseFloat(approveForm.approved_amount) }));
      setShowApprove(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to approve'); }
    finally { setActionLoading(false); }
  };

  const handleDeny = async () => {
    if (!denyReason.trim()) { toast.error('Provide a rejection reason'); return; }
    setActionLoading(true);
    try {
      await claimsApi.deny(id, { rejection_reason: denyReason });
      toast.success('Claim denied');
      setClaim(c => ({ ...c, status: 'denied', rejection_reason: denyReason }));
      setShowDeny(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to deny'); }
    finally { setActionLoading(false); }
  };

  const handlePay = async () => {
    if (!window.confirm(`Process payment of ${fmt(claim?.approved_amount)}?`)) return;
    setActionLoading(true);
    try {
      await claimsApi.pay(id);
      toast.success('Payment processed');
      setClaim(c => ({ ...c, status: 'paid', paid_amount: c.approved_amount }));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to process payment'); }
    finally { setActionLoading(false); }
  };

  const handleAppeal = async () => {
    if (!appealReason.trim()) { toast.error('Provide an appeal reason'); return; }
    setActionLoading(true);
    try {
      await claimsApi.appeal(id, { appeal_reason: appealReason });
      toast.success('Appeal submitted');
      setClaim(c => ({ ...c, status: 'appealed' }));
      setAppealReason('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit appeal'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <Layout title="Claim Detail"><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;
  if (!claim) return <Layout title="Claim Detail"><p className="text-gray-500 mt-8">Claim not found.</p></Layout>;

  const isPending = ['submitted', 'under_review'].includes(claim.status);
  const isApproved = ['approved', 'partially_approved'].includes(claim.status);

  const itemCols = [
    { header: 'Description', accessor: 'description' },
    { header: 'Qty', accessor: 'quantity' },
    { header: 'Unit Cost', accessor: row => fmt(row.unit_cost) },
    { header: 'Total', accessor: row => <span className="font-semibold">{fmt(row.total_cost)}</span> },
  ];

  return (
    <Layout title={`Claim ${claim.claim_number}`} subtitle="Claim details and adjudication">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/claims')} className="text-sm text-gray-500 hover:text-gray-700">← Back to Claims</button>
        <div className="flex gap-2">
          {isPending && <>
            <Button variant="success" size="sm" onClick={() => { setApproveForm({ approved_amount: claim.submitted_amount, notes: '' }); setShowApprove(true); }}>✓ Approve</Button>
            <Button variant="danger" size="sm" onClick={() => setShowDeny(true)}>✕ Deny</Button>
          </>}
          {isApproved && <Button size="sm" loading={actionLoading} onClick={handlePay}>💳 Process Payment</Button>}
        </div>
      </div>

      {/* Status header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{claim.claim_number}</h2>
            <p className="text-sm text-gray-500">{claim.service_category} · {fmtDate(claim.service_date)}</p>
            {claim.diagnosis_code && <p className="text-sm text-gray-400 mt-1">ICD: {claim.diagnosis_code} — {claim.diagnosis_description}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge status={claim.status} className="text-sm">{claim.status?.replace(/_/g, ' ')}</Badge>
            <div className="text-right text-sm space-y-0.5">
              <div>Submitted: <span className="font-semibold">{fmt(claim.submitted_amount)}</span></div>
              {claim.approved_amount > 0 && <div>Approved: <span className="font-semibold text-green-600">{fmt(claim.approved_amount)}</span></div>}
              {claim.paid_amount > 0 && <div>Paid: <span className="font-semibold text-blue-600">{fmt(claim.paid_amount)}</span></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Member & Provider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <Card title="Member">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-400 text-xs uppercase">Name</dt><dd className="font-semibold">{claim.member_first_name} {claim.member_last_name}</dd></div>
            <div><dt className="text-gray-400 text-xs uppercase">Member #</dt><dd className="font-mono">{claim.member_number}</dd></div>
            <div><dt className="text-gray-400 text-xs uppercase">Plan</dt><dd>{claim.plan_name || '—'}</dd></div>
          </dl>
        </Card>
        <Card title="Provider">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-400 text-xs uppercase">Name</dt><dd className="font-semibold">{claim.provider_name}</dd></div>
            <div><dt className="text-gray-400 text-xs uppercase">Type</dt><dd className="capitalize">{claim.provider_type || '—'}</dd></div>
          </dl>
        </Card>
      </div>

      {/* Line items */}
      {claim.claim_items?.length > 0 && (
        <Card title="Claim Line Items" className="mb-5">
          <Table columns={itemCols} data={claim.claim_items} />
          <div className="flex justify-end px-6 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500 mr-4">Total:</span>
            <span className="font-bold text-lg">{fmt(claim.submitted_amount)}</span>
          </div>
        </Card>
      )}

      {/* Denial reason */}
      {claim.rejection_reason && (
        <Card title="Denial Reason" className="mb-5 border-red-200">
          <p className="text-red-600 text-sm">{claim.rejection_reason}</p>
        </Card>
      )}

      {/* Appeal section */}
      {claim.status === 'denied' && !claim.appeal_reason && (
        <Card title="Submit Appeal" className="mb-5 border-orange-200 bg-orange-50">
          <div className="space-y-3">
            <textarea value={appealReason} onChange={e => setAppealReason(e.target.value)} rows={3}
              placeholder="Explain why this claim should be reconsidered..."
              className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
            <Button variant="warning" loading={actionLoading} onClick={handleAppeal}>Submit Appeal</Button>
          </div>
        </Card>
      )}

      {/* Notes */}
      {claim.notes && <Card title="Notes"><p className="text-sm text-gray-600">{claim.notes}</p></Card>}

      {/* Approve Modal */}
      {showApprove && (
        <Modal title="Approve Claim" onClose={() => setShowApprove(false)}
          footer={<><Button variant="outline" onClick={() => setShowApprove(false)}>Cancel</Button><Button variant="success" loading={actionLoading} onClick={handleApprove}>Confirm Approval</Button></>}>
          <div className="space-y-4">
            <Input label="Approved Amount (₦) *" type="number" min="0" step="0.01"
              value={approveForm.approved_amount}
              onChange={e => setApproveForm(f => ({ ...f, approved_amount: e.target.value }))}
              helperText={`Submitted: ${fmt(claim.submitted_amount)}`} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={approveForm.notes} onChange={e => setApproveForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        </Modal>
      )}

      {/* Deny Modal */}
      {showDeny && (
        <Modal title="Deny Claim" onClose={() => setShowDeny(false)}
          footer={<><Button variant="outline" onClick={() => setShowDeny(false)}>Cancel</Button><Button variant="danger" loading={actionLoading} onClick={handleDeny}>Confirm Denial</Button></>}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
            <textarea value={denyReason} onChange={e => setDenyReason(e.target.value)} rows={4}
              placeholder="Explain why this claim is being denied..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
          </div>
        </Modal>
      )}
    </Layout>
  );
}
