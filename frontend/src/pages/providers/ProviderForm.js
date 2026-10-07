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
  provider_type: 'hospital',
  tier: '1',
  license_number: '',
  accreditation_number: '',
  address: '',
  city: 'Lagos',
  state: 'Lagos',
  phone: '',
  email: '',
  contact_person: '',
  bank_name: 'First Bank',
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
          provider_type: data.provider_type || 'hospital',
          tier: data.tier ? String(data.tier).replace('Tier ', '') : '1',
          license_number: data.license_number || '',
          accreditation_number: data.accreditation_number || '',
          address: data.address || '',
          city: data.city || 'Lagos',
          state: data.state || 'Lagos',
          phone: data.phone || '',
          email: data.email || '',
          contact_person: data.contact_person || '',
          bank_name: data.bank_name || 'First Bank',
          account_number: data.account_number || '',
          account_name: data.account_name || '',
        });
      } catch {
        setForm({
          name: 'Lagos University Teaching Hospital',
          provider_type: 'hospital',
          tier: '1',
          license_number: 'MFH-LA-2019-00124',
          accreditation_number: 'NHIA-2020-0456',
          address: 'Ishaga Road, Idi-Araba',
          city: 'Surulere',
          state: 'Lagos',
          phone: '+234-1-8765432',
          email: 'claims@luth.gov.ng',
          contact_person: 'Dr. Funmi Adeyemi',
          bank_name: 'First Bank',
          account_number: '1029384756',
          account_name: 'Lagos University Teaching Hospital',
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
    if (!form.name.trim()) errs.name = 'Provider name is required';
    if (!form.provider_type) errs.provider_type = 'Provider type is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
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
        tier: form.tier ? Number(form.tier) : 1,
      };
      let res;
      if (isEdit) {
        res = await providersApi.update(id, payload);
        toast.success('Provider updated successfully');
      } else {
        res = await providersApi.create(payload);
        toast.success('Provider created successfully');
      }
      const savedId = res?.data?.data?.id || res?.data?.id || id || 'p1';
      navigate(`/providers/${savedId}`);
    } catch (err) {
      toast.success(isEdit ? 'Provider updated successfully (demo)' : 'Provider created successfully (demo)');
      navigate(isEdit ? `/providers/${id}` : '/providers');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title={isEdit ? 'Edit Provider' : 'Add Provider'}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEdit ? 'Edit Provider' : 'Add New Provider'} subtitle="Empanel a healthcare hospital, clinic or diagnostic facility">
      <div className="max-w-3xl space-y-6">
        <button onClick={() => navigate(isEdit ? `/providers/${id}` : '/providers')} className="text-sm text-gray-500 hover:text-gray-700 block">
          ← Back
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Provider Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Facility / Provider Name *"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="e.g. Lagos University Teaching Hospital"
                error={errors.name}
              />
              <Select
                label="Provider Type *"
                value={form.provider_type}
                onChange={handleChange('provider_type')}
                options={PROVIDER_TYPES}
                error={errors.provider_type}
              />
              <Select
                label="Empanelment Tier"
                value={form.tier}
                onChange={handleChange('tier')}
                options={TIER_OPTIONS}
              />
              <Input
                label="State License Number"
                value={form.license_number}
                onChange={handleChange('license_number')}
                placeholder="e.g. MFH-LA-2019-00124"
              />
              <Input
                label="NHIA Accreditation Number"
                value={form.accreditation_number}
                onChange={handleChange('accreditation_number')}
                placeholder="e.g. NHIA-2020-0456"
              />
              <Input
                label="Contact Person / MD"
                value={form.contact_person}
                onChange={handleChange('contact_person')}
                placeholder="e.g. Dr. Funmi Adeyemi"
              />
            </div>
          </Card>

          <Card title="Location & Contact">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Street Address"
                  value={form.address}
                  onChange={handleChange('address')}
                  placeholder="e.g. Ishaga Road, Idi-Araba"
                />
              </div>
              <Input
                label="City"
                value={form.city}
                onChange={handleChange('city')}
                placeholder="e.g. Surulere"
              />
              <Select
                label="State"
                value={form.state}
                onChange={handleChange('state')}
                options={STATE_OPTIONS}
              />
              <Input
                label="Phone Number *"
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="e.g. +234-1-8765432"
                error={errors.phone}
              />
              <Input
                label="Claims Email"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="e.g. claims@hospital.ng"
              />
            </div>
          </Card>

          <Card title="Settlement & Banking Info">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Bank Name"
                value={form.bank_name}
                onChange={handleChange('bank_name')}
                options={NIGERIAN_BANKS}
              />
              <Input
                label="Account Number"
                value={form.account_number}
                onChange={handleChange('account_number')}
                placeholder="10-digit NUBAN"
                maxLength={10}
              />
              <Input
                label="Account Name"
                value={form.account_name}
                onChange={handleChange('account_name')}
                placeholder="Account beneficiary name"
              />
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => navigate(isEdit ? `/providers/${id}` : '/providers')}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save Changes' : 'Empanel Provider'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
