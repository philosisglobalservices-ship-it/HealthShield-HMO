import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { auditApi } from '../../api';

export function Header({ title, subtitle }) {
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    auditApi.getNotifications()
      .then((res) => setNotifCount(res.data.unreadCount || 0))
      .catch(() => {});
  }, [title]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

export default Header;
