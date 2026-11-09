import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Award, 
  ShoppingBag, 
  DollarSign, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { AppDatasets } from '../../types';
import { DynamicChart } from '../DynamicChart';
import { Pagination } from '../Pagination';

interface SalesCRMTabProps {
  datasets: AppDatasets;
}

export const SalesCRMTab: React.FC<SalesCRMTabProps> = ({ datasets }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const orders = datasets.orders;
  const customers = datasets.customers;

  // 1. KPI: Total inquiries (total count of all orders/inquiries in orders_data.csv)
  const totalInquiries = orders.length;

  // 2. KPI: Daily sales (orders won - where status != 'LOST' and status != 'lost')
  const wonOrders = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s !== 'lost';
  });
  const wonCount = wonOrders.length;

  // 3. KPI: Conversion rate (%) = (Count of orders where status == 'DELIVERED') / (Count of orders where status == 'ACCEPTED') * 100
  // Handle accepted / delivered or completed
  const acceptedOrders = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'accepted' || s === 'delivered' || s === 'completed' || s === 'in progress' || s === 'design' || s === 'milling' || s === 'joinery' || s === 'finishing';
  });
  const deliveredOrders = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'delivered' || s === 'completed';
  });
  const conversionRate = acceptedOrders.length > 0 
    ? Math.round((deliveredOrders.length / acceptedOrders.length) * 100) 
    : 0;

  // Visualizations: Mapping inquiries to quotes, accepted orders, and completed deliveries
  // Funnel representation
  const funnelData = [
    { label: 'Inquiries Received', value: totalInquiries },
    { label: 'Quotes Issued', value: orders.filter(o => o.quotePrice > 0).length || totalInquiries },
    { label: 'Orders Accepted', value: acceptedOrders.length },
    { label: 'Completed Deliveries', value: deliveredOrders.length }
  ];

  // Customer ranking by revenue and order count
  // Parse orderIds array string in customers_data.csv (e.g. "[1, 4]" or "['ORD-1001']")
  const customerRankings = customers.map(cust => {
    let orderIdList: string[] = [];
    try {
      if (cust.orderIds) {
        if (cust.orderIds.startsWith('[')) {
          orderIdList = cust.orderIds
            .replace(/[\[\]'"]/g, '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        } else {
          orderIdList = [cust.orderIds.trim()];
        }
      }
    } catch {
      orderIdList = [];
    }

    // Match orders either by customerId == cust.id or orderId in orderIdList
    const matchedOrders = orders.filter(o => 
      o.customerId === cust.id || orderIdList.includes(o.id)
    );

    const totalRevenue = matchedOrders.reduce((sum, o) => sum + (o.quotePrice || 0), 0);
    const completedCount = matchedOrders.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'delivered' || s === 'completed';
    }).length;

    return {
      id: cust.id,
      name: cust.name || `Client ${cust.id}`,
      totalRevenue,
      orderCount: matchedOrders.length,
      completedCount
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const topCustomerChartData = customerRankings.slice(0, 8).map(c => ({
    label: c.name.length > 14 ? c.name.slice(0, 12) + '...' : c.name,
    value: c.totalRevenue,
    secondaryValue: c.orderCount
  }));

  const displayedCustomers = customerRankings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Daily Sales (Orders Won) */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Daily Sales (Orders Won)</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#33443c] font-mono">
            {wonCount} <span className="text-xs text-[#5e8673] font-normal">deals won</span>
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Orders with status != 'LOST'</span>
          </div>
        </div>

        {/* Total Inquiries */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Total Inquiries</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#33443c] font-mono">
            {totalInquiries} <span className="text-xs text-[#5e8673] font-normal">inquiries logged</span>
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            Total records in orders pipeline
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Conversion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            {conversionRate}%
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            Completed deliveries vs accepted orders
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DynamicChart
          title="Sales Pipeline Funnel"
          subtitle="Mapping inquiries to quotes, accepted orders, and completed deliveries"
          data={funnelData}
          defaultVizType="Funnel"
        />

        <DynamicChart
          title="Top Clients by Revenue"
          subtitle="Total spend ($) and repeat order count per customer"
          data={topCustomerChartData}
          valuePrefix="$"
          defaultVizType="Bar"
        />
      </div>

      {/* Customer Master Relationship Table */}
      <div className="bg-white border border-[#94b4a5]/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#94b4a5]/30 flex flex-wrap items-center justify-between gap-3 bg-[#f4f7f5]/80">
          <div>
            <h4 className="text-sm font-bold text-[#33443c]">Client Accounts &amp; Order Mapping</h4>
            <p className="text-xs text-[#5e8673] font-medium">Derived from customers_data.csv linked with active orders</p>
          </div>
          <span className="text-xs bg-[#5e8673]/15 text-[#33443c] border border-[#5e8673]/30 px-2.5 py-1 rounded-lg font-mono font-bold">
            {customers.length} Registered Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f4f7f5] text-[#5e8673] font-bold border-b border-[#94b4a5]/30">
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Linked Orders</th>
                <th className="py-3 px-4">Completed Deliveries</th>
                <th className="py-3 px-4 text-right">Cumulative Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#94b4a5]/20 font-medium">
              {displayedCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-[#f4f7f5]/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#33443c]">{c.id}</td>
                  <td className="py-3 px-4 font-bold text-[#33443c]">{c.name}</td>
                  <td className="py-3 px-4">
                    <span className="bg-[#5e8673]/15 text-[#33443c] border border-[#5e8673]/30 px-2 py-0.5 rounded-md font-mono font-bold">
                      {c.orderCount} orders
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-700 font-semibold">
                      {c.completedCount} delivered
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#33443c]">
                    ${c.totalRevenue.toLocaleString()}
                  </td>
                </tr>
              ))}
              {displayedCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#5e8673]">
                    No customer records found. Please upload customers_data.csv and orders_data.csv.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {customerRankings.length > PAGE_SIZE && (
          <div className="p-3 border-t border-[#94b4a5]/30">
            <Pagination
              currentPage={currentPage}
              totalItems={customerRankings.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
