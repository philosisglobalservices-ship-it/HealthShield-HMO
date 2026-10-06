import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Input, Select } from '../../components/ui';

export default function AuthorizationForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    memberId: '',
    providerId: '',
    category: '',
    description: '',
    icdCode: '',
    procedureCode: '',
    requestedAmount: '',
    urgency: 'Routine',
    expiryDate: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/authorizations');
  };

  return (
    <Layout title="New Authorization Request">
      <Card className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Member ID / Search" name="memberId" value={formData.memberId} onChange={handleChange} required />
            <Input label="Provider ID / Search" name="providerId" value={formData.providerId} onChange={handleChange} required />
            
            <Select 
              label="Service Category" 
              name="category" 
              value={formData.category} 
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Category' },
                { value: 'Outpatient', label: 'Outpatient' },
                { value: 'Inpatient', label: 'Inpatient' },
                { value: 'Surgery', label: 'Surgery' },
                { value: 'Specialist', label: 'Specialist' },
                { value: 'Laboratory', label: 'Laboratory' },
                { value: 'Pharmacy', label: 'Pharmacy' },
                { value: 'Dental', label: 'Dental' },
                { value: 'Optical', label: 'Optical' },
                { value: 'Emergency', label: 'Emergency' },
                { value: 'Maternity', label: 'Maternity' }
              ]}
              required
            />
            
            <Select 
              label="Urgency" 
              name="urgency" 
              value={formData.urgency} 
              onChange={handleChange}
              options={[
                { value: 'Routine', label: 'Routine' },
                { value: 'Urgent', label: 'Urgent' },
                { value: 'Emergency', label: 'Emergency' }
              ]}
            />
            
            <Input label="ICD Code" name="icdCode" value={formData.icdCode} onChange={handleChange} />
            <Input label="Procedure Code" name="procedureCode" value={formData.procedureCode} onChange={handleChange} />
            <Input label="Requested Amount (₦)" type="number" name="requestedAmount" value={formData.requestedAmount} onChange={handleChange} required />
            <Input label="Expiry Date" type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Service Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              className="w-full border rounded p-2" 
              rows="3" 
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              className="w-full border rounded p-2" 
              rows="3"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
