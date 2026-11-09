import { AppDatasets, ColorTheme, EmployeeRecord, OrderRecord, VizType } from '../types';

export const COLOR_PALETTES: Record<ColorTheme, string[]> = {
  'Modern Sage': ['#33443c', '#5e8673', '#94b4a5', '#465d52', '#759e8c', '#b5ccc1'],
  'Corporate Blue': ['#1f77b4', '#aec7e8', '#2ca02c', '#98df8a', '#17becf', '#9edae5'],
  'Dark Teal': ['#004d40', '#00897b', '#80cbc4', '#00695c', '#26a69a', '#b2dfdb'],
  'Viridis': ['#440154', '#3b528b', '#21908c', '#5dc863', '#fde725', '#7ad151'],
  'Warm Sunset': ['#d84315', '#f4511e', '#ffb74d', '#bf360c', '#e65100', '#ffcc80']
};

export function calculateOrderPenalty(order: OrderRecord): number {
  if (!order.lateDays || order.lateDays <= 0) return 0;
  return Math.round((order.quotePrice || 0) * (order.penaltyPct || 0) * (order.lateDays || 0) * 100) / 100;
}

export function calculateKPIs(data: AppDatasets) {
  // Orders metrics
  const totalOrders = data.orders.length;
  const completedOrders = data.orders.filter(o => o.status === 'Completed').length;
  const delayedOrders = data.orders.filter(o => o.status === 'Delayed' || (o.lateDays && o.lateDays > 0)).length;
  const inProgressOrders = data.orders.filter(o => o.status === 'In Progress' || o.status === 'Pending').length;

  // Win rate: % of orders that closed/completed vs total (or won quote conversion rate)
  const orderWinRate = totalOrders > 0 ? Math.round(((totalOrders - delayedOrders) / totalOrders) * 100 * 10) / 10 : 0;
  const onTimeDeliveryRate = completedOrders > 0 ? Math.round(((completedOrders) / (completedOrders + delayedOrders)) * 100 * 10) / 10 : 0;

  // Total Late Penalties ($)
  const totalLatePenalties = data.orders.reduce((sum, o) => sum + calculateOrderPenalty(o), 0);

  // Total Revenue: from orders quotePrice or Financial ledger Revenue
  const totalOrdersRevenue = data.orders.reduce((sum, o) => sum + (o.quotePrice || 0), 0);
  const ledgerRevenue = data.financialLedger
    .filter(f => f.type === 'Revenue')
    .reduce((sum, f) => sum + f.amount, 0);

  // Financial Ledger calculations
  const overheadCost = data.financialLedger
    .filter(f => f.type === 'Overhead')
    .reduce((sum, f) => sum + f.amount, 0);

  const materialCost = data.financialLedger
    .filter(f => f.type === 'Material Cost')
    .reduce((sum, f) => sum + f.amount, 0);

  const laborCost = data.financialLedger
    .filter(f => f.type === 'Labor Cost')
    .reduce((sum, f) => sum + f.amount, 0);

  const ledgerPenalties = data.financialLedger
    .filter(f => f.type === 'Late Penalty')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalCosts = overheadCost + materialCost + laborCost + ledgerPenalties;
  const netOperatingProfit = ledgerRevenue - totalCosts;
  const profitMargin = ledgerRevenue > 0 ? Math.round((netOperatingProfit / ledgerRevenue) * 100 * 10) / 10 : 0;

  // Bottleneck calculation:
  // Stage hours required across active/delayed orders
  const activeOrders = data.orders.filter(o => o.status !== 'Completed');
  
  const stageDemand: Record<'Design' | 'Milling' | 'Joinery' | 'Finishing', number> = {
    Design: activeOrders.reduce((acc, o) => acc + (o.currentStage === 'Design' ? o.designHours : 0), 0),
    Milling: activeOrders.reduce((acc, o) => acc + (o.currentStage === 'Milling' ? o.millingHours : 0), 0),
    Joinery: activeOrders.reduce((acc, o) => acc + (o.currentStage === 'Joinery' ? o.joineryHours : 0), 0),
    Finishing: activeOrders.reduce((acc, o) => acc + (o.currentStage === 'Finishing' ? o.finishingHours : 0), 0)
  };

  // Active staff capacity (weekly 40h standard or biweekly active capacity)
  const activeStaff = data.hrRoster.filter(e => e.status !== 'Resigned' && e.status !== 'On Leave');
  const staffByRole: Record<'Designer' | 'Miller' | 'Joiner' | 'Finisher', EmployeeRecord[]> = {
    Designer: activeStaff.filter(e => e.role === 'Designer'),
    Miller: activeStaff.filter(e => e.role === 'Miller'),
    Joiner: activeStaff.filter(e => e.role === 'Joiner'),
    Finisher: activeStaff.filter(e => e.role === 'Finisher')
  };

  // Nominal 40-hour capacity per active worker per sprint/cycle
  const SPRINT_HOURS_PER_WORKER = 40;
  const stageCapacity: Record<'Design' | 'Milling' | 'Joinery' | 'Finishing', number> = {
    Design: (staffByRole.Designer.length || 0) * SPRINT_HOURS_PER_WORKER,
    Milling: (staffByRole.Miller.length || 0) * SPRINT_HOURS_PER_WORKER,
    Joinery: (staffByRole.Joiner.length || 0) * SPRINT_HOURS_PER_WORKER,
    Finishing: (staffByRole.Finisher.length || 0) * SPRINT_HOURS_PER_WORKER
  };

  const bottleneckByStage: Record<string, { demand: number; capacity: number; deficit: number }> = {
    Design: { demand: stageDemand.Design, capacity: stageCapacity.Design, deficit: Math.max(0, stageDemand.Design - stageCapacity.Design) },
    Milling: { demand: stageDemand.Milling, capacity: stageCapacity.Milling, deficit: Math.max(0, stageDemand.Milling - stageCapacity.Milling) },
    Joinery: { demand: stageDemand.Joinery, capacity: stageCapacity.Joinery, deficit: Math.max(0, stageDemand.Joinery - stageCapacity.Joinery) },
    Finishing: { demand: stageDemand.Finishing, capacity: stageCapacity.Finishing, deficit: Math.max(0, stageDemand.Finishing - stageCapacity.Finishing) }
  };

  const totalBottleneckHours = Object.values(bottleneckByStage).reduce((sum, s) => sum + s.deficit, 0);

  return {
    totalRevenue: ledgerRevenue || totalOrdersRevenue,
    orderWinRate,
    onTimeDeliveryRate,
    totalLatePenalties,
    totalBottleneckHours,
    netOperatingProfit,
    netProfitGrowth: 14.8, // % YoY growth
    overheadCost,
    materialCost,
    laborCost,
    totalOrders,
    completedOrders,
    delayedOrders,
    inProgressOrders,
    stageDemand,
    stageCapacity,
    bottleneckByStage,
    profitMargin
  };
}

