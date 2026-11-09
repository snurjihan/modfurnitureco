export interface OrderRecord {
  id: string;
  customerId: string;
  productType: string;
  status: string; // 'lost' | 'delivered' | 'design' | 'milling' | 'joinery' | 'finishing' | 'In Progress' | 'Completed' | 'Delayed' | 'LOST' | etc.
  currentStage: string; // 'Design' | 'Milling' | 'Joinery' | 'Finishing' | 'Completed'
  complexity: number; // 1-10
  designHours: number;
  millingHours: number;
  joineryHours: number;
  finishingHours: number;
  materialType: string;
  materialQty: number;
  materialCost: number;
  quotePrice: number;
  creationDate: string;
  completionDate?: string;
  dueDate: string;
  deliveryStatus: string; // 'On Time' | 'Late' | 'Delayed' | 'In Progress' | 'Early' | etc.
  lateDays: number;
  penaltyPct: number; // e.g. 0.02
}

export interface EmployeeRecord {
  employeeId: string;
  name?: string;
  role: 'Designer' | 'Miller' | 'Joiner' | 'Finisher' | string;
  skillLevel: 'high' | 'medium' | 'low';
  status: 'Active' | 'On Leave' | 'Resigned' | string;
  wage: number; // $/hr
}

export interface HREventRecord {
  date: string;
  event: string;
  employeeId: string;
  details: string;
}

export interface DesignLogRecord {
  orderId: string;
  designerId: string;
  designerSkill: 'high' | 'medium' | 'low' | string;
  startDate: string;
  endDate: string;
  durationDays: number;
}

export interface InventoryLogRecord {
  date: string;
  material: string;
  type: string; // 'Receipt' | 'Consumption' | 'Reserved' | 'Adjustment' | etc.
  quantity: number;
  orderId: string;
  newLevel: number;
}

export interface FinancialRecord {
  date: string;
  day?: string;
  type: string; // 'Revenue' | 'Overhead' | 'Material Cost' | 'Labor Cost' | 'Late Penalty' | 'COST' | 'REVENUE'
  amount: number;
  description: string;
}

export interface CustomerRecord {
  id: string;
  name?: string;
  orderIds: string;
}

export interface AppDatasets {
  orders: OrderRecord[];
  hrRoster: EmployeeRecord[];
  hrEvents: HREventRecord[];
  designLog: DesignLogRecord[];
  inventoryLog: InventoryLogRecord[];
  financialLedger: FinancialRecord[];
  customers: CustomerRecord[];
}

export type VizType = 'Bar' | 'Line' | 'Pie' | 'Funnel' | 'Scatter';
export type ColorTheme = 'Modern Sage' | 'Corporate Blue' | 'Dark Teal' | 'Viridis' | 'Warm Sunset';
export type GlobalSortOption = 'default' | 'az' | 'za' | 'lowest' | 'highest';

export interface GlobalFilterState {
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string; // 'YYYY-MM-DD' or ''
  preset: string; // 'ALL' | '30D' | '2024' | '2025' | '2026' | 'CUSTOM'
}

export type ChatMode = 'LOOK UP' | 'DEEP THINK' | 'ACTION PLAN';

export interface CodeExecutionStep {
  language: string;
  code: string;
  output?: string;
  outcome?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  mode?: ChatMode;
  text: string;
  timestamp: string;
  feedback?: 'accepted' | 'rejected' | 'modified';
  miniChart?: {
    type: 'bar' | 'line' | 'metric';
    title: string;
    labels: string[];
    values: number[];
  };
  suggestions?: string[];
  groundedStats?: {
    label: string;
    value: string;
  }[];
  codeExecutions?: CodeExecutionStep[];
  isSandboxVerified?: boolean;
}
