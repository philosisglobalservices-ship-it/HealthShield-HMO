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
  industry: '',
  address: '',
  city: '',
  state: '',
  contact_phone: '',
  email: '',
  contact_person: '',
  contact_email: '',
  contact_phone_alt: '',
  employee_count: '',
  premium_cycle: '',
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
          organization_name: data.organization_name || '',
          code: data.code || '',
          industry: data.industry || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          contact_phone: data.contact_phone || '',
          email: data.email || '',
          contact_person: data.contact_person || '',
          contact_email: data.contact_email || '',
          contact_phone_alt: data.contact_phone_alt || '',
          employee_count: data.employee_count || '',
          premium_cycle: data.premium_cycle || '',
        });
      } catch {
        toast.error('Failed to load employer data');
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
    if (!form.code.trim()) errs.code = 'Code is required';
    if (!form.contact_phone.trim()) errs.contact_phone = 'Phone is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
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
      const savedId = res.data?.data?.id || res.data?.id || id;
      navigate(`/employers/${savedId}`);
    } catch (err) {
      const msg = err?.response?.data?.message || (isEdit ? 'Failed to update employer' : 'Failed to create employer');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(isEdit ? `/employers/${id}` : '/employers')}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Employer' : 'Add New Employer'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Organization Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. TechNova Nigeria Ltd"
                  value={form.organization_name}
                  onChange={handleChange('organization_name')}
                  error={errors.organization_name}
                />
                {errors.organization_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.organization_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. TNN-001"
                  value={form.code}
                  onChange={handleChange('code')}
                  error={errors.code}
                />
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <Select
                  value={form.industry}
                  onChange={handleChange('industry')}
                  options={INDUSTRIES}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Count</label>
                <Input
                  type="number"
                  placeholder="e.g. 250"
                  value={form.employee_count}
                  onChange={handleChange('employee_count')}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Premium Cycle</label>
                <Select
                  value={form.premium_cycle}
                  onChange={handleChange('premium_cycle')}
                  options={PREMIUM_CYCLES}
                />
              </div>
            </div>
          </Card>

          {/* Address */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <Input
                  placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
                  value={form.address}
                  onChange={handleChange('address')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <Input
                  placeholder="e.g. Lagos"
                  value={form.city}
                  onChange={handleChange('city')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <Select
                  value={form.state}
                  onChange={handleChange('state')}
                  options={STATE_OPTIONS}
                />
              </div>
            </div>
          </Card>

          {/* Contact */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Emeka Okafor"
                  value={form.contact_person}
                  onChange={handleChange('contact_person')}
                  error={errors.contact_person}
                />
                {errors.contact_person && (
                  <p className="text-xs text-red-500 mt-1">{errors.contact_person}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. 08012345678"
                  value={form.contact_phone}
                  onChange={handleChange('contact_phone')}
                  error={errors.contact_phone}
                />
                {errors.contact_phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.contact_phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="e.g. hr@company.ng"
                  value={form.email}
                  onChange={handleChange('email')}
                  error={errors.email}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <Input
                  type="email"
                  placeholder="e.g. emeka.okafor@company.ng"
                  value={form.contact_email}
                  onChange={handleChange('contact_email')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alt. Contact Phone</label>
                <Input
                  placeholder="e.g. 08087654321"
                  value={form.contact_phone_alt}
                  onChange={handleChange('contact_phone_alt')}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEdit ? `/employers/${id}` : '/employers')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Update Employer' : 'Create Employer'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
