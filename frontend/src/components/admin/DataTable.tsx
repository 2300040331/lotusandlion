'use client';

import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends { _id: string }>({ 
  columns, 
  data, 
  loading, 
  onRowClick,
  emptyMessage = 'No data found.'
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white border border-[#573B2D]/20 rounded-xl shadow-sm">
        <div className="text-[#573B2D] text-xs font-bold uppercase tracking-[0.3em] animate-pulse">
          Loading Data...
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-white border border-[#573B2D]/20 rounded-xl text-[#573B2D]/70 shadow-sm">
        <p className="text-xs uppercase tracking-widest font-bold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#573B2D]/20 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#FEFFEF] border-b border-[#573B2D]/20">
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`px-6 py-4 text-[11px] uppercase tracking-widest text-[#573B2D] font-extrabold ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#573B2D]/10 bg-white">
            {data.map((item) => (
              <tr 
                key={item.id} 
                onClick={() => onRowClick?.(item)}
                className={`transition-colors hover:bg-[#FEFFEF]/60 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col, idx) => (
                  <td key={idx} className={`px-6 py-4 text-[#573B2D] ${col.className || ''}`}>
                    {typeof col.accessor === 'function' 
                      ? col.accessor(item) 
                      : (col.accessor ? (item[col.accessor] as ReactNode) : null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
