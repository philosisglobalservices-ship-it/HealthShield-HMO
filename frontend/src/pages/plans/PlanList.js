import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Card, Badge, LoadingSpinner } from '../../components/ui';
import { plansApi } from '../../api';
import toast from 'react-hot-toast';

const PLAN_COLORS = ['from-blue-500 to-blue-700', 'from-emerald-500 to-emerald-700', 'from-purple-500 to-purple-700', 'from-orange-500 to-orange-700'];

const MOCK_PLANS = [
  { id: '1', name: 'Basic Care', plan_type: 'individual', premium_amount: 15000, coverage_limit: 500000, status: 'active', active_enrollments: 342, description: 'Essential healthcare coverage for individuals' },
  { id: '2', name: 'Standard Care', plan_type: 'individual', premium_amount: 25000, coverage_limit: 1500000, status: 'active', active_enrollments: 518, description: 'Comprehensive coverage for individuals and families' },
  { id: '3', name: 'Premium Care', plan_type: 'family', premium_amount: 45000, coverage_limit: 5000000, status: 'active', active_enrollments: 210, description: 'Full-spectrum healthcare for the whole family' },
  { id: '4', name: 'Corporate Elite', plan_type: 'group', premium_amount: 80000, coverage_limit: 10000000, status: 'active', active_enrollments: 130, description: 'Enterprise-grade coverage for corporate clients' },
];

export default function PlanList() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    plansApi.getAll()
      .then(res => {
        const data = res.data?.data?.data || res.data?.data || [];
        setPlans(data.length ? data : MOCK_PLANS);
      })
      .catch(() => setPlans(MOCK_PLANS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter ? plans.filter(p => p.status === statusFilter) : plans;

  return (
    <Layout title="Health Plans" subtitle="Manage your HMO health plan offerings">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {['', 'active', 'inactive'].map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Button onClick={() => navigate('/plans/new')}>+ Add Plan</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No plans found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((plan, i) => (
            <div key={plan.id}
              onClick={() => navigate(`/plans/${plan.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer overflow-hidden">
              {/* Gradient header */}
              <div className={`bg-gradient-to-r ${PLAN_COLORS[i % PLAN_COLORS.length]} p-5 text-white`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <Badge status={plan.status} className="text-xs">{plan.status}</Badge>
                </div>
                <div className="text-3xl font-bold mb-0.5">
                  ₦{Number(plan.premium_amount).toLocaleString()}
                </div>
                <div className="text-sm opacity-80">per month</div>
              </div>
              {/* Body */}
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-4">{plan.description || `${plan.plan_type} health plan`}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Coverage Limit</span>
                    <span className="font-semibold text-gray-800">₦{Number(plan.coverage_limit || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Plan Type</span>
                    <span className="font-medium capitalize">{plan.plan_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active Enrollments</span>
                    <span className="font-semibold text-blue-600">{(plan.active_enrollments || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={e => { e.stopPropagation(); navigate(`/plans/${plan.id}`); }}>
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1" onClick={e => { e.stopPropagation(); navigate(`/plans/${plan.id}/edit`); }}>
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
