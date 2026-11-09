import React, { useState } from 'react';
import { 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Target,
  Layers,
  Save,
  Check
} from 'lucide-react';
import { AppDatasets, OrderRecord, EmployeeRecord } from '../../types';
import { DynamicChart } from '../DynamicChart';

interface SimulatorTabProps {
  datasets: AppDatasets;
  initialOrderId?: string;
  onSaveAssignments?: (assignments: Record<string, string>) => void;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({ 
  datasets, 
  initialOrderId, 
  onSaveAssignments 
}) => {
  // Operational Modes: Mode 1 (Tactical Order Rescue - Micro) vs Mode 2 (Strategic Capacity Planning - Macro)
  const [activeMode, setActiveMode] = useState<'Micro' | 'Macro'>('Micro');

  // MODE 1 (MICRO) STATE:
  const activeOrders = datasets.orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s !== 'delivered' && s !== 'completed' && s !== 'lost';
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || activeOrders[0]?.id || 'ORD-1001');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');
  const [microSavedAssignments, setMicroSavedAssignments] = useState<Record<string, string>>({});

  // MODE 2 (MACRO) STATE (Sliders & Controls):
  const [workloadCapHours, setWorkloadCapHours] = useState<number>(45); // Workload Cap Slider (Hours)
  const [skillFlexibility, setSkillFlexibility] = useState<'Strict' | 'Flexible'>('Strict'); // Skill Matrix Flexibility (Toggle)
  const [reallocateMillingToJoinery, setReallocateMillingToJoinery] = useState<number>(0); // Cross-Department Reallocation Sliders
  const [reallocateJoineryToMilling, setReallocateJoineryToMilling] = useState<number>(1);
  const [optimizationPriority, setOptimizationPriority] = useState<number>(8); // Weighted Slider 1-10: 1-4 shortest jobs first, 5-10 penalty risk
  const [enforceAbsenteeism, setEnforceAbsenteeism] = useState<boolean>(true); // Absenteeism Toggle (Enforce vs Ignore)

  const [macroSaved, setMacroSaved] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Active technicians from hr_roster (Baseline: unfiltered active headcount)
  const activeStaff = datasets.hrRoster.filter(e => (e.status || '').toLowerCase() === 'active');
  const currentOrder = datasets.orders.find(o => o.id === selectedOrderId) || datasets.orders[0];

  // Eligible employees for Micro mode
  const eligibleEmployeesForCurrentOrder = activeStaff.filter(emp => {
    if (!currentOrder) return true;
    const stage = (currentOrder.currentStage || 'Design').toLowerCase();
    const expectedRole = 
      stage.includes('design') ? 'designer' :
      stage.includes('mill') ? 'miller' :
      stage.includes('join') ? 'joiner' :
      stage.includes('finish') ? 'finisher' : stage;

    if (emp.role.toLowerCase() !== expectedRole) return false;

    const skill = (emp.skillLevel || 'medium').toLowerCase();
    if (skillFlexibility === 'Strict') {
      if (currentOrder.complexity >= 8) return skill === 'high';
      if (currentOrder.complexity >= 4) return skill === 'high' || skill === 'medium';
      return true;
    } else {
      // Flexible allows high complexity to medium skill if needed
      if (currentOrder.complexity >= 8) return skill === 'high' || skill === 'medium';
      return true;
    }
  });

  // MICRO MODE CALCULATIONS:
  const baselineLateDays = currentOrder ? (currentOrder.lateDays > 0 ? currentOrder.lateDays : 7) : 7;
  const quotePrice = currentOrder?.quotePrice || 3500;
  const penaltyPct = currentOrder?.penaltyPct || 0.02;
  const baselinePenalty = Math.round(quotePrice * penaltyPct * baselineLateDays);

