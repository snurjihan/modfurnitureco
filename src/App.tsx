import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Coins, 
  Boxes, 
  Users, 
  Factory, 
  LineChart, 
  Sliders, 
  FileText,
  Bot, 
  Sparkles, 
  Menu,
  X,
  Database,
  TrendingUp,
  Terminal
} from 'lucide-react';
import { AppDatasets, GlobalFilterState } from './types';
import { emptyDatasets, defaultFilterState, applyGlobalFilters } from './utils/filterAndSort';
import { SearchBar } from './components/SearchBar';
import { DataManagementBar } from './components/DataManagementBar';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { AIChatPanel } from './components/AIChatPanel';
import { OverviewTab } from './components/tabs/OverviewTab';
import { OrdersTab } from './components/tabs/OrdersTab';
import { FinancialsTab } from './components/tabs/FinancialsTab';
import { SalesCRMTab } from './components/tabs/SalesCRMTab';
import { InventoryTab } from './components/tabs/InventoryTab';
import { HRTab } from './components/tabs/HRTab';
import { ProductionTab } from './components/tabs/ProductionTab';
import { ForecastingTab } from './components/tabs/ForecastingTab';
import { SimulatorTab } from './components/tabs/SimulatorTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { PythonSandboxTab } from './components/tabs/PythonSandboxTab';

type TabKey = 
  | 'Overview' 
  | 'Orders' 
  | 'Financials' 
  | 'Sales & CRM'
  | 'Inventory' 
  | 'HR & Capacity' 
  | 'Production' 
  | 'Forecasting' 
  | 'Simulator' 
  | 'Reports'
  | 'Python Sandbox';

