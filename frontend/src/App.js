import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { FullPageSpinner } from './components/ui/LoadingSpinner';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import MemberList from './pages/members/MemberList';
import MemberDetail from './pages/members/MemberDetail';
import MemberForm from './pages/members/MemberForm';
import EmployerList from './pages/employers/EmployerList';
import EmployerDetail from './pages/employers/EmployerDetail';
import EmployerForm from './pages/employers/EmployerForm';
import ProviderList from './pages/providers/ProviderList';
import ProviderDetail from './pages/providers/ProviderDetail';
import ProviderForm from './pages/providers/ProviderForm';
import PlanList from './pages/plans/PlanList';
import PlanDetail from './pages/plans/PlanDetail';
import PlanForm from './pages/plans/PlanForm';
import EnrollmentList from './pages/enrollments/EnrollmentList';
import EnrollmentDetail from './pages/enrollments/EnrollmentDetail';
import EnrollmentForm from './pages/enrollments/EnrollmentForm';
import AuthorizationList from './pages/authorizations/AuthorizationList';
import AuthorizationDetail from './pages/authorizations/AuthorizationDetail';
import AuthorizationForm from './pages/authorizations/AuthorizationForm';
import ClaimList from './pages/claims/ClaimList';
import ClaimDetail from './pages/claims/ClaimDetail';
import ClaimForm from './pages/claims/ClaimForm';
import InvoiceList from './pages/finance/InvoiceList';
import PaymentList from './pages/finance/PaymentList';
import SettlementList from './pages/finance/SettlementList';
import FinancialDashboard from './pages/finance/FinancialDashboard';
import CaseList from './pages/cases/CaseList';
import CaseDetail from './pages/cases/CaseDetail';
import CaseForm from './pages/cases/CaseForm';
import UserList from './pages/admin/UserList';
import UserForm from './pages/admin/UserForm';
import RoleList from './pages/admin/RoleList';
import AuditLogs from './pages/admin/AuditLogs';
import SecurityEvents from './pages/admin/SecurityEvents';
import MemberReport from './pages/reports/MemberReport';
import ClaimsReport from './pages/reports/ClaimsReport';
import FinancialReport from './pages/reports/FinancialReport';
import ProviderReport from './pages/reports/ProviderReport';
import UtilizationReport from './pages/reports/UtilizationReport';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Private */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

      {/* HMO Operations - Members */}
      <Route path="/members" element={<PrivateRoute><MemberList /></PrivateRoute>} />
      <Route path="/members/new" element={<PrivateRoute><MemberForm /></PrivateRoute>} />
      <Route path="/members/:id" element={<PrivateRoute><MemberDetail /></PrivateRoute>} />
      <Route path="/members/:id/edit" element={<PrivateRoute><MemberForm /></PrivateRoute>} />

      {/* HMO Operations - Employers */}
      <Route path="/employers" element={<PrivateRoute><EmployerList /></PrivateRoute>} />
      <Route path="/employers/new" element={<PrivateRoute><EmployerForm /></PrivateRoute>} />
      <Route path="/employers/:id" element={<PrivateRoute><EmployerDetail /></PrivateRoute>} />
      <Route path="/employers/:id/edit" element={<PrivateRoute><EmployerForm /></PrivateRoute>} />

      {/* HMO Operations - Providers */}
      <Route path="/providers" element={<PrivateRoute><ProviderList /></PrivateRoute>} />
      <Route path="/providers/new" element={<PrivateRoute><ProviderForm /></PrivateRoute>} />
      <Route path="/providers/:id" element={<PrivateRoute><ProviderDetail /></PrivateRoute>} />
      <Route path="/providers/:id/edit" element={<PrivateRoute><ProviderForm /></PrivateRoute>} />

      {/* HMO Operations - Health Plans */}
      <Route path="/plans" element={<PrivateRoute><PlanList /></PrivateRoute>} />
      <Route path="/plans/new" element={<PrivateRoute><PlanForm /></PrivateRoute>} />
      <Route path="/plans/:id" element={<PrivateRoute><PlanDetail /></PrivateRoute>} />
      <Route path="/plans/:id/edit" element={<PrivateRoute><PlanForm /></PrivateRoute>} />

      {/* HMO Operations - Enrollments */}
      <Route path="/enrollments" element={<PrivateRoute><EnrollmentList /></PrivateRoute>} />
      <Route path="/enrollments/new" element={<PrivateRoute><EnrollmentForm /></PrivateRoute>} />
      <Route path="/enrollments/:id" element={<PrivateRoute><EnrollmentDetail /></PrivateRoute>} />

      {/* Healthcare - Authorizations */}
      <Route path="/authorizations" element={<PrivateRoute><AuthorizationList /></PrivateRoute>} />
      <Route path="/authorizations/new" element={<PrivateRoute><AuthorizationForm /></PrivateRoute>} />
      <Route path="/authorizations/:id" element={<PrivateRoute><AuthorizationDetail /></PrivateRoute>} />

      {/* Healthcare - Claims */}
      <Route path="/claims" element={<PrivateRoute><ClaimList /></PrivateRoute>} />
      <Route path="/claims/new" element={<PrivateRoute><ClaimForm /></PrivateRoute>} />
      <Route path="/claims/:id" element={<PrivateRoute><ClaimDetail /></PrivateRoute>} />

      {/* Finance */}
      <Route path="/finance" element={<Navigate to="/finance/dashboard" replace />} />
      <Route path="/finance/dashboard" element={<PrivateRoute><FinancialDashboard /></PrivateRoute>} />
      <Route path="/finance/invoices" element={<PrivateRoute><InvoiceList /></PrivateRoute>} />
      <Route path="/finance/payments" element={<PrivateRoute><PaymentList /></PrivateRoute>} />
      <Route path="/finance/settlements" element={<PrivateRoute><SettlementList /></PrivateRoute>} />

      {/* Customer Service - Cases */}
      <Route path="/cases" element={<PrivateRoute><CaseList /></PrivateRoute>} />
      <Route path="/cases/new" element={<PrivateRoute><CaseForm /></PrivateRoute>} />
      <Route path="/cases/:id" element={<PrivateRoute><CaseDetail /></PrivateRoute>} />

      {/* Administration */}
      <Route path="/admin/users" element={<PrivateRoute><UserList /></PrivateRoute>} />
      <Route path="/admin/users/new" element={<PrivateRoute><UserForm /></PrivateRoute>} />
      <Route path="/admin/roles" element={<PrivateRoute><RoleList /></PrivateRoute>} />
      <Route path="/admin/audit-logs" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
      <Route path="/admin/security-events" element={<PrivateRoute><SecurityEvents /></PrivateRoute>} />

      {/* Reports */}
      <Route path="/reports/members" element={<PrivateRoute><MemberReport /></PrivateRoute>} />
      <Route path="/reports/claims" element={<PrivateRoute><ClaimsReport /></PrivateRoute>} />
      <Route path="/reports/financial" element={<PrivateRoute><FinancialReport /></PrivateRoute>} />
      <Route path="/reports/providers" element={<PrivateRoute><ProviderReport /></PrivateRoute>} />
      <Route path="/reports/utilization" element={<PrivateRoute><UtilizationReport /></PrivateRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '10px', fontSize: '14px' } }} />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
