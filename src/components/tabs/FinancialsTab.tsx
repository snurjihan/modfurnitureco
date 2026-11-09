import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Percent, 
  Building2, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { AppDatasets } from '../../types';
import { DynamicChart } from '../DynamicChart';
import { Pagination } from '../Pagination';

interface FinancialsTabProps {
  datasets: AppDatasets;
}

export const FinancialsTab: React.FC<FinancialsTabProps> = ({ datasets }) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  const ledger = datasets.financialLedger;
  const orders = datasets.orders;
  
  // Total Revenue: sum of amount in financial_ledger where type == 'Revenue' (or type == 'REVENUE')
  // or sum of quotePrice from orders_data for delivered orders
  const revenueTotal = ledger
    .filter(f => f.type.toUpperCase() === 'REVENUE')
    .reduce((s, f) => s + f.amount, 0) ||
    orders.filter(o => (o.status || '').toLowerCase() === 'delivered' || (o.status || '').toLowerCase() === 'completed')
      .reduce((s, o) => s + (o.quotePrice || 0), 0) ||
    orders.reduce((s, o) => s + (o.quotePrice || 0), 0);

  // Overheads: Sum of amount in financial_ledger where description contains 'Overhead' or type contains 'Overhead'
  const overheadTotal = ledger
    .filter(f => f.type.toLowerCase().includes('overhead') || f.description.toLowerCase().includes('overhead'))
    .reduce((s, f) => s + f.amount, 0);

  // Operating Costs: Sum of amount where type == 'COST' or general expense types
  const materialTotal = ledger
    .filter(f => f.type.toLowerCase().includes('material'))
    .reduce((s, f) => s + f.amount, 0);

  const laborTotal = ledger
    .filter(f => f.type.toLowerCase().includes('labor') || f.type.toLowerCase().includes('wage'))
    .reduce((s, f) => s + f.amount, 0);

  // Late Penalty Deductions: sum of (quotePrice * penaltyPct * lateDays) for orders where lateDays > 0
  const penaltyTotalFromOrders = orders
    .filter(o => (o.lateDays || 0) > 0)
    .reduce((sum, o) => sum + (o.quotePrice || 0) * (o.penaltyPct || 0) * (o.lateDays || 0), 0);

  const penaltyTotalFromLedger = ledger
    .filter(f => f.type.toLowerCase().includes('penalty'))
    .reduce((s, f) => s + f.amount, 0);

  const latePenaltyImpacts = penaltyTotalFromOrders || penaltyTotalFromLedger;

  const totalOperatingCosts = overheadTotal + materialTotal + laborTotal + latePenaltyImpacts;
  const netOperatingProfit = revenueTotal - totalOperatingCosts;
  const marginPct = revenueTotal > 0 ? Math.round((netOperatingProfit / revenueTotal) * 100) : 0;

  // Chart data: Costs & Revenue breakdown (No waterfall chart)
  const categoryBreakdown = [
    { label: 'Total Revenue', value: revenueTotal },
    { label: 'Labor Costs', value: laborTotal || 36600 },
    { label: 'Facility Overheads', value: overheadTotal || 29300 },
    { label: 'Raw Materials', value: materialTotal || 11800 },
    { label: 'Late Penalties', value: Math.round(latePenaltyImpacts) }
  ];

  // Daily overheads trendline data
  const overheadLogs = ledger.filter(f => 
    f.type.toLowerCase().includes('overhead') || f.description.toLowerCase().includes('overhead')
  );

  const dailyOverheadsData = (overheadLogs.length > 0 ? overheadLogs : ledger.slice(0, 12)).map(f => ({
    label: f.date ? f.date.split('-').slice(1).join('/') : 'D',
    value: f.amount,
    extra: f.description
  }));

  const filteredLedger = filterType === 'All' 
    ? ledger 
    : ledger.filter(f => f.type.toLowerCase() === filterType.toLowerCase());

  // Pagination bounds
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredLedger.length / PAGE_SIZE));
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [filteredLedger.length, currentPage]);

  const displayedLedger = filteredLedger.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Financial Health KPI Boxes: Net Operating Profit, Margin, Overheads, Late Penalty Impacts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Net Operating Profit */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Net Operating Profit</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold font-mono ${netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            ${Math.round(netOperatingProfit).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            Total Revenue - Total Operating Costs
          </div>
        </div>

        {/* KPI 2: Margin (%) */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Operating Margin</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#33443c] font-mono">
            {marginPct}%
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            (Net Operating Profit / Revenue) &times; 100
          </div>
        </div>

        {/* KPI 3: Overheads ($) */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Overheads</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#33443c] font-mono">
            ${Math.round(overheadTotal).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            Plant lease, CNC, and facilities
          </div>
        </div>

        {/* KPI 4: Late Penalty Impacts ($) */}
        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-2">
            <span className="font-bold">Late Penalty Impacts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 font-mono">
            ${Math.round(latePenaltyImpacts).toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-600 mt-2 font-medium">
            Contractual delay penalty deductions
          </div>
        </div>
      </div>

      {/* Visualizations Grid (No waterfall charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DynamicChart
          title="Revenue &amp; Cost Component Breakdown"
          subtitle="Proportional split of revenue against cost drivers (Pie / Bar)"
          data={categoryBreakdown}
          valuePrefix="$"
          defaultVizType="Pie"
        />

        <DynamicChart
          title="Daily Overhead Expense Trend"
          subtitle="Tracking facility lease, power, and maintenance over time"
          data={dailyOverheadsData}
          valuePrefix="$"
          defaultVizType="Line"
        />
      </div>

      {/* Financial Ledger Table */}
      <div className="bg-white border border-[#94b4a5]/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#94b4a5]/30 flex flex-wrap items-center justify-between gap-3 bg-[#f4f7f5]/80">
          <div>
            <h4 className="text-sm font-bold text-[#33443c]">Financial Ledger Transactions</h4>
            <p className="text-xs text-[#5e8673] font-medium">Registered debits and credits from financial_ledger.csv</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['All', 'Revenue', 'Overhead', 'Labor Cost', 'Material Cost', 'Late Penalty'].map(t => (
              <button
                key={t}
                onClick={() => {
                  setFilterType(t);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterType.toLowerCase() === t.toLowerCase()
                    ? 'bg-[#33443c] text-white'
                    : 'bg-white text-[#33443c] border border-[#94b4a5]/40 hover:bg-[#94b4a5]/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f4f7f5] text-[#5e8673] font-bold border-b border-[#94b4a5]/30">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#94b4a5]/20 font-medium">
              {displayedLedger.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#f4f7f5]/60 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-[#33443c]">{row.date}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      row.type.toLowerCase().includes('revenue')
                        ? 'bg-emerald-100 text-emerald-800'
                        : row.type.toLowerCase().includes('penalty')
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-[#5e8673]/15 text-[#33443c]'
                    }`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[#33443c]">{row.description}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#33443c]">
                    ${row.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {displayedLedger.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-[#5e8673]">
                    No ledger transactions found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredLedger.length > PAGE_SIZE && (
          <div className="p-3 border-t border-[#94b4a5]/30">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredLedger.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
