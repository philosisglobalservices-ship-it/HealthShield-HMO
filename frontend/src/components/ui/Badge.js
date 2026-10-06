import React from 'react';

const variantMap = {
  // Status
  active: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  verified: 'bg-green-100 text-green-800',
  enrolled: 'bg-green-100 text-green-800',
  sent: 'bg-blue-100 text-blue-800',
  pending: 'bg-blue-100 text-blue-800',
  under_review: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-blue-100 text-blue-800',
  submitted: 'bg-indigo-100 text-indigo-800',
  partially_approved: 'bg-amber-100 text-amber-800',
  suspended: 'bg-amber-100 text-amber-800',
  overdue: 'bg-amber-100 text-amber-800',
  open: 'bg-amber-100 text-amber-800',
  terminated: 'bg-red-100 text-red-800',
  denied: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-100 text-gray-600',
  draft: 'bg-gray-100 text-gray-600',
  prospect: 'bg-gray-100 text-gray-600',
  // Priority
  critical: 'bg-red-100 text-red-800',
  emergency: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-orange-100 text-orange-800',
  normal: 'bg-blue-100 text-blue-800',
  routine: 'bg-gray-100 text-gray-600',
  low: 'bg-gray-100 text-gray-600',
  // Provider tiers
  tertiary: 'bg-purple-100 text-purple-800',
  secondary: 'bg-blue-100 text-blue-800',
  primary: 'bg-green-100 text-green-800',
  // Severity
  medium: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

export function Badge({ children, status, variant, className = '', size = 'sm' }) {
  // Extract a clean string representation safely
  let raw = '';
  if (typeof status === 'string') {
    raw = status;
  } else if (typeof variant === 'string') {
    raw = variant;
  } else if (typeof children === 'string') {
    raw = children;
  } else if (typeof children === 'number') {
    raw = String(children);
  }

  const key = String(raw || '').toLowerCase().trim().replace(/\s+/g, '_');
  const color = variantMap[key] || 'bg-gray-100 text-gray-700';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${color} ${className}`}>
      {children !== undefined && children !== null ? children : (status || variant || '')}
    </span>
  );
}

export default Badge;
