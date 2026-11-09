import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  CalendarOff, 
  Award, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { AppDatasets, OrderRecord, EmployeeRecord } from '../../types';
import { DynamicChart } from '../DynamicChart';
import { Pagination } from '../Pagination';

interface HRTabProps {
  datasets: AppDatasets;
}

export const HRTab: React.FC<HRTabProps> = ({ datasets }) => {
  const [triageFilter, setTriageFilter] = useState<'ALL' | 'Unassigned' | 'Assigned' | 'Overdue'>('ALL');
  const [activeAllocatingOrderId, setActiveAllocatingOrderId] = useState<string | null>(null);
  const [assignedStaffMap, setAssignedStaffMap] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const staff = datasets.hrRoster;
  const activeStaff = staff.filter(s => (s.status || '').toLowerCase() === 'active');
  const onLeaveStaff = staff.filter(s => (s.status || '').toLowerCase() === 'on leave');
  const orders = datasets.orders;
  const hrEvents = datasets.hrEvents;

  // Active and on-leave hours per role (Assuming 40 hours per week per employee)
  const roles = ['Designer', 'Miller', 'Joiner', 'Finisher'];
  
  // Calculate active hours and on-leave hours per role
  const roleHoursData = roles.map(role => {
    const roleActiveStaff = activeStaff.filter(s => s.role.toLowerCase() === role.toLowerCase());
    const roleLeaveStaff = onLeaveStaff.filter(s => s.role.toLowerCase() === role.toLowerCase());
    
    // Sum hours: Active staff provide 40h standard weekly baseline
    const activeHours = roleActiveStaff.length * 40;
    const leaveHours = roleLeaveStaff.length * 40;

    return {
      label: role,
      value: activeHours,
      secondaryValue: leaveHours
    };
  });

  // Triage Table logic: Dynamic list of active orders requiring dispatch
  const activeOrders = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s !== 'delivered' && s !== 'completed' && s !== 'lost';
  });

  const triageOrders = activeOrders.map(order => {
    const stage = order.currentStage || 'Design';
    let requiredHours = 0;
    if (stage === 'Design') requiredHours = order.designHours;
    else if (stage === 'Milling') requiredHours = order.millingHours;
    else if (stage === 'Joinery') requiredHours = order.joineryHours;
    else if (stage === 'Finishing') requiredHours = order.finishingHours;
    else requiredHours = order.designHours + order.millingHours + order.joineryHours + order.finishingHours;

    const penaltyRisk = Math.round((order.quotePrice || 0) * (order.penaltyPct || 0.02) * Math.max(1, order.lateDays || 0));

    // Determine staffing status
    const assignedEmpId = assignedStaffMap[order.id];
    let staffingStatus: 'Unassigned' | 'Assigned' | 'Overdue' = 'Unassigned';
    
    if (order.lateDays > 0 || (order.deliveryStatus || '').toLowerCase().includes('late')) {
      staffingStatus = 'Overdue';
    } else if (assignedEmpId) {
      staffingStatus = 'Assigned';
    } else {
      staffingStatus = 'Unassigned';
    }

    return {
      order,
      requiredHours,
      penaltyRisk,
      staffingStatus,
      assignedEmpId
    };
  });

  // Filter triage by staffing status
  const filteredTriage = triageOrders.filter(item => {
    if (triageFilter === 'ALL') return true;
    return item.staffingStatus === triageFilter;
  });

  const displayedTriage = filteredTriage.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Helper to get pre-filtered eligible employees based on Complexity & Role
  const getEligibleEmployees = (order: OrderRecord): EmployeeRecord[] => {
    const stage = (order.currentStage || 'Design').toLowerCase();
    const complexity = order.complexity || 5;

    // Role mapping
    const expectedRole = 
      stage.includes('design') ? 'designer' :
      stage.includes('mill') ? 'miller' :
      stage.includes('join') ? 'joiner' :
      stage.includes('finish') ? 'finisher' : stage;

    return activeStaff.filter(emp => {
      // 1. Role must strictly match currentStage
      const roleMatches = emp.role.toLowerCase() === expectedRole;
      if (!roleMatches) return false;

      // 2. Adhere to Skill-to-Complexity matrix:
      // Complexity 8-10 MUST be assigned to skillLevel == 'high'
      // Complexity 4-7 MUST be assigned to skillLevel IN ['high', 'medium']
      // Complexity 1-3 can be assigned to any active staff member
      const skill = (emp.skillLevel || 'medium').toLowerCase();
      if (complexity >= 8) {
        return skill === 'high';
      } else if (complexity >= 4) {
        return skill === 'high' || skill === 'medium';
      } else {
        return true;
      }
    });
  };

  const handleAllocate = (orderId: string, employeeId: string) => {
    setAssignedStaffMap(prev => ({
      ...prev,
      [orderId]: employeeId
    }));
    setActiveAllocatingOrderId(null);
  };

  return (
    <div className="space-y-6">
      {/* Workforce Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Active Headcount</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#33443c] font-mono">
            {activeStaff.length} <span className="text-xs text-[#5e8673] font-normal">technicians</span>
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            Baseline production capacity
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-2">
            <span>Staff on Leave</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <CalendarOff className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-800 font-mono">
            {onLeaveStaff.length} <span className="text-xs text-amber-700 font-normal">technicians</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-2 font-medium">
            Temporary absences from hr_events_log
          </div>
        </div>

        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>High-Skill Specialists</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#33443c] font-mono">
            {activeStaff.filter(s => (s.skillLevel || '').toLowerCase() === 'high').length}
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            Available for complexity &ge; 8 pieces
          </div>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-2">
            <span>Pending Triage Queue</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 font-mono">
            {triageOrders.filter(t => t.staffingStatus === 'Unassigned').length} <span className="text-xs text-rose-600 font-normal">unassigned</span>
          </div>
          <div className="text-[11px] text-rose-600 mt-2 font-medium">
            Active orders needing staff dispatch
          </div>
        </div>
      </div>

      {/* Visualizations: Active and on-leave hours per role */}
      <DynamicChart
        title="Active vs On-Leave Capacity Hours per Role"
        subtitle="Comparing active 40h weekly capacity (primary bar) against leave deficit hours (secondary bar)"
        data={roleHoursData}
        valueSuffix="h"
        defaultVizType="Bar"
      />

      {/* Interactive Staff-to-Order Dispatch Management Triage Table */}
      <div className="bg-white border border-[#94b4a5]/40 rounded-2xl overflow-hidden shadow-sm">
        {/* Triage Filter Header */}
        <div className="p-4 border-b border-[#94b4a5]/30 flex flex-wrap items-center justify-between gap-3 bg-[#f4f7f5]/80">
          <div>
            <h4 className="text-sm font-bold text-[#33443c]">Staff-to-Order Dispatch Management</h4>
            <p className="text-xs text-[#5e8673] font-medium">
              Dynamic triage table: Filter by staffing status and allocate qualified personnel adhering to skill-complexity matrix
            </p>
          </div>

          {/* Triage Filtering: Isolate unassigned incoming orders */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-[#5e8673] mr-1">Triage Filter:</span>
            {(['ALL', 'Unassigned', 'Assigned', 'Overdue'] as const).map(status => (
              <button
                key={status}
                onClick={() => {
                  setTriageFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  triageFilter === status
                    ? status === 'Unassigned'
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : status === 'Overdue'
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'bg-[#33443c] text-white font-bold shadow-xs'
                    : 'bg-white text-[#33443c] hover:bg-[#94b4a5]/20 border border-[#94b4a5]/40'
                }`}
              >
                {status} ({status === 'ALL' ? triageOrders.length : triageOrders.filter(t => t.staffingStatus === status).length})
              </button>
            ))}
          </div>
        </div>

        {/* Triage Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f4f7f5] text-[#5e8673] font-bold border-b border-[#94b4a5]/30">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Complexity (1-10)</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Required Hours</th>
                <th className="py-3 px-4">Financial Penalty Risk</th>
                <th className="py-3 px-4">Staffing Status</th>
                <th className="py-3 px-4 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#94b4a5]/20 font-medium">
              {displayedTriage.map(({ order, requiredHours, penaltyRisk, staffingStatus, assignedEmpId }) => {
                const eligibleStaff = getEligibleEmployees(order);
                const isAllocating = activeAllocatingOrderId === order.id;

                return (
                  <tr key={order.id} className="hover:bg-[#f4f7f5]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#33443c]">{order.id}</td>
                    <td className="py-3 px-4 font-semibold text-[#33443c]">{order.productType}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                        order.complexity >= 8 ? 'bg-rose-100 text-rose-800' :
                        order.complexity >= 4 ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        Level {order.complexity} {order.complexity >= 8 ? '(High Skill Req)' : order.complexity >= 4 ? '(Med/High)' : '(Any)'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-[#5e8673]/15 text-[#33443c] px-2 py-0.5 rounded-md font-semibold">
                        {order.currentStage || 'Design'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#33443c]">
                      {requiredHours}h
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">
                      ${penaltyRisk.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        staffingStatus === 'Overdue'
                          ? 'bg-rose-100 text-rose-800'
                          : staffingStatus === 'Assigned'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {staffingStatus === 'Assigned' ? `Assigned (${assignedEmpId})` : staffingStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isAllocating ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleAllocate(order.id, e.target.value);
                            }}
                            defaultValue=""
                            className="bg-white border border-[#33443c] text-[#33443c] text-xs font-semibold px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                          >
                            <option value="" disabled>Select Eligible Staff...</option>
                            {eligibleStaff.map(emp => (
                              <option key={emp.employeeId} value={emp.employeeId}>
                                {emp.employeeId}: {emp.name || emp.role} ({emp.skillLevel} skill)
                              </option>
                            ))}
                            {eligibleStaff.length === 0 && (
                              <option value="" disabled>No eligible {order.currentStage} staff available</option>
                            )}
                          </select>
                          <button
                            onClick={() => setActiveAllocatingOrderId(null)}
                            className="text-xs text-[#5e8673] hover:text-[#33443c] px-1 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveAllocatingOrderId(order.id)}
                          className="bg-[#33443c] hover:bg-[#25322c] text-white px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          {assignedEmpId ? 'Reassign' : 'Allocate Staff'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {displayedTriage.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#5e8673]">
                    No orders in triage matching filter: {triageFilter}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredTriage.length > PAGE_SIZE && (
          <div className="p-3 border-t border-[#94b4a5]/30">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredTriage.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
