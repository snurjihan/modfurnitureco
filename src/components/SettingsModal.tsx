import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Terminal, 
  Sparkles, 
  Check, 
  Copy, 
  RotateCcw, 
  Save, 
  ShieldCheck, 
  Cpu, 
  BookOpen, 
  AlertCircle, 
  Play, 
  Loader2, 
  Sliders, 
  FileCode2, 
  Database, 
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AgentSettings } from '../types';
import { 
  DEFAULT_SYSTEM_INSTRUCTIONS, 
  DEFAULT_AGENT_SETTINGS, 
  SYSTEM_INSTRUCTIONS_BREAKDOWN 
} from '../data/defaultSystemInstructions';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasets: any;
  currentSettings: AgentSettings;
  onSaveSettings: (newSettings: AgentSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  datasets,
  currentSettings,
  onSaveSettings
}) => {
  const [activeTab, setActiveTab] = useState<'instructions' | 'sandbox' | 'test'>('instructions');
  const [instructionsText, setInstructionsText] = useState(currentSettings.systemInstruction);
  const [primaryModel, setPrimaryModel] = useState<'gemini-2.5-flash' | 'gemini-3.8-flash'>(currentSettings.primaryModel);
  const [strictDataBoundary, setStrictDataBoundary] = useState(currentSettings.strictDataBoundary);
  const [sandboxEnabled, setSandboxEnabled] = useState(currentSettings.sandboxEnabled);
  const [temperature, setTemperature] = useState(currentSettings.temperature);

  const [copied, setCopied] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('core_objective');

  // Interactive Test State
  const [testQuery, setTestQuery] = useState('Calculate total late penalty deductions across all delayed orders');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    text: string;
    code?: string;
    output?: string;
    outcome?: string;
    isSandboxVerified?: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInstructionsText(currentSettings.systemInstruction);
      setPrimaryModel(currentSettings.primaryModel);
      setStrictDataBoundary(currentSettings.strictDataBoundary);
      setSandboxEnabled(currentSettings.sandboxEnabled);
      setTemperature(currentSettings.temperature);
      setSavedToast(false);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(instructionsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetToDefault = () => {
    setInstructionsText(DEFAULT_SYSTEM_INSTRUCTIONS);
    setPrimaryModel('gemini-2.5-flash');
    setStrictDataBoundary(true);
    setSandboxEnabled(true);
    setTemperature(0.1);
  };

  const handleSave = () => {
    const updated: AgentSettings = {
      systemInstruction: instructionsText,
      primaryModel,
      strictDataBoundary,
      sandboxEnabled,
      temperature
    };
    onSaveSettings(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleRunTest = async (queryToRun?: string) => {
    const q = queryToRun || testQuery;
    setTestLoading(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          datasets,
          systemInstruction: instructionsText
        })
      });

      const data = await res.json();
      if (data.success) {
        const firstExec = data.codeExecutions?.[0];
        setTestResult({
          text: data.text || 'Calculation completed successfully.',
          code: firstExec?.code,
          output: firstExec?.output,
          outcome: firstExec?.outcome,
          isSandboxVerified: data.isSandboxVerified
        });
      } else {
        setTestResult({
          text: data.error || 'Failed to execute query in sandbox',
          outcome: 'ERROR'
        });
      }
    } catch (e: any) {
      setTestResult({
        text: e.message || 'Execution request failed',
        outcome: 'ERROR'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const testPresets = [
    {
      label: 'Formula Test: Late Penalty Deductions',
      query: 'Calculate total late penalty deductions using formula quotePrice * penaltyPct * lateDays for orders where lateDays > 0'
    },
    {
      label: 'Strict Boundary Test: Out-of-Scope Query',
      query: 'What is the stock price of Apple Inc. and tomorrow weather in London?'
    },
    {
      label: 'Formula Test: Net Operating Profit',
      query: 'Calculate Total Revenue, Total Operating Costs, and Net Operating Profit from financial_ledger.csv'
    },
    {
      label: 'ML Pipeline: Forecasting Temporal Split',
      query: 'Perform temporal splitting on orders_data.csv by creationDate and report training size (completed orders) vs prediction size (active orders)'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 lg:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#94b4a5]/40 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#94b4a5]/30 flex items-center justify-between bg-[#33443c] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#94b4a5] text-[#33443c] shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">AI Agent Settings & System Instructions</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gemini Managed Sandbox
                </span>
              </div>
              <p className="text-xs text-[#94b4a5]">
                Configure system instructions, operational formulas, ML guardrails, and Python code execution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedToast && (
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                Saved & Applied
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[#94b4a5]/20 bg-[#f4f7f5] flex items-center justify-between">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab('instructions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'instructions'
                  ? 'bg-[#33443c] text-white shadow-sm'
                  : 'text-[#5e8673] hover:bg-[#94b4a5]/20'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>System Instructions</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20">Updated</span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sandbox'
                  ? 'bg-[#33443c] text-white shadow-sm'
                  : 'text-[#5e8673] hover:bg-[#94b4a5]/20'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Sandbox & Guardrails</span>
            </button>

            <button
              onClick={() => setActiveTab('test')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'test'
                  ? 'bg-[#33443c] text-white shadow-sm'
                  : 'text-[#5e8673] hover:bg-[#94b4a5]/20'
              }`}
            >
              <Play className="w-4 h-4 text-emerald-500" />
              <span>Live Test Console</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#5e8673] font-medium font-mono">
            <span>Model: {primaryModel}</span>
            <span>•</span>
            <span>Strict Boundary: {strictDataBoundary ? 'ON' : 'OFF'}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: SYSTEM INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-6">
              
              {/* Instructions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#eef3f0] p-3 rounded-2xl border border-[#94b4a5]/30">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-[#33443c]" />
                  <span className="text-xs font-bold text-[#33443c]">
                    Active System Prompt ({instructionsText.length} chars, {instructionsText.split(/\s+/).length} words)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#94b4a5]/40 text-[#33443c] hover:bg-[#f4f7f5] transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5e8673]" />}
                    <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
                  </button>

                  <button
                    onClick={handleResetToDefault}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#94b4a5]/40 text-[#33443c] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Updated Default</span>
                  </button>

                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#33443c] text-white hover:bg-[#27352f] transition-all shadow-sm cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save & Apply</span>
                  </button>
                </div>
              </div>

              {/* Textarea Editor */}
              <div className="relative border border-[#94b4a5]/40 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#5e8673]/40">
                <div className="bg-[#242f29] px-4 py-2 text-[11px] font-mono text-[#94b4a5] flex items-center justify-between border-b border-white/10">
                  <span>system_instructions.md</span>
                  <span>Markdown & Guidelines Syntax</span>
                </div>
                <textarea
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  rows={14}
                  className="w-full p-4 font-mono text-xs leading-relaxed text-[#213028] bg-[#fbfdfc] resize-y focus:outline-none scrollbar-thin"
                  placeholder="Enter active system instructions..."
                  spellCheck={false}
                />
              </div>

              {/* Structural Sections Breakdown (Visual Guide) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#33443c] uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#5e8673]" />
                    Registered Guidelines & Operational Rules Overview
                  </h3>
                  <span className="text-[11px] text-[#5e8673]">Click to inspect schema and formulas</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SYSTEM_INSTRUCTIONS_BREAKDOWN.map((sec) => {
                    const isExpanded = expandedSection === sec.id;
                    return (
                      <div 
                        key={sec.id}
                        className="border border-[#94b4a5]/30 rounded-2xl p-3.5 bg-white hover:border-[#94b4a5] transition-all shadow-sm"
                      >
                        <div 
                          className="flex items-start justify-between cursor-pointer"
                          onClick={() => setExpandedSection(isExpanded ? null : sec.id)}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#94b4a5]/20 text-[#33443c] font-mono">
                                {sec.badge}
                              </span>
                              <h4 className="text-xs font-bold text-[#33443c]">{sec.title}</h4>
                            </div>
                            <p className="text-[11px] text-[#5e8673] line-clamp-1">{sec.summary}</p>
                          </div>
                          <div className="p-1 text-[#5e8673]">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-[#94b4a5]/20 space-y-1.5 animate-in fade-in duration-150">
                            {sec.rules.map((rule, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-[11px] text-[#33443c]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#5e8673] mt-1 shrink-0" />
                                <span>{rule}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SANDBOX & GUARDRAILS CONFIG */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6">
              
              {/* Architecture Overview Banner */}
              <div className="bg-gradient-to-r from-[#33443c] to-[#25362e] text-white p-5 rounded-2xl shadow-sm border border-[#94b4a5]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold">Gemini Managed Python Sandbox Engine</h3>
                  </div>
                  <p className="text-xs text-[#94b4a5] max-w-xl">
                    Every operational KPI, capacity bottleneck, late penalty, and predictive risk calculation is processed via code execution on Google GenAI sandbox running isolated Python with Pandas and NumPy.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/15 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sandbox: ACTIVE</span>
                </div>
              </div>

              {/* Guardrails Control Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Strict Boundary Enforcement */}
                <div className="border border-[#94b4a5]/40 rounded-2xl p-5 bg-white space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#5e8673]" />
                      <h4 className="text-xs font-bold text-[#33443c]">Strict Data Boundary</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={strictDataBoundary} 
                        onChange={(e) => setStrictDataBoundary(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#33443c]"></div>
                    </label>
                  </div>
                  <p className="text-xs text-[#5e8673] leading-relaxed">
                    When enabled, unprovided external queries strictly output:
                  </p>
                  <div className="p-3 bg-[#f4f7f5] rounded-xl border border-[#94b4a5]/30 text-xs font-mono text-[#33443c]">
                    &quot;I can only analyze data from your uploaded files. Please upload the relevant dataset to process this query.&quot;
                  </div>
                </div>

                {/* Mandatory Code Execution */}
                <div className="border border-[#94b4a5]/40 rounded-2xl p-5 bg-white space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-[#5e8673]" />
                      <h4 className="text-xs font-bold text-[#33443c]">Mandatory Code Execution</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={sandboxEnabled} 
                        onChange={(e) => setSandboxEnabled(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#33443c]"></div>
                    </label>
                  </div>
                  <p className="text-xs text-[#5e8673] leading-relaxed">
                    Forces Gemini to run Python code to calculate numbers instead of hallucinating or estimating metrics.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                    <Check className="w-4 h-4" />
                    <span>Grounding verification badge displayed on calculated responses</span>
                  </div>
                </div>

                {/* Model Selection */}
                <div className="border border-[#94b4a5]/40 rounded-2xl p-5 bg-white space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-[#5e8673]" />
                    <h4 className="text-xs font-bold text-[#33443c]">Primary Gemini Model</h4>
                  </div>
                  <p className="text-xs text-[#5e8673]">
                    Select primary model supporting Gemini Code Execution:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPrimaryModel('gemini-2.5-flash')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-start gap-1 transition-all cursor-pointer ${
                        primaryModel === 'gemini-2.5-flash'
                          ? 'bg-[#33443c] text-white border-[#33443c]'
                          : 'bg-[#f4f7f5] text-[#33443c] border-[#94b4a5]/40 hover:bg-[#94b4a5]/20'
                      }`}
                    >
                      <span className="font-bold">gemini-2.5-flash</span>
                      <span className="text-[10px] opacity-80">Fast & reliable sandbox (Recommended)</span>
                    </button>

                    <button
                      onClick={() => setPrimaryModel('gemini-3.8-flash')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-start gap-1 transition-all cursor-pointer ${
                        primaryModel === 'gemini-3.8-flash'
                          ? 'bg-[#33443c] text-white border-[#33443c]'
                          : 'bg-[#f4f7f5] text-[#33443c] border-[#94b4a5]/40 hover:bg-[#94b4a5]/20'
                      }`}
                    >
                      <span className="font-bold">gemini-3.8-flash</span>
                      <span className="text-[10px] opacity-80">Next-gen multimodal reasoning</span>
                    </button>
                  </div>
                </div>

                {/* Machine Learning Pipeline Guardrails */}
                <div className="border border-[#94b4a5]/40 rounded-2xl p-5 bg-white space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#5e8673]" />
                    <h4 className="text-xs font-bold text-[#33443c]">Predictive ML Guardrails (Forecasting)</h4>
                  </div>
                  <div className="text-xs text-[#5e8673] space-y-1.5">
                    <div className="flex items-center justify-between py-1 border-b border-[#94b4a5]/20">
                      <span>Model</span>
                      <span className="font-mono font-bold text-[#33443c]">RandomForestRegressor</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#94b4a5]/20">
                      <span>Imputation Strategy</span>
                      <span className="font-mono text-[#33443c]">Column Median (Forecasting only)</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#94b4a5]/20">
                      <span>Outlier Handling</span>
                      <span className="font-mono text-[#33443c]">Cap at 99th percentile</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span>Data Leakage Shield</span>
                      <span className="font-mono text-emerald-700">completionDate & penaltyPct excluded</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Save Bar */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#33443c] text-white hover:bg-[#27352f] transition-all shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Save Sandbox & Guardrail Settings</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: LIVE TEST CONSOLE */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              
              <div className="bg-[#eef3f0] p-4 rounded-2xl border border-[#94b4a5]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#33443c] flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-600" />
                    Live System Instructions & Python Sandbox Verification
                  </h3>
                  <span className="text-[11px] text-[#5e8673]">Tests real code execution with active prompt</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#5e8673]">Select Test Scenario Preset:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {testPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setTestQuery(preset.query);
                          handleRunTest(preset.query);
                        }}
                        className="text-left p-2.5 rounded-xl border border-[#94b4a5]/40 bg-white hover:bg-[#94b4a5]/20 transition-all text-xs font-semibold text-[#33443c] cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{preset.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#5e8673]" />
                        </div>
                        <p className="text-[10px] text-[#5e8673] line-clamp-1 mt-0.5">{preset.query}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Query Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Enter custom test prompt to evaluate active system instructions..."
                    className="flex-1 bg-white border border-[#94b4a5]/40 rounded-xl px-3.5 py-2 text-xs text-[#33443c] focus:outline-none focus:ring-2 focus:ring-[#5e8673]"
                  />
                  <button
                    onClick={() => handleRunTest()}
                    disabled={testLoading || !testQuery.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#33443c] text-white hover:bg-[#27352f] disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    {testLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Executing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-emerald-400" />
                        <span>Run Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Test Results Output */}
              {testResult && (
                <div className="border border-[#94b4a5]/40 rounded-2xl p-5 bg-white space-y-4 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-[#94b4a5]/20 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        testResult.outcome === 'ERROR' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                      <h4 className="text-xs font-bold text-[#33443c]">
                        Execution Result ({testResult.outcome || 'OUTCOME_OK'})
                      </h4>
                    </div>

                    {testResult.isSandboxVerified && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                        <Check className="w-3 h-3" />
                        Verified via Python Sandbox
                      </span>
                    )}
                  </div>

                  {/* Executed Code */}
                  {testResult.code && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#5e8673] uppercase tracking-wider font-mono">
                        Executed Python Code:
                      </span>
                      <pre className="bg-[#242f29] text-emerald-300 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-white/10">
                        {testResult.code}
                      </pre>
                    </div>
                  )}

                  {/* Terminal Output */}
                  {testResult.output && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#5e8673] uppercase tracking-wider font-mono">
                        Sandbox stdout Output:
                      </span>
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                        {testResult.output}
                      </pre>
                    </div>
                  )}

                  {/* Operational Business Response */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-[#33443c] uppercase tracking-wider">
                      Business Takeaway & Operational Insight:
                    </span>
                    <div className="bg-[#fbfdfc] p-4 rounded-xl border border-[#94b4a5]/30 text-xs text-[#213028] leading-relaxed whitespace-pre-wrap">
                      {testResult.text}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#94b4a5]/30 bg-[#f4f7f5] flex items-center justify-between text-xs text-[#5e8673]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Modern Furniture Co. Operations System Instructions v2.0</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-[#94b4a5]/40 text-[#33443c] hover:bg-[#94b4a5]/20 font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-[#33443c] text-white hover:bg-[#27352f] font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
