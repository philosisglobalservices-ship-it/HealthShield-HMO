import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export function EmptyState({ icon: Icon = Inbox, title = 'No data found', description, action, actionLabel, actionIcon }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-gray-100 rounded-full">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">{description}</p>}
      {action && actionLabel && (
        <Button onClick={action} size="sm" icon={actionIcon}>{actionLabel}</Button>
      )}
    </div>
  );
}

export default EmptyState;
