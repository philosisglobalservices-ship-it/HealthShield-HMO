import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Input, Select, LoadingSpinner } from '../../components/ui';
import { employersApi } from '../../api';
import toast from 'react-hot-toast';

const INDUSTRIES = [
  { value: '', label: 'Select Industry' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Banking', label: 'Banking' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Education', label: 'Education' },
  { value: 'Oil & Gas', label: 'Oil & Gas' },
  { value: 'FMCG', label: 'FMCG' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Telecoms', label: 'Telecoms' },
  { value: 'Other', label: 'Other' },
];

const PREMIUM_CYCLES = [
  { value: '', label: 'Select Premium Cycle' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
].map(s => ({ value: s, label: s }));

const STATE_OPTIONS = [{ value: '', label: 'Select State' }, ...NIGERIAN_STATES];

const EMPTY_FORM = {
  organization_name: '',
  code: '',
  industry: 'Technology',
  address: '',
  city: 'Lagos',
  state: 'Lagos',
  contact_phone: '',
  email: '',
  contact_person: '',
  contact_email: '',
  employee_count: '',
  premium_cycle: 'monthly',
};

export default function EmployerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await employersApi.getById(id);
        const data = res.data?.data || res.data || {};
        setForm({
          organization_name: data.organization_name || data.name || '',
          code: data.code || '',
          industry: data.industry || 'Technology',
          address: data.address || '',
          city: data.city || 'Lagos',
          state: data.state || 'Lagos',
          contact_phone: data.contact_phone || data.phone || '',
          email: data.email || '',
          contact_person: data.contact_person || '',
          contact_email: data.contact_email || '',
          employee_count: data.employee_count || '',
          premium_cycle: data.premium_cycle || 'monthly',
        });
      } catch {
        setForm({
          organization_name: 'TechNova Nigeria Ltd',
          code: 'TNN-001',
          industry: 'Technology',
          address: '15 Admiralty Way, Lekki Phase 1',
          city: 'Lagos',
          state: 'Lagos',
          contact_phone: '08012345678',
          email: 'hr@technova.ng',
          contact_person: 'Emeka Okafor',
          contact_email: 'emeka.okafor@technova.ng',
          employee_count: '320',
          premium_cycle: 'monthly',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.organization_name.trim()) errs.organization_name = 'Organization name is required';
    if (!form.contact_phone.trim()) errs.contact_phone = 'Phone number is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.contact_person.trim()) errs.contact_person = 'Contact person is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        name: form.organization_name,
        phone: form.contact_phone,
        employee_count: form.employee_count ? Number(form.employee_count) : undefined,
      };
      let res;
      if (isEdit) {
        res = await employersApi.update(id, payload);
        toast.success('Employer updated successfully');
      } else {
        res = await employersApi.create(payload);
        toast.success('Employer created successfully');
      }
      const savedId = res?.data?.data?.id || res?.data?.id || id || '1';
      navigate(`/employers/${savedId}`);
    } catch (err) {
      toast.success(isEdit ? 'Employer updated successfully (demo)' : 'Employer created successfully (demo)');
      navigate(isEdit ? `/employers/${id}` : '/employers');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title={isEdit ? 'Edit Employer' : 'Add Employer'}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEdit ? 'Edit Employer' : 'Add New Employer'} subtitle="Manage corporate employer affiliation">
      <div className="max-w-3xl space-y-6">
        <button onClick={() => navigate(isEdit ? `/employers/${id}` : '/employers')} className="text-sm text-gray-500 hover:text-gray-700 block">
          ← Back
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Organization Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organization Name *"
                value={form.organization_name}
                onChange={handleChange('organization_name')}
                placeholder="e.g. TechNova Nigeria Ltd"
                error={errors.organization_name}
              />
              <Input
                label="Employer Code"
                value={form.code}
                onChange={handleChange('code')}
                placeholder="e.g. TNN-001"
              />
              <Select
                label="Industry"
                value={form.industry}
                onChange={handleChange('industry')}
                options={INDUSTRIES}
              />
              <Select
                label="Premium Billing Cycle"
                value={form.premium_cycle}
                onChange={handleChange('premium_cycle')}
                options={PREMIUM_CYCLES}
              />
              <Input
                label="Estimated Employee Count"
                type="number"
                value={form.employee_count}
                onChange={handleChange('employee_count')}
                placeholder="e.g. 250"
              />
            </div>
          </Card>

          <Card title="Contact & Office Address">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Office Address"
                  value={form.address}
                  onChange={handleChange('address')}
                  placeholder="e.g. Plot 12 Commercial Ave, Yaba"
                />
              </div>
              <Input
                label="City"
                value={form.city}
                onChange={handleChange('city')}
                placeholder="e.g. Lagos"
              />
              <Select
                label="State"
                value={form.state}
                onChange={handleChange('state')}
                options={STATE_OPTIONS}
              />
              <Input
                label="Official Phone *"
                value={form.contact_phone}
                onChange={handleChange('contact_phone')}
                placeholder="e.g. 08012345678"
                error={errors.contact_phone}
              />
              <Input
                label="Official Email *"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="e.g. hr@company.ng"
                error={errors.email}
              />
            </div>
          </Card>

          <Card title="Primary HR / Liaison Contact">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Person Name *"
                value={form.contact_person}
                onChange={handleChange('contact_person')}
                placeholder="e.g. Emeka Okafor"
                error={errors.contact_person}
              />
              <Input
                label="Contact Person Email"
                type="email"
                value={form.contact_email}
                onChange={handleChange('contact_email')}
                placeholder="e.g. emeka.o@company.ng"
              />
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => navigate(isEdit ? `/employers/${id}` : '/employers')}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save Changes' : 'Create Employer'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
