import React, { useState } from 'react';
import { Boxes, Filter, Layers, PackageCheck, AlertCircle } from 'lucide-react';
import { AppDatasets } from '../../types';
import { DynamicChart } from '../DynamicChart';

interface InventoryTabProps {
  datasets: AppDatasets;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ datasets }) => {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('All');
  const [selectedProductType, setSelectedProductType] = useState<string>('All');

  const inventoryLogs = datasets.inventoryLog;
  const orders = datasets.orders;

  // Material types available in inventory
  const materialList = Array.from(new Set(inventoryLogs.map(i => i.material).filter(Boolean)));
  if (materialList.length === 0) {
    materialList.push('Walnut', 'Tasmanian Oak', 'Teak', 'Ash Wood', 'European Beech', 'Reclaimed Pine');
  }

  // Product types available in orders
  const productTypes = Array.from(new Set(orders.map(o => o.productType).filter(Boolean)));

  // Count of materials per type across all logs/orders
  const materialCounts: Record<string, number> = {};
  materialList.forEach(mat => {
    materialCounts[mat] = inventoryLogs.filter(i => i.material.toLowerCase() === mat.toLowerCase()).length;
  });

  // Calculate current stock levels by material
  const stockByMaterial = materialList.map(mat => {
    const logs = inventoryLogs.filter(i => i.material.toLowerCase() === mat.toLowerCase());
    const latest = logs[logs.length - 1];
    const level = latest ? Number(latest.newLevel) || 0 : 0;

    // Filter consumption according to product type if active
    let consumptionLogs = logs.filter(l => (l.type || '').toLowerCase() === 'consumption');
    if (selectedProductType !== 'All') {
      consumptionLogs = consumptionLogs.filter(l => {
        const order = orders.find(o => o.id === l.orderId);
        return order && order.productType.toLowerCase() === selectedProductType.toLowerCase();
      });
    }

    const totalConsumed = consumptionLogs.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);

    return {
      material: mat,
      level,
      totalConsumed
    };
  });

  // Apply filters
  const filteredStockData = stockByMaterial.filter(item => {
    const matchesMaterial = selectedMaterial === 'All' || item.material.toLowerCase() === selectedMaterial.toLowerCase();
    return matchesMaterial;
  });

  // KPI box: Current stock levels (sum across filtered materials)
  const currentTotalStock = filteredStockData.reduce((sum, item) => sum + item.level, 0);
  const totalConsumption = filteredStockData.reduce((sum, item) => sum + item.totalConsumed, 0);

  // Visualization 1: Pie chart illustrating total consumption per material
  const consumptionPieData = filteredStockData.map(item => ({
    label: item.material,
    value: item.totalConsumed
  }));

  // Visualization 2: Bar chart showing the current stock level for each material
  const stockLevelBarData = filteredStockData.map(item => ({
    label: item.material,
    value: item.level
  }));

  return (
    <div className="space-y-6">
      {/* Local Filter Bar: Material Type with count per type + Product Type */}
      <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#5e8673]/15 text-[#33443c] border border-[#5e8673]/30">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#33443c] tracking-wide uppercase">
                Inventory Filters
              </span>
              <p className="text-[10px] text-[#5e8673] font-medium leading-none mt-0.5">
                Filter by material type count and product type
              </p>
            </div>
          </div>

          {/* Product Type dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-[#5e8673] shrink-0">Product Type:</span>
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="bg-[#f4f7f5] border border-[#94b4a5]/50 text-[#33443c] text-xs font-semibold px-2.5 py-1.5 rounded-xl cursor-pointer focus:outline-none"
            >
              <option value="All">All Product Types</option>
              {productTypes.map(pt => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Material Type Pills with Total Count of Materials per Type */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#94b4a5]/20">
          <button
            onClick={() => setSelectedMaterial('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              selectedMaterial === 'All'
                ? 'bg-[#33443c] text-white shadow-xs font-bold'
                : 'bg-[#f4f7f5] text-[#33443c] hover:bg-[#94b4a5]/20 border border-[#94b4a5]/40'
            }`}
          >
            All Materials ({inventoryLogs.length})
          </button>
          {materialList.map(mat => (
            <button
              key={mat}
              onClick={() => setSelectedMaterial(mat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedMaterial.toLowerCase() === mat.toLowerCase()
                  ? 'bg-[#33443c] text-white shadow-xs font-bold'
                  : 'bg-[#f4f7f5] text-[#33443c] hover:bg-[#94b4a5]/20 border border-[#94b4a5]/40'
              }`}
            >
              <span>{mat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedMaterial.toLowerCase() === mat.toLowerCase()
                  ? 'bg-white/20 text-white'
                  : 'bg-[#5e8673]/15 text-[#33443c]'
              }`}>
                {materialCounts[mat] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Box: Current Stock Levels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* KPI 1: Current Stock Levels */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Current Stock Levels</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#33443c] font-mono">
            {currentTotalStock.toLocaleString()} <span className="text-xs text-[#5e8673] font-normal">units in warehouse</span>
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            Active available timber stock across filtered materials
          </div>
        </div>

        {/* Total Consumption */}
        <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-[#5e8673] text-xs font-semibold mb-2">
            <span>Cumulative Material Consumption</span>
            <div className="w-8 h-8 rounded-xl bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#33443c] font-mono">
            {totalConsumption.toLocaleString()} <span className="text-xs text-[#5e8673] font-normal">units consumed</span>
          </div>
          <div className="text-[11px] text-[#5e8673] mt-2 font-medium">
            Allocated into production across stages
          </div>
        </div>
      </div>

      {/* Visualizations Grid: Only Pie chart of total consumption & Bar chart of current stock levels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart illustrating total consumption per material */}
        <DynamicChart
          title="Total Consumption per Material"
          subtitle="Proportional raw timber consumption across selected scope"
          data={consumptionPieData}
          valueSuffix=" units"
          defaultVizType="Pie"
        />

        {/* Bar chart showing the current stock level for each material */}
        <DynamicChart
          title="Current Stock Level for Each Material"
          subtitle="Real-time available inventory levels in units"
          data={stockLevelBarData}
          valueSuffix=" units"
          defaultVizType="Bar"
        />
      </div>

      {/* Material Stock Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {filteredStockData.map((item) => (
          <div
            key={item.material}
            className="bg-white border border-[#94b4a5]/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-bold text-[#33443c] truncate">{item.material}</div>
              <div className="text-xl font-extrabold text-[#33443c] font-mono mt-1">
                {item.level} <span className="text-[10px] text-[#5e8673]">units</span>
              </div>
            </div>
            <div className="mt-2 text-[10px] font-semibold text-[#5e8673]">
              Consumed: {item.totalConsumed}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
