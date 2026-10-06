import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Input, Select } from '../../components/ui';
import { casesApi, membersApi } from '../../api';
import toast from 'react-hot-toast';

const CASE_TYPES = [
  { value: 'complaint', label: 'Complaint' },
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'service_request', label: 'Service Request' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'appeal', label: 'Appeal' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function CaseForm() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    case_type: 'inquiry',
    priority: 'normal',
    subject: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    membersApi.getAll({ limit: 100 })
      .then(res => {
        const list = res.data?.data?.data || res.data?.data || [];
        setMembers([
          { value: '', label: 'Select member (optional)...' },
          ...list.map(m => ({
            value: m.id,
            label: `${m.first_name} ${m.last_name} (${m.member_number || 'No ID'})`
          }))
        ]);
      })
      .catch(() => {
        setMembers([{ value: '', label: 'Select member (optional)...' }]);
      });
  }, []);

  const validate = () => {
    const errs = {};
    if (!formData.subject.trim()) errs.subject = 'Subject is required';
    if (!formData.description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await casesApi.create(formData);
      toast.success('Case created successfully');
      const newId = res.data?.data?.id;
      navigate(newId ? `/cases/${newId}` : '/cases');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="New Service Case" subtitle="Log a customer service ticket or complaint">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/cases')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 block"
        >
          ← Back to Cases
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card title="Case Information">
            <div className="space-y-4">
              <Select
                label="Associated Member"
                value={formData.member_id}
                onChange={e => setFormData({ ...formData, member_id: e.target.value })}
                options={members}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Case Type *"
                  value={formData.case_type}
                  onChange={e => setFormData({ ...formData, case_type: e.target.value })}
                  options={CASE_TYPES}
                />
                <Select
                  label="Priority *"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  options={PRIORITIES}
                />
              </div>

              <Input
                label="Subject *"
                placeholder="Brief summary of the issue..."
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                error={errors.subject}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={5}
                  placeholder="Detailed description of the inquiry or grievance..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                )}
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => navigate('/cases')}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Case
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
