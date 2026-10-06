import React from 'react';

export function Pagination({ page, currentPage, totalPages = 1, total = 0, limit = 20, onPageChange, onLimitChange }) {
  const activePage = page ?? currentPage ?? 1;

  if (totalPages <= 1 && total <= limit) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, activePage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  const handlePageChange = (p) => onPageChange && onPageChange(p);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        {total > 0 && (
          <span className="text-gray-500">
            Showing {Math.min((activePage - 1) * limit + 1, total)}–{Math.min(activePage * limit, total)} of {total}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(activePage - 1)}
          disabled={activePage <= 1}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ←
        </button>
        {start > 1 && <span className="px-2 text-gray-400">...</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => handlePageChange(p)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              p === activePage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && <span className="px-2 text-gray-400">...</span>}
        <button
          onClick={() => handlePageChange(activePage + 1)}
          disabled={activePage >= totalPages}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>
    </div>
  );
}

export default Pagination;
