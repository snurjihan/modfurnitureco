import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, CheckCircle2, Clock, Filter, Layers, Sliders } from 'lucide-react';
import { AppDatasets, OrderRecord } from '../../types';
import { DynamicChart } from '../DynamicChart';
import { Pagination } from '../Pagination';

interface OrdersTabProps {
  datasets: AppDatasets;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ datasets }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [complexityFilter, setComplexityFilter] = useState<string>('All'); // 'All' or '1'..'10'
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20; // Exactly 20 rows with pagination (1, 2, 3...)

  // Status options per instructions: lost, delivered, design, milling, joinery, finishing
  const statusOptions = ['All', 'lost', 'delivered', 'design', 'milling', 'joinery', 'finishing'];
  const complexityOptions = ['All', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  const filteredOrders = datasets.orders.filter(order => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      !term ||
      order.id.toLowerCase().includes(term) ||
      order.productType.toLowerCase().includes(term) ||
      order.customerId.toLowerCase().includes(term);

    const orderStatusNorm = (order.status || '').toLowerCase();
    const orderStageNorm = (order.currentStage || '').toLowerCase();

    // Check status filter against status or currentStage
    let matchesStatus = true;
    if (statusFilter !== 'All') {
      const target = statusFilter.toLowerCase();
      matchesStatus = orderStatusNorm === target || orderStageNorm === target;
    }

    // Check complexity filter
    let matchesComplexity = true;
    if (complexityFilter !== 'All') {
      matchesComplexity = Number(order.complexity) === Number(complexityFilter);
    }

    return matchesSearch && matchesStatus && matchesComplexity;
  });

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [filteredOrders.length, currentPage]);

  const displayedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 1. Pie chart: Overall distribution of deliveryStatus for total order volume
  const deliveryStatusCounts: Record<string, number> = {};
  datasets.orders.forEach(o => {
    const ds = o.deliveryStatus || (o.lateDays > 0 ? 'Late' : (o.completionDate ? 'On Time' : 'In Progress'));
    deliveryStatusCounts[ds] = (deliveryStatusCounts[ds] || 0) + 1;
  });
  const deliveryStatusChartData = Object.entries(deliveryStatusCounts).map(([status, count]) => ({
    label: status,
    value: count
  }));

  // 2. Chart breaking down production hours by stage (design, milling, joinery, finishing)
  const stageHoursBreakdown = [
    { label: 'Design Hours', value: datasets.orders.reduce((sum, o) => sum + (o.designHours || 0), 0) },
    { label: 'Milling Hours', value: datasets.orders.reduce((sum, o) => sum + (o.millingHours || 0), 0) },
    { label: 'Joinery Hours', value: datasets.orders.reduce((sum, o) => sum + (o.joineryHours || 0), 0) },
    { label: 'Finishing Hours', value: datasets.orders.reduce((sum, o) => sum + (o.finishingHours || 0), 0) }
  ];

  // 3. Chart by Order Status
  const statusCounts: Record<string, number> = {};
  datasets.orders.forEach(o => {
    const st = (o.status || 'Active').toLowerCase();
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });
  const orderStatusChartData = Object.entries(statusCounts).map(([st, count]) => ({
    label: st.toUpperCase(),
    value: count
  }));

  // 4. Chart by Product Complexity (1-10)
  const complexityCounts: Record<number, number> = {};
  for (let c = 1; c <= 10; c++) complexityCounts[c] = 0;
  datasets.orders.forEach(o => {
    const c = o.complexity || 5;
    complexityCounts[c] = (complexityCounts[c] || 0) + 1;
  });
  const complexityChartData = Object.entries(complexityCounts).map(([c, count]) => ({
    label: `Complexity ${c}`,
    value: count
  }));

  // 5. Chart by Product Type
  const productTypeCounts: Record<string, number> = {};
  datasets.orders.forEach(o => {
    const pt = o.productType || 'Custom Piece';
    productTypeCounts[pt] = (productTypeCounts[pt] || 0) + 1;
  });
  const productTypeChartData = Object.entries(productTypeCounts).map(([pt, count]) => ({
    label: pt,
    value: count
  }));

  return (
    <div className="space-y-6">
      {/* Local Filter Bar: Complexity (1-10) & Status (lost, delivered, design, milling, joinery, finishing) */}
      <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#5e8673]" />
            <input
              type="text"
              placeholder="Search Order ID, Product, Customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#f4f7f5] border border-[#94b4a5]/50 rounded-xl pl-9 pr-3 py-2 text-xs text-[#33443c] placeholder-[#5e8673]/70 focus:outline-none focus:ring-2 focus:ring-[#5e8673]/30 font-medium"
            />
          </div>

          {/* Complexity filter dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-[#5e8673] flex items-center gap-1 shrink-0">
              <Sliders className="w-3.5 h-3.5" />
              Complexity:
            </span>
            <select
              value={complexityFilter}
              onChange={(e) => {
                setComplexityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#f4f7f5] border border-[#94b4a5]/50 text-[#33443c] text-xs font-semibold px-2.5 py-1.5 rounded-xl cursor-pointer focus:outline-none"
            >
              {complexityOptions.map(c => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Complexities (1-10)' : `Complexity ${c}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-[#94b4a5]/20">
          <span className="text-xs font-bold text-[#5e8673] mr-1 shrink-0">Status:</span>
          {statusOptions.map(status => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize shrink-0 ${
                statusFilter.toLowerCase() === status.toLowerCase()
                  ? 'bg-[#33443c] text-white shadow-xs font-bold'
                  : 'bg-[#f4f7f5] text-[#33443c] hover:bg-[#94b4a5]/20 border border-[#94b4a5]/40'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart: deliveryStatus distribution */}
        <DynamicChart
          title="Overall Delivery Status Distribution"
          subtitle="Proportion of orders delivered On Time, Late, or In Progress"
          data={deliveryStatusChartData}
          defaultVizType="Pie"
        />

        {/* Stage hours breakdown */}
        <DynamicChart
          title="Production Hours by Stage"
          subtitle="Cumulative hours required in Design, Milling, Joinery, Finishing"
          data={stageHoursBreakdown}
          valueSuffix="h"
          defaultVizType="Bar"
        />

        {/* Order Status Breakdown */}
        <DynamicChart
          title="Pipeline Volume by Order Status"
          subtitle="Orders categorized by workflow progress"
          data={orderStatusChartData}
          defaultVizType="Bar"
        />

        {/* Product Type Breakdown */}
        <DynamicChart
          title="Orders by Product Type"
          subtitle="Order volume breakdown by furniture category"
          data={productTypeChartData}
          defaultVizType="Pie"
        />
      </div>

      {/* Masterlist Orders Table (Exactly 20 rows per page with pagination) */}
      <div className="bg-white border border-[#94b4a5]/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#94b4a5]/30 flex flex-wrap items-center justify-between gap-3 bg-[#f4f7f5]/80">
          <div>
            <h4 className="text-sm font-bold text-[#33443c]">Orders Pipeline Masterlist</h4>
            <p className="text-xs text-[#5e8673] font-medium">
              Showing 20 records per page &bull; {filteredOrders.length} matching orders
            </p>
          </div>
          <span className="text-xs bg-[#5e8673]/15 text-[#33443c] border border-[#5e8673]/30 px-2.5 py-1 rounded-lg font-mono font-bold">
            Page {currentPage} of {Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f4f7f5] text-[#5e8673] font-bold border-b border-[#94b4a5]/30">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Complexity</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Creation Date</th>
                <th className="py-3 px-4">Completion Date</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4 text-right">Quote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#94b4a5]/20 font-medium">
              {displayedOrders.map((o) => {
                const isLost = (o.status || '').toUpperCase() === 'LOST';
                // Table Formatting Rule: If an order's status == 'LOST', the completionDate cell MUST be left entirely blank!
                const formattedCompletionDate = isLost ? '' : (o.completionDate || '');

                const isDelivered = (o.status || '').toLowerCase() === 'delivered' || (o.status || '').toLowerCase() === 'completed';
                const isLate = (o.lateDays || 0) > 0 || (o.deliveryStatus || '').toLowerCase().includes('late');

                return (
                  <tr key={o.id} className="hover:bg-[#f4f7f5]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#33443c]">{o.id}</td>
                    <td className="py-3 px-4 text-[#5e8673]">{o.customerId}</td>
                    <td className="py-3 px-4 font-semibold text-[#33443c]">{o.productType}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                        o.complexity >= 8 ? 'bg-rose-100 text-rose-800' :
                        o.complexity >= 5 ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {o.complexity}/10
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-[#5e8673]/15 text-[#33443c] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                        {o.currentStage || 'Design'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#5e8673]">
                      {o.creationDate || '-'}
                    </td>
                    {/* Completion Date formatting rule: empty if LOST */}
                    <td className="py-3 px-4 font-mono text-[#5e8673]">
                      {formattedCompletionDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        isLost ? 'bg-slate-100 text-slate-700' :
                        isLate ? 'bg-rose-100 text-rose-800' :
                        isDelivered ? 'bg-emerald-100 text-emerald-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {isLost ? 'Lost Deal' : (o.deliveryStatus || (isLate ? 'Late' : 'On Time'))}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#33443c]">
                      ${(o.quotePrice || 0).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {displayedOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#5e8673]">
                    No orders match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination 1, 2, 3... */}
        {filteredOrders.length > PAGE_SIZE && (
          <div className="p-3 border-t border-[#94b4a5]/30">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredOrders.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
