'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  User,
  Send,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Mail,
  MessageSquare,
  Clock,
  Terminal,
  Key,
  ExternalLink,
} from 'lucide-react';
import { api, Negotiation, Message, Offer } from '@/lib/api';

export default function NegotiationRoomPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [agentRuns, setAgentRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [runningAI, setRunningAI] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Gemini API Key state (saved in localStorage for easy access)
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Message Input State
  const [inputText, setInputText] = useState('');
  const [channel, setChannel] = useState<'CHAT' | 'EMAIL'>('CHAT');
  const [offerInput, setOfferInput] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) setGeminiApiKey(saved);
  }, []);

  const saveGeminiKey = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyModal(false);
  };

  const loadNegotiationData = async () => {
    try {
      const [neg, runs] = await Promise.all([
        api.getNegotiationById(id),
        api.getAgentRuns(id),
      ]);
      setNegotiation(neg);
      setAgentRuns(runs);
    } catch (err: any) {
      console.error('Failed to load negotiation room:', err);
      setErrorMsg(err.message || 'Failed to load negotiation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNegotiationData();
    const interval = setInterval(loadNegotiationData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [negotiation?.messages, runningAI]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText !== undefined ? customText : inputText;
    if (!textToSend && !offerInput) return;

    try {
      setSending(true);
      setErrorMsg(null);

      // If user provided a numeric counteroffer
      if (offerInput && parseFloat(offerInput) > 0) {
        await api.submitOffer(id, {
          amount: parseFloat(offerInput),
          source: 'CLIENT',
          message: textToSend || `Client proposes counteroffer of $${offerInput}`,
        });
        setOfferInput('');
        setShowOfferInput(false);
      } else {
        await api.sendMessage(id, {
          content: textToSend,
          channel,
          senderType: 'CLIENT',
        });
      }

      setInputText('');
      await loadNegotiationData();

      // AUTOMATICALLY TRIGGER AI AGENT TO ANSWER CLIENT'S QUESTION/INSTRUCTION!
      setRunningAI(true);
      try {
        await api.runAIAgent(id, { geminiKey: geminiApiKey || undefined });
        await loadNegotiationData();
      } catch (aiErr: any) {
        console.error('AI response error:', aiErr);
      } finally {
        setRunningAI(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTriggerAI = async () => {
    try {
      setRunningAI(true);
      setErrorMsg(null);
      await api.runAIAgent(id, { geminiKey: geminiApiKey || undefined });
      await loadNegotiationData();
    } catch (err: any) {
      setErrorMsg(err.message || 'AI agent execution failed');
    } finally {
      setRunningAI(false);
    }
  };

  const handleSimulateFreelancer = async () => {
    try {
      setSimulating(true);
      setErrorMsg(null);
      await api.simulateFreelancer(id);
      await loadNegotiationData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      setErrorMsg(null);
      await api.acceptOffer(id, offerId);
      await loadNegotiationData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept offer');
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      setErrorMsg(null);
      await api.rejectOffer(id, offerId, 'Offer outside budget target range');
      await loadNegotiationData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject offer');
    }
  };

  if (loading || !negotiation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Entering Autonomous Negotiation Chamber...</p>
      </div>
    );
  }

  const budgetCeiling = parseFloat(negotiation.project.budget.toString()) || 500;
  const lastOffer = negotiation.offers[negotiation.offers.length - 1];
  const lastOfferAmount = lastOffer ? parseFloat(lastOffer.amount.toString()) : null;
  const budgetVariance = lastOfferAmount !== null ? lastOfferAmount - budgetCeiling : 0;
  const isOverBudget = budgetVariance > 0;
  const contract = negotiation.contracts?.[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                {negotiation.project.title}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-[10px] font-bold text-sky-400 uppercase">
                {negotiation.status}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Client: <strong className="text-slate-200">Alex Morgan</strong> • Freelancer:{' '}
              <strong className="text-slate-200">{negotiation.freelancer.name}</strong>
            </div>
          </div>
        </div>

        {/* Live Simulation Controls & Gemini API Key Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Gemini Key Config Pill */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
              geminiApiKey
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 shadow-sm shadow-emerald-500/10'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>{geminiApiKey ? 'Gemini 1.5 Flash Connected (1,500 Free RPD)' : '⚡ Connect Gemini 1.5 Flash (1,500 Free Requests/Day)'}</span>
          </button>

          <button
            onClick={handleTriggerAI}
            disabled={runningAI}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>{runningAI ? 'AI Thinking...' : 'Trigger AI Agent'}</span>
          </button>

          <button
            onClick={handleSimulateFreelancer}
            disabled={simulating}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>{simulating ? 'Simulating...' : 'Simulate Freelancer Step'}</span>
          </button>

          <button
            onClick={loadNegotiationData}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            title="Refresh Room"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Conversation & Negotiation Stream (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-[700px] glass-panel rounded-3xl overflow-hidden border border-slate-800">
          {/* Stream Header */}
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Multi-Channel Conversation Stream</span>
            </div>

            {/* Channel Toggle */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setChannel('CHAT')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  channel === 'CHAT' ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Chat Mode
              </button>
              <button
                onClick={() => setChannel('EMAIL')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center space-x-1 ${
                  channel === 'EMAIL' ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3 h-3" />
                <span>Email Mode (Resend)</span>
              </button>
            </div>
          </div>

          {/* Messages Scrollable Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {negotiation.messages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No messages yet. Send an opening proposal or click "Trigger AI Agent".
              </div>
            ) : (
              negotiation.messages.map((msg: Message) => {
                const isAI = msg.senderType === 'AI_AGENT';
                const isFreelancer = msg.senderType === 'FREELANCER';
                const isClient = msg.senderType === 'CLIENT';
                const isSystem = msg.senderType === 'SYSTEM';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-3">
                      <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 max-w-md text-center">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isClient ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1 px-1">
                      {isAI && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-extrabold border border-sky-500/30 flex items-center space-x-1">
                          <Bot className="w-3 h-3" />
                          <span>AI AGENT (Autonomous Negotiator)</span>
                        </span>
                      )}
                      {isFreelancer && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{negotiation.freelancer.name}</span>
                          {msg.content.includes('[SIMULATED') && (
                            <span className="text-[9px] text-amber-400 opacity-90">(Simulated)</span>
                          )}
                        </span>
                      )}
                      {isClient && (
                        <span className="text-[10px] font-semibold text-slate-400">
                          Alex Morgan (Client)
                        </span>
                      )}
                      {msg.channel === 'EMAIL' && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] flex items-center space-x-0.5">
                          <Mail className="w-2.5 h-2.5" />
                          <span>EMAIL</span>
                        </span>
                      )}
                      <span className="text-[9px] text-slate-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                        isAI
                          ? 'bg-gradient-to-tr from-sky-950/60 to-slate-900 border border-sky-500/30 text-sky-100 rounded-tl-sm'
                          : isFreelancer
                          ? 'bg-[#131b2e] border border-slate-700/60 text-slate-200 rounded-tl-sm'
                          : 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-sm'
                      }`}
                    >
                      {msg.subject && (
                        <div className="font-bold border-b border-white/10 pb-1 mb-2 text-sky-300">
                          Subject: {msg.subject}
                        </div>
                      )}
                      <div className="whitespace-pre-line">{msg.content}</div>

                      {/* Attached Offer Card if present */}
                      {msg.metadata?.amount && (
                        <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Formal Offer</span>
                            <div className="text-base font-extrabold text-white">
                              ${msg.metadata.amount} {negotiation.currency}
                            </div>
                          </div>
                          {lastOffer && lastOffer.status === 'PENDING' && (
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleAcceptOffer(lastOffer.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectOffer(lastOffer.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-all"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Live Typing / Thinking Indicator */}
            {runningAI && (
              <div className="flex items-center space-x-2 text-xs text-sky-400 animate-pulse bg-sky-950/30 p-2.5 rounded-xl border border-sky-500/20 max-w-sm">
                <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <span>AI Agent is analyzing your request & formulating response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions & Prompt Pills */}
          <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 flex flex-wrap gap-1.5">
            {[
              { label: '💰 Need to lower price to $420', text: 'NEED TO LOWER PRICE to $420 USD' },
              { label: '📋 What is the project scope?', text: 'Can you provide a full breakdown of the deliverables in scope?' },
              { label: '🔄 Explain revision policy', text: 'What is the agreed revision policy for this project?' },
              { label: '🔒 How does PayPal protection work?', text: 'How does the PayPal escrow and milestone authorization work?' },
            ].map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(undefined, pill.text)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-[10px] text-slate-300 hover:text-white transition-all"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Message Input Footer */}
          <div className="p-4 bg-slate-900/90 border-t border-slate-800">
            {showOfferInput && (
              <div className="mb-3 p-3 rounded-xl bg-slate-950 border border-sky-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-semibold text-slate-300">Submit Formal Counteroffer:</span>
                  <input
                    type="number"
                    value={offerInput}
                    onChange={(e) => setOfferInput(e.target.value)}
                    placeholder="420"
                    max={budgetCeiling}
                    className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[11px] text-slate-400">USD</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOfferInput(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowOfferInput(!showOfferInput)}
                className={`p-2 rounded-xl text-xs font-medium border transition-all ${
                  showOfferInput
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Propose Specific Price Counteroffer"
              >
                <DollarSign className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={channel === 'EMAIL' ? 'Draft email response to freelancer...' : 'Ask question or instruct AI agent (e.g. "NEED TO LOWER PRICE")...'}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />

              <button
                type="submit"
                disabled={sending || (!inputText && !offerInput)}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Budget Gauge, AI Activity & Timeline (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Visual Budget Ceiling Gauge */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Client Budget Ceiling
                </span>
                <div className="text-2xl font-black text-white">
                  ${budgetCeiling.toFixed(2)} {negotiation.currency}
                </div>
              </div>

              {isOverBudget ? (
                <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Breach (+${budgetVariance.toFixed(2)})</span>
                </div>
              ) : (
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Within Budget Target</span>
                </div>
              )}
            </div>

            {/* Visual Budget Progress Bar */}
            <div className="space-y-1">
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget
                      ? 'bg-rose-500 w-full animate-pulse'
                      : lastOfferAmount
                      ? 'bg-gradient-to-r from-sky-500 to-emerald-400'
                      : 'bg-sky-500 w-1/4'
                  }`}
                  style={{
                    width: lastOfferAmount
                      ? `${Math.min(100, (lastOfferAmount / budgetCeiling) * 100)}%`
                      : '20%',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>$0</span>
                <span>Current: ${lastOfferAmount ? lastOfferAmount.toFixed(2) : '0.00'}</span>
                <span>Max Ceiling: ${budgetCeiling.toFixed(2)}</span>
              </div>
            </div>

            {/* Agreed / Contract Status Banner */}
            {negotiation.status === 'AGREED' && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Mutual Agreement Verified at ${negotiation.agreedAmount} USD!</span>
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  Agreed price is within budget (${(budgetCeiling - (Number(negotiation.agreedAmount) || 0)).toFixed(2)} saved). Next step: Review & sign formal contract.
                </p>
                {contract && (
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all shadow-md"
                  >
                    <span>View & Sign Generated Contract</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* AI Agent Function Calling Activity Log */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Agent Tool Executions
                </h3>
              </div>
              <span className="text-[10px] text-sky-400 font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20">
                AgentRun Log ({agentRuns.length})
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {agentRuns.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No tool calls executed yet. Click "Trigger AI Agent" or ask a question in chat.
                </div>
              ) : (
                agentRuns.map((run: any) => (
                  <div
                    key={run.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1 hover:border-sky-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sky-400 font-bold">
                        {run.toolName ? `tool: ${run.toolName}()` : 'assistant: reasoning'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(run.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {run.toolArguments && (
                      <div className="font-mono text-[10px] text-slate-400 truncate">
                        args: {JSON.stringify(run.toolArguments)}
                      </div>
                    )}

                    {run.toolResult && (
                      <div className="font-mono text-[10px] text-emerald-400 truncate">
                        result: {typeof run.toolResult === 'object' ? JSON.stringify(run.toolResult) : run.toolResult}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* State Machine Progress Timeline */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Procurement Lifecycle Progress
            </div>

            <div className="space-y-3 text-xs">
              {[
                { label: 'Initiated', state: 'INITIATED', done: true },
                { label: 'AI Strategic Negotiation', state: 'NEGOTIATING', done: true },
                { label: 'Verified Agreement Reached', state: 'AGREED', done: negotiation.status === 'AGREED' || negotiation.status === 'CONTRACT_PENDING' || negotiation.project.status === 'COMPLETED' },
                { label: 'Contract Signatures Pending', state: 'CONTRACT_PENDING', done: negotiation.contracts?.length > 0 },
                { label: 'Client Deliverables Approved', state: 'WORK_APPROVED', done: contract?.status === 'WORK_APPROVED' || negotiation.project.status === 'COMPLETED' },
                { label: 'PayPal Sandbox Capture & Payout', state: 'COMPLETED', done: negotiation.project.status === 'COMPLETED' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step.done
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {step.done ? '✓' : idx + 1}
                  </div>
                  <span className={step.done ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connect Gemini API Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google Gemini 1.5 Flash (Free Tier)</h3>
                  <p className="text-xs text-emerald-400 font-medium">1,500 Free Requests/Day • 15 RPM • 1M Context • Zero Cost</p>
                </div>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-slate-300 space-y-1.5">
              <div className="font-semibold text-emerald-300 flex items-center justify-between">
                <span>Highest Free Tier Quota in AI:</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">100% Free Forever</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>1,500 Requests Per Day</strong> (30x more free requests than GPT-4o or Pro models)</li>
                <li><strong>15 Requests Per Minute</strong> (No throttling during rapid chat turns)</li>
                <li><strong>1,000,000 Token Context Window</strong> for complete negotiation & contract analysis</li>
                <li><strong>Zero Billing Required:</strong> Free with any standard Google account</li>
              </ul>
              <div className="pt-1">
                Get your free instant API key at:{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline font-bold inline-flex items-center gap-1 hover:text-emerald-300"
                >
                  Google AI Studio (https://aistudio.google.com/apikey) <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gemini API Key:
              </label>
              <input
                type="password"
                defaultValue={geminiApiKey}
                placeholder="AIzaSy..."
                id="geminiKeyInput"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => saveGeminiKey('')}
                className="text-xs text-rose-400 hover:underline"
              >
                Clear Key (Use Autonomous Engine)
              </button>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('geminiKeyInput') as HTMLInputElement;
                    saveGeminiKey(input?.value || '');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-90 text-white text-xs font-bold"
                >
                  Save & Apply Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
