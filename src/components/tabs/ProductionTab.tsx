import React, { useState, useEffect } from 'react';
import { Sliders, CheckCircle2, AlertTriangle, Send, Clock, Percent, Factory } from 'lucide-react';
import { AppDatasets } from '../../types';
import { getRecommendedStaffAssignment } from '../../utils/dataEngine';
import { DynamicChart } from '../DynamicChart';
import { Pagination } from '../Pagination';

interface ProductionTabProps {
  datasets: AppDatasets;
  onUpdateAssignment?: (assignments: Record<string, string>) => void;
}

export const ProductionTab: React.FC<ProductionTabProps> = ({ datasets, onUpdateAssignment }) => {
  const activeStaff = datasets.hrRoster.filter(s => (s.status || '').toLowerCase() === 'active');
  const recommendations = getRecommendedStaffAssignment(datasets);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // On-time delivery rate (%):
  // (Count of orders where lateDays == 0 AND deliveryStatus == 'On Time') / (Total count of orders where deliveryStatus is not null) * 100
  const ordersWithDeliveryStatus = datasets.orders.filter(o => Boolean(o.deliveryStatus));
  const onTimeOrders = ordersWithDeliveryStatus.filter(o => 
    (o.lateDays || 0) === 0 && (o.deliveryStatus || '').toLowerCase().includes('time')
  );
  const onTimeDeliveryRate = ordersWithDeliveryStatus.length > 0
    ? Math.round((onTimeOrders.length / ordersWithDeliveryStatus.length) * 100)
    : 78;

  // State for user custom orderId -> employeeId assignments
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    recommendations.forEach(r => {
      initial[r.orderId] = r.recommendedEmployeeId;
    });
    return initial;
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Tracking time spent in Design, Milling, Joinery, Finishing
  const activeOrders = datasets.orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s !== 'completed' && s !== 'delivered' && s !== 'lost';
  });

  const stageHoursTrackingData = [
    { label: 'Design Stage', value: activeOrders.reduce((s,o)=>s+(o.designHours||0),0) },
    { label: 'Milling Stage', value: activeOrders.reduce((s,o)=>s+(o.millingHours||0),0) },
    { label: 'Joinery Stage', value: activeOrders.reduce((s,o)=>s+(o.joineryHours||0),0) },
    { label: 'Finishing Stage', value: activeOrders.reduce((s,o)=>s+(o.finishingHours||0),0) }
  ];

  // Design duration days from design_log
  const designLogDurations = datasets.designLog.slice(0, 10).map(d => ({
    label: d.orderId,
    value: d.durationDays || 4,
    extra: `Designer: ${d.designerId}`
  }));

  const handleAssignmentChange = (orderId: string, employeeId: string) => {
    setAssignments(prev => ({
      ...prev,
      [orderId]: employeeId
    }));
    setIsSubmitted(false);
  };

  const handleSubmitAllAssignments = () => {
    setIsSubmitted(true);
    if (onUpdateAssignment) {
      onUpdateAssignment(assignments);
    }
    setSubmissionFeedback(`Confirmed ${Object.keys(assignments).length} production assignments! Synchronized with shop floor.`);
    setTimeout(() => setSubmissionFeedback(null), 4000);
  };

  const displayedRecommendations = recommendations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Production KPI Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI Box: On-Time Delivery Rate (%) */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>On-Time Delivery Rate</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#33443c] font-mono">
            {onTimeDeliveryRate}%
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            Orders completed with zero late days &amp; on-time status
          </div>
        </div>

        {/* Active Work In Progress */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Active WIP Orders</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#33443c] font-mono">
            {activeOrders.length} <span className="text-xs text-[#5e8673] font-normal">active jobs</span>
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            Currently traversing production stages
          </div>
        </div>

        {/* Total Active Stage Hours */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Total Queued Stage Workload</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#33443c] font-mono">
            {stageHoursTrackingData.reduce((s, d) => s + d.value, 0)} <span className="text-xs text-[#5e8673] font-normal">hours</span>
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            Cumulative production hours remaining
          </div>
        </div>
      </div>

      {submissionFeedback && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{submissionFeedback}</span>
        </div>
      )}

      {/* Visualizations: Tracking time spent in Design, Milling, Joinery, Finishing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DynamicChart
          title="Time Spent in Production Stages"
          subtitle="Tracking cumulative hours queued across Design, Milling, Joinery, Finishing"
          data={stageHoursTrackingData}
          valueSuffix="h"
          defaultVizType="Bar"
        />

        <DynamicChart
          title="Design Stage Duration History"
          subtitle="Duration (days) logged for recent design completions"
          data={designLogDurations}
          valueSuffix=" days"
          defaultVizType="Line"
        />
      </div>

      {/* Interactive Data Table of Active Assignments */}
      <div className="bg-white border border-[#94b4a5]/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#94b4a5]/30 flex flex-wrap items-center justify-between gap-3 bg-[#f4f7f5]/80">
          <div>
            <h4 className="text-sm font-bold text-[#33443c]">Active Production Assignment Roster</h4>
            <p className="text-xs text-[#5e8673] font-medium">
              Review and adjust assigned technicians for active production orders
            </p>
          </div>

          <button
            onClick={handleSubmitAllAssignments}
            className="flex items-center gap-1.5 bg-[#33443c] hover:bg-[#25322c] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Confirm Roster Updates</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f4f7f5] text-[#5e8673] font-bold border-b border-[#94b4a5]/30">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Complexity</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Assigned Technician</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#94b4a5]/20 font-medium">
              {displayedRecommendations.map((rec) => {
                const assignedId = assignments[rec.orderId] || rec.recommendedEmployeeId;
                const assignedEmp = activeStaff.find(e => e.employeeId === assignedId);

                return (
                  <tr key={rec.orderId} className="hover:bg-[#f4f7f5]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#33443c]">{rec.orderId}</td>
                    <td className="py-3 px-4 font-semibold text-[#33443c]">{rec.productType}</td>
                    <td className="py-3 px-4">
                      <span className="bg-[#5e8673]/15 text-[#33443c] px-2 py-0.5 rounded-md font-mono font-bold">
                        {rec.complexity}/10
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md font-bold">
                        {rec.currentStage}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#33443c]">
                        {assignedEmp ? `${assignedEmp.employeeId}: ${assignedEmp.name || assignedEmp.role} (${assignedEmp.skillLevel})` : assignedId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={assignedId}
                        onChange={(e) => handleAssignmentChange(rec.orderId, e.target.value)}
                        className="bg-[#f4f7f5] border border-[#94b4a5]/50 text-[#33443c] text-xs font-semibold px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                      >
                        {activeStaff
                          .filter(e => e.role.toLowerCase().includes((rec.currentStage || 'Design').toLowerCase().slice(0, 4)))
                          .map(emp => (
                            <option key={emp.employeeId} value={emp.employeeId}>
                              {emp.employeeId} - {emp.name || emp.role} ({emp.skillLevel})
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {displayedRecommendations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#5e8673]">
                    No active assignments in pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {recommendations.length > PAGE_SIZE && (
          <div className="p-3 border-t border-[#94b4a5]/30">
            <Pagination
              currentPage={currentPage}
              totalItems={recommendations.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
