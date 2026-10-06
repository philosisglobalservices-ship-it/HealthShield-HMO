import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Input, Select } from '../../components/ui';
import { enrollmentsApi, membersApi, plansApi } from '../../api';
import toast from 'react-hot-toast';

export default function EnrollmentForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({
    member_id: '', plan_id: '',
    effective_date: new Date().toISOString().slice(0, 10),
    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    premium_amount: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      membersApi.getAll({ limit: 200 }).catch(() => ({ data: { data: { data: [] } } })),
      plansApi.getAll().catch(() => ({ data: { data: [] } })),
    ]).then(([m, p]) => {
      const mems = m.data?.data?.data || m.data?.data || [];
      const plns = p.data?.data?.data || p.data?.data || [];
      setMembers([{ value: '', label: 'Select member...' }, ...mems.map(x => ({ value: x.id, label: `${x.first_name} ${x.last_name} — ${x.member_number}` }))]);
      setPlans([{ value: '', label: 'Select plan...' }, ...plns.map(x => ({ value: x.id, label: `${x.name} — ₦${Number(x.premium_amount).toLocaleString()}/mo`, data: x }))]);
    });
  }, []);

  const handlePlanChange = (e) => {
    const planId = e.target.value;
    const planOpt = plans.find(p => p.value === planId);
    setForm(f => ({ ...f, plan_id: planId, premium_amount: planOpt?.data?.premium_amount || '' }));
    setSelectedPlan(planOpt?.data || null);
  };

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.member_id) e.member_id = 'Member is required';
    if (!form.plan_id) e.plan_id = 'Plan is required';
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
      const newId = res.data?.data?.id;
      toast.success('Enrollment created successfully');
      navigate(newId ? `/enrollments/${newId}` : '/enrollments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create enrollment');
    } finally { setLoading(false); }
  };

  return (
    <Layout title="New Enrollment" subtitle="Enroll a member in a health plan">
      <div className="max-w-2xl">
        <button onClick={() => navigate('/enrollments')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">← Back to Enrollments</button>

        <form onSubmit={handleSubmit}>
          <Card title="Enrollment Details" className="mb-4">
            <div className="space-y-4">
              <Select label="Member *" options={members} value={form.member_id} onChange={set('member_id')} error={errors.member_id} />
              <Select label="Health Plan *" options={plans} value={form.plan_id} onChange={handlePlanChange} error={errors.plan_id} />
              {selectedPlan && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <div className="font-semibold text-blue-800 mb-2">{selectedPlan.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-blue-700">
                    <div>Premium: <strong>₦{Number(selectedPlan.premium_amount).toLocaleString()}/mo</strong></div>
                    <div>Coverage: <strong>₦{Number(selectedPlan.coverage_limit || 0).toLocaleString()}</strong></div>
                    <div>Type: <strong className="capitalize">{selectedPlan.plan_type}</strong></div>
                    <div>Waiting: <strong>{selectedPlan.waiting_period_days || 90} days</strong></div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input label="Effective Date *" type="date" value={form.effective_date} onChange={set('effective_date')} error={errors.effective_date} />
                <Input label="Expiry Date *" type="date" value={form.expiry_date} onChange={set('expiry_date')} error={errors.expiry_date} />
              </div>
              <Input label="Monthly Premium (₦)" type="number" min="0" step="0.01"
                value={form.premium_amount} onChange={set('premium_amount')}
                helperText="Auto-filled from plan — modify if needed" />
            </div>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => navigate('/enrollments')}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Enrollment</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
