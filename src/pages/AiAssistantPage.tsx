import React, { useState, useEffect, useRef } from 'react';
import { processAiQuery, AiChatMessage } from '../services/aiAssistantService';
import { MarkdownRenderer } from '../components/copilot/MarkdownRenderer';
import { GenerativeWidgetRenderer } from '../components/generative/GenerativeWidgetRenderer';
import { useStudioContext } from '../context/StudioContext';
import { Send, Terminal, RefreshCw, Cpu } from 'lucide-react';

interface AiAssistantPageProps {
  initialPrompt?: string;
  onOpenBacktestWithAllocations: (allocations: any[]) => void;
}

export const AiAssistantPage: React.FC<AiAssistantPageProps> = ({
  initialPrompt,
  onOpenBacktestWithAllocations
}) => {
  const { activeAllocations, applyAllocationsToWorkspace, setActiveTab } = useStudioContext();

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `AI Quantitative Studio Terminal online. Specify asset tickers, historical allocation percentages, or macroeconomic strategies to simulate risk metrics and historical returns with live interactive telemetry widgets.`,
      timestamp: 'Session initialized'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Ray Dalio All-Weather vs S&P 500',
    'Classic 60/40 balanced strategy',
    'High-Conviction Tech Growth allocation',
    'Retirement 4% withdrawal safe rate',
    'Dividend Aristocrats with SCHD',
    'Compound $500 monthly savings for 15 years'
  ];

  const handleSend = (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const response = (processAiQuery as (p: string, a?: typeof activeAllocations) => ReturnType<typeof processAiQuery>)(
        text,
        activeAllocations
      );
      const assistantMsg: AiChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: response.text,
        parts: response.parts,
        backtestData: response.backtestData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
      setLoading(false);
    }, 400);
  };

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleApplyAllocations = (allocations: { symbol: string; weight: number }[]) => {
    applyAllocationsToWorkspace(allocations);
    onOpenBacktestWithAllocations(allocations);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col h-[calc(100vh-120px)] min-h-[640px]">
      
      {/* System Metrology Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised text-primary">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-graphite-lightText dark:text-graphite-text">
                AI Studio Terminal
              </h1>
              <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
                [SYS.04]
              </span>
            </div>
            <p className="text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary">
              Quantitative strategy reasoning and generative widget emission engine
            </p>
          </div>
        </div>

        {/* Honest Engine Metrology Label */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted tabular">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06]">
            <Cpu className="w-3 h-3 text-primary" />
            <span>STUDIO CLIENT INFERENCE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            <span>PORTFOLIO OS: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Messages Stream: Analyst Telemetry Log Cards */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Metadata Ribbon */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted mb-1 px-1">
              <span className="font-semibold uppercase text-graphite-lightText dark:text-graphite-text">
                {m.sender === 'user' ? 'ANALYST COMMAND' : 'INFERENCE TELEMETRY'}
              </span>
              <span>·</span>
              <span className="tabular">{m.timestamp}</span>
              {m.sender === 'assistant' && (
                <>
                  <span>·</span>
                  <span className="text-primary tabular">IN-BROWSER ENGINE</span>
                </>
              )}
            </div>

            {/* Card Content */}
            <div className={`w-full max-w-[96%] rounded-xl p-4 text-xs leading-relaxed border transition-colors ${
              m.sender === 'user'
                ? 'bg-graphite-lightRaised/80 dark:bg-graphite-card/80 border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text'
                : 'bg-white dark:bg-graphite-card border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text shadow-sm'
            }`}>
              
              {/* Structured Message Parts or Text */}
              {m.parts && m.parts.length > 0 ? (
                <div className="space-y-4">
                  {m.parts.map((part, pIdx) => {
                    if (part.type === 'text') {
                      return <MarkdownRenderer key={pIdx} content={part.content} />;
                    } else if (part.type === 'widget') {
                      return (
                        <div key={pIdx} className="pt-1">
                          <GenerativeWidgetRenderer
                            widgetType={part.widgetType}
                            payload={part.payload}
                            onApplyToWorkspace={applyAllocationsToWorkspace}
                            onNavigateTab={(tab) => setActiveTab(tab)}
                          />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <MarkdownRenderer content={m.content} />
              )}

              {/* Legacy summary card if parts omitted */}
              {(!m.parts || m.parts.length === 0) && m.backtestData && (
                <div className="mt-3 p-3 rounded-lg bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.06] dark:border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-medium">
                    <span>Simulated Outcome</span>
                    <span className="text-primary tabular">${m.backtestData.finalValue.toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono tabular">
                    <div className="p-1.5 rounded bg-white dark:bg-graphite-card">
                      <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">CAGR</div>
                      <div className="font-medium mt-0.5">{m.backtestData.cagr}%</div>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-graphite-card">
                      <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Sharpe</div>
                      <div className="font-medium mt-0.5">{m.backtestData.sharpeRatio}</div>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-graphite-card">
                      <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Drawdown</div>
                      <div className="font-medium text-semantic-negativeLight dark:text-semantic-negative mt-0.5">{m.backtestData.maxDrawdown}%</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyAllocations(m.backtestData!.allocations)}
                    className="w-full min-h-[44px] py-1.5 px-2.5 rounded bg-black/[0.05] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-graphite-lightText dark:text-graphite-text font-medium text-[11px] transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Open in Backtester</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] text-xs text-graphite-lightMuted dark:text-graphite-muted">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Evaluating quantitative sequences and compiling interactive widgets...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 shrink-0">
        {samplePrompts.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(s)}
            className="min-h-[44px] inline-flex items-center text-[11px] whitespace-nowrap px-3 py-2 rounded-md bg-white dark:bg-graphite-card text-graphite-lightSecondary dark:text-graphite-secondary border border-black/[0.06] dark:border-white/[0.06] hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Console */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
        className="pt-1 shrink-0"
      >
        <label htmlFor="ai-chat-prompt" className="sr-only">
          Ask a strategy question or describe a portfolio allocation
        </label>
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <input
            id="ai-chat-prompt"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Specify strategy, allocation (e.g. 60% VTI, 40% BND), or risk question..."
            className="flex-1 px-3 py-2 bg-transparent text-xs text-graphite-lightText dark:text-graphite-text placeholder-graphite-lightMuted dark:placeholder-graphite-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Submit strategy query"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-30 text-white transition-colors"
          >
            <Send aria-hidden="true" className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

    </div>
  );
};