export default function App() {
  // Empty data in the beginning when loading the dashboard (File upload mandate)
  const [datasets, setDatasets] = useState<AppDatasets>(emptyDatasets);
  const [globalFilters, setGlobalFilters] = useState<GlobalFilterState>(defaultFilterState);
  const [activeTab, setActiveTab] = useState<TabKey>('Overview');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSimulatorOrderId, setSelectedSimulatorOrderId] = useState<string | undefined>(undefined);

  // Loaded files tracker initialized to empty/false
  const [loadedFilesSummary, setLoadedFilesSummary] = useState<Record<string, boolean>>({
    orders: false,
    hrRoster: false,
    hrEvents: false,
    designLog: false,
    inventoryLog: false,
    financialLedger: false,
    customers: false
  });

  const handleUpdateDatasets = (newDatasets: AppDatasets) => {
    setDatasets(newDatasets);
    setLoadedFilesSummary({
      orders: newDatasets.orders.length > 0,
      hrRoster: newDatasets.hrRoster.length > 0,
      hrEvents: newDatasets.hrEvents.length > 0,
      designLog: newDatasets.designLog.length > 0,
      inventoryLog: newDatasets.inventoryLog.length > 0,
      financialLedger: newDatasets.financialLedger.length > 0,
      customers: newDatasets.customers.length > 0
    });
  };

  const handleResetData = () => {
    setDatasets(emptyDatasets);
    setGlobalFilters(defaultFilterState);
    setLoadedFilesSummary({
      orders: false,
      hrRoster: false,
      hrEvents: false,
      designLog: false,
      inventoryLog: false,
      financialLedger: false,
      customers: false
    });
  };

  const handleOpenChatWithQuery = (query: string) => {
    setChatInitialQuery(query);
    setIsChatOpen(true);
  };

  // Dynamically compute filtered datasets for all descriptive tabs
  // Static Table Exemption: hr_roster and customers are exempt from date filtering
  const effectiveDatasets = applyGlobalFilters(datasets, globalFilters);

  const navTabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'Overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'Orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { key: 'Financials', label: 'Financials', icon: <Coins className="w-4 h-4" /> },
    { key: 'Sales & CRM', label: 'Sales & CRM', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'Inventory', label: 'Inventory', icon: <Boxes className="w-4 h-4" /> },
    { key: 'HR & Capacity', label: 'HR & Capacity', icon: <Users className="w-4 h-4" /> },
    { key: 'Production', label: 'Production', icon: <Factory className="w-4 h-4" /> },
    { key: 'Forecasting', label: 'Forecasting', icon: <LineChart className="w-4 h-4" /> },
    { key: 'Simulator', label: 'Simulator', icon: <Sliders className="w-4 h-4" /> },
    { key: 'Reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { key: 'Python Sandbox', label: 'Python Sandbox', icon: <Terminal className="w-4 h-4 text-emerald-500" /> }
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#33443c] flex flex-col font-sans selection:bg-[#94b4a5]/40 selection:text-[#33443c]">
      {/* Top Application Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b border-[#94b4a5]/30 px-4 lg:px-8 py-3.5 shadow-sm"
        style={{ backgroundColor: '#33443c' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl p-0.5 shadow-sm flex items-center justify-center"
              style={{ backgroundColor: '#94b4a5' }}
            >
              <Factory
                className="w-5 h-5 text-[#33443c]"
                style={{ backgroundColor: '#94b4a5' }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-extrabold text-base tracking-tight"
                  style={{ color: '#ffffff' }}
                >
                  Modern Furniture Co.
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono"
                  style={{ backgroundColor: '#94b4a5', color: '#363636' }}
                >
                  OPERATIONS AI
                </span>
              </div>
              <p
                className="text-xs font-medium"
                style={{ color: '#ffffff' }}
              >
                Production Bottleneck, Delay Penalty &amp; Workforce Dispatch
              </p>
            </div>
          </div>

          {/* Header Action controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Status Pill */}
            <div className="hidden md:flex items-center gap-2 bg-[#94b4a5]/20 border border-[#94b4a5]/40 rounded-xl px-3 py-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${datasets.orders.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[#94b4a5] font-semibold">
                {datasets.orders.length > 0 ? `${datasets.orders.length} Orders Active` : 'Awaiting CSV Upload'}
              </span>
            </div>

            {/* AI Assistant Toggle Button */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer group"
              style={{ backgroundColor: '#94b4a5', color: '#33443c' }}
            >
              <Bot className="w-4 h-4 text-[#33443c] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">AI Operations Agent</span>
              <span className="sm:hidden">AI Agent</span>
              <Sparkles className="w-3.5 h-3.5 text-[#33443c]" />
            </button>

            {/* Mobile Nav Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#5e8673]/30 text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Static Left-hand side Sidebar: Datasets > Filter > Dashboard Navigation */}
          <aside className={`w-full lg:w-72 shrink-0 space-y-4 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
            {/* 1. Datasets Upload & Export Panel */}
            <DataManagementBar
              datasets={datasets}
              onUpdateDatasets={handleUpdateDatasets}
              onResetData={handleResetData}
              loadedFilesSummary={loadedFilesSummary}
            />

            {/* 2. Global Universal Date Filter */}
            <GlobalFilterBar
              filters={globalFilters}
              onFilterChange={setGlobalFilters}
              onResetFilters={() => setGlobalFilters(defaultFilterState)}
              totalFilteredOrders={effectiveDatasets.orders.length}
              totalOrders={datasets.orders.length}
            />

            {/* 3. Dashboard Navigation Tabs */}
            <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-2.5 shadow-sm">
              <div className="text-[10px] font-bold text-[#5e8673] uppercase tracking-wider px-3 py-1.5 border-b border-[#94b4a5]/20 mb-1">
                Dashboard Modules
              </div>
              <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 scrollbar-none">
                {navTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-left w-full ${
                      activeTab === tab.key
                        ? 'bg-[#33443c] text-white shadow-sm font-bold'
                        : 'text-[#33443c] hover:text-[#25322c] hover:bg-[#f4f7f5]'
                    }`}
                  >
                    <span className={activeTab === tab.key ? 'text-white' : 'text-[#5e8673]'}>
                      {tab.icon}
                    </span>
                    <span className="flex-1">{tab.label}</span>
                    {activeTab === tab.key && (
                      <span className="hidden lg:block w-1.5 h-1.5 rounded-full bg-white ml-auto" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right-hand side: Search Bar + Dashboard Visualizations */}
          <div className="flex-1 min-w-0 w-full space-y-5 animate-in fade-in duration-200">
            {/* Quick Search Bar with 2 Dynamic Suggestions */}
            <SearchBar
              datasets={datasets}
              onSelectAction={(action) => handleOpenChatWithQuery(action)}
              onOpenChatWithQuery={(query) => handleOpenChatWithQuery(query)}
            />

            {/* Dashboard Visualisations below the search bar */}
            <div>
              {activeTab === 'Overview' && (
                <OverviewTab 
                  datasets={effectiveDatasets} 
                  onNavigateTab={(tab) => setActiveTab(tab as TabKey)} 
                />
              )}

              {activeTab === 'Orders' && (
                <OrdersTab datasets={effectiveDatasets} />
              )}

              {activeTab === 'Financials' && (
                <FinancialsTab datasets={effectiveDatasets} />
              )}

              {activeTab === 'Sales & CRM' && (
                <SalesCRMTab datasets={effectiveDatasets} />
              )}

              {activeTab === 'Inventory' && (
                <InventoryTab datasets={effectiveDatasets} />
              )}

              {activeTab === 'HR & Capacity' && (
                <HRTab datasets={effectiveDatasets} />
              )}

              {activeTab === 'Production' && (
                <ProductionTab datasets={effectiveDatasets} />
              )}

              {/* Forecasting and Simulator are exempt from global date filter per instructions */}
              {activeTab === 'Forecasting' && (
                <ForecastingTab 
                  datasets={datasets} 
                  onSendToSimulator={(orderId) => {
                    setSelectedSimulatorOrderId(orderId);
                    setActiveTab('Simulator');
                  }}
                />
              )}

              {activeTab === 'Simulator' && (
                <SimulatorTab 
                  datasets={datasets} 
                  initialOrderId={selectedSimulatorOrderId} 
                />
              )}

              {activeTab === 'Reports' && (
                <ReportsTab datasets={effectiveDatasets} />
              )}

              {activeTab === 'Python Sandbox' && (
                <PythonSandboxTab datasets={datasets} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Operations Chatbot Panel */}
      <AIChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        datasets={datasets}
        initialQuery={chatInitialQuery}
      />
    </div>
  );
}
