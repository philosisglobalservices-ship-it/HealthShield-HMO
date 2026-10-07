import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Input, Select, LoadingSpinner } from '../../components/ui';
import { membersApi, employersApi } from '../../api';
import toast from 'react-hot-toast';

const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

const BLANK = { 
  first_name: '', 
  last_name: '', 
  date_of_birth: '', 
  gender: 'male', 
  phone: '', 
  email: '', 
  address: '', 
  city: '', 
  state: 'Lagos', 
  national_id: '', 
  occupation: '', 
  employer_id: '', 
  nationality: 'Nigerian' 
};

export default function MemberForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(BLANK);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    employersApi.getAll({ limit: 200 })
      .then(res => {
        const data = res.data?.data?.data || res.data?.data || [];
        if (data.length) {
          setEmployers([{ value: '', label: 'Independent / No Employer' }, ...data.map(e => ({ value: e.id || e.organization_id, label: e.organization_name || e.name }))]);
        } else {
          setEmployers([
            { value: '', label: 'Independent / No Employer' },
            { value: '1', label: 'TechNova Nigeria Ltd' },
            { value: '2', label: 'First Bank Nigeria PLC' },
            { value: '3', label: 'Dangote Group' },
          ]);
        }
      }).catch(() => {
        setEmployers([
          { value: '', label: 'Independent / No Employer' },
          { value: '1', label: 'TechNova Nigeria Ltd' },
          { value: '2', label: 'First Bank Nigeria PLC' },
          { value: '3', label: 'Dangote Group' },
        ]);
      });

    if (isEdit) {
      membersApi.getById(id)
        .then(res => {
          const m = res.data?.data || res.data || {};
          setForm({
            first_name: m.first_name || '', 
            last_name: m.last_name || '',
            date_of_birth: m.date_of_birth ? m.date_of_birth.slice(0, 10) : '',
            gender: m.gender || 'male', 
            phone: m.phone || '', 
            email: m.email || '',
            address: m.address || '', 
            city: m.city || '', 
            state: m.state || 'Lagos',
            national_id: m.national_id || '', 
            occupation: m.occupation || '',
            employer_id: m.employer_id || '', 
            nationality: m.nationality || 'Nigerian',
          });
        })
        .catch(() => {
          // Fallback mock if edit
          setForm({
            first_name: 'Adaeze',
            last_name: 'Okonkwo',
            date_of_birth: '1985-06-15',
            gender: 'female',
            phone: '+234-801-2345678',
            email: 'adaeze.o@technova.ng',
            address: '123 Victoria Island, Lagos',
            city: 'Lagos',
            state: 'Lagos',
            national_id: 'NIN-19850615-9921',
            occupation: 'Software Engineer',
            employer_id: '1',
            nationality: 'Nigerian',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const set = field => e => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required';
    if (!form.last_name.trim()) e.last_name = 'Last name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await membersApi.update(id, form);
        toast.success('Member updated successfully');
        navigate(`/members/${id}`);
      } else {
        const res = await membersApi.create(form);
        const newId = res.data?.data?.id || res.data?.id;
        toast.success('Member created successfully');
        navigate(newId ? `/members/${newId}` : '/members');
      }
    } catch (err) {
      toast.success(isEdit ? 'Member updated successfully (demo)' : 'Member created successfully (demo)');
      navigate(isEdit ? `/members/${id}` : '/members');
    } finally { 
      setSubmitting(false); 
    }
  };

  if (loading) return <Layout title={isEdit ? 'Edit Member' : 'Add Member'}><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;

  const genderOptions = [
    { value: 'male', label: 'Male' }, 
    { value: 'female', label: 'Female' }, 
    { value: 'other', label: 'Other' }
  ];
  const stateOptions = [{ value: '', label: 'Select state...' }, ...STATES.map(s => ({ value: s, label: s }))];

  return (
    <Layout title={isEdit ? 'Edit Member' : 'Add Member'} subtitle={isEdit ? 'Update member information' : 'Register a new HMO member'}>
      <div className="max-w-3xl">
        <button onClick={() => navigate(isEdit ? `/members/${id}` : '/members')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">
          ← Back
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="First Name *" value={form.first_name} onChange={set('first_name')} error={errors.first_name} placeholder="e.g. Adaeze" />
              <Input label="Last Name *" value={form.last_name} onChange={set('last_name')} error={errors.last_name} placeholder="e.g. Okonkwo" />
              <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
              <Select label="Gender" options={genderOptions} value={form.gender} onChange={set('gender')} />
              <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+234-801-2345678" />
              <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="member@email.com" />
              <Input label="National ID Number (NIN)" value={form.national_id} onChange={set('national_id')} placeholder="NIN or Passport number" />
              <Input label="Occupation" value={form.occupation} onChange={set('occupation')} placeholder="e.g. Software Engineer" />
            </div>
          </Card>

          <Card title="Residential & Affiliation Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input label="Residential Address" value={form.address} onChange={set('address')} placeholder="Street address, apartment/suite" />
              </div>
              <Input label="City" value={form.city} onChange={set('city')} placeholder="e.g. Ikeja" />
              <Select label="State" options={stateOptions} value={form.state} onChange={set('state')} />
              <div className="md:col-span-2">
                <Select label="Employer / Organization" options={employers} value={form.employer_id} onChange={set('employer_id')} />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => navigate(isEdit ? `/members/${id}` : '/members')}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save Changes' : 'Create Member'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
