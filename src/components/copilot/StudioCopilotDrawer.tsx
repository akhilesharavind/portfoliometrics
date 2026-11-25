import React, { useState, useEffect, useRef } from 'react';
import { useStudioContext } from '../../context/StudioContext';
import { processAiQuery, AiChatMessage } from '../../services/aiAssistantService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { GenerativeWidgetRenderer } from '../generative/GenerativeWidgetRenderer';
import { X, Send, RefreshCw } from 'lucide-react';

export const StudioCopilotDrawer: React.FC = () => {
  const {
    copilotOpen,
    setCopilotOpen,
    activeAllocations,
    applyAllocationsToWorkspace,
    activeTab,
    setActiveTab
  } = useStudioContext();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `Portfolio Studio Copilot online. Ask analytical questions, compare historical strategies, or evaluate risk metrics for your active workspace.`,
      timestamp: 'Session start'
    }
  ]);

  // Body scroll lock, initial focus, Escape key, and Tab focus trap
  useEffect(() => {
    if (!copilotOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCopilotOpen(false);
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [copilotOpen, setCopilotOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (copilotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, copilotOpen]);

  // Context-specific quick prompts
  const getContextPrompts = (): string[] => {
    switch (activeTab) {
      case 'backtesting':
        return [
          'Optimize Sharpe ratio for active portfolio',
          'Ray Dalio All-Weather vs S&P 500',
          'Simulate 2022 market drawdown'
        ];
      case 'optimization':
        return [
          'Compare Max Sharpe vs Min Volatility',
          'Add Gold (GLD) and Real Estate (VNQ) to frontier',
          'Risk Parity asset weighting explanation'
        ];
      case 'monte-carlo':
        return [
          'Simulate $40k annual withdrawal on $1M portfolio',
          'Sequence of returns risk under inflation',
          'Safe withdrawal rate stress test'
        ];
      case 'cagr-calculator':
      case 'compound-interest':
        return [
          'Project $500 monthly deposit over 20 years',
          'CAGR required to double capital in 7 years',
          'Daily vs Monthly compounding yield difference'
        ];
      default:
        return [
          'Ray Dalio All-Weather vs S&P 500',
          'Classic 60/40 balanced strategy',
          'High-Conviction Tech Growth allocation'
        ];
    }
  };

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
    }, 350);
  };

  if (!copilotOpen) return null;

  return (
    <div
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Studio Copilot Drawer"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-graphite-bg border-l border-black/[0.08] dark:border-white/[0.08] shadow-xl flex flex-col transition-transform duration-200"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.08] dark:border-white/[0.08] shrink-0 bg-graphite-lightRaised/30 dark:bg-graphite-card/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-graphite-lightText dark:text-graphite-text">
              STUDIO COPILOT
            </span>
            <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
              [{activeTab.toUpperCase()}]
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted tabular">
            INFERENCE: CLIENT
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setCopilotOpen(false)}
            aria-label="Close copilot drawer"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-graphite-lightMuted dark:text-graphite-muted hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workspace Context Bar */}
      <div className="px-4 py-1 border-b border-black/[0.04] dark:border-white/[0.04] bg-graphite-lightRaised/60 dark:bg-graphite-raised/40 text-[11px] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-graphite-lightMuted dark:text-graphite-muted font-mono">WORKSPACE:</span>
          <div className="flex items-center gap-1 truncate font-mono text-graphite-lightText dark:text-graphite-text tabular">
            {activeAllocations.map(a => `${a.symbol} ${a.weight}%`).join(' · ')}
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleSend(`Analyze current workspace allocation: ${activeAllocations.map(a => `${a.weight}% ${a.symbol}`).join(', ')}`)}
          className="min-h-[44px] px-2 inline-flex items-center text-[10px] font-mono text-primary hover:underline whitespace-nowrap ml-2"
        >
          Inspect
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted mb-1 px-1">
              {m.sender === 'user' ? 'ANALYST' : 'COPILOT INFERENCE'} · {m.timestamp}
            </div>

            <div className={`w-full rounded-lg p-3 text-xs leading-relaxed ${
              m.sender === 'user'
                ? 'bg-graphite-lightRaised dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text'
                : 'bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text'
            }`}>
              
              {/* If structured parts exist, render them */}
              {m.parts && m.parts.length > 0 ? (
                <div className="space-y-3">
                  {m.parts.map((part, pIdx) => {
                    if (part.type === 'text') {
                      return <MarkdownRenderer key={pIdx} content={part.content} />;
                    } else if (part.type === 'widget') {
                      return (
                        <GenerativeWidgetRenderer
                          key={pIdx}
                          widgetType={part.widgetType}
                          payload={part.payload}
                          onApplyToWorkspace={applyAllocationsToWorkspace}
                          onNavigateTab={(tab) => {
                            setActiveTab(tab);
                            setCopilotOpen(false);
                          }}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <MarkdownRenderer content={m.content} />
              )}

              {/* Legacy backtest data fallback if parts omitted */}
              {(!m.parts || m.parts.length === 0) && m.backtestData && (
                <div className="mt-3 p-2.5 rounded bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.06] dark:border-white/[0.06] space-y-2">
                  <div className="flex justify-between font-mono text-xs font-semibold">
                    <span>Backtest Result</span>
                    <span className="text-primary tabular">${m.backtestData.finalValue.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px] tabular">
                    <div className="p-1 rounded bg-white dark:bg-graphite-card">
                      <span className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted block">CAGR</span>
                      <span className="font-semibold">{m.backtestData.cagr}%</span>
                    </div>
                    <div className="p-1 rounded bg-white dark:bg-graphite-card">
                      <span className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted block">Sharpe</span>
                      <span className="font-semibold">{m.backtestData.sharpeRatio}</span>
                    </div>
                    <div className="p-1 rounded bg-white dark:bg-graphite-card">
                      <span className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted block">Drawdown</span>
                      <span className="font-semibold text-semantic-negativeLight dark:text-semantic-negative">{m.backtestData.maxDrawdown}%</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      applyAllocationsToWorkspace(m.backtestData!.allocations);
                      setActiveTab('backtesting');
                      setCopilotOpen(false);
                    }}
                    className="w-full py-1 text-center rounded bg-primary text-white text-[11px] font-medium transition-colors"
                  >
                    Apply to Workspace
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-graphite-lightRaised dark:bg-graphite-card text-xs text-graphite-lightMuted dark:text-graphite-muted">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Evaluating quantitative portfolio sequences...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-black/[0.06] dark:border-white/[0.06] bg-graphite-lightRaised/40 dark:bg-graphite-raised/30 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {getContextPrompts().map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="min-h-[44px] inline-flex items-center text-[11px] px-3 py-2 rounded-md bg-white dark:bg-graphite-card border border-black/[0.06] dark:border-white/[0.06] text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text whitespace-nowrap transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 border-t border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-graphite-card shrink-0"
      >
        <div className="flex items-center gap-2 p-1 rounded-lg bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08]">
          <label htmlFor="copilot-drawer-input" className="sr-only">
            Ask Copilot strategy or portfolio question
          </label>
          <input
            id="copilot-drawer-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask strategy question or describe allocation..."
            className="flex-1 px-3 py-1.5 bg-transparent text-xs text-graphite-lightText dark:text-graphite-text placeholder-graphite-lightMuted dark:placeholder-graphite-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Submit copilot query"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md bg-primary hover:bg-primary-hover disabled:opacity-30 text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
