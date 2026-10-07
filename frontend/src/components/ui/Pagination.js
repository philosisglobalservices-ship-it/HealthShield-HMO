import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ 
  page, 
  currentPage, 
  totalPages = 1, 
  total = 0, 
  limit = 20, 
  onPageChange, 
  onLimitChange 
}) {
  const activePage = page ?? currentPage ?? 1;

  if (totalPages <= 1 && total <= limit) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, activePage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages || p === activePage) return;
    if (onPageChange) onPageChange(p);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200 rounded-b-xl">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        {total > 0 && (
          <span className="text-gray-500">
            Showing {Math.min((activePage - 1) * limit + 1, total)}–{Math.min(activePage * limit, total)} of {total}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handlePageChange(activePage - 1)}
          disabled={activePage <= 1}
          aria-label="Previous page"
          className="flex items-center justify-center p-1.5 min-w-[32px] h-8 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {start > 1 && <span className="px-1 text-gray-400">...</span>}
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handlePageChange(p)}
            className={`min-w-[32px] h-8 px-2 text-sm rounded-md border font-medium transition-colors ${
              p === activePage
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && <span className="px-1 text-gray-400">...</span>}
        <button
          type="button"
          onClick={() => handlePageChange(activePage + 1)}
          disabled={activePage >= totalPages}
          aria-label="Next page"
          className="flex items-center justify-center p-1.5 min-w-[32px] h-8 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
