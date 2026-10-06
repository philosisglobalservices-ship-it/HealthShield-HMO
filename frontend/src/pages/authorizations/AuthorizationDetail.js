import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Badge, Modal, Input } from '../../components/ui';
import { authorizationsApi, membersApi, providersApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK = {
  id: 'AUTH-2026-1000', reference: 'AUTH-REF-2000', status: 'pending', urgency: 'urgent',
  member_first_name: 'Adaeze', member_last_name: 'Okonkwo', member_number: 'MBR-20261001-1000',
  plan_name: 'Standard Care Plan',
  provider_name: 'Lagos University Teaching Hospital', provider_type: 'Hospital',
  service_category: 'Surgery', service_description: 'Appendectomy procedure',
  diagnosis_code: 'K35.8', procedure_code: '47.09',
  requested_amount: 500000, approved_amount: null,
  expiry_date: '2026-11-01', created_at: new Date().toISOString(),
  notes: 'Patient requires urgent attention.',
};

export default function AuthorizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showApprove, setShowApprove] = useState(false);
  const [showDeny, setShowDeny] = useState(false);
  const [approveForm, setApproveForm] = useState({ approved_amount: '', notes: '', expiry_date: '' });
  const [denyForm, setDenyForm] = useState({ denial_reason: '' });

  useEffect(() => {
    authorizationsApi.getById(id)
      .then(res => setAuth(res.data.data || res.data))
      .catch(() => setAuth(MOCK))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await authorizationsApi.approve(id, {
        approved_amount: parseFloat(approveForm.approved_amount) || auth.requested_amount,
        notes: approveForm.notes,
        expiry_date: approveForm.expiry_date,
      });
      toast.success('Authorization approved');
      setAuth(a => ({ ...a, status: 'approved', approved_amount: parseFloat(approveForm.approved_amount) }));
      setShowApprove(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally { setActionLoading(false); }
  };

  const handleDeny = async () => {
    if (!denyForm.denial_reason.trim()) { toast.error('Please provide a denial reason'); return; }
    setActionLoading(true);
    try {
      await authorizationsApi.deny(id, { denial_reason: denyForm.denial_reason });
      toast.success('Authorization denied');
      setAuth(a => ({ ...a, status: 'denied' }));
      setShowDeny(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deny');
    } finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this authorization?')) return;
    setActionLoading(true);
    try {
      await authorizationsApi.cancel(id);
      toast.success('Authorization cancelled');
      setAuth(a => ({ ...a, status: 'cancelled' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally { setActionLoading(false); }
  };

  if (loading) return (
    <Layout title="Authorization Detail">
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-2 gap-4"><div className="h-48 bg-gray-100 rounded-xl" /><div className="h-48 bg-gray-100 rounded-xl" /></div>
      </div>
    </Layout>
  );

  if (!auth) return <Layout title="Authorization Detail"><p className="text-gray-500">Not found.</p></Layout>;

  const isPending = ['pending', 'under_review'].includes(auth.status);

  return (
    <Layout title={`Authorization ${auth.reference || auth.id}`} subtitle="Pre-authorization request details">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          ← Back to Authorizations
        </button>
        <div className="flex gap-2">
          {isPending && (
            <>
              <Button variant="success" size="sm" onClick={() => { setApproveForm({ approved_amount: auth.requested_amount || '', notes: '', expiry_date: '' }); setShowApprove(true); }}>
                ✓ Approve
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowDeny(true)}>✕ Deny</Button>
              <Button variant="outline" size="sm" loading={actionLoading} onClick={handleCancel}>Cancel</Button>
            </>
          )}
        </div>
      </div>

      {/* Status header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{auth.reference || auth.id}</h2>
            <p className="text-sm text-gray-500">Requested {auth.created_at ? new Date(auth.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
          </div>
          <div className="flex gap-2">
            <Badge status={auth.urgency}>{auth.urgency?.replace(/_/g, ' ')}</Badge>
            <Badge status={auth.status}>{auth.status?.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
      </div>

      {/* Two-column info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="Member Information">
          <dl className="space-y-3">
            <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Full Name</dt><dd className="font-semibold text-gray-900 mt-0.5">{auth.member_first_name} {auth.member_last_name}</dd></div>
            <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Member Number</dt><dd className="font-mono text-sm mt-0.5">{auth.member_number}</dd></div>
            <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Health Plan</dt><dd className="mt-0.5">{auth.plan_name || '—'}</dd></div>
          </dl>
        </Card>

        <Card title="Provider Information">
          <dl className="space-y-3">
            <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Provider Name</dt><dd className="font-semibold text-gray-900 mt-0.5">{auth.provider_name}</dd></div>
            <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Type</dt><dd className="mt-0.5">{auth.provider_type || '—'}</dd></div>
          </dl>
        </Card>

        <Card title="Service Details">
          <dl className="space-y-3">
            <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Category</dt><dd className="font-semibold mt-0.5">{auth.service_category}</dd></div>
            <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Description</dt><dd className="mt-0.5">{auth.service_description || '—'}</dd></div>
            <div><dt className="text-xs text-gray-500 uppercase tracking-wide">ICD Code</dt><dd className="font-mono text-sm mt-0.5">{auth.diagnosis_code || '—'}</dd></div>
            <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Procedure Code</dt><dd className="font-mono text-sm mt-0.5">{auth.procedure_code || '—'}</dd></div>
          </dl>
        </Card>

        <Card title="Authorization Details">
          <dl className="space-y-3">
            <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Requested Amount</dt><dd className="text-lg font-bold text-blue-600 mt-0.5">₦{Number(auth.requested_amount || 0).toLocaleString()}</dd></div>
            {auth.approved_amount != null && (
              <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Approved Amount</dt><dd className="text-lg font-bold text-green-600 mt-0.5">₦{Number(auth.approved_amount).toLocaleString()}</dd></div>
            )}
            <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Expiry Date</dt><dd className="mt-0.5">{auth.expiry_date ? new Date(auth.expiry_date).toLocaleDateString('en-GB') : '—'}</dd></div>
            {auth.denial_reason && (
              <div><dt className="text-xs text-gray-500 uppercase tracking-wide">Denial Reason</dt><dd className="mt-0.5 text-red-600">{auth.denial_reason}</dd></div>
            )}
          </dl>
        </Card>
      </div>

      {auth.notes && (
        <Card title="Notes">
          <p className="text-sm text-gray-700">{auth.notes}</p>
        </Card>
      )}

      {/* Approve Modal */}
      {showApprove && (
        <Modal title="Approve Authorization" onClose={() => setShowApprove(false)}
          footer={<><Button variant="outline" onClick={() => setShowApprove(false)}>Cancel</Button><Button variant="success" loading={actionLoading} onClick={handleApprove}>Confirm Approval</Button></>}>
          <div className="space-y-4">
            <Input label="Approved Amount (₦) *" type="number" min="0" step="0.01"
              value={approveForm.approved_amount}
              onChange={e => setApproveForm(f => ({ ...f, approved_amount: e.target.value }))} />
            <Input label="Expiry Date" type="date"
              value={approveForm.expiry_date}
              onChange={e => setApproveForm(f => ({ ...f, expiry_date: e.target.value }))} />
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
        <Modal title="Deny Authorization" onClose={() => setShowDeny(false)}
          footer={<><Button variant="outline" onClick={() => setShowDeny(false)}>Cancel</Button><Button variant="danger" loading={actionLoading} onClick={handleDeny}>Confirm Denial</Button></>}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Denial Reason *</label>
            <textarea value={denyForm.denial_reason} onChange={e => setDenyForm({ denial_reason: e.target.value })}
              rows={4} placeholder="Explain why this authorization is being denied..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
          </div>
        </Modal>
      )}
    </Layout>
  );
}
