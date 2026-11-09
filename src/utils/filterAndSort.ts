import { AppDatasets, GlobalFilterState, GlobalSortOption } from '../types';

export const emptyDatasets: AppDatasets = {
  orders: [],
  hrRoster: [],
  hrEvents: [],
  designLog: [],
  inventoryLog: [],
  financialLedger: [],
  customers: []
};

export const defaultFilterState: GlobalFilterState = {
  startDate: '',
  endDate: '',
  preset: 'ALL'
};

export function applyGlobalFilters(
  datasets: AppDatasets,
  filters: GlobalFilterState
): AppDatasets {
  const { startDate, endDate } = filters;
  const isDateFilterActive = Boolean(startDate || endDate);

  // If no global date filter is active, return datasets as-is
  if (!isDateFilterActive) {
    return datasets;
  }

  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return false;
    const cleanDate = dateStr.trim().split('T')[0];
    if (startDate && cleanDate < startDate) return false;
    if (endDate && cleanDate > endDate) return false;
    return true;
  };

  // 1. ORDERS: Anchor is creationDate
  const filteredOrders = datasets.orders.filter(order => isDateInRange(order.creationDate));

  // 2. STATIC TABLE EXEMPTION: hr_roster is NEVER filtered by global date
  const filteredRoster = datasets.hrRoster;

  // 3. HR EVENTS: Anchor is date
  const filteredHREvents = datasets.hrEvents.filter(event => isDateInRange(event.date));

  // 4. DESIGN LOG: Anchor is startDate or endDate
  const filteredDesignLog = datasets.designLog.filter(log => isDateInRange(log.startDate) || isDateInRange(log.endDate));

  // 5. INVENTORY LOG: Anchor is date
  const filteredInventoryLog = datasets.inventoryLog.filter(inv => isDateInRange(inv.date));

  // 6. FINANCIAL LEDGER: Anchor is date
  const filteredFinancialLedger = datasets.financialLedger.filter(fin => isDateInRange(fin.date));

  // 7. STATIC TABLE EXEMPTION: customers is NEVER filtered by global date
  const filteredCustomers = datasets.customers;

  return {
    orders: filteredOrders,
    hrRoster: filteredRoster,
    hrEvents: filteredHREvents,
    designLog: filteredDesignLog,
    inventoryLog: filteredInventoryLog,
    financialLedger: filteredFinancialLedger,
    customers: filteredCustomers
  };
}

export function sortChartData<T extends { label: string; value: number }>(
  data: T[],
  sortOption: GlobalSortOption
): T[] {
  const clone = [...data];
  if (sortOption === 'az') {
    clone.sort((a, b) => a.label.localeCompare(b.label));
  } else if (sortOption === 'za') {
    clone.sort((a, b) => b.label.localeCompare(a.label));
  } else if (sortOption === 'lowest') {
    clone.sort((a, b) => a.value - b.value);
  } else if (sortOption === 'highest') {
    clone.sort((a, b) => b.value - a.value);
  }
  return clone;
}
