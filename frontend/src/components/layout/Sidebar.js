import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Stethoscope, FileText, UserCheck,
  ShieldCheck, ClipboardList, Receipt, CreditCard, DollarSign, MessageSquare,
  UserCog, Activity, AlertTriangle, BarChart3, ChevronDown, ChevronRight,
  LogOut, Shield, Heart,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navGroups = [
  {
    label: null,
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'HMO Operations',
    items: [
      { to: '/members', icon: Users, label: 'Members' },
      { to: '/employers', icon: Building2, label: 'Employers' },
      { to: '/providers', icon: Stethoscope, label: 'Providers' },
      { to: '/plans', icon: FileText, label: 'Health Plans' },
      { to: '/enrollments', icon: UserCheck, label: 'Enrollments' },
    ],
  },
  {
    label: 'Healthcare',
    items: [
      { to: '/authorizations', icon: ShieldCheck, label: 'Authorizations' },
      { to: '/claims', icon: ClipboardList, label: 'Claims' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/finance/invoices', icon: Receipt, label: 'Invoices' },
      { to: '/finance/payments', icon: CreditCard, label: 'Payments' },
      { to: '/finance/settlements', icon: DollarSign, label: 'Settlements' },
    ],
  },
  {
    label: 'Customer Service',
    items: [
      { to: '/cases', icon: MessageSquare, label: 'Service Cases' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/admin/users', icon: UserCog, label: 'Users' },
      { to: '/admin/audit-logs', icon: Activity, label: 'Audit Logs' },
      { to: '/admin/security-events', icon: AlertTriangle, label: 'Security Events' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/reports/members', icon: BarChart3, label: 'Member Report' },
      { to: '/reports/claims', icon: BarChart3, label: 'Claims Report' },
      { to: '/reports/financial', icon: BarChart3, label: 'Financial Report' },
      { to: '/reports/providers', icon: BarChart3, label: 'Provider Report' },
      { to: '/reports/utilization', icon: BarChart3, label: 'Utilization' },
    ],
  },
];

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-blue-600 text-white font-medium'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function NavGroup({ label, items, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!label) {
    return (
      <div className="space-y-0.5">
        {items.map((item) => <NavItem key={item.to} {...item} />)}
      </div>
    );
  }
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors"
      >
        {label}
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          {items.map((item) => <NavItem key={item.to} {...item} />)}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-64 flex-shrink-0 bg-gray-900 h-screen flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="p-2 bg-blue-600 rounded-xl">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">HealthShield</p>
          <p className="text-gray-400 text-xs">HMO Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navGroups.map((group, i) => (
          <NavGroup key={i} label={group.label} items={group.items} defaultOpen={i < 3} />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-800 px-3 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-gray-400 text-xs truncate">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
