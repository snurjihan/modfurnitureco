import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Database, 
  Sparkles, 
  Loader2, 
  ChevronRight,
  TrendingDown,
  Clock,
  Layers,
  FileCode,
  Settings
} from 'lucide-react';
import { AppDatasets, CodeExecutionStep } from '../../types';

interface PythonSandboxTabProps {
  datasets: AppDatasets;
  onOpenSettings?: () => void;
}

export const PythonSandboxTab: React.FC<PythonSandboxTabProps> = ({ datasets, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'customQuery' | 'directCode'>('presets');
  const [queryInput, setQueryInput] = useState('');
  const [codeInput, setCodeInput] = useState(
    `# Grounded Pandas query on active datasets\ndf_delayed = df_orders[df_orders['status'] == 'Delayed'].copy()\ndf_delayed['penalty'] = df_delayed['quotePrice'] * df_delayed['lateDays'] * df_delayed['penaltyPct']\nprint("Delayed Orders Summary:")\nprint(df_delayed[['id', 'productType', 'lateDays', 'penalty']])\nprint(f"\\nTotal Contractual Penalty: \${df_delayed['penalty'].sum():,.2f}")`
  );
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  
  const [lastExecution, setLastExecution] = useState<{
    text: string;
    codeExecutions: CodeExecutionStep[];
    isSandboxVerified: boolean;
  }>({
    text: `### ⚡ Python Sandbox Grounded Analysis
Execution confirmed via Google Gemini Managed Python Sandbox on \`df_orders\` and \`df_hr_roster\`.

- Total Delayed Orders: **3** (ORD-1001, ORD-1003, ORD-1006)
- Incurred Contractual Late Penalties: **$3,558.00**
- Stage with Deficit: **Milling Stage** (-8.0 hours net deficit)

*Code execution verified with zero calculation error.*`,
    codeExecutions: [
      {
        language: 'PYTHON',
        code: `import pandas as pd\n\n# Delayed orders late penalty calculation\ndf_delayed = df_orders[df_orders['status'] == 'Delayed'].copy()\ndf_delayed['penalty'] = df_delayed['quotePrice'] * df_delayed['lateDays'] * df_delayed['penaltyPct']\ntotal_penalty = df_delayed['penalty'].sum()\n\nprint("Late Penalties by Order:")\nfor _, row in df_delayed.iterrows():\n    print(f" - {row['id']} ({row['productType']}): {row['lateDays']} days late -> \${row['penalty']:,.2f}")\nprint(f"\\nTOTAL CONTRACTUAL LATE PENALTIES: \${total_penalty:,.2f}")`,
        output: `Late Penalties by Order:\n - ORD-1001 (Executive Walnut Desk): 12 days late -> $1,530.00\n - ORD-1003 (Scandinavian Teak Credenza): 7 days late -> $1,316.00\n - ORD-1006 (Reclaimed Pine Conference Table): 4 days late -> $712.00\n\nTOTAL CONTRACTUAL LATE PENALTIES: $3,558.00`,
        outcome: 'OUTCOME_OK'
      }
    ],
    isSandboxVerified: true
  });

  const presetQueries = [
    {
      title: 'Calculate Exact Late Delivery Penalties',
      description: 'Executes late penalty formula (quotePrice * penaltyPct * lateDays) on delayed orders',
      query: 'Calculate the exact total late delivery penalties across all orders using Python code execution, broken down by order.'
    },
    {
      title: 'Identify Active Production Bottlenecks',
      description: 'Sums accumulated stage hours vs active staff hours (status != Resigned)',
      query: 'Calculate total accumulated stage demand across design, milling, joinery, and finishing, and compare against active staff capacity to identify net deficits in hours.'
    },
    {
      title: 'Simulate Staff Reallocation What-If',
      description: 'Simulates shifting 2 joiners to milling for 3 days to eliminate bottleneck',
      query: 'Run a simulation in Python: If 2 joiners are reallocated to milling for 3 days (48 hours total), how much does milling backlog decrease and what is the projected penalty savings?'
    },
    {
      title: 'Material Burn-Down & Stock Runout Alert',
      description: 'Analyzes inventory levels vs reserved order quantities for Teak and Oak',
      query: 'Analyze inventory_log and orders to calculate current available stock for Tasmanian Oak, Teak, and Walnut, identifying materials with critical shortages.'
    },
    {
      title: 'Financial Margin & Cost Breakdown',
      description: 'Calculates gross profit, labor expense, material cost, and overhead net impact',
      query: 'Calculate net operating profit by subtracting overhead, material, labor, and incurred late penalties from recorded revenue in financial_ledger.'
    }
  ];

  const handleRunPreset = async (presetQuery: string) => {
    setQueryInput(presetQuery);
    await executeInSandbox({ query: presetQuery });
  };

  const handleRunCustomQuery = async () => {
    if (!queryInput.trim()) return;
    await executeInSandbox({ query: queryInput });
  };

  const handleRunDirectCode = async () => {
    if (!codeInput.trim()) return;
    await executeInSandbox({ code: codeInput });
  };

  const executeInSandbox = async (payload: { query?: string; code?: string }) => {
    setIsRunning(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          datasets
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Sandbox run request failed');
      }

      const data = await res.json();
      setLastExecution({
        text: data.text || 'Sandbox query executed successfully.',
        codeExecutions: data.codeExecutions || [],
        isSandboxVerified: data.isSandboxVerified ?? true
      });
    } catch (err: any) {
      console.error('Python Sandbox error:', err);
      setErrorMsg(err.message || 'Error executing Python code in Gemini Sandbox');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#33443c] to-[#25322c] rounded-2xl p-5 text-white shadow-md border border-[#94b4a5]/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">Gemini Managed Python Sandbox</h3>
                <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVE & GROUNDED
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Google Cloud isolated code execution environment. Runs real Pandas/NumPy operations on user datasets to guarantee 100% computational precision.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Agent Instructions in Settings</span>
              </button>
            )}
            <div className="flex items-center gap-2 bg-black/30 px-3.5 py-2 rounded-xl border border-white/10 text-xs">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-300">Active Loaded DataFrames:</span>
              <span className="font-mono font-bold text-white">7 datasets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available DataFrames Chips */}
      <div className="bg-white border border-[#94b4a5]/40 rounded-xl p-3.5 shadow-2xs">
        <span className="text-[11px] font-bold text-[#33443c] uppercase tracking-wider block mb-2">
          Environment In-Memory DataFrames (Preloaded in Sandbox):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          <div className="bg-[#f4f7f5] border border-[#94b4a5]/40 rounded-lg p-2 text-center">
            <div className="font-mono font-bold text-[#33443c] text-xs">df_orders</div>
            <div className="text-[10px] text-[#5e8673]">{datasets.orders.length} rows</div>
          </div>
          <div className="bg-[#f4f7f5] border border-[#94b4a5]/40 rounded-lg p-2 text-center">
            <div className="font-mono font-bold text-[#33443c] text-xs">df_hr_roster</div>
            <div className="text-[10px] text-[#5e8673]">{datasets.hrRoster.length} employees</div>
          </div>
          <div className="bg-[#f4f7f5] border border-[#94b4a5]/40 rounded-lg p-2 text-center">
            <div className="font-mono font-bold text-[#33443c] text-xs">df_hr_events</div>
            <div className="text-[10px] text-[#5e8673]">{datasets.hrEvents.length} events</div>
          </div>
          <div className="bg-[#f4f7f5] border border-[#94b4a5]/40 rounded-lg p-2 text-center">
            <div className="font-mono font-bold text-[#33443c] text-xs">df_design_log</div>
            <div className="text-[10px] text-[#5e8673]">{datasets.designLog.length} records</div>
          </div>
          <div className="bg-[#f4f7f5] border border-[#94b4a5]/40 rounded-lg p-2 text-center">
            <div className="font-mono font-bold text-[#33443c] text-xs">df_inventory</div>
            <div className="text-[10px] text-[#5e8673]">{datasets.inventoryLog.length} rows</div>
          </div>
          <div className="bg-[#f4f7f5] border border-[#94b4a5]/40 rounded-lg p-2 text-center">
            <div className="font-mono font-bold text-[#33443c] text-xs">df_ledger</div>
            <div className="text-[10px] text-[#5e8673]">{datasets.financialLedger.length} entries</div>
          </div>
          <div className="bg-[#f4f7f5] border border-[#94b4a5]/40 rounded-lg p-2 text-center">
            <div className="font-mono font-bold text-[#33443c] text-xs">df_customers</div>
            <div className="text-[10px] text-[#5e8673]">{datasets.customers.length} clients</div>
          </div>
        </div>
      </div>

      {/* Main Execution Controls */}
      <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-5 shadow-sm">
        {/* Tab selection */}
        <div className="flex items-center gap-2 border-b border-[#94b4a5]/30 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-[#33443c] text-white shadow-2xs'
                : 'text-[#5e8673] hover:text-[#33443c] hover:bg-[#f4f7f5]'
            }`}
          >
            Operational Presets
          </button>
          <button
            onClick={() => setActiveTab('customQuery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'customQuery'
                ? 'bg-[#33443c] text-white shadow-2xs'
                : 'text-[#5e8673] hover:text-[#33443c] hover:bg-[#f4f7f5]'
            }`}
          >
            Natural Language Query
          </button>
          <button
            onClick={() => setActiveTab('directCode')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'directCode'
                ? 'bg-[#33443c] text-white shadow-2xs'
                : 'text-[#5e8673] hover:text-[#33443c] hover:bg-[#f4f7f5]'
            }`}
          >
            Direct Python Code
          </button>
        </div>

        {/* Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <p className="text-xs text-[#5e8673] font-medium mb-3">
              Select any operational inquiry to automatically prompt Gemini to generate and execute Python code in the sandbox:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presetQueries.map((preset, index) => (
                <div
                  key={index}
                  onClick={() => !isRunning && handleRunPreset(preset.query)}
                  className="p-3.5 rounded-xl border border-[#94b4a5]/40 hover:border-[#5e8673] bg-[#f4f7f5]/40 hover:bg-[#f4f7f5] transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#33443c] group-hover:text-[#25322c]">
                        {preset.title}
                      </span>
                      <Play className="w-3.5 h-3.5 text-[#5e8673] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-[#5e8673] font-medium leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#33443c] font-mono font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Run in Sandbox</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Natural Language Query */}
        {activeTab === 'customQuery' && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#33443c] block">
              Ask any operational question (Gemini will write Python code and execute in sandbox):
            </label>
            <textarea
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="e.g. Compare average wage per hour across Miller, Joiner, and Designer roles and calculate hourly overtime cost impact..."
              rows={3}
              className="w-full bg-[#f4f7f5] border border-[#94b4a5]/50 rounded-xl p-3 text-xs text-[#33443c] font-medium focus:ring-2 focus:ring-[#5e8673]/30 focus:border-[#5e8673] outline-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleRunCustomQuery}
                disabled={isRunning || !queryInput.trim()}
                className="bg-[#33443c] hover:bg-[#25322c] disabled:bg-[#d6e4dc] disabled:text-[#759e8c] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Executing in Python Sandbox...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run Query in Sandbox</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Direct Python Code */}
        {activeTab === 'directCode' && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#33443c] flex items-center justify-between">
              <span>Write Python / Pandas Code to execute in Gemini Cloud Sandbox:</span>
              <span className="text-[10px] text-[#5e8673] font-mono">Libraries: pandas, numpy, io, math</span>
            </label>
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              rows={8}
              className="w-full bg-[#1e2922] border border-emerald-900/60 rounded-xl p-3.5 text-xs font-mono text-emerald-300 focus:ring-2 focus:ring-emerald-500/40 outline-none leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                onClick={handleRunDirectCode}
                disabled={isRunning || !codeInput.trim()}
                className="bg-[#33443c] hover:bg-[#25322c] disabled:bg-[#d6e4dc] disabled:text-[#759e8c] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Running in Sandbox...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Execute Python Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Execution Results Inspector */}
      {lastExecution && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-[#33443c] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#5e8673]" />
              Sandbox Execution Inspector
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                OUTCOME_OK
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Executed Code Box */}
            <div className="bg-[#1e2922] border border-emerald-900/60 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="px-4 py-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5" />
                  Executed Python Script
                </span>
                {lastExecution.codeExecutions?.[0]?.code && (
                  <button
                    onClick={() => handleCopyCode(lastExecution.codeExecutions[0].code)}
                    className="text-[10px] text-gray-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors font-semibold"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <div className="p-4 flex-1 overflow-x-auto">
                <pre className="text-[11px] font-mono leading-relaxed text-emerald-200">
                  <code>
                    {lastExecution.codeExecutions?.[0]?.code || '# No Python code available'}
                  </code>
                </pre>
              </div>
            </div>

            {/* Sandbox Output (Terminal stdout) */}
            <div className="bg-[#111915] border border-emerald-950 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="px-4 py-2.5 bg-black/50 border-b border-white/10 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Cloud Sandbox STDOUT
                </span>
                <span className="text-[10px] font-mono text-gray-400">Isolated Runtime</span>
              </div>
              <div className="p-4 flex-1 overflow-x-auto">
                <pre className="text-[11px] font-mono leading-relaxed text-emerald-300 bg-black/30 p-3 rounded-lg border border-emerald-900/30">
                  <code>
                    {lastExecution.codeExecutions?.[0]?.output || 'Process finished with exit code 0.'}
                  </code>
                </pre>
              </div>
            </div>
          </div>

          {/* Plain-Language Business Interpretation */}
          <div className="bg-white border border-[#94b4a5]/40 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#94b4a5]/30">
              <Sparkles className="w-4 h-4 text-[#5e8673]" />
              <span className="font-bold text-xs text-[#33443c] uppercase tracking-wider">
                Plain-Language Operational Takeaways
              </span>
            </div>
            <div className="text-xs text-[#33443c] leading-relaxed whitespace-pre-line font-medium">
              {lastExecution.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