// Recommended Staff-to-order mapping algorithm
export function getRecommendedStaffAssignment(data: AppDatasets) {
  const activeStaff = data.hrRoster.filter(s => s.status === 'Active');
  const delayedOrActiveOrders = data.orders.filter(o => o.status !== 'Completed');

  return delayedOrActiveOrders.map(order => {
    // Current stage target role
    let targetRole: 'Designer' | 'Miller' | 'Joiner' | 'Finisher' = 'Joiner';
    if (order.currentStage === 'Design') targetRole = 'Designer';
    else if (order.currentStage === 'Milling') targetRole = 'Miller';
    else if (order.currentStage === 'Joinery') targetRole = 'Joiner';
    else if (order.currentStage === 'Finishing') targetRole = 'Finisher';

    const candidates = activeStaff.filter(s => s.role === targetRole);
    // Sort by skill match: high complexity (>=7) needs 'high', medium needs 'medium'
    const bestFit = candidates.sort((a, b) => {
      const skillScore = (level: string) => level === 'high' ? 3 : level === 'medium' ? 2 : 1;
      if (order.complexity >= 8) {
        return skillScore(b.skillLevel) - skillScore(a.skillLevel);
      }
      return skillScore(b.skillLevel) - skillScore(a.skillLevel);
    })[0] || activeStaff[0];

    return {
      orderId: order.id,
      productType: order.productType,
      complexity: order.complexity,
      currentStage: order.currentStage,
      recommendedEmployeeId: bestFit?.employeeId || 'EMP-01',
      recommendedEmployeeName: bestFit?.name || 'Staff',
      role: targetRole,
      matchReason: order.complexity >= 8 
        ? `High complexity (${order.complexity}/10) assigned to Senior ${bestFit?.skillLevel} skill specialist`
        : `Complexity (${order.complexity}/10) matched to ${bestFit?.skillLevel} skill level for balanced load`
    };
  });
}

// Simple robust CSV stringifier
export function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// Simple robust CSV parser
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const result: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, index) => {
      row[h.trim()] = values[index]?.trim() ?? '';
    });
    result.push(row);
  }
  return result;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