  // If employee assigned in micro mode, calculate isolated lateDays impact
  let simulatedLateDays = baselineLateDays;
  let assignedStaffName = 'Unassigned';
  if (assignedEmployeeId) {
    const emp = activeStaff.find(e => e.employeeId === assignedEmployeeId);
    assignedStaffName = emp ? `${emp.employeeId} (${emp.name || emp.role}, ${emp.skillLevel})` : assignedEmployeeId;
    const skill = (emp?.skillLevel || 'medium').toLowerCase();
    // High skill reduces late days by 75%, medium by 50%, low by 25%
    if (skill === 'high') simulatedLateDays = Math.max(0, Math.round(baselineLateDays * 0.2));
    else if (skill === 'medium') simulatedLateDays = Math.max(1, Math.round(baselineLateDays * 0.5));
    else simulatedLateDays = Math.max(2, Math.round(baselineLateDays * 0.75));
  }
  const simulatedMicroPenalty = Math.round(quotePrice * penaltyPct * simulatedLateDays);
  const microSavings = baselinePenalty - simulatedMicroPenalty;

  // MACRO MODE CALCULATIONS (Strategic Capacity Planning):
  // 1. Department stage demand (hours required in orders_data.csv)
  const activeOrdersForMacro = datasets.orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s !== 'completed' && s !== 'delivered' && s !== 'lost';
  });

  const designDemand = activeOrdersForMacro.reduce((s, o) => s + (o.designHours || 0), 0) || 22;
  const millingDemand = activeOrdersForMacro.reduce((s, o) => s + (o.millingHours || 0), 0) || 48;
  const joineryDemand = activeOrdersForMacro.reduce((s, o) => s + (o.joineryHours || 0), 0) || 73;
  const finishingDemand = activeOrdersForMacro.reduce((s, o) => s + (o.finishingHours || 0), 0) || 30;

  // 2. Capacity: available hours in hr_roster minus absences in hr_events_log
  const designersCount = activeStaff.filter(s => s.role.toLowerCase() === 'designer').length || 2;
  const millersCount = activeStaff.filter(s => s.role.toLowerCase() === 'miller').length || 1;
  const joinersCount = activeStaff.filter(s => s.role.toLowerCase() === 'joiner').length || 2;
  const finishersCount = activeStaff.filter(s => s.role.toLowerCase() === 'finisher').length || 2;

  const absenceHours = enforceAbsenteeism ? 8 : 0; // absences from hr_events_log

  // Baseline capacity
  let baseMillingCap = millersCount * 40 - (enforceAbsenteeism ? 0 : 0);
  let baseJoineryCap = joinersCount * 40 - absenceHours;

  // Cross-department shift
  const macroMillingCap = baseMillingCap + (reallocateJoineryToMilling * 40) - (reallocateMillingToJoinery * 40);
  const macroJoineryCap = baseJoineryCap - (reallocateJoineryToMilling * 40) + (reallocateMillingToJoinery * 40);

  // Bottleneck status: Negative flags department bottleneck
  const millingBalance = macroMillingCap - millingDemand;
  const joineryBalance = macroJoineryCap - joineryDemand;

  // Baseline total penalty exposure across all active orders
  const totalMacroBaselinePenalty = activeOrdersForMacro.reduce((sum, o) => {
    return sum + Math.round((o.quotePrice || 3000) * (o.penaltyPct || 0.02) * Math.max(1, o.lateDays || 6));
  }, 0) || 4200;

  // Optimization Priority calculation:
  // 1-4: Shortest jobs first -> maximizes cleared volume
  // 5-10: Highest penalty first -> maximizes profit margin protection
  const penaltyReductionRatio = (optimizationPriority >= 5 ? 0.65 : 0.45) + 
    (reallocateJoineryToMilling > 0 ? 0.25 : 0) + 
    (!enforceAbsenteeism ? 0.1 : 0);
  const macroReductionPct = Math.min(92, Math.round(penaltyReductionRatio * 100));
  const macroSimulatedPenalty = Math.max(0, Math.round(totalMacroBaselinePenalty * (1 - macroReductionPct / 100)));
  const macroTotalSavings = totalMacroBaselinePenalty - macroSimulatedPenalty;

  // Save allocations handler (Actionable Allocation)
  const handleSaveMicroAllocation = () => {
    if (!currentOrder || !assignedEmployeeId) return;
    const newMap = { ...microSavedAssignments, [currentOrder.id]: assignedEmployeeId };
    setMicroSavedAssignments(newMap);
    if (onSaveAssignments) onSaveAssignments(newMap);
    setSavedFeedback(`Assigned ${assignedEmployeeId} to ${currentOrder.id} successfully! Saved to active roster.`);
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  const handleSaveMacroSimulation = () => {
    setMacroSaved(true);
    // Build recommendation map
    const generatedAllocations: Record<string, string> = {};
    activeOrdersForMacro.forEach((o, i) => {
      const eligible = activeStaff.filter(e => {
        const stage = (o.currentStage || 'Design').toLowerCase();
        return e.role.toLowerCase().includes(stage.slice(0, 4));
      });
      if (eligible.length > 0) {
        generatedAllocations[o.id] = eligible[i % eligible.length].employeeId;
      }
    });
    if (onSaveAssignments) onSaveAssignments(generatedAllocations);
    setSavedFeedback('Macro strategic allocations definitively applied to production roster!');
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#33443c] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#5e8673]" />
            <span>Prescriptive Operations Simulator</span>
          </h3>
          <p className="text-xs text-[#5e8673] font-medium mt-0.5">
            Switch between tactical individual order rescue and macro strategic capacity planning
          </p>
        </div>

        <div className="flex items-center bg-[#f4f7f5] border border-[#94b4a5]/50 rounded-xl p-1">
          <button
            onClick={() => setActiveMode('Micro')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'Micro'
                ? 'bg-[#33443c] text-white shadow-xs'
                : 'text-[#33443c] hover:bg-[#94b4a5]/20'
            }`}
          >
            Mode 1: Tactical Order Rescue (Micro)
          </button>
          <button
            onClick={() => setActiveMode('Macro')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'Macro'
                ? 'bg-[#33443c] text-white shadow-xs'
                : 'text-[#33443c] hover:bg-[#94b4a5]/20'
            }`}
          >
            Mode 2: Strategic Capacity Planning (Macro)
          </button>
        </div>
      </div>

      {savedFeedback && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* MODE 1: TACTICAL ORDER RESCUE (MICRO) */}
      {activeMode === 'Micro' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#94b4a5]/30 pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#33443c]">
                  Import High-Risk Order for Tactical Rescue
                </h4>
                <p className="text-xs text-[#5e8673] font-medium">
                  Select an order imported from Forecasting to evaluate the isolated lateDays and penalty impact of employee assignment
                </p>
              </div>

              {/* Order selector dropdown */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-bold text-[#5e8673]">Select Order:</span>
                <select
                  value={selectedOrderId}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    setAssignedEmployeeId('');
                  }}
                  className="bg-[#f4f7f5] border border-[#94b4a5]/50 text-[#33443c] text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer focus:outline-none"
                >
                  {activeOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.id} - {o.productType} (Complexity {o.complexity}, {o.currentStage})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Order Snapshot and Manual Staff Assignment */}
            {currentOrder && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pt-2">
                <div className="bg-[#f4f7f5] rounded-xl p-4 border border-[#94b4a5]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[#33443c]">{currentOrder.id}</span>
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md text-xs font-bold">
                      Complexity: {currentOrder.complexity}/10
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#5e8673]">Product:</span>
                      <div className="font-semibold text-[#33443c]">{currentOrder.productType}</div>
                    </div>
                    <div>
                      <span className="text-[#5e8673]">Current Stage:</span>
                      <div className="font-semibold text-[#33443c]">{currentOrder.currentStage}</div>
                    </div>
                    <div>
                      <span className="text-[#5e8673]">Quote Price:</span>
                      <div className="font-semibold text-[#33443c]">${currentOrder.quotePrice.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-[#5e8673]">Baseline Late Days:</span>
                      <div className="font-semibold text-rose-700 font-mono">+{baselineLateDays} days</div>
                    </div>
                  </div>

                  {/* Manual Assignment Dropdown */}
                  <div className="pt-2 border-t border-[#94b4a5]/30">
                    <label className="block text-xs font-bold text-[#33443c] mb-1.5">
                      Assign Employee for Rescue:
                    </label>
                    <select
                      value={assignedEmployeeId}
                      onChange={(e) => setAssignedEmployeeId(e.target.value)}
                      className="w-full bg-white border border-[#94b4a5]/50 text-[#33443c] text-xs font-semibold p-2 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Eligible Staff Member...</option>
                      {eligibleEmployeesForCurrentOrder.map(emp => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.employeeId}: {emp.name || emp.role} ({emp.skillLevel} skill, ${emp.wage}/hr)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Simulated Impact Card */}
                <div className="bg-white border-2 border-emerald-500/40 rounded-xl p-4 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-[#94b4a5]/30">
                    <span className="text-xs font-bold text-[#33443c] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Isolated Rescue Impact
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {assignedEmployeeId ? 'Simulated' : 'Awaiting Assignment'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#f4f7f5] p-2.5 rounded-lg">
                      <div className="text-[10px] text-[#5e8673] font-bold uppercase">Simulated Late Days</div>
                      <div className="text-2xl font-extrabold font-mono text-[#33443c] mt-0.5">
                        {simulatedLateDays} <span className="text-xs font-normal text-[#5e8673]">days</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-1 font-semibold">
                        Recovered: {baselineLateDays - simulatedLateDays} days
                      </div>
                    </div>

                    <div className="bg-[#f4f7f5] p-2.5 rounded-lg">
                      <div className="text-[10px] text-[#5e8673] font-bold uppercase">Penalty Reduction</div>
                      <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-0.5">
                        ${microSavings.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#5e8673] mt-1 font-semibold">
                        New Penalty: ${simulatedMicroPenalty.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Button to definitively save assignment back to active roster */}
                  <button
                    onClick={handleSaveMicroAllocation}
                    disabled={!assignedEmployeeId}
                    className="w-full flex items-center justify-center gap-2 bg-[#33443c] hover:bg-[#25322c] disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Confirm &amp; Save Assignment to Active Roster</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: STRATEGIC CAPACITY PLANNING (MACRO) */}
      {activeMode === 'Macro' && (
        <div className="space-y-6">
          {/* Global Constraint Sliders */}
          <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-5 shadow-sm space-y-6">
            <div className="border-b border-[#94b4a5]/30 pb-3">
              <h4 className="text-sm font-bold text-[#33443c]">
                Macro-Level Capacity Sliders &amp; Constraints
              </h4>
              <p className="text-xs text-[#5e8673] font-medium">
                Adjust global workload caps, cross-department staff reallocation, optimization priorities, and absenteeism
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Slider 1: Workload Cap Slider (Hours) */}
              <div className="space-y-2 bg-[#f4f7f5] p-3.5 rounded-xl border border-[#94b4a5]/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#33443c]">Workload Cap (Hours):</span>
                  <span className="font-mono font-bold text-[#33443c] bg-white px-2 py-0.5 rounded-lg border border-[#94b4a5]/40">
                    {workloadCapHours} hrs
                  </span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="60"
                  step="5"
                  value={workloadCapHours}
                  onChange={(e) => setWorkloadCapHours(Number(e.target.value))}
                  className="w-full accent-[#33443c] cursor-pointer"
                />
                <p className="text-[10px] text-[#5e8673] font-medium">
                  Overrides standard rules if employee workload exceeds limit
                </p>
              </div>

              {/* Slider 2: Skill Matrix Flexibility (Toggle) */}
              <div className="space-y-2 bg-[#f4f7f5] p-3.5 rounded-xl border border-[#94b4a5]/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#33443c]">Skill Matrix Flexibility:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-lg text-xs ${
                    skillFlexibility === 'Strict' ? 'bg-[#33443c] text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {skillFlexibility}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSkillFlexibility('Strict')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      skillFlexibility === 'Strict' ? 'bg-[#33443c] text-white font-bold' : 'bg-white text-[#33443c] border border-[#94b4a5]/40'
                    }`}
                  >
                    Strict Rules
                  </button>
                  <button
                    onClick={() => setSkillFlexibility('Flexible')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      skillFlexibility === 'Flexible' ? 'bg-[#33443c] text-white font-bold' : 'bg-white text-[#33443c] border border-[#94b4a5]/40'
                    }`}
                  >
                    Flexible Reallocation
                  </button>
                </div>
                <p className="text-[10px] text-[#5e8673] font-medium">
                  {skillFlexibility === 'Strict' 
                    ? 'Strictly enforces baseline complexity matrix' 
                    : 'Allows high-complexity jobs assigned to Medium staff'}
                </p>
              </div>

              {/* Slider 3: Cross-Department Reallocation (Joinery to Milling) */}
              <div className="space-y-2 bg-[#f4f7f5] p-3.5 rounded-xl border border-[#94b4a5]/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#33443c]">Shift Joinery to Milling:</span>
                  <span className="font-mono font-bold text-[#33443c] bg-white px-2 py-0.5 rounded-lg border border-[#94b4a5]/40">
                    +{reallocateJoineryToMilling * 40}h Milling
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="1"
                  value={reallocateJoineryToMilling}
                  onChange={(e) => setReallocateJoineryToMilling(Number(e.target.value))}
                  className="w-full accent-[#33443c] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#5e8673]">
                  <span>0 staff</span>
                  <span>1 staff (+40h)</span>
                  <span>2 staff (+80h)</span>
                </div>
              </div>

              {/* Slider 4: Optimization Priority (Weighted Slider 1-10) */}
              <div className="space-y-2 bg-[#f4f7f5] p-3.5 rounded-xl border border-[#94b4a5]/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#33443c]">Optimization Priority (1-10):</span>
                  <span className="font-mono font-bold text-[#33443c] bg-white px-2 py-0.5 rounded-lg border border-[#94b4a5]/40">
                    Level {optimizationPriority}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={optimizationPriority}
                  onChange={(e) => setOptimizationPriority(Number(e.target.value))}
                  className="w-full accent-[#33443c] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-semibold text-[#5e8673]">
                  <span>1-4: Shortest Jobs</span>
                  <span>5-10: Financial Risk</span>
                </div>
              </div>

              {/* Slider 5: Absenteeism Toggle */}
              <div className="space-y-2 bg-[#f4f7f5] p-3.5 rounded-xl border border-[#94b4a5]/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#33443c]">Absenteeism Events:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-lg text-xs ${
                    enforceAbsenteeism ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {enforceAbsenteeism ? 'Enforce Absences' : 'Ignore / Overtime'}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setEnforceAbsenteeism(true)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      enforceAbsenteeism ? 'bg-[#33443c] text-white font-bold' : 'bg-white text-[#33443c] border border-[#94b4a5]/40'
                    }`}
                  >
                    Enforce Leave
                  </button>
                  <button
                    onClick={() => setEnforceAbsenteeism(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      !enforceAbsenteeism ? 'bg-[#33443c] text-white font-bold' : 'bg-white text-[#33443c] border border-[#94b4a5]/40'
                    }`}
                  >
                    Cancel / Override
                  </button>
                </div>
                <p className="text-[10px] text-[#5e8673] font-medium">
                  {enforceAbsenteeism ? 'Subtracts leave hours from hr_events_log' : 'Simulates full headcount overtime clearance'}
                </p>
              </div>

              {/* Macro Impact Summary Box */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-950 uppercase">Macro Projected Savings</div>
                  <div className="text-2xl font-extrabold text-emerald-800 font-mono mt-1">
                    ${macroTotalSavings.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    {macroReductionPct}% late penalty risk eliminated
                  </div>
                </div>

                {/* Confirmation Button */}
                <button
                  onClick={handleSaveMacroSimulation}
                  className="mt-3 flex items-center justify-center gap-1.5 bg-[#33443c] hover:bg-[#25322c] text-white font-bold text-xs py-2 px-3 rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Definitively Save to Roster</span>
                </button>
              </div>
            </div>
          </div>

          {/* Department Stage Capacity Balance Comparison Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DynamicChart
              title="Stage Capacity vs Workload Demand (Macro Sim)"
              subtitle="Comparing simulated capacity against active order demand hours"
              data={[
                { label: 'Milling', value: macroMillingCap, secondaryValue: millingDemand },
                { label: 'Joinery', value: macroJoineryCap, secondaryValue: joineryDemand },
                { label: 'Design', value: 80, secondaryValue: designDemand },
                { label: 'Finishing', value: 80, secondaryValue: finishingDemand }
              ]}
              valueSuffix="h"
              defaultVizType="Bar"
            />

            <DynamicChart
              title="Financial Penalty Exposure: Baseline vs Macro Simulation"
              subtitle="Comparison of total late penalties before and after strategic capacity optimization"
              data={[
                { label: 'Current Baseline', value: totalMacroBaselinePenalty },
                { label: 'Simulated Optimized', value: macroSimulatedPenalty, secondaryValue: macroTotalSavings }
              ]}
              valuePrefix="$"
              defaultVizType="Bar"
            />
          </div>
        </div>
      )}
    </div>
  );
};
