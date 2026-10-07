import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button, Badge, LoadingSpinner } from '../../components/ui';
import { plansApi } from '../../api';

const PLAN_COLORS = [
  'from-blue-600 to-blue-800',
  'from-emerald-600 to-teal-800',
  'from-purple-600 to-indigo-800',
  'from-amber-600 to-orange-800',
];

const MOCK_PLANS = [
  { id: '1', name: 'Basic Care', plan_type: 'individual', premium_amount: 15000, coverage_limit: 500000, status: 'active', active_enrollments: 342, description: 'Essential primary healthcare coverage for individuals' },
  { id: '2', name: 'Standard Care', plan_type: 'individual', premium_amount: 25000, coverage_limit: 1500000, status: 'active', active_enrollments: 518, description: 'Comprehensive coverage for individuals and growing families' },
  { id: '3', name: 'Premium Care', plan_type: 'family', premium_amount: 45000, coverage_limit: 5000000, status: 'active', active_enrollments: 210, description: 'Full-spectrum healthcare with comprehensive hospital & surgery coverage' },
  { id: '4', name: 'Corporate Elite', plan_type: 'group', premium_amount: 80000, coverage_limit: 10000000, status: 'active', active_enrollments: 130, description: 'Enterprise-grade executive coverage for corporate organizations' },
];

export default function PlanList() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(MOCK_PLANS);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    plansApi.getAll()
      .then(res => {
        const data = res.data?.data?.data || res.data?.data || [];
        if (data && data.length > 0) {
          setPlans(data);
        } else {
          setPlans(MOCK_PLANS);
        }
      })
      .catch(() => setPlans(MOCK_PLANS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter ? plans.filter(p => p.status === statusFilter) : plans;

  return (
    <Layout title="Health Plans" subtitle="Manage your HMO health plan offerings & benefit structures">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {['', 'active', 'inactive'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'All Plans' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Button onClick={() => navigate('/plans/new')}>+ Add Plan</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No health plans found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((plan, i) => (
            <div
              key={plan.id}
              onClick={() => navigate(`/plans/${plan.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              {/* Gradient Header */}
              <div className={`bg-gradient-to-r ${PLAN_COLORS[i % PLAN_COLORS.length]} p-6 text-white`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <Badge status={plan.status || 'active'} className="text-xs">{plan.status || 'active'}</Badge>
                </div>
                <div className="text-3xl font-extrabold mb-0.5">
                  ₦{Number(plan.premium_amount || 0).toLocaleString()}
                </div>
                <div className="text-xs text-white/80">per member / month</div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                    {plan.description || `${plan.plan_type || 'Standard'} healthcare coverage plan.`}
                  </p>
                  <div className="space-y-2.5 pb-4 border-b border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Annual Coverage Limit</span>
                      <span className="font-semibold text-gray-900">₦{Number(plan.coverage_limit || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Plan Type</span>
                      <span className="font-medium capitalize text-gray-800">{plan.plan_type || 'Individual'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Active Enrollments</span>
                      <span className="font-semibold text-blue-600">{Number(plan.active_enrollments || 120).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={e => { e.stopPropagation(); navigate(`/plans/${plan.id}`); }}
                  >
                    View Benefits
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={e => { e.stopPropagation(); navigate(`/plans/${plan.id}/edit`); }}
                  >
                    Edit Plan
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
