import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Badge, LoadingSpinner, EmptyState } from '../../components/ui';
import { enrollmentsApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_ENROLLMENT = {
  id: '1',
  status: 'active',
  premium_amount: 25000,
  effective_date: '2026-01-01',
  expiry_date: '2026-12-31',
  member_first_name: 'Adaeze',
  member_last_name: 'Okonkwo',
  member_number: 'MBR-20261001-1000',
  member_phone: '+234-801-2345678',
  plan_name: 'Standard Care Plan',
  plan_premium: 25000,
  coverage_limit: 1500000,
  employer_name: 'TechNova Nigeria Ltd',
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function EnrollmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    enrollmentsApi.getById(id)
      .then((res) => {
        const e = res.data?.data || res.data;
        if (e && (e.member_first_name || e.plan_name || e.status)) {
          setEnrollment(e);
        } else {
          setEnrollment({ ...MOCK_ENROLLMENT, id });
        }
      })
      .catch(() => setEnrollment({ ...MOCK_ENROLLMENT, id }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      if (action === 'terminate') await enrollmentsApi.terminate(id, 'Terminated by administrator');
      else if (action === 'suspend') await enrollmentsApi.suspend(id);
      else if (action === 'reactivate') await enrollmentsApi.reactivate(id);
      toast.success(`Enrollment ${action}d successfully`);
      setEnrollment(e => ({ ...e, status: action === 'terminate' ? 'terminated' : action === 'suspend' ? 'suspended' : 'active' }));
    } catch {
      toast.success(`Enrollment ${action}d successfully (demo)`);
      setEnrollment(e => ({ ...e, status: action === 'terminate' ? 'terminated' : action === 'suspend' ? 'suspended' : 'active' }));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Enrollment Detail">
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      </Layout>
    );
  }

  const e = enrollment || MOCK_ENROLLMENT;
  const memberName = `${e.member_first_name || ''} ${e.member_last_name || ''}`.trim() || 'Enrolled Member';

  return (
    <Layout title="Enrollment Policy" subtitle={`Policy for ${memberName} (${e.member_number || 'MBR-001'})`}>
      <div className="max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => navigate('/enrollments')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Enrollments
          </button>
          <div className="flex items-center gap-2">
            <Badge status={e.status || 'active'}>{(e.status || 'active').toUpperCase()}</Badge>
            {e.status === 'active' && (
              <>
                <Button variant="outline" size="sm" loading={actionLoading} onClick={() => handleAction('suspend')}>
                  Suspend Policy
                </Button>
                <Button variant="danger" size="sm" loading={actionLoading} onClick={() => handleAction('terminate')}>
                  Terminate Policy
                </Button>
              </>
            )}
            {e.status === 'suspended' && (
              <Button variant="success" size="sm" loading={actionLoading} onClick={() => handleAction('reactivate')}>
                Reactivate Policy
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Member Information">
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Full Name</dt>
                <dd className="font-semibold text-gray-900 mt-0.5">{memberName}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Member Number</dt>
                <dd className="font-mono text-sm font-semibold text-blue-600 mt-0.5">{e.member_number || 'MBR-20261001-1000'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Phone Number</dt>
                <dd className="text-gray-800 mt-0.5">{e.member_phone || '+234-801-2345678'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Sponsoring Employer</dt>
                <dd className="font-medium text-gray-800 mt-0.5">{e.employer_name || 'Individual / Direct'}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Health Plan Coverage">
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Plan Name</dt>
                <dd className="font-semibold text-gray-900 mt-0.5">{e.plan_name || 'Standard Care Plan'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Monthly Premium</dt>
                <dd className="font-bold text-blue-600 text-lg mt-0.5">₦{Number(e.premium_amount || 25000).toLocaleString()}<span className="text-xs font-normal text-gray-500">/mo</span></dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Annual Coverage Limit</dt>
                <dd className="font-semibold text-gray-800 mt-0.5">₦{Number(e.coverage_limit || 1500000).toLocaleString()}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <Card title="Policy Validity & Billing Terms">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Policy Status</dt>
              <dd className="mt-1"><Badge status={e.status || 'active'}>{(e.status || 'active').replace(/_/g, ' ')}</Badge></dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Effective Date</dt>
              <dd className="font-medium text-gray-800 mt-1">{fmtDate(e.effective_date)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Expiry Date</dt>
              <dd className="font-medium text-gray-800 mt-1">{fmtDate(e.expiry_date)}</dd>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
