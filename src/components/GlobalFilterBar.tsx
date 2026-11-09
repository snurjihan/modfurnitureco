import React from 'react';
import { Calendar, RotateCcw, Check, Clock } from 'lucide-react';
import { GlobalFilterState } from '../types';

interface GlobalFilterBarProps {
  filters: GlobalFilterState;
  onFilterChange: (newFilters: GlobalFilterState) => void;
  onResetFilters: () => void;
  totalFilteredOrders: number;
  totalOrders: number;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFilteredOrders,
  totalOrders
}) => {
  const isFilterActive = Boolean(filters.startDate || filters.endDate);

  const setPreset = (preset: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (preset === 'ALL') {
      onFilterChange({ startDate: '', endDate: '', preset: 'ALL' });
    } else if (preset === '30D') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      onFilterChange({ startDate: past.toISOString().split('T')[0], endDate: today, preset: '30D' });
    } else if (preset === '2024') {
      onFilterChange({ startDate: '2024-01-01', endDate: '2024-12-31', preset: '2024' });
    } else if (preset === '2025') {
      onFilterChange({ startDate: '2025-01-01', endDate: '2025-12-31', preset: '2025' });
    } else if (preset === '2026') {
      onFilterChange({ startDate: '2026-01-01', endDate: '2026-12-31', preset: '2026' });
    }
  };

  return (
    <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#94b4a5]/30 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#5e8673]/15 text-[#33443c] border border-[#5e8673]/30">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#33443c] tracking-wide uppercase">
              Global Date Filter
            </span>
            <p className="text-[10px] text-[#5e8673] font-medium leading-none mt-0.5">
              Universal anchor across time-series logs
            </p>
          </div>
        </div>

        {isFilterActive && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Date Range Inputs */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-[#5e8673] uppercase mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value, preset: 'CUSTOM' })}
              className="w-full bg-[#f4f7f5] border border-[#94b4a5]/50 rounded-xl px-2 py-1.5 text-xs text-[#33443c] focus:outline-none focus:ring-1 focus:ring-[#5e8673]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#5e8673] uppercase mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value, preset: 'CUSTOM' })}
              className="w-full bg-[#f4f7f5] border border-[#94b4a5]/50 rounded-xl px-2 py-1.5 text-xs text-[#33443c] focus:outline-none focus:ring-1 focus:ring-[#5e8673]"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1 pt-1">
          {[
            { id: 'ALL', label: 'All Time' },
            { id: '30D', label: '30 Days' },
            { id: '2024', label: '2024' },
            { id: '2025', label: '2025' },
            { id: '2026', label: '2026' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                filters.preset === p.id
                  ? 'bg-[#33443c] text-white'
                  : 'bg-[#f4f7f5] text-[#33443c] hover:bg-[#94b4a5]/20 border border-[#94b4a5]/40'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filter Status Note */}
      <div className="bg-[#f4f7f5] rounded-xl p-2 border border-[#94b4a5]/30 flex items-center justify-between text-[11px]">
        <span className="text-[#5e8673] font-medium">Orders in window:</span>
        <span className="font-mono font-bold text-[#33443c]">
          {totalFilteredOrders} / {totalOrders}
        </span>
      </div>
    </div>
  );
};
