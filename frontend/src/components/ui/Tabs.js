import React, { useState } from 'react';

/**
 * Tabs component — two usage modes:
 *
 * Mode A — Controlled (external state):
 *   <Tabs tabs={[{id, label, icon}]} activeTab={tab} onChange={setTab} />
 *   Render content yourself based on activeTab.
 *
 * Mode B — Self-contained (content embedded in tabs array):
 *   <Tabs tabs={[{label, content: <JSX />}]} />
 *   Component manages its own active state and renders content.
 */
export function Tabs({ tabs = [], activeTab: controlledActive, onChange, className = '' }) {
  const selfContained = tabs.length > 0 && 'content' in tabs[0];
  const [internalActive, setInternalActive] = useState(0);

  const activeIdx = selfContained ? internalActive : null;
  const activeId = !selfContained ? controlledActive : null;

  const handleClick = (tab, idx) => {
    if (selfContained) {
      setInternalActive(idx);
    } else {
      onChange && onChange(tab.id);
    }
  };

  const isActive = (tab, idx) =>
    selfContained ? idx === activeIdx : tab.id === activeId;

  return (
    <div className={className}>
      {/* Tab nav */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab, idx) => {
            const active = isActive(tab, idx);
            return (
              <button
                key={tab.id || tab.label || idx}
                onClick={() => handleClick(tab, idx)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0
                  ${active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.icon && <tab.icon className="h-4 w-4" />}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content (only in self-contained mode) */}
      {selfContained && (
        <div className="mt-4">
          {tabs[activeIdx]?.content}
        </div>
      )}
    </div>
  );
}

export default Tabs;
