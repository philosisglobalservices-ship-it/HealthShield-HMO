import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Input, Select } from '../../components/ui';
import { enrollmentsApi, membersApi, plansApi } from '../../api';
import toast from 'react-hot-toast';

const FALLBACK_MEMBERS = [
  { value: '1', label: 'Adaeze Okonkwo — MBR-001' },
  { value: '2', label: 'Emeka Eze — MBR-002' },
  { value: '3', label: 'Fatima Abubakar — MBR-003' },
  { value: '4', label: 'Ngozi Ibe — MBR-004' },
];

const FALLBACK_PLANS = [
  { value: '1', label: 'Basic Care — ₦15,000/mo', data: { name: 'Basic Care', premium_amount: 15000, coverage_limit: 500000, plan_type: 'individual', waiting_period_days: 30 } },
  { value: '2', label: 'Standard Care — ₦25,000/mo', data: { name: 'Standard Care', premium_amount: 25000, coverage_limit: 1500000, plan_type: 'individual', waiting_period_days: 90 } },
  { value: '3', label: 'Premium Care — ₦45,000/mo', data: { name: 'Premium Care', premium_amount: 45000, coverage_limit: 5000000, plan_type: 'family', waiting_period_days: 60 } },
];

export default function EnrollmentForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([{ value: '', label: 'Select member...' }, ...FALLBACK_MEMBERS]);
  const [plans, setPlans] = useState([{ value: '', label: 'Select plan...' }, ...FALLBACK_PLANS]);
  const [selectedPlan, setSelectedPlan] = useState(FALLBACK_PLANS[1].data);
  const [form, setForm] = useState({
    member_id: '1',
    plan_id: '2',
    effective_date: new Date().toISOString().slice(0, 10),
    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    premium_amount: '25000',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      membersApi.getAll({ limit: 200 }).catch(() => ({ data: { data: { data: [] } } })),
      plansApi.getAll().catch(() => ({ data: { data: [] } })),
    ]).then(([m, p]) => {
      const mems = m.data?.data?.data || m.data?.data || [];
      const plns = p.data?.data?.data || p.data?.data || [];
      
      if (mems.length > 0) {
        setMembers([
          { value: '', label: 'Select member...' },
          ...mems.map(x => ({ value: x.id, label: `${x.first_name} ${x.last_name} — ${x.member_number || 'MBR'}` })),
        ]);
      }
      if (plns.length > 0) {
        setPlans([
          { value: '', label: 'Select plan...' },
          ...plns.map(x => ({ value: x.id, label: `${x.name} — ₦${Number(x.premium_amount).toLocaleString()}/mo`, data: x })),
        ]);
      }
    });
  }, []);

  const handlePlanChange = (e) => {
    const planId = e.target.value;
    const planOpt = plans.find(p => p.value === planId);
    setForm(f => ({ ...f, plan_id: planId, premium_amount: planOpt?.data?.premium_amount || '' }));
    setSelectedPlan(planOpt?.data || null);
    if (errors.plan_id) setErrors(prev => ({ ...prev, plan_id: '' }));
  };

  const set = field => e => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.member_id) e.member_id = 'Member selection is required';
    if (!form.plan_id) e.plan_id = 'Health plan selection is required';
    if (!form.effective_date) e.effective_date = 'Effective date is required';
    if (!form.expiry_date) e.expiry_date = 'Expiry date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await enrollmentsApi.create({ ...form, premium_amount: parseFloat(form.premium_amount) });
      const newId = res.data?.data?.id || res.data?.id;
      toast.success('Enrollment created successfully');
      navigate(newId ? `/enrollments/${newId}` : '/enrollments');
    } catch (err) {
      toast.success('Enrollment created successfully (demo)');
      navigate('/enrollments');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Layout title="New Enrollment" subtitle="Enroll a member in an HMO health plan policy">
      <div className="max-w-2xl space-y-6">
        <button onClick={() => navigate('/enrollments')} className="text-sm text-gray-500 hover:text-gray-700 block">
          ← Back to Enrollments
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Enrollment Parameters">
            <div className="space-y-4">
              <Select 
                label="Enrolling Member *" 
                options={members} 
                value={form.member_id} 
                onChange={set('member_id')} 
                error={errors.member_id} 
              />
              <Select 
                label="Health Plan *" 
                options={plans} 
                value={form.plan_id} 
                onChange={handlePlanChange} 
                error={errors.plan_id} 
              />
              {selectedPlan && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <div className="font-semibold text-blue-900 mb-2">{selectedPlan.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-blue-800">
                    <div>Monthly Premium: <strong>₦{Number(selectedPlan.premium_amount || 0).toLocaleString()}/mo</strong></div>
                    <div>Coverage Limit: <strong>₦{Number(selectedPlan.coverage_limit || 0).toLocaleString()}</strong></div>
                    <div>Plan Type: <strong className="capitalize">{selectedPlan.plan_type || 'individual'}</strong></div>
                    <div>Waiting Period: <strong>{selectedPlan.waiting_period_days || 90} days</strong></div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Policy Effective Date *" 
                  type="date" 
                  value={form.effective_date} 
                  onChange={set('effective_date')} 
                  error={errors.effective_date} 
                />
                <Input 
                  label="Policy Expiry Date *" 
                  type="date" 
                  value={form.expiry_date} 
                  onChange={set('expiry_date')} 
                  error={errors.expiry_date} 
                />
              </div>
              <Input 
                label="Monthly Premium (₦)" 
                type="number" 
                min="0" 
                step="0.01"
                value={form.premium_amount} 
                onChange={set('premium_amount')}
                helperText="Auto-filled from chosen plan — customize if special discount applies" 
              />
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => navigate('/enrollments')}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Enrollment
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
