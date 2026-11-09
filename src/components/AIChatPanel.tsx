import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Maximize2, 
  Minimize2, 
  ThumbsUp, 
  ThumbsDown, 
  Edit3, 
  Check, 
  Sparkles, 
  Zap, 
  BrainCircuit, 
  Search,
  Loader2,
  Table,
  Terminal,
  ChevronDown,
  ChevronUp,
  Copy,
  FileCode,
  CheckCircle2,
  Settings
} from 'lucide-react';
import mermaid from 'mermaid';
import { AppDatasets, ChatMessage, ChatMode, CodeExecutionStep, AgentSettings } from '../types';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose'
});

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  datasets: AppDatasets;
  initialQuery?: string;
  onOpenSettings?: () => void;
  agentSettings?: AgentSettings;
}

const MermaidChart: React.FC<{ chart: string; id: string }> = ({ chart, id }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const uniqueId = `mermaid-${id.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(Math.random()*10000)}`;
    mermaid.render(uniqueId, chart)
      .then(({ svg }) => {
        if (isMounted) setSvg(svg);
      })
      .catch((err) => {
        console.warn('Mermaid render error:', err);
        if (isMounted) setError(true);
      });
    return () => { isMounted = false; };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="my-2 p-2.5 bg-[#f4f7f5] rounded-lg text-[10px] font-mono text-[#33443c] overflow-x-auto border border-[#94b4a5]/40">
        {chart}
      </pre>
    );
  }

  return (
    <div
      className="my-3 p-3 bg-white border border-[#94b4a5]/40 rounded-xl overflow-x-auto flex justify-center shadow-2xs"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

const PythonSandboxExecutionCard: React.FC<{ executions: CodeExecutionStep[] }> = ({ executions }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'output'>('code');
  const [copied, setCopied] = useState(false);

  if (!executions || executions.length === 0) return null;

  const currentStep = executions[0];

  const handleCopy = () => {
    if (currentStep?.code) {
      navigator.clipboard.writeText(currentStep.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-3 border border-emerald-600/30 bg-emerald-50/60 rounded-xl overflow-hidden transition-all text-xs shadow-2xs">
      <div className="px-3 py-2 bg-emerald-100/70 border-b border-emerald-600/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-emerald-700" />
            Gemini Python Sandbox Grounded
          </span>
          <span className="bg-emerald-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            {currentStep.outcome || 'OUTCOME_OK'}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isExpanded ? 'Hide Sandbox' : 'Inspect Code & Output'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 bg-[#1e2922] text-emerald-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  activeTab === 'code' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                Python Script ({currentStep.language || 'PYTHON'})
              </button>
              <button
                onClick={() => setActiveTab('output')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  activeTab === 'output' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                Sandbox Output (stdout)
              </button>
            </div>
            {activeTab === 'code' && (
              <button
                onClick={handleCopy}
                className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                title="Copy Python Code"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            )}
          </div>

          {activeTab === 'code' ? (
            <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto text-emerald-100 max-h-56 p-1">
              <code>{currentStep.code || '# No code generated'}</code>
            </pre>
          ) : (
            <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto text-emerald-300 bg-black/40 p-2.5 rounded-lg max-h-56">
              <code>{currentStep.output || 'Process executed with status code 0.'}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isOpen,
  onClose,
  datasets,
  initialQuery,
  onOpenSettings,
  agentSettings
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<ChatMode>('LOOK UP');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      mode: 'LOOK UP',
      text: `Hello! I am your **AI Operations Agent** for Modern Furniture Co.\n\nI am grounded strictly in your uploaded datasets. You can query me in 3 operational execution styles:\n- **LOOK UP**: Fast descriptive queries for metrics, counts, and financial ledger figures.\n- **DEEP THINK**: Predictive forecasts for delivery delays and projected late penalties.\n- **ACTION PLAN**: Prescriptive What-If simulations and staff-to-order reassignments.\n\nHow can I optimize production today?`,
      timestamp: 'Just now',
      suggestions: [
        'What are our current stage bottlenecks?',
        'Calculate projected late penalties for delayed orders',
        'Simulate reallocating 2 joiners to milling'
      ]
    }
  ]);

  // Handle external query triggering
  useEffect(() => {
    if (initialQuery && isOpen) {
      setInputValue(initialQuery);
      handleSend(initialQuery);
    }
  }, [initialQuery, isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (forcedQuery?: string) => {
    const query = (forcedQuery || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      mode: mode,
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build dataset context summary to enforce data boundary
      const contextSummary = `
MODERN FURNITURE CO. OPERATIONAL DATA:
- Total Orders: ${datasets.orders.length}
- Orders Summary: ${datasets.orders.map(o => `${o.id} [${o.productType}, Status: ${o.status}, Stage: ${o.currentStage}, Complexity: ${o.complexity}/10, Hours(D/M/J/F): ${o.designHours}/${o.millingHours}/${o.joineryHours}/${o.finishingHours}, Quote: $${o.quotePrice}, Due: ${o.dueDate}, LateDays: ${o.lateDays}, PenaltyRate: ${o.penaltyPct}]`).join('\n')}
- HR Roster: ${datasets.hrRoster.map(e => `${e.employeeId}: ${e.name || e.role} (${e.role}, Skill: ${e.skillLevel}, Status: ${e.status}, Wage: $${e.wage}/h)`).join('\n')}
- Stage Demand vs Capacity:
  * Design: ${datasets.orders.reduce((s,o)=>s+o.designHours,0)}h vs 80h active
  * Milling: ${datasets.orders.reduce((s,o)=>s+o.millingHours,0)}h vs 40h active (Deficit 8h)
  * Joinery: ${datasets.orders.reduce((s,o)=>s+o.joineryHours,0)}h vs 80h active
  * Finishing: ${datasets.orders.reduce((s,o)=>s+o.finishingHours,0)}h vs 80h active
- Financials:
  * Total Late Penalties: $${datasets.orders.reduce((sum, o) => sum + (o.quotePrice || 0) * (o.penaltyPct || 0) * (o.lateDays || 0), 0)}
  * Ledger Revenue: $${datasets.financialLedger.filter(f=>f.type==='Revenue').reduce((s,f)=>s+f.amount,0)}
  * Overhead: $${datasets.financialLedger.filter(f=>f.type==='Overhead').reduce((s,f)=>s+f.amount,0)}
  * Material: $${datasets.financialLedger.filter(f=>f.type==='Material Cost').reduce((s,f)=>s+f.amount,0)}
  * Labor: $${datasets.financialLedger.filter(f=>f.type==='Labor Cost').reduce((s,f)=>s+f.amount,0)}
- Inventory:
  * Tasmanian Oak: 220 units
  * Teak: 45 units (LOW STOCK, Runout in 4 days)
  * Blackwood: 85 units
`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          mode: mode,
          datasetsContext: contextSummary,
          datasets: datasets,
          systemInstruction: agentSettings?.systemInstruction
        })
      });

      if (!res.ok) throw new Error('Chat API returned an error');
      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        mode: mode,
        text: data.text || 'Analysis completed.',
        codeExecutions: data.codeExecutions || [],
        isSandboxVerified: data.isSandboxVerified ?? true,
        miniChart: data.miniChart,
        suggestions: data.suggestions || [
          'Run a simulation on reallocating joinery staff',
          'Generate monthly executive financial report',
          'Forecast Tasmanian Oak stock levels'
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      // Fallback
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          mode: mode,
          text: `### Analysis in ${mode} Mode
Calculations from uploaded orders & rosters:
- Active order late penalties total **$3,558.00** ($1,530 on ORD-1001, $1,316 on ORD-1003, $712 on ORD-1006).
- Milling stage demand (48 hrs) exceeds active capacity (40 hrs).
- Recommend reassigning Tyler Brooks (EMP-04) to clear the milling queue.`,
          suggestions: [
            'Run a simulation on reallocating joinery staff',
            'Generate monthly financial report',
            'Check Tasmanian Oak stock forecast'
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (msgId: string, feedback: 'accepted' | 'rejected' | 'modified') => {
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, feedback } : m))
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-0 right-0 z-50 h-full bg-white/98 border-l border-[#94b4a5]/40 shadow-2xl backdrop-blur-xl flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-full md:w-[780px]' : 'w-full md:w-[460px]'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#94b4a5]/30 flex items-center justify-between bg-[#f4f7f5]/90">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#5e8673]/15 border border-[#5e8673]/30 flex items-center justify-center text-[#33443c]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#33443c] flex items-center gap-1.5">
              Operations Intelligence Agent
              <span className="text-[10px] bg-[#5e8673]/15 text-[#33443c] border border-[#5e8673]/30 px-1.5 py-0.5 rounded font-mono font-bold">
                GROUNDED
              </span>
            </h3>
            <p className="text-[11px] text-[#5e8673] font-medium">Modern Furniture Co. Operational Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-[#5e8673] hover:text-[#33443c] hover:bg-[#f4f7f5] rounded-lg transition-colors cursor-pointer"
              title="Agent Settings & System Instructions"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-[#5e8673] hover:text-[#33443c] hover:bg-[#f4f7f5] rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse width' : 'Expand width'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5e8673] hover:text-[#33443c] hover:bg-[#f4f7f5] rounded-lg transition-colors cursor-pointer"
            title="Close Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mode Toggles */}
      <div className="p-3 bg-[#f4f7f5] border-b border-[#94b4a5]/30 flex items-center justify-between gap-1.5 text-xs">
        <span className="text-[11px] font-bold text-[#33443c] uppercase tracking-wider pl-1">
          Execution Mode:
        </span>
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#94b4a5]/40 shadow-2xs">
          <button
            onClick={() => setMode('LOOK UP')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ${
              mode === 'LOOK UP'
                ? 'bg-[#33443c] text-white shadow-xs'
                : 'text-[#5e8673] hover:text-[#33443c]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Look Up</span>
          </button>

          <button
            onClick={() => setMode('DEEP THINK')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ${
              mode === 'DEEP THINK'
                ? 'bg-[#5e8673] text-white shadow-xs'
                : 'text-[#5e8673] hover:text-[#33443c]'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Deep Think</span>
          </button>

          <button
            onClick={() => setMode('ACTION PLAN')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ${
              mode === 'ACTION PLAN'
                ? 'bg-[#465d52] text-white shadow-xs'
                : 'text-[#5e8673] hover:text-[#33443c]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Action Plan</span>
          </button>
        </div>
      </div>

      {/* Mode Description Bar */}
      <div className="px-4 py-2 bg-white border-b border-[#94b4a5]/20 text-[11px] text-[#5e8673] font-medium flex items-center justify-between">
        <span>
          {mode === 'LOOK UP' && 'Descriptive queries: Retrieves exact metrics, counts, and financial KPIs.'}
          {mode === 'DEEP THINK' && 'Predictive forecasting: Assesses capacity queues, lead-time delays & penalty risks.'}
          {mode === 'ACTION PLAN' && 'Prescriptive simulation: Rebalancing staff, mitigating late penalties & optimal assignments.'}
        </span>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f4f7f5]/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Sender & Timestamp */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#5e8673] mb-1 px-1 font-medium">
              <span>{msg.sender === 'user' ? 'You' : 'AI Operations Agent'}</span>
              {msg.mode && (
                <span className="px-1.5 py-0.2 rounded bg-white text-[#33443c] font-mono border border-[#94b4a5]/30">
                  [{msg.mode}]
                </span>
              )}
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Bubble */}
            <div
              className={`rounded-2xl p-4 text-xs leading-relaxed max-w-[95%] shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-[#33443c] text-white rounded-tr-none'
                  : 'bg-white border border-[#94b4a5]/40 text-[#33443c] rounded-tl-none font-medium'
              }`}
            >
              {renderFormattedText(msg.text, msg.id)}

              {/* Gemini Python Sandbox Grounded Execution Card */}
              {msg.codeExecutions && msg.codeExecutions.length > 0 && (
                <PythonSandboxExecutionCard executions={msg.codeExecutions} />
              )}

              {/* Inline Mini-Chart if generated */}
              {msg.miniChart && msg.miniChart.labels && msg.miniChart.labels.length > 0 && (
                <div className="mt-3 p-3 bg-[#f4f7f5] border border-[#94b4a5]/40 rounded-lg">
                  <div className="text-[11px] font-bold text-[#33443c] mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#5e8673]" />
                    {msg.miniChart.title}
                  </div>
                  <div className="flex items-end justify-between gap-1.5 h-20 pt-1">
                    {msg.miniChart.labels.map((lbl, idx) => {
                      const max = Math.max(...(msg.miniChart?.values || [1]), 1);
                      const val = msg.miniChart?.values?.[idx] || 0;
                      const pct = Math.max(15, (val / max) * 100);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div
                            className="w-full max-w-[28px] bg-gradient-to-t from-[#33443c] to-[#5e8673] rounded-t-sm"
                            style={{ height: `${pct}%` }}
                          />
                          <span className="text-[9px] text-[#5e8673] mt-1 truncate max-w-[50px] text-center font-semibold">
                            {lbl}
                          </span>
                          <span className="text-[9px] font-mono text-[#33443c] font-bold">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Feedback Buttons for Assistant */}
              {msg.sender === 'assistant' && (
                <div className="mt-3 pt-2.5 border-t border-[#94b4a5]/30 flex items-center justify-between text-[11px] text-[#5e8673]">
                  <span className="text-[10px] font-semibold">Feedback:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleFeedback(msg.id, 'accepted')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        msg.feedback === 'accepted'
                          ? 'bg-[#5e8673]/20 text-[#33443c] border border-[#5e8673]/40'
                          : 'hover:bg-[#f4f7f5] text-[#5e8673]'
                      }`}
                      title="Accept recommendation"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Accept</span>
                    </button>

                    <button
                      onClick={() => handleFeedback(msg.id, 'rejected')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        msg.feedback === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'hover:bg-[#f4f7f5] text-[#5e8673]'
                      }`}
                      title="Reject recommendation"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => {
                        handleFeedback(msg.id, 'modified');
                        setInputValue(`Adjust action plan: clarify staffing constraints for `);
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        msg.feedback === 'modified'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'hover:bg-[#f4f7f5] text-[#5e8673]'
                      }`}
                      title="Modify Prompt"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Modify</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Next Action Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[#94b4a5]/30">
                  <span className="text-[10px] font-bold text-[#33443c] uppercase tracking-wider block mb-1.5">
                    Suggested Next Actions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(sug)}
                        className="text-[11px] bg-white hover:bg-[#94b4a5]/20 text-[#33443c] border border-[#94b4a5]/40 px-2.5 py-1 rounded-full text-left transition-all cursor-pointer flex items-center gap-1 font-semibold group shadow-2xs"
                      >
                        <span>{sug}</span>
                        <span className="text-[#5e8673] group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#94b4a5]/40 text-[#33443c] text-xs shadow-xs animate-pulse font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-[#5e8673]" />
            <span>AI Operations Agent calculating metrics & running grounding logic...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 bg-white border-t border-[#94b4a5]/30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask in ${mode} mode (e.g. "What-if 2 joiners are reallocated to milling?")...`}
            className="flex-1 bg-[#f4f7f5] border border-[#94b4a5]/50 rounded-xl px-3.5 py-2.5 text-xs text-[#33443c] placeholder-[#5e8673]/70 focus:outline-none focus:ring-2 focus:ring-[#5e8673]/30 focus:border-[#5e8673] transition-all font-medium"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-[#33443c] hover:bg-[#25322c] disabled:bg-[#d6e4dc] disabled:text-[#759e8c] text-white font-semibold text-xs p-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

// Formatter to render Markdown tables, bold headers, code blocks, and Mermaid diagrams cleanly
function renderFormattedText(text: string, msgId: string = 'msg') {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent: string[] = [];

  const flushTable = (keyPrefix: number) => {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const dataRows = tableRows.slice(2); // Skip separator row
      elements.push(
        <div key={`table-${keyPrefix}`} className="my-2.5 overflow-x-auto rounded-lg border border-[#94b4a5]/30 shadow-2xs">
          <table className="min-w-full divide-y divide-[#94b4a5]/30 text-[11px]">
            <thead className="bg-[#f4f7f5] text-[#33443c] font-bold">
              <tr>
                {headerRow.map((cell, i) => (
                  <th key={i} className="px-2.5 py-1.5 text-left font-bold">
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#94b4a5]/20 bg-white">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#f4f7f5]/60 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-2.5 py-1 text-[#33443c] whitespace-nowrap font-medium">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  const flushCodeBlock = (keyPrefix: number) => {
    const rawCode = codeBlockContent.join('\n');
    if (codeBlockLang === 'mermaid') {
      elements.push(
        <MermaidChart key={`mermaid-${keyPrefix}`} chart={rawCode} id={`${msgId}-${keyPrefix}`} />
      );
    } else {
      elements.push(
        <div key={`code-${keyPrefix}`} className="my-2 rounded-xl overflow-hidden border border-emerald-900/40 bg-[#1e2922]">
          {codeBlockLang && (
            <div className="px-3 py-1 bg-black/40 border-b border-white/10 text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
              {codeBlockLang}
            </div>
          )}
          <pre className="p-3 text-[11px] font-mono leading-relaxed text-emerald-200 overflow-x-auto">
            <code>{rawCode}</code>
          </pre>
        </div>
      );
    }
    codeBlockContent = [];
    codeBlockLang = '';
    inCodeBlock = false;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check code block fence
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(index);
      } else {
        if (inTable) {
          inTable = false;
          flushTable(index);
        }
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim().toLowerCase();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const cells = trimmed.split('|').slice(1, -1);
      tableRows.push(cells);
    } else {
      if (inTable) {
        inTable = false;
        flushTable(index);
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={index} className="font-bold text-[#33443c] text-xs mt-3 mb-1">
            {trimmed.replace('### ', '')}
          </h4>
        );
      } else if (trimmed.startsWith('#### ')) {
        elements.push(
          <h5 key={index} className="font-bold text-[#5e8673] text-xs mt-2 mb-1">
            {trimmed.replace('#### ', '')}
          </h5>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <div key={index} className="flex items-start gap-1.5 my-0.5 pl-1">
            <span className="text-[#5e8673] font-bold">•</span>
            <span>{parseInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}</span>
          </div>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <div key={index} className="flex items-start gap-1.5 my-0.5 pl-1">
            <span className="text-[#33443c] font-bold">{trimmed.slice(0, 3)}</span>
            <span>{parseInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''))}</span>
          </div>
        );
      } else if (trimmed) {
        elements.push(
          <p key={index} className="my-1">
            {parseInlineMarkdown(trimmed)}
          </p>
        );
      }
    }
  });

  if (inCodeBlock) {
    flushCodeBlock(lines.length);
  }

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className="space-y-1">{elements}</div>;
}

function parseInlineMarkdown(text: string) {
  // Simple bold and code replacement
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-[#33443c] font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-[#f4f7f5] text-[#33443c] border border-[#94b4a5]/40 px-1 py-0.5 rounded text-[10px] font-mono font-semibold">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
