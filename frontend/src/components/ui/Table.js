import React from 'react';

/**
 * Table component.
 * columns: [{ key?, accessor?, header, render? }]
 *   - key: field name (renders row[key])
 *   - accessor: field name OR function (row) => value
 *   - render: function (value, row) => ReactNode (takes priority)
 */
export function Table({ columns = [], data = [], loading = false, onRowClick, emptyMessage = 'No data found', emptyIcon }) {
  // Resolve cell value from either accessor or key
  const cellValue = (col, row) => {
    if (col.render) return col.render(row[col.key || col.accessor], row);
    if (typeof col.accessor === 'function') return col.accessor(row);
    const field = col.accessor || col.key;
    return field ? (row[field] ?? '—') : '—';
  };

  const colKey = (col, i) => col.key || (typeof col.accessor === 'string' ? col.accessor : `col-${i}`);

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, i) => (
                <th key={colKey(col, i)} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={colKey(col, j)} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || !data.length) {
    return (
      <div className="text-center py-16">
        {emptyIcon && <div className="flex justify-center mb-3 text-gray-300">{emptyIcon}</div>}
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, i) => (
              <th key={colKey(col, i)} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick && onRowClick(row)}
              className={`${onRowClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
            >
              {columns.map((col, j) => (
                <td key={colKey(col, j)} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                  {cellValue(col, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
