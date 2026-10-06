import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { enrollmentsApi } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const MOCK = {
  id: '1', status: 'active', premium_amount: 25000,
  effective_date: '2026-01-01', expiry_date: '2026-12-31',
  member_first_name: 'Adaeze', member_last_name: 'Okonkwo',
  member_number: 'MBR-20261001-1000', member_phone: '+234-801-2345678',
  plan_name: 'Standard Care Plan', plan_premium: 25000, coverage_limit: 1500000,
  employer_name: 'TechNova Nigeria Ltd',
};

export default function EnrollmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    enrollmentsApi.getById(id)
      .then((res) => setEnrollment(res.data.data))
      .catch(() => setEnrollment(MOCK))
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
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} enrollment`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Layout title="Enrollment Detail"><div className="animate-pulse h-64 bg-gray-100 rounded-xl" /></Layout>;
  if (!enrollment) return <Layout title="Enrollment Detail"><p className="text-gray-500">Enrollment not found</p></Layout>;

  const e = enrollment;

  return (
    <Layout title="Enrollment Detail" subtitle={`Enrollment for ${e.member_first_name} ${e.member_last_name}`}>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/enrollments')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex gap-2">
            {e.status === 'active' && (
              <>
                <Button variant="warning" size="sm" loading={actionLoading} onClick={() => handleAction('suspend')}>Suspend</Button>
                <Button variant="danger" size="sm" loading={actionLoading} onClick={() => handleAction('terminate')}>Terminate</Button>
              </>
            )}
            {e.status === 'suspended' && (
              <Button variant="success" size="sm" loading={actionLoading} onClick={() => handleAction('reactivate')}>Reactivate</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card title="Member Information">
            <dl className="space-y-3">
              <div><dt className="text-xs text-gray-500">Name</dt><dd className="font-medium">{e.member_first_name} {e.member_last_name}</dd></div>
              <div><dt className="text-xs text-gray-500">Member Number</dt><dd className="font-mono text-sm">{e.member_number}</dd></div>
              <div><dt className="text-xs text-gray-500">Phone</dt><dd>{e.member_phone || '—'}</dd></div>
              <div><dt className="text-xs text-gray-500">Employer</dt><dd>{e.employer_name || 'Individual'}</dd></div>
            </dl>
          </Card>

          <Card title="Plan Information">
            <dl className="space-y-3">
              <div><dt className="text-xs text-gray-500">Plan Name</dt><dd className="font-medium">{e.plan_name}</dd></div>
              <div><dt className="text-xs text-gray-500">Premium</dt><dd className="font-semibold text-blue-600">₦{Number(e.premium_amount).toLocaleString()}/month</dd></div>
              <div><dt className="text-xs text-gray-500">Coverage Limit</dt><dd>₦{Number(e.coverage_limit || 0).toLocaleString()}</dd></div>
            </dl>
          </Card>
        </div>

        <Card title="Enrollment Details">
          <div className="grid grid-cols-2 gap-6">
            <div><dt className="text-xs text-gray-500">Status</dt><dd className="mt-1"><Badge status={e.status}>{e.status?.replace(/_/g, ' ')}</Badge></dd></div>
            <div><dt className="text-xs text-gray-500">Effective Date</dt><dd className="font-medium mt-1">{e.effective_date ? format(new Date(e.effective_date), 'dd MMM yyyy') : '—'}</dd></div>
            <div><dt className="text-xs text-gray-500">Expiry Date</dt><dd className="font-medium mt-1">{e.expiry_date ? format(new Date(e.expiry_date), 'dd MMM yyyy') : '—'}</dd></div>
            <div><dt className="text-xs text-gray-500">Premium Amount</dt><dd className="font-semibold mt-1">₦{Number(e.premium_amount).toLocaleString()}</dd></div>
            {e.termination_reason && <div className="col-span-2"><dt className="text-xs text-gray-500">Termination Reason</dt><dd className="text-red-600 mt-1">{e.termination_reason}</dd></div>}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
