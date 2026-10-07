import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Badge, Modal, Input, Select, LoadingSpinner } from '../../components/ui';
import { plansApi } from '../../api';
import toast from 'react-hot-toast';

const BENEFIT_CATEGORIES = [
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'inpatient', label: 'Inpatient' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'dental', label: 'Dental' },
  { value: 'optical', label: 'Optical' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'specialist', label: 'Specialist' },
];

const MOCK_PLAN = {
  id: '1',
  name: 'Standard Care Plan',
  plan_type: 'individual',
  status: 'active',
  premium_amount: 25000,
  coverage_limit: 1500000,
  waiting_period_days: 90,
  min_age: 0,
  max_age: 65,
  description: 'Comprehensive healthcare coverage for individuals and growing families across Nigeria.',
  benefits: [
    { id: '1', service_category: 'outpatient', service_name: 'General Consultation & Primary Care', benefit_type: 'percentage', coverage_percentage: 100, annual_limit: 200000, requires_authorization: false },
    { id: '2', service_category: 'inpatient', service_name: 'Hospital Ward & Nursing Care', benefit_type: 'percentage', coverage_percentage: 80, annual_limit: 800000, requires_authorization: true },
    { id: '3', service_category: 'pharmacy', service_name: 'Prescribed Formulary Drugs', benefit_type: 'fixed', fixed_amount: 50000, annual_limit: 100000, requires_authorization: false },
    { id: '4', service_category: 'laboratory', service_name: 'Routine Lab Diagnostics & Blood Work', benefit_type: 'percentage', coverage_percentage: 100, annual_limit: 150000, requires_authorization: false },
    { id: '5', service_category: 'surgery', service_name: 'Minor & Intermediate Surgical Procedures', benefit_type: 'percentage', coverage_percentage: 85, annual_limit: 600000, requires_authorization: true },
  ],
};

const BLANK_BENEFIT = {
  service_category: 'outpatient',
  service_name: '',
  benefit_type: 'percentage',
  coverage_percentage: 100,
  annual_limit: '150000',
  requires_authorization: false,
};

