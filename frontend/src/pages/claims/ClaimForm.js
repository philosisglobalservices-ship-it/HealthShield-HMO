import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { claimsApi, membersApi, providersApi, plansApi } from '../../api';
import toast from 'react-hot-toast';

const SERVICE_CATEGORIES = [
  { value: 'Outpatient', label: 'Outpatient' },
  { value: 'Inpatient', label: 'Inpatient' },
  { value: 'Surgery', label: 'Surgery' },
  { value: 'Specialist', label: 'Specialist' },
  { value: 'Laboratory', label: 'Laboratory' },
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'Dental', label: 'Dental' },
  { value: 'Optical', label: 'Optical' },
  { value: 'Emergency', label: 'Emergency' },
  { value: 'Maternity', label: 'Maternity' },
  { value: 'Radiology', label: 'Radiology' },
  { value: 'Rehabilitation', label: 'Rehabilitation' },
];

export default function ClaimForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    member_id: '', provider_id: '', plan_id: '',
    service_date: new Date().toISOString().slice(0, 10),
    service_category: '', diagnosis_code: '', diagnosis_description: '',
    submitted_amount: '', notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      membersApi.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      providersApi.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      plansApi.getAll().catch(() => ({ data: { data: [] } })),
    ]).then(([m, p, pl]) => {
      setMembers((m.data.data || []).map(x => ({ value: x.id, label: `${x.first_name} ${x.last_name} (${x.member_number})` })));
      setProviders((p.data.data || []).map(x => ({ value: x.id, label: `${x.name} — ${x.city || ''}` })));
      setPlans((pl.data.data || []).map(x => ({ value: x.id, label: `${x.name} (₦${Number(x.premium_amount).toLocaleString()}/mo)` })));
    });
  }, []);

  const validate = () => {
    const e = {};
    if (!form.member_id) e.member_id = 'Member is required';
    if (!form.provider_id) e.provider_id = 'Provider is required';
    if (!form.service_date) e.service_date = 'Service date is required';
    if (!form.submitted_amount || isNaN(form.submitted_amount)) e.submitted_amount = 'Valid amount is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await claimsApi.create({ ...form, submitted_amount: parseFloat(form.submitted_amount) });
      toast.success('Claim created successfully');
      navigate(`/claims/${res.data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create claim');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Layout title="Submit New Claim" subtitle="Create a new healthcare claim">
      <div className="max-w-2xl">
        <button onClick={() => navigate('/claims')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Claims
        </button>

        <form onSubmit={handleSubmit}>
          <Card title="Claim Details" className="mb-4">
            <div className="space-y-4">
              <Select label="Member *" options={members} value={form.member_id} onChange={set('member_id')} placeholder="Select member..." error={errors.member_id} />
              <Select label="Provider *" options={providers} value={form.provider_id} onChange={set('provider_id')} placeholder="Select provider..." error={errors.provider_id} />
              <Select label="Health Plan" options={plans} value={form.plan_id} onChange={set('plan_id')} placeholder="Select plan..." />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Service Date *" type="date" value={form.service_date} onChange={set('service_date')} error={errors.service_date} />
                <Select label="Service Category" options={SERVICE_CATEGORIES} value={form.service_category} onChange={set('service_category')} placeholder="Select category..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Diagnosis Code (ICD)" placeholder="e.g. J06.9" value={form.diagnosis_code} onChange={set('diagnosis_code')} />
                <Input label="Submitted Amount (₦) *" type="number" min="0" step="0.01" placeholder="0.00" value={form.submitted_amount} onChange={set('submitted_amount')} error={errors.submitted_amount} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Description</label>
                <textarea value={form.diagnosis_description} onChange={set('diagnosis_description')} rows={2} placeholder="Brief description of diagnosis..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => navigate('/claims')}>Cancel</Button>
            <Button type="submit" loading={loading}>Submit Claim</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
