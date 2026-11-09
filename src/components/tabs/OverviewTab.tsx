import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldAlert,
  Percent,
  CheckCircle2,
  Award
} from 'lucide-react';
import { AppDatasets } from '../../types';
import { calculateKPIs } from '../../utils/dataEngine';
import { DynamicChart } from '../DynamicChart';

interface OverviewTabProps {
  datasets: AppDatasets;
  onNavigateTab?: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ datasets, onNavigateTab }) => {
  const kpis = calculateKPIs(datasets);
  const ledger = datasets.financialLedger;
  const orders = datasets.orders;

  // 1. Line graph: Actual vs Projected Revenue across the historical timeline
  // Extract all distinct dates or months from ledger and orders
  const dateMap: Record<string, { actual: number; projected: number }> = {};

  // Actual revenue from financial ledger (type == 'Revenue' or 'REVENUE')
  ledger.forEach(f => {
    if (f.type.toUpperCase() === 'REVENUE' && f.date) {
      const monthKey = f.date.slice(0, 7); // 'YYYY-MM'
      if (!dateMap[monthKey]) dateMap[monthKey] = { actual: 0, projected: 0 };
      dateMap[monthKey].actual += f.amount;
    }
  });

  // Projected revenue from orders_data.csv (quotePrice distributed by creationDate month)
  orders.forEach(o => {
    if (o.creationDate) {
      const monthKey = o.creationDate.slice(0, 7);
      if (!dateMap[monthKey]) dateMap[monthKey] = { actual: 0, projected: 0 };
      dateMap[monthKey].projected += (o.quotePrice || 0);
    }
  });

  // Sort chronological timeline
  const sortedMonths = Object.keys(dateMap).sort();

  // If no date entries exist yet, build placeholder chronological points
  const actualVsProjectedData = sortedMonths.length > 0
    ? sortedMonths.map(m => ({
        label: m,
        value: dateMap[m].actual,
        secondaryValue: dateMap[m].projected || Math.round(dateMap[m].actual * 1.15)
      }))
    : [
        { label: '2024-Q1', value: 38000, secondaryValue: 42000 },
        { label: '2024-Q2', value: 45000, secondaryValue: 48000 },
        { label: '2024-Q3', value: 52000, secondaryValue: 50000 },
        { label: '2024-Q4', value: 58000, secondaryValue: 62000 },
        { label: '2025-Q1', value: 64000, secondaryValue: 70000 },
        { label: '2025-Q2', value: 71000, secondaryValue: 75000 },
        { label: '2025-Q3', value: 85000, secondaryValue: 90000 }
      ];

  // Stage demand vs capacity
  const stageComparisonData = [
    { label: 'Design', value: kpis.stageDemand.Design, secondaryValue: kpis.stageCapacity.Design },
    { label: 'Milling', value: kpis.stageDemand.Milling, secondaryValue: kpis.stageCapacity.Milling },
    { label: 'Joinery', value: kpis.stageDemand.Joinery, secondaryValue: kpis.stageCapacity.Joinery },
    { label: 'Finishing', value: kpis.stageDemand.Finishing, secondaryValue: kpis.stageCapacity.Finishing }
  ];

  return (
    <div className="space-y-6">
      {/* Top Level Dynamic KPI Overview Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Revenue */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#33443c] font-mono">
            ${kpis.totalRevenue.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#5e8673] font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Financial receipts &amp; quotes</span>
          </div>
        </div>

        {/* KPI 2: Net Operating Profit */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Net Operating Profit</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold font-mono ${kpis.netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            ${kpis.netOperatingProfit.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#5e8673] font-medium">
            <span>Margin: <strong>{kpis.profitMargin}%</strong></span>
          </div>
        </div>

        {/* KPI 3: Order Win Rate */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Order Win Rate</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#33443c] font-mono">
            {kpis.orderWinRate}%
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#5e8673] font-medium">
            <span>Orders status != 'LOST'</span>
          </div>
        </div>

        {/* KPI 4: Total Late Penalties */}
        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-2">
            <span className="font-bold">Total Late Penalties</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 font-mono">
            ${kpis.totalLatePenalties.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-600 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Delayed contractual orders</span>
          </div>
        </div>

        {/* KPI 5: Production Bottleneck */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-2">
            <span className="font-bold">Production Bottleneck</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-800 font-mono">
            {kpis.totalBottleneckHours} hrs deficit
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-700 font-medium">
            <span>Critical in Milling stage queue</span>
          </div>
        </div>
      </div>

      {/* Primary Visualizations Grid: Line graph showing Actual vs Projected Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Graph: Actual vs Projected Revenue */}
        <DynamicChart
          title="Actual vs Projected Revenue Timeline"
          subtitle="Plotting chronological receipts (primary) against projected pipeline revenue (secondary line)"
          data={actualVsProjectedData}
          valuePrefix="$"
          defaultVizType="Line"
        />

        {/* Stage Demand vs Staff Capacity */}
        <DynamicChart
          title="Active Stage Demand vs Staff Capacity"
          subtitle="Hours required in active queue vs available 40h capacity per technician"
          data={stageComparisonData}
          valueSuffix="h"
          defaultVizType="Bar"
        />
      </div>
    </div>
  );
};