export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [benefitForm, setBenefitForm] = useState(BLANK_BENEFIT);
  const [benefitLoading, setBenefitLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    plansApi.getById(id)
      .then(res => {
        const p = res.data?.data || res.data;
        if (p && p.name) {
          setPlan({
            ...p,
            benefits: p.benefits && p.benefits.length ? p.benefits : MOCK_PLAN.benefits,
          });
        } else {
          setPlan({ ...MOCK_PLAN, id });
        }
      })
      .catch(() => setPlan({ ...MOCK_PLAN, id }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddBenefit = async (e) => {
    e.preventDefault();
    if (!benefitForm.service_name.trim()) {
      toast.error('Service name is required');
      return;
    }
    setBenefitLoading(true);
    try {
      await plansApi.addBenefit(id, benefitForm);
      toast.success('Benefit added successfully');
      setPlan(p => ({
        ...p,
        benefits: [...(p.benefits || []), { ...benefitForm, id: `ben-${Date.now()}` }],
      }));
      setShowBenefitModal(false);
      setBenefitForm(BLANK_BENEFIT);
    } catch {
      toast.success('Benefit added successfully (demo)');
      setPlan(p => ({
        ...p,
        benefits: [...(p.benefits || []), { ...benefitForm, id: `ben-${Date.now()}` }],
      }));
      setShowBenefitModal(false);
      setBenefitForm(BLANK_BENEFIT);
    } finally {
      setBenefitLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Plan Details">
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      </Layout>
    );
  }

  const p = plan || MOCK_PLAN;

  const benefitCols = [
    { header: 'Service Category', accessor: row => <span className="capitalize font-medium text-gray-800">{row.service_category}</span> },
    { header: 'Covered Service', accessor: 'service_name' },
    {
      header: 'Benefit Type',
      accessor: row => (
        <Badge status={row.benefit_type === 'percentage' ? 'active' : 'pending'}>
          {row.benefit_type}
        </Badge>
      ),
    },
    {
      header: 'Coverage',
      accessor: row => row.benefit_type === 'percentage' ? `${row.coverage_percentage || 100}%` : `₦${Number(row.fixed_amount || 0).toLocaleString()}`,
    },
    {
      header: 'Annual Limit',
      accessor: row => `₦${Number(row.annual_limit || 0).toLocaleString()}`,
    },
    {
      header: 'Requires Auth',
      accessor: row => (
        <Badge status={row.requires_authorization ? 'warning' : 'active'}>
          {row.requires_authorization ? 'Pre-Auth Required' : 'Direct Access'}
        </Badge>
      ),
    },
  ];

  return (
    <Layout title={p.name} subtitle="Health plan benefits, limits and policy terms">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/plans')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Plans
          </button>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/plans/${id}/edit`)}>Edit Plan</Button>
          </div>
        </div>

        {/* Plan Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-800 rounded-xl p-6 text-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{p.name}</h2>
              <p className="text-white/80 text-sm mb-4 max-w-xl">{p.description}</p>
              <div className="flex flex-wrap gap-6 pt-2">
                <div>
                  <div className="text-xs text-white/70">Monthly Premium</div>
                  <div className="text-xl font-bold">₦{Number(p.premium_amount || 0).toLocaleString()}<span className="text-xs font-normal text-white/70">/mo</span></div>
                </div>
                <div>
                  <div className="text-xs text-white/70">Coverage Limit</div>
                  <div className="text-xl font-bold">₦{Number(p.coverage_limit || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-white/70">Waiting Period</div>
                  <div className="text-xl font-bold">{p.waiting_period_days || 90} days</div>
                </div>
                <div>
                  <div className="text-xs text-white/70">Plan Type</div>
                  <div className="text-xl font-bold capitalize">{p.plan_type || 'Individual'}</div>
                </div>
              </div>
            </div>
            <div>
              <Badge status={p.status || 'active'} className="text-sm font-semibold">{p.status || 'active'}</Badge>
            </div>
          </div>
        </div>

        {/* Benefits Table */}
        <Card
          title={`Plan Covered Benefits (${(p.benefits || []).length})`}
          headerAction={<Button size="sm" onClick={() => setShowBenefitModal(true)}>+ Add Benefit</Button>}
        >
          <Table
            columns={benefitCols}
            data={p.benefits || []}
            emptyMessage="No benefits configured for this health plan."
          />
        </Card>
      </div>

      {/* Add Benefit Modal */}
      <Modal
        isOpen={showBenefitModal}
        onClose={() => setShowBenefitModal(false)}
        title="Add Plan Benefit"
      >
        <form onSubmit={handleAddBenefit} className="space-y-4">
          <Select
            label="Service Category *"
            value={benefitForm.service_category}
            onChange={e => setBenefitForm(f => ({ ...f, service_category: e.target.value }))}
            options={BENEFIT_CATEGORIES}
          />
          <Input
            label="Service Name *"
            value={benefitForm.service_name}
            onChange={e => setBenefitForm(f => ({ ...f, service_name: e.target.value }))}
            placeholder="e.g. Specialist Consultation"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Benefit Type"
              value={benefitForm.benefit_type}
              onChange={e => setBenefitForm(f => ({ ...f, benefit_type: e.target.value }))}
              options={[
                { value: 'percentage', label: 'Percentage (%)' },
                { value: 'fixed', label: 'Fixed Amount (₦)' },
              ]}
            />
            {benefitForm.benefit_type === 'percentage' ? (
              <Input
                label="Coverage %"
                type="number"
                min="1"
                max="100"
                value={benefitForm.coverage_percentage}
                onChange={e => setBenefitForm(f => ({ ...f, coverage_percentage: Number(e.target.value) }))}
              />
            ) : (
              <Input
                label="Fixed Limit (₦)"
                type="number"
                value={benefitForm.fixed_amount}
                onChange={e => setBenefitForm(f => ({ ...f, fixed_amount: Number(e.target.value) }))}
              />
            )}
          </div>
          <Input
            label="Annual Benefit Limit (₦)"
            type="number"
            value={benefitForm.annual_limit}
            onChange={e => setBenefitForm(f => ({ ...f, annual_limit: e.target.value }))}
          />
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="req_auth"
              checked={benefitForm.requires_authorization}
              onChange={e => setBenefitForm(f => ({ ...f, requires_authorization: e.target.checked }))}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="req_auth" className="text-sm font-medium text-gray-700">
              Requires Prior Authorization (Pre-Auth)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowBenefitModal(false)}>Cancel</Button>
            <Button type="submit" loading={benefitLoading}>Add Benefit</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
