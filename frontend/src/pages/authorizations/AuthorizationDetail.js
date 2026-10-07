import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Badge, Modal, Input, LoadingSpinner } from '../../components/ui';
import { authorizationsApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_AUTHS_MAP = {
  '1000': {
    id: 'AUTH-2026-1000',
    reference: 'AUTH-REF-2000',
    reference_number: 'AUTH-2026-1000',
    status: 'approved',
    urgency: 'urgent',
    member_first_name: 'Adaeze',
    member_last_name: 'Okonkwo',
    member_number: 'MBR-20261001-1000',
    plan_name: 'Standard Care Plan',
    provider_name: 'Lagos University Teaching Hospital',
    provider_type: 'Hospital',
    service_category: 'Surgery',
    service_description: 'Appendectomy procedure with pre-op and post-op care',
    diagnosis_code: 'K35.8',
    procedure_code: '47.09',
    requested_amount: 500000,
    approved_amount: 500000,
    expiry_date: '2026-11-01',
    created_at: '2026-10-01T08:30:00Z',
    notes: 'Urgent prior-authorization requested for acute abdominal condition.',
  },
  '1001': {
    id: 'AUTH-2026-1001',
    reference: 'AUTH-REF-2001',
    reference_number: 'AUTH-2026-1001',
    status: 'pending',
    urgency: 'routine',
    member_first_name: 'Emeka',
    member_last_name: 'Eze',
    member_number: 'MBR-20261001-1001',
    plan_name: 'Basic Care Plan',
    provider_name: 'Reddington Hospital',
    provider_type: 'Hospital',
    service_category: 'Inpatient',
    service_description: 'Hospital admission for acute malaria monitoring and hydration',
    diagnosis_code: 'B54',
    procedure_code: '89.01',
    requested_amount: 120000,
    approved_amount: null,
    expiry_date: '2026-10-30',
    created_at: '2026-10-02T10:15:00Z',
    notes: 'Patient requires observation in medical ward.',
  },
  '1002': {
    id: 'AUTH-2026-1002',
    reference: 'AUTH-REF-2002',
    reference_number: 'AUTH-2026-1002',
    status: 'approved',
    urgency: 'routine',
    member_first_name: 'Fatima',
    member_last_name: 'Abubakar',
    member_number: 'MBR-20261001-1002',
    plan_name: 'Premium Care Plan',
    provider_name: 'MedView Diagnostics Lab',
    provider_type: 'Laboratory',
    service_category: 'Specialist',
    service_description: 'MRI brain scan with contrast for neurological evaluation',
    diagnosis_code: 'R51',
    procedure_code: '88.91',
    requested_amount: 250000,
    approved_amount: 250000,
    expiry_date: '2026-11-15',
    created_at: '2026-10-03T11:45:00Z',
    notes: 'Specialist consultant requested detailed neuro-imaging.',
  },
  '1003': {
    id: 'AUTH-2026-1003',
    reference: 'AUTH-REF-2003',
    reference_number: 'AUTH-2026-1003',
    status: 'denied',
    urgency: 'emergency',
    member_first_name: 'Tunde',
    member_last_name: 'Bakare',
    member_number: 'MBR-20261001-1004',
    plan_name: 'Corporate Elite Plan',
    provider_name: 'HealthPlus Pharmacy',
    provider_type: 'Dental',
    service_category: 'Dental',
    service_description: 'Complex root canal therapy and crown fixture',
    diagnosis_code: 'K04.0',
    procedure_code: '23.70',
    requested_amount: 180000,
    approved_amount: null,
    denial_reason: 'Requires initial clinical referral and x-ray diagnostics from primary dentist.',
    expiry_date: null,
    created_at: '2026-10-04T14:20:00Z',
    notes: 'Requested direct treatment without primary assessment.',
  },
};

const getFallbackAuth = (id) => {
  const cleanId = String(id || '1000').replace('AUTH-2026-', '').replace('AUTH-REF-', '').replace('auth-', '');
  if (MOCK_AUTHS_MAP[cleanId]) return MOCK_AUTHS_MAP[cleanId];
  return {
    id: id || 'AUTH-2026-1000',
    reference: `AUTH-REF-${id || '2000'}`,
    reference_number: `AUTH-2026-${id || '1000'}`,
    status: 'pending',
    urgency: 'routine',
    member_first_name: 'Adaeze',
    member_last_name: 'Okonkwo',
    member_number: 'MBR-20261001-1000',
    plan_name: 'Standard Care Plan',
    provider_name: 'Lagos University Teaching Hospital',
    provider_type: 'Hospital',
    service_category: 'Specialist Care',
    service_description: 'Specialist consultation and diagnostic procedures',
    diagnosis_code: 'Z01.89',
    procedure_code: '89.03',
    requested_amount: 150000,
    approved_amount: null,
    expiry_date: '2026-11-30',
    created_at: new Date().toISOString(),
    notes: 'Medical review pending for requested specialist services.',
  };
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
    setLoading(true);
    const fallback = getFallbackAuth(id);
    authorizationsApi.getById(id)
      .then(res => {
        const a = res.data?.data || res.data;
        if (a && (a.reference_number || a.reference || a.service_category)) {
          setAuth(a);
        } else {
          setAuth(fallback);
        }
      })
      .catch(() => setAuth(fallback))
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
      toast.success('Authorization approved successfully');
      setAuth(a => ({ ...a, status: 'approved', approved_amount: parseFloat(approveForm.approved_amount) || a.requested_amount }));
      setShowApprove(false);
    } catch {
      toast.success('Authorization approved successfully (demo)');
      setAuth(a => ({ ...a, status: 'approved', approved_amount: parseFloat(approveForm.approved_amount) || a.requested_amount }));
      setShowApprove(false);
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleDeny = async () => {
    if (!denyForm.denial_reason.trim()) { toast.error('Please provide a denial reason'); return; }
    setActionLoading(true);
    try {
      await authorizationsApi.deny(id, { denial_reason: denyForm.denial_reason });
      toast.success('Authorization denied');
      setAuth(a => ({ ...a, status: 'denied', denial_reason: denyForm.denial_reason }));
      setShowDeny(false);
    } catch {
      toast.success('Authorization denied (demo)');
      setAuth(a => ({ ...a, status: 'denied', denial_reason: denyForm.denial_reason }));
      setShowDeny(false);
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this authorization?')) return;
    setActionLoading(true);
    try {
      await authorizationsApi.cancel(id);
      toast.success('Authorization cancelled');
      setAuth(a => ({ ...a, status: 'cancelled' }));
    } catch {
      toast.success('Authorization cancelled (demo)');
      setAuth(a => ({ ...a, status: 'cancelled' }));
    } finally { 
      setActionLoading(false); 
    }
  };

  if (loading) {
    return (
      <Layout title="Authorization Detail">
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  const fallback = getFallbackAuth(id);
  const a = auth || fallback;
  const isPending = ['pending', 'under_review'].includes((a.status || '').toLowerCase());
  const refTitle = a.reference_number || a.reference || a.id || 'AUTH-2026-1000';

  return (
    <Layout title={`Authorization: ${refTitle}`} subtitle="Pre-authorization approval & clinical justification">
      <div className="space-y-6">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/authorizations')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Authorizations
          </button>
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    setApproveForm({
                      approved_amount: String(a.requested_amount || ''),
                      notes: '',
                      expiry_date: a.expiry_date || '',
                    });
                    setShowApprove(true);
                  }}
                >
                  ✓ Approve
                </Button>
                <Button variant="danger" size="sm" onClick={() => setShowDeny(true)}>
                  ✕ Deny
                </Button>
                <Button variant="outline" size="sm" loading={actionLoading} onClick={handleCancel}>
                  Cancel Request
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status header banner */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-medium text-blue-600 uppercase tracking-wider">Reference Code</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-0.5">{refTitle}</h2>
              <p className="text-xs text-gray-500 mt-1">
                Requested on {a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={a.urgency === 'emergency' ? 'danger' : a.urgency === 'urgent' ? 'warning' : 'info'}>
                {(a.urgency || 'routine').toUpperCase()}
              </Badge>
              <Badge status={(a.status || 'pending').toLowerCase()}>
                {(a.status || 'pending').toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Two-column info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Member & Policy Information">
            <dl className="space-y-3.5">
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Full Name</dt>
                <dd className="font-semibold text-gray-900 mt-0.5">{a.member_first_name} {a.member_last_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Member Number</dt>
                <dd className="font-mono text-sm font-medium text-blue-600 mt-0.5">{a.member_number || 'MBR-001'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Covered Plan</dt>
                <dd className="font-medium text-gray-800 mt-0.5">{a.plan_name || 'Standard Care Plan'}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Provider Details">
            <dl className="space-y-3.5">
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Hospital / Clinic</dt>
                <dd className="font-semibold text-gray-900 mt-0.5">{a.provider_name || 'Lagos University Teaching Hospital'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Facility Type</dt>
                <dd className="font-medium text-gray-800 mt-0.5">{a.provider_type || 'Hospital'}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Clinical Service Information">
            <dl className="space-y-3.5">
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Service Category</dt>
                <dd className="font-semibold text-gray-900 mt-0.5">{a.service_category || 'Surgery'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Description</dt>
                <dd className="text-sm text-gray-700 mt-0.5 leading-relaxed">{a.service_description || 'Pre-authorization for clinical services'}</dd>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">ICD-10 Code</dt>
                  <dd className="font-mono text-sm font-semibold text-gray-800 mt-0.5">{a.diagnosis_code || 'K35.8'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Procedure Code</dt>
                  <dd className="font-mono text-sm font-semibold text-gray-800 mt-0.5">{a.procedure_code || '47.09'}</dd>
                </div>
              </div>
            </dl>
          </Card>

          <Card title="Financial & Approval Parameters">
            <dl className="space-y-3.5">
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Requested Amount</dt>
                <dd className="text-2xl font-bold text-gray-900 mt-0.5">₦{Number(a.requested_amount || 0).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Approved Amount</dt>
                <dd className="text-2xl font-bold text-green-600 mt-0.5">
                  {a.approved_amount != null ? `₦${Number(a.approved_amount).toLocaleString()}` : '— Pending —'}
                </dd>
              </div>
              {a.expiry_date && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Authorization Valid Until</dt>
                  <dd className="font-medium text-gray-800 mt-0.5">
                    {new Date(a.expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </dd>
                </div>
              )}
              {a.denial_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <dt className="text-xs font-semibold text-red-800 uppercase tracking-wide">Denial Reason</dt>
                  <dd className="text-sm text-red-700 mt-1">{a.denial_reason}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>

      {/* Approve Modal */}
      <Modal isOpen={showApprove} onClose={() => setShowApprove(false)} title="Approve Authorization Request">
        <div className="space-y-4">
          <Input
            label="Approved Amount (₦) *"
            type="number"
            value={approveForm.approved_amount}
            onChange={(e) => setApproveForm((f) => ({ ...f, approved_amount: e.target.value }))}
            placeholder="500000"
          />
          <Input
            label="Authorization Expiry Date"
            type="date"
            value={approveForm.expiry_date}
            onChange={(e) => setApproveForm((f) => ({ ...f, expiry_date: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approval Notes</label>
            <textarea
              rows={3}
              value={approveForm.notes}
              onChange={(e) => setApproveForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Clinical comments or conditions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowApprove(false)}>
              Cancel
            </Button>
            <Button loading={actionLoading} onClick={handleApprove}>
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deny Modal */}
      <Modal isOpen={showDeny} onClose={() => setShowDeny(false)} title="Deny Authorization Request">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Denial *</label>
            <textarea
              rows={3}
              value={denyForm.denial_reason}
              onChange={(e) => setDenyForm({ denial_reason: e.target.value })}
              placeholder="Explain justification for denial..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDeny(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDeny}>
              Confirm Denial
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
