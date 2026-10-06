import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Table, Modal, Input, LoadingSpinner } from '../../components/ui';
import { usersApi } from '../../api';
import toast from 'react-hot-toast';

const MOCK_ROLES = [
  { id: 'r1', name: 'super_admin', description: 'Full access to all system features and administration', user_count: 2, is_system: true },
  { id: 'r2', name: 'operations_manager', description: 'Oversees enrollments, health plans, and employers', user_count: 5, is_system: true },
  { id: 'r3', name: 'claims_officer', description: 'Reviews, adjudicates, and approves healthcare claims', user_count: 8, is_system: true },
  { id: 'r4', name: 'finance_officer', description: 'Manages invoicing, premium collections, and provider settlements', user_count: 4, is_system: true },
  { id: 'r5', name: 'medical_officer', description: 'Handles clinical authorizations and hospital referrals', user_count: 6, is_system: true },
  { id: 'r6', name: 'customer_service', description: 'Resolves member inquiries, grievances, and service cases', user_count: 12, is_system: false },
];

export default function RoleList() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });

  const loadRoles = () => {
    setLoading(true);
    usersApi.getRoles()
      .then(res => {
        const list = res.data?.data || res.data || [];
        setRoles(list.length ? list : MOCK_ROLES);
      })
      .catch(() => {
        setRoles(MOCK_ROLES);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newRole.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    setCreating(true);
    try {
      await usersApi.createRole(newRole);
      toast.success('Role created successfully');
      setShowModal(false);
      setNewRole({ name: '', description: '' });
      loadRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    {
      header: 'Role Name',
      accessor: row => (
        <span className="font-semibold text-gray-900 capitalize">
          {(row.name || '').replace(/_/g, ' ')}
        </span>
      )
    },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Assigned Users',
      accessor: row => <span className="font-medium text-gray-700">{row.user_count ?? row.userCount ?? 0}</span>
    },
    {
      header: 'System Role',
      accessor: row => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.is_system || row.isSystem ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          {row.is_system || row.isSystem ? 'System Default' : 'Custom'}
        </span>
      )
    },
  ];

  return (
    <Layout title="Roles & Permissions" subtitle="Manage role-based access control policies">
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-gray-500">Configured security roles across the organization</p>
        <Button onClick={() => setShowModal(true)}>+ Create Role</Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : (
          <Table columns={columns} data={roles} emptyMessage="No roles defined." />
        )}
      </Card>

      {showModal && (
        <Modal
          title="Create New Role"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button loading={creating} onClick={handleCreate}>Save Role</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Role Name *"
              placeholder="e.g. auditor"
              value={newRole.name}
              onChange={e => setNewRole({ ...newRole, name: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Scope of responsibilities and permissions..."
                value={newRole.description}
                onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
