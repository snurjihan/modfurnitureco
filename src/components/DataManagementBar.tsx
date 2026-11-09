import React, { useRef, useState } from 'react';
import { 
  Database, 
  UploadCloud, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  ChevronDown,
  FileArchive
} from 'lucide-react';
import JSZip from 'jszip';
import { AppDatasets } from '../types';
import { convertToCSV, parseCSV } from '../utils/dataEngine';

interface DataManagementBarProps {
  datasets: AppDatasets;
  onUpdateDatasets: (datasets: AppDatasets) => void;
  onResetData: () => void;
  loadedFilesSummary: Record<string, boolean>;
}

export const DataManagementBar: React.FC<DataManagementBarProps> = ({
  datasets,
  onUpdateDatasets,
  onResetData,
  loadedFilesSummary
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [statusVisibility, setStatusVisibility] = useState<'show' | 'hide'>('hide');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileKeys: { key: keyof AppDatasets; filename: string; label: string }[] = [
    { key: 'orders', filename: 'orders_data.csv', label: 'orders_data' },
    { key: 'hrRoster', filename: 'hr_roster.csv', label: 'hr_roster' },
    { key: 'hrEvents', filename: 'hr_events_log.csv', label: 'hr_events_log' },
    { key: 'designLog', filename: 'design_log.csv', label: 'design_log' },
    { key: 'inventoryLog', filename: 'inventory_log.csv', label: 'inventory_log' },
    { key: 'financialLedger', filename: 'financial_ledger.csv', label: 'financial_ledger' },
    { key: 'customers', filename: 'customers_data.csv', label: 'customers_data' }
  ];

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    setFeedbackMsg(null);

    const updatedDatasets: AppDatasets = { ...datasets };
    const loadedNames: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const text = await file.text();
      const lowerName = file.name.toLowerCase();

      try {
        if (lowerName.includes('order')) {
          const parsed = parseCSV(text);
          updatedDatasets.orders = parsed.map((r: any) => ({
            id: r.id || `ORD-${Math.floor(1000 + Math.random()*9000)}`,
            customerId: r.customerId || 'CUST-UNKNOWN',
            productType: r.productType || 'Custom Furniture',
            status: (r.status as any) || 'In Progress',
            currentStage: (r.currentStage as any) || 'Design',
            complexity: Number(r.complexity) || 5,
            designHours: Number(r.designHours) || 0,
            millingHours: Number(r.millingHours) || 0,
            joineryHours: Number(r.joineryHours) || 0,
            finishingHours: Number(r.finishingHours) || 0,
            materialType: r.materialType || 'Lumber',
            materialQty: Number(r.materialQty) || 1,
            materialCost: Number(r.materialCost) || 0,
            quotePrice: Number(r.quotePrice) || 0,
            creationDate: r.creationDate || new Date().toISOString().split('T')[0],
            completionDate: r.completionDate || undefined,
            dueDate: r.dueDate || new Date().toISOString().split('T')[0],
            deliveryStatus: (r.deliveryStatus as any) || 'Scheduled',
            lateDays: Number(r.lateDays) || 0,
            penaltyPct: Number(r.penaltyPct) || 0.02
          }));
          loadedNames.push('orders_data.csv');
        } else if (lowerName.includes('hr_roster') || (lowerName.includes('roster') && !lowerName.includes('event'))) {
          const parsed = parseCSV(text);
          updatedDatasets.hrRoster = parsed.map((r: any) => ({
            employeeId: r.employeeId || `EMP-${Math.floor(10 + Math.random()*90)}`,
            name: r.name || undefined,
            role: (r.role as any) || 'Joiner',
            skillLevel: (r.skillLevel as any) || 'medium',
            status: (r.status as any) || 'Active',
            wage: Number(r.wage) || 35
          }));
          loadedNames.push('hr_roster.csv');
        } else if (lowerName.includes('hr_event') || lowerName.includes('events_log') || lowerName.includes('event')) {
          const parsed = parseCSV(text);
          updatedDatasets.hrEvents = parsed.map((r: any) => ({
            date: r.date || new Date().toISOString().split('T')[0],
            event: (r.event as any) || 'Attendance',
            employeeId: r.employeeId || 'EMP-01',
            details: r.details || ''
          }));
          loadedNames.push('hr_events_log.csv');
        } else if (lowerName.includes('design')) {
          const parsed = parseCSV(text);
          updatedDatasets.designLog = parsed.map((r: any) => ({
            orderId: r.orderId || 'ORD-00',
            designerId: r.designerId || 'EMP-01',
            designerSkill: (r.designerSkill as any) || 'medium',
            startDate: r.startDate || new Date().toISOString().split('T')[0],
            endDate: r.endDate || undefined,
            durationDays: Number(r.durationDays) || 1
          }));
          loadedNames.push('design_log.csv');
        } else if (lowerName.includes('inventory')) {
          const parsed = parseCSV(text);
          updatedDatasets.inventoryLog = parsed.map((r: any) => ({
            date: r.date || new Date().toISOString().split('T')[0],
            material: r.material || 'Hardwood',
            type: (r.type as any) || 'Consumption',
            quantity: Number(r.quantity) || 1,
            orderId: r.orderId || 'ORD-GEN',
            newLevel: Number(r.newLevel) || 10
          }));
          loadedNames.push('inventory_log.csv');
        } else if (lowerName.includes('financial') || lowerName.includes('ledger')) {
          const parsed = parseCSV(text);
          updatedDatasets.financialLedger = parsed.map((r: any) => ({
            date: r.date || new Date().toISOString().split('T')[0],
            day: r.day || 'Monday',
            type: (r.type as any) || 'Overhead',
            amount: Number(r.amount) || 0,
            description: r.description || 'General Ledger Entry'
          }));
          loadedNames.push('financial_ledger.csv');
        } else if (lowerName.includes('customer')) {
          const parsed = parseCSV(text);
          updatedDatasets.customers = parsed.map((r: any) => ({
            id: r.id || 'CUST-00',
            orderIds: typeof r.orderIds === 'string' ? r.orderIds.split(';').map((s: string) => s.trim()) : (r.orderIds || [])
          }));
          loadedNames.push('customers_data.csv');
        }
      } catch (err) {
        console.error(`Error parsing file ${file.name}:`, err);
      }
    }

    onUpdateDatasets(updatedDatasets);
    setIsProcessing(false);

    if (loadedNames.length > 0) {
      setFeedbackMsg({
        text: `Loaded ${loadedNames.length} file(s): ${loadedNames.join(', ')}`,
        type: 'success'
      });
      setStatusVisibility('show');
    } else {
      setFeedbackMsg({
        text: 'No recognised schema matching orders, roster, events, design, inventory, ledger, or customers.',
        type: 'error'
      });
    }

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 5000);
  };

  const handleExportSingle = (key: keyof AppDatasets, filename: string) => {
    const data = datasets[key];
    const csvStr = convertToCSV(data);
    downloadFile(csvStr, filename);
  };

  // Export all 7 datasets bundled into a single ZIP file
  const handleExportZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Package each dataset
      zip.file('orders_data.csv', convertToCSV(datasets.orders));
      zip.file('hr_roster.csv', convertToCSV(datasets.hrRoster));
      zip.file('hr_events_log.csv', convertToCSV(datasets.hrEvents));
      zip.file('design_log.csv', convertToCSV(datasets.designLog));
      zip.file('inventory_log.csv', convertToCSV(datasets.inventoryLog));
      zip.file('financial_ledger.csv', convertToCSV(datasets.financialLedger));
      zip.file('customers_data.csv', convertToCSV(datasets.customers));

      // Add a manifest README with timestamp and row counts
      const manifestContent = `# Modern Furniture Co. - Operations Data Export
Exported: ${new Date().toISOString()}

Included Datasets:
- orders_data.csv (${datasets.orders.length} records)
- hr_roster.csv (${datasets.hrRoster.length} records)
- hr_events_log.csv (${datasets.hrEvents.length} records)
- design_log.csv (${datasets.designLog.length} records)
- inventory_log.csv (${datasets.inventoryLog.length} records)
- financial_ledger.csv (${datasets.financialLedger.length} records)
- customers_data.csv (${datasets.customers.length} records)
`;
      zip.file('README.txt', manifestContent);

      const content = await zip.generateAsync({ type: 'blob' });
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `modern_furniture_datasets_${dateStr}.zip`;

      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedbackMsg({
        text: 'All 7 datasets successfully packaged and exported as .zip!',
        type: 'success'
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('ZIP generation error:', err);
      setFeedbackMsg({
        text: 'Failed to create .ZIP export archive',
        type: 'error'
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setIsZipping(false);
    }
  };

  const downloadFile = (content: string, filename: string, type: string = 'text/csv') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeCount = Object.values(loadedFilesSummary).filter(Boolean).length;

  return (
    <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-3.5 shadow-sm space-y-3">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-[#94b4a5]/30 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#5e8673]/15 text-[#33443c]">
            <Database className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-[#33443c] tracking-wide uppercase">
            Data Management
          </span>
        </div>
        <span className="text-[9px] bg-[#5e8673]/15 text-[#33443c] border border-[#5e8673]/30 px-1.5 py-0.5 rounded-full font-mono font-bold">
          {activeCount} / 7 LOADED
        </span>
      </div>

      {/* Upload Zone & Action Buttons side by side, 2 columns */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".csv"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        {/* Button 1: Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center justify-center gap-1.5 bg-[#33443c] hover:bg-[#25322c] text-white font-bold text-xs py-2 px-2.5 rounded-xl transition-all shadow-sm cursor-pointer group"
          title="Upload multiple CSV datasets simultaneously"
        >
          <UploadCloud className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          <span>Upload</span>
        </button>

        {/* Button 2: Revised text: Export */}
        <button
          onClick={handleExportZip}
          disabled={isZipping}
          className="flex items-center justify-center gap-1.5 bg-[#5e8673]/15 hover:bg-[#5e8673]/25 text-[#33443c] font-bold text-xs py-2 px-2.5 rounded-xl transition-all border border-[#5e8673]/40 cursor-pointer shadow-2xs"
          title="Export all 7 CSV datasets packaged into a single ZIP archive"
        >
          <FileArchive className="w-3.5 h-3.5 text-[#5e8673] shrink-0" />
          <span>{isZipping ? 'Zipping...' : 'Export'}</span>
        </button>

        {/* Button 3: Reset Data */}
        <button
          onClick={onResetData}
          className="flex items-center justify-center gap-1 bg-[#f4f7f5] hover:bg-rose-50 text-rose-700 font-semibold text-xs py-1.5 px-2 rounded-xl transition-all border border-rose-200 cursor-pointer"
          title="Clear all datasets and reset all metrics to zero"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Reset Data</span>
        </button>

        {/* Button 4: Individual CSVs export dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="w-full flex items-center justify-center gap-1 bg-[#f4f7f5] hover:bg-[#94b4a5]/20 text-[#33443c] font-semibold text-xs py-1.5 px-2 rounded-xl transition-all border border-[#94b4a5]/40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#5e8673] shrink-0" />
            <span>CSVs</span>
            <ChevronDown className="w-3 h-3 text-[#5e8673] ml-0.5 shrink-0" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-[#94b4a5]/40 rounded-xl shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 font-bold text-[#5e8673] text-[10px] uppercase border-b border-[#94b4a5]/30">
                Export Individual CSVs
              </div>
              {fileKeys.map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    handleExportSingle(f.key, f.filename);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#f4f7f5] text-[#33443c] font-medium flex items-center justify-between cursor-pointer"
                >
                  <span>{f.filename}</span>
                  <Download className="w-3 h-3 text-[#5e8673]" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dataset Schema Badges Grid - hide/show it with a select down menu */}
      <div className="border-t border-[#94b4a5]/30 pt-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#5e8673] uppercase tracking-wider">
              Dataset Status
            </span>
            <span className="text-[9px] bg-[#5e8673]/15 text-[#33443c] border border-[#5e8673]/30 px-1.5 py-0.2 rounded-full font-mono font-bold">
              {activeCount}/7
            </span>
          </div>

          {/* Toggle button to hide/show dataset status */}
          <button
            type="button"
            onClick={() => setStatusVisibility(prev => prev === 'show' ? 'hide' : 'show')}
            className="flex items-center justify-center p-1 rounded-lg bg-[#f4f7f5] hover:bg-[#94b4a5]/20 text-[#33443c] border border-[#94b4a5]/50 transition-all cursor-pointer"
            aria-label="Toggle Dataset Status visibility"
            title={statusVisibility === 'show' ? 'Collapse Dataset Status' : 'Expand Dataset Status'}
          >
            <ChevronDown className={`w-3.5 h-3.5 text-[#5e8673] transition-transform duration-200 ${statusVisibility === 'show' ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {statusVisibility === 'show' && (
          <div className="grid grid-cols-2 gap-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            {fileKeys.map((f) => {
              const isLoaded = loadedFilesSummary[f.key] ?? false;
              return (
                <div
                  key={f.key}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold border truncate ${
                    isLoaded
                      ? 'bg-[#f4f7f5] text-[#33443c] border-[#94b4a5]/50'
                      : 'bg-white text-slate-400 border-slate-200'
                  }`}
                  title={isLoaded ? `${f.filename} is loaded` : `${f.filename} not uploaded`}
                >
                  <CheckCircle2
                    className={`w-2.5 h-2.5 shrink-0 ${isLoaded ? 'text-[#5e8673]' : 'text-slate-300'}`}
                  />
                  <span className="truncate">{f.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feedback Messages */}
      {feedbackMsg && (
        <div
          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-[#5e8673]/15 text-[#33443c] border-[#5e8673]/30'
              : feedbackMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-[#f4f7f5] text-[#33443c] border-[#94b4a5]/40'
          }`}
        >
          {feedbackMsg.type === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5e8673] shrink-0" />
          )}
          <span className="font-medium text-[11px] leading-tight">{feedbackMsg.text}</span>
        </div>
      )}
    </div>
  );
};
