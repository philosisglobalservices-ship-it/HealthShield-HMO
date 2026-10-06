import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Card, Input, Select, Button, LoadingSpinner } from '../../components/ui';
import { usersApi } from '../../api';
import toast from 'react-hot-toast';

const DEPTS = ['Management', 'Claims', 'Finance', 'Medical', 'Operations', 'Customer Service', 'IT', 'HR', 'Legal', 'Marketing'];

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', phone: '', role_id: '', department: '' });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    usersApi.getRoles().then(res => {
      const r = res.data?.data || res.data || [];
      setRoles([{ value: '', label: 'Select role...' }, ...r.map(x => ({ value: x.id, label: (x.name || '').replace(/_/g, ' ') }))]);
    }).catch(() => setRoles([{ value: '', label: 'Select role...' }]));

    if (isEdit) {
      usersApi.getById(id)
        .then(res => {
          const u = res.data?.data || res.data || {};
          setForm({ first_name: u.first_name || '', last_name: u.last_name || '', email: u.email || '', password: '', phone: u.phone || '', role_id: u.role_id || '', department: u.department || '' });
        })
        .catch(() => toast.error('Could not load user data'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!isEdit && !form.password) e.password = 'Required for new users';
    if (!form.role_id) e.role_id = 'Role is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (isEdit) {
        await usersApi.update(id, payload);
        toast.success('User updated successfully');
        navigate('/admin/users');
      } else {
        await usersApi.create(payload);
        toast.success('User created successfully');
        navigate('/admin/users');
      }
    } catch (err) { toast.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} user`); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Layout title={isEdit ? 'Edit User' : 'Add User'}><div className="flex justify-center py-20"><LoadingSpinner /></div></Layout>;

  return (
    <Layout title={isEdit ? 'Edit User' : 'Add User'} subtitle={isEdit ? 'Update user account' : 'Create a new platform user'}>
      <div className="max-w-2xl">
        <button onClick={() => navigate('/admin/users')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">← Back to Users</button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card title="User Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="First Name *" value={form.first_name} onChange={set('first_name')} error={errors.first_name} />
              <Input label="Last Name *" value={form.last_name} onChange={set('last_name')} error={errors.last_name} />
              <Input label="Email *" type="email" value={form.email} onChange={set('email')} error={errors.email} />
              <Input label={isEdit ? 'New Password (optional)' : 'Password *'} type="password" value={form.password} onChange={set('password')} error={errors.password} placeholder={isEdit ? 'Leave blank to keep current' : ''} />
              <Input label="Phone" value={form.phone} onChange={set('phone')} />
              <Select label="Department" value={form.department} onChange={set('department')}
                options={[{ value: '', label: 'Select department...' }, ...DEPTS.map(d => ({ value: d, label: d }))]} />
            </div>
          </Card>
          <Card title="Role & Permissions">
            <Select label="Role *" options={roles} value={form.role_id} onChange={set('role_id')} error={errors.role_id} />
          </Card>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => navigate('/admin/users')}>Cancel</Button>
            <Button type="submit" loading={submitting}>{isEdit ? 'Save Changes' : 'Create User'}</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
