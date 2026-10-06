import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Modal, Input, Select, LoadingSpinner } from '../../components/ui';
import { plansApi } from '../../api';
import toast from 'react-hot-toast';

const BENEFIT_CATEGORIES = [
  { value: 'outpatient', label: 'Outpatient' }, { value: 'inpatient', label: 'Inpatient' },
  { value: 'surgery', label: 'Surgery' }, { value: 'laboratory', label: 'Laboratory' },
  { value: 'pharmacy', label: 'Pharmacy' }, { value: 'dental', label: 'Dental' },
  { value: 'optical', label: 'Optical' }, { value: 'maternity', label: 'Maternity' },
  { value: 'emergency', label: 'Emergency' }, { value: 'specialist', label: 'Specialist' },
];

const MOCK_PLAN = {
  id: '1', name: 'Standard Care Plan', plan_type: 'individual', status: 'active',
  premium_amount: 25000, coverage_limit: 1500000,
  waiting_period_days: 90, min_age: 0, max_age: 65,
  description: 'Comprehensive healthcare coverage for individuals and families.',
  benefits: [
    { id: '1', service_category: 'outpatient', service_name: 'Consultation', benefit_type: 'percentage', coverage_percentage: 100, annual_limit: 200000, requires_authorization: false },
    { id: '2', service_category: 'inpatient', service_name: 'Hospitalization', benefit_type: 'percentage', coverage_percentage: 80, annual_limit: 800000, requires_authorization: true },
    { id: '3', service_category: 'pharmacy', service_name: 'Prescribed Drugs', benefit_type: 'fixed', fixed_amount: 50000, annual_limit: 100000, requires_authorization: false },
  ],
};

const BLANK_BENEFIT = { service_category: '', service_name: '', benefit_type: 'percentage', coverage_percentage: 100, annual_limit: '', requires_authorization: false };

export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new' || !id;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [benefitForm, setBenefitForm] = useState(BLANK_BENEFIT);
  const [benefitLoading, setBenefitLoading] = useState(false);

  useEffect(() => {
    if (isNew) return;
    plansApi.getById(id)
      .then(res => setPlan(res.data?.data || res.data))
      .catch(() => setPlan(MOCK_PLAN))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleAddBenefit = async () => {
    if (!benefitForm.service_category || !benefitForm.service_name) {
      toast.error('Category and service name are required'); return;
    }
    setBenefitLoading(true);
    try {
      await plansApi.addBenefit(id, benefitForm);
      toast.success('Benefit added');
      const res = await plansApi.getById(id);
      setPlan(res.data?.data || res.data);
      setShowBenefitModal(false);
      setBenefitForm(BLANK_BENEFIT);
    } catch {
      // Mock add for demo
      setPlan(p => ({ ...p, benefits: [...(p.benefits || []), { ...benefitForm, id: Date.now().toString() }] }));
      setShowBenefitModal(false);
      setBenefitForm(BLANK_BENEFIT);
    } finally { setBenefitLoading(false); }
  };

  if (loading) return <Layout title="Plan Details"><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;
  if (!plan && !isNew) return <Layout title="Plan Details"><p className="text-gray-500 mt-8">Plan not found.</p></Layout>;

  const benefitCols = [
    { header: 'Category', accessor: row => <span className="capitalize">{row.service_category}</span> },
    { header: 'Service', accessor: 'service_name' },
    { header: 'Benefit Type', accessor: row => <Badge status={row.benefit_type === 'percentage' ? 'active' : 'pending'}>{row.benefit_type}</Badge> },
    { header: 'Coverage', accessor: row => row.benefit_type === 'percentage' ? `${row.coverage_percentage}%` : `₦${Number(row.fixed_amount || 0).toLocaleString()}` },
    { header: 'Annual Limit', accessor: row => `₦${Number(row.annual_limit || 0).toLocaleString()}` },
    { header: 'Requires Auth', accessor: row => <Badge status={row.requires_authorization ? 'pending' : 'active'}>{row.requires_authorization ? 'Yes' : 'No'}</Badge> },
  ];

  return (
    <Layout title={plan?.name || 'Plan Details'} subtitle="Health plan configuration and benefits">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/plans')} className="text-sm text-gray-500 hover:text-gray-700">← Back to Plans</button>
        <Button onClick={() => navigate(`/plans/${id}/edit`)}>Edit Plan</Button>
      </div>

      {/* Plan summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{plan?.name}</h2>
            <p className="opacity-80 text-sm mb-4">{plan?.description}</p>
            <div className="flex gap-6">
              <div><div className="text-sm opacity-70">Premium</div><div className="text-xl font-bold">₦{Number(plan?.premium_amount || 0).toLocaleString()}<span className="text-sm font-normal opacity-70">/mo</span></div></div>
              <div><div className="text-sm opacity-70">Coverage Limit</div><div className="text-xl font-bold">₦{Number(plan?.coverage_limit || 0).toLocaleString()}</div></div>
              <div><div className="text-sm opacity-70">Waiting Period</div><div className="text-xl font-bold">{plan?.waiting_period_days || 90} days</div></div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge status={plan?.status} className="text-sm">{plan?.status}</Badge>
            <span className="text-sm opacity-70 capitalize">{plan?.plan_type} plan</span>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <Card
        title="Plan Benefits"
        subtitle={`${(plan?.benefits || []).length} benefits configured`}
        action={<Button size="sm" onClick={() => setShowBenefitModal(true)}>+ Add Benefit</Button>}
      >
        <Table columns={benefitCols} data={plan?.benefits || []} emptyMessage="No benefits configured yet. Click 'Add Benefit' to get started." />
      </Card>

      {/* Add Benefit Modal */}
      {showBenefitModal && (
        <Modal title="Add Plan Benefit" onClose={() => setShowBenefitModal(false)}
          footer={<><Button variant="outline" onClick={() => setShowBenefitModal(false)}>Cancel</Button><Button loading={benefitLoading} onClick={handleAddBenefit}>Add Benefit</Button></>}>
          <div className="space-y-4">
            <Select label="Service Category *" options={BENEFIT_CATEGORIES} value={benefitForm.service_category}
              onChange={e => setBenefitForm(f => ({ ...f, service_category: e.target.value }))} placeholder="Select category..." />
            <Input label="Service Name *" value={benefitForm.service_name}
              onChange={e => setBenefitForm(f => ({ ...f, service_name: e.target.value }))} placeholder="e.g. Consultation, Hospitalization" />
            <Select label="Benefit Type" value={benefitForm.benefit_type}
              onChange={e => setBenefitForm(f => ({ ...f, benefit_type: e.target.value }))}
              options={[{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed Amount' }, { value: 'full', label: 'Full Cover' }]} />
            {benefitForm.benefit_type === 'percentage' && (
              <Input label="Coverage %" type="number" min="0" max="100" value={benefitForm.coverage_percentage}
                onChange={e => setBenefitForm(f => ({ ...f, coverage_percentage: e.target.value }))} />
            )}
            <Input label="Annual Limit (₦)" type="number" min="0" value={benefitForm.annual_limit}
              onChange={e => setBenefitForm(f => ({ ...f, annual_limit: e.target.value }))} />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="req_auth" checked={benefitForm.requires_authorization}
                onChange={e => setBenefitForm(f => ({ ...f, requires_authorization: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600" />
              <label htmlFor="req_auth" className="text-sm font-medium text-gray-700">Requires pre-authorization</label>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
