import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Input, Select, LoadingSpinner } from '../../components/ui';
import { providersApi } from '../../api';
import toast from 'react-hot-toast';

const PROVIDER_TYPES = [
  { value: '', label: 'Select Provider Type' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'dental', label: 'Dental' },
  { value: 'optical', label: 'Optical' },
];

const TIER_OPTIONS = [
  { value: '', label: 'Select Tier' },
  { value: '1', label: 'Tier 1' },
  { value: '2', label: 'Tier 2' },
  { value: '3', label: 'Tier 3' },
];

const NIGERIAN_BANKS = [
  { value: '', label: 'Select Bank' },
  { value: 'Access Bank', label: 'Access Bank' },
  { value: 'First Bank', label: 'First Bank' },
  { value: 'GTBank', label: 'GTBank' },
  { value: 'Zenith Bank', label: 'Zenith Bank' },
  { value: 'UBA', label: 'UBA' },
  { value: 'Sterling Bank', label: 'Sterling Bank' },
  { value: 'Union Bank', label: 'Union Bank' },
  { value: 'FCMB', label: 'FCMB' },
  { value: 'Fidelity Bank', label: 'Fidelity Bank' },
  { value: 'Polaris Bank', label: 'Polaris Bank' },
  { value: 'Stanbic IBTC', label: 'Stanbic IBTC' },
  { value: 'Standard Chartered', label: 'Standard Chartered' },
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
  name: '',
  provider_type: '',
  tier: '',
  license_number: '',
  accreditation_number: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  email: '',
  contact_person: '',
  bank_name: '',
  account_number: '',
  account_name: '',
};

export default function ProviderForm() {
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
        const res = await providersApi.getById(id);
        const data = res.data?.data || res.data || {};
        setForm({
          name: data.name || '',
          provider_type: data.provider_type || '',
          tier: data.tier ? String(data.tier) : '',
          license_number: data.license_number || '',
          accreditation_number: data.accreditation_number || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          phone: data.phone || '',
          email: data.email || '',
          contact_person: data.contact_person || '',
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          account_name: data.account_name || '',
        });
      } catch {
        toast.error('Failed to load provider data');
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
    if (!form.name.trim()) errs.name = 'Provider name is required';
    if (!form.provider_type) errs.provider_type = 'Provider type is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
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
        tier: form.tier ? Number(form.tier) : undefined,
      };
      let res;
      if (isEdit) {
        res = await providersApi.update(id, payload);
        toast.success('Provider updated successfully');
      } else {
        res = await providersApi.create(payload);
        toast.success('Provider created successfully');
      }
      const savedId = res.data?.data?.id || res.data?.id || id;
      navigate(`/providers/${savedId}`);
    } catch (err) {
      const msg = err?.response?.data?.message || (isEdit ? 'Failed to update provider' : 'Failed to create provider');
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
          <Button variant="ghost" onClick={() => navigate(isEdit ? `/providers/${id}` : '/providers')}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Provider' : 'Add New Provider'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Info */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Provider Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Lagos University Teaching Hospital"
                  value={form.name}
                  onChange={handleChange('name')}
                  error={errors.name}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={form.provider_type}
                  onChange={handleChange('provider_type')}
                  options={PROVIDER_TYPES}
                />
                {errors.provider_type && <p className="text-xs text-red-500 mt-1">{errors.provider_type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <Select
                  value={form.tier}
                  onChange={handleChange('tier')}
                  options={TIER_OPTIONS}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <Input
                  placeholder="e.g. MFH-LA-2019-00124"
                  value={form.license_number}
                  onChange={handleChange('license_number')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accreditation Number</label>
                <Input
                  placeholder="e.g. NHIA-2020-0456"
                  value={form.accreditation_number}
                  onChange={handleChange('accreditation_number')}
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
                  placeholder="e.g. Idi-Araba, Surulere"
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
                  Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. 01-2345678"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  error={errors.phone}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="e.g. info@hospital.ng"
                  value={form.email}
                  onChange={handleChange('email')}
                  error={errors.email}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <Input
                  placeholder="e.g. Dr. Funmi Adeyemi"
                  value={form.contact_person}
                  onChange={handleChange('contact_person')}
                />
              </div>
            </div>
          </Card>

          {/* Banking */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Banking Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <Select
                  value={form.bank_name}
                  onChange={handleChange('bank_name')}
                  options={NIGERIAN_BANKS}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <Input
                  placeholder="e.g. 3012345678"
                  value={form.account_number}
                  onChange={handleChange('account_number')}
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <Input
                  placeholder="e.g. Lagos University Teaching Hospital"
                  value={form.account_name}
                  onChange={handleChange('account_name')}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEdit ? `/providers/${id}` : '/providers')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Update Provider' : 'Create Provider'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
