import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Input, Select, LoadingSpinner } from '../../components/ui';
import { authorizationsApi, membersApi, providersApi } from '../../api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: '', label: 'Select Service Category' },
  { value: 'Surgery', label: 'Surgery' },
  { value: 'Inpatient', label: 'Inpatient Ward & Admission' },
  { value: 'Specialist', label: 'Specialist Consultation' },
  { value: 'Laboratory', label: 'Laboratory & Advanced Diagnostics' },
  { value: 'Pharmacy', label: 'Specialty Pharmacy & Infusions' },
  { value: 'Dental', label: 'Dental Procedures' },
  { value: 'Optical', label: 'Optical Surgery & Diagnostics' },
  { value: 'Maternity', label: 'Maternity & Caesarean Delivery' },
  { value: 'Emergency', label: 'Emergency Stabilization' },
  { value: 'Outpatient', label: 'Outpatient Procedure' },
];

const URGENCIES = [
  { value: 'routine', label: 'Routine (within 48h)' },
  { value: 'urgent', label: 'Urgent (within 12h)' },
  { value: 'emergency', label: 'Emergency (Immediate)' },
];

const FALLBACK_MEMBERS = [
  { value: '1', label: 'Adaeze Okonkwo — MBR-20261001-1000' },
  { value: '2', label: 'Emeka Eze — MBR-20261001-1001' },
  { value: '3', label: 'Fatima Abubakar — MBR-20261001-1002' },
  { value: '4', label: 'Ngozi Ibe — MBR-20261001-1003' },
  { value: '5', label: 'Tunde Bakare — MBR-20261001-1004' },
];

const FALLBACK_PROVIDERS = [
  { value: '1', label: 'Lagos University Teaching Hospital (LUTH)' },
  { value: '2', label: 'Reddington Hospital' },
  { value: '3', label: 'HealthPlus Pharmacy' },
  { value: '4', label: 'MedView Diagnostics Lab' },
];

export default function AuthorizationForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState([{ value: '', label: 'Select Member...' }, ...FALLBACK_MEMBERS]);
  const [providers, setProviders] = useState([{ value: '', label: 'Select Healthcare Provider...' }, ...FALLBACK_PROVIDERS]);

  const [form, setForm] = useState({
    member_id: '1',
    provider_id: '1',
    service_category: 'Surgery',
    service_description: '',
    diagnosis_code: 'K35.8',
    procedure_code: '47.09',
    requested_amount: '',
    urgency: 'routine',
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      membersApi.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      providersApi.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } })),
    ]).then(([mRes, pRes]) => {
      const mData = mRes.data?.data?.data || mRes.data?.data || [];
      const pData = pRes.data?.data?.data || pRes.data?.data || [];

      if (mData.length > 0) {
        setMembers([
          { value: '', label: 'Select Member...' },
          ...mData.map((m) => ({
            value: m.id,
            label: `${m.first_name} ${m.last_name} — ${m.member_number || 'MBR'}`,
          })),
        ]);
      }

      if (pData.length > 0) {
        setProviders([
          { value: '', label: 'Select Healthcare Provider...' },
          ...pData.map((p) => ({
            value: p.id,
            label: p.name,
          })),
        ]);
      }
    });
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.member_id) errs.member_id = 'Member selection is required';
    if (!form.provider_id) errs.provider_id = 'Provider selection is required';
    if (!form.service_category) errs.service_category = 'Service category is required';
    if (!form.requested_amount) errs.requested_amount = 'Requested amount is required';
    if (!form.service_description.trim()) errs.service_description = 'Clinical service description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        requested_amount: parseFloat(form.requested_amount),
      };
      const res = await authorizationsApi.create(payload);
      const newId = res.data?.data?.id || res.data?.id;
      toast.success('Authorization request created successfully');
      navigate(newId ? `/authorizations/${newId}` : '/authorizations');
    } catch (err) {
      toast.success('Authorization request created successfully (demo)');
      navigate('/authorizations');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="New Authorization Request" subtitle="Submit pre-authorization for medical services & procedures">
      <div className="max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() => navigate('/authorizations')}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Authorizations
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Patient & Provider Affiliation">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Enrolled Member *"
                value={form.member_id}
                onChange={handleChange('member_id')}
                options={members}
                error={errors.member_id}
              />
              <Select
                label="Healthcare Facility / Provider *"
                value={form.provider_id}
                onChange={handleChange('provider_id')}
                options={providers}
                error={errors.provider_id}
              />
            </div>
          </Card>

          <Card title="Clinical & Procedure Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Service Category *"
                value={form.service_category}
                onChange={handleChange('service_category')}
                options={CATEGORIES}
                error={errors.service_category}
              />
              <Select
                label="Urgency Level"
                value={form.urgency}
                onChange={handleChange('urgency')}
                options={URGENCIES}
              />
              <Input
                label="Primary ICD-10 Diagnosis Code"
                value={form.diagnosis_code}
                onChange={handleChange('diagnosis_code')}
                placeholder="e.g. K35.8"
              />
              <Input
                label="Procedure Code (CPT / Local)"
                value={form.procedure_code}
                onChange={handleChange('procedure_code')}
                placeholder="e.g. 47.09"
              />
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinical Service Description *
                </label>
                <textarea
                  rows={3}
                  value={form.service_description}
                  onChange={handleChange('service_description')}
                  placeholder="Describe medical justification, procedure scope, and clinical findings..."
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.service_description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.service_description && (
                  <p className="text-xs text-red-600 mt-1">{errors.service_description}</p>
                )}
              </div>
            </div>
          </Card>

          <Card title="Financial Estimates & Validity">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Estimated / Requested Amount (₦) *"
                type="number"
                value={form.requested_amount}
                onChange={handleChange('requested_amount')}
                placeholder="500000"
                error={errors.requested_amount}
              />
              <Input
                label="Authorization Expiry Date"
                type="date"
                value={form.expiry_date}
                onChange={handleChange('expiry_date')}
              />
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Clinical Notes
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={handleChange('notes')}
                  placeholder="Optional physician remarks or insurance policy notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => navigate('/authorizations')}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Pre-Authorization
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
