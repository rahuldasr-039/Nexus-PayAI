'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Bot,
  Mail,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Key,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [keyInput, setKeyInput] = useState<string>('');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.getHealth();
      setHealth(res);
    } catch (err) {
      console.error('Failed to get health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const saved = localStorage.getItem('gemini_api_key') || '';
    setGeminiApiKey(saved);
    setKeyInput(saved);
  }, []);

  const handleSaveGeminiKey = (newKey: string) => {
    const clean = newKey.trim();
    if (clean) {
      localStorage.setItem('gemini_api_key', clean);
      setGeminiApiKey(clean);
      setKeyInput(clean);
      setSaveMsg('Gemini API Key activated successfully!');
    } else {
      localStorage.removeItem('gemini_api_key');
      setGeminiApiKey('');
      setKeyInput('');
      setSaveMsg('Gemini API Key cleared. System using autonomous simulation engine.');
    }
    window.dispatchEvent(new Event('gemini_key_updated'));
    setTimeout(() => setSaveMsg(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">System & Integration Settings</h1>
        <p className="text-xs text-slate-400">
          Inspection of connected fintech APIs, AI reasoning models, and database persistence layers.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Google Gemini API Key Management Card */}
          <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#0c1a2e] to-[#0a1424] space-y-4 shadow-xl shadow-emerald-500/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white">Google Gemini 1.5 Flash API Key</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      {geminiApiKey ? 'CONNECTED & ACTIVE' : 'AWAITING KEY'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Highest free limits: 1,500 free requests/day • 15 RPM • 1,000,000 token context window
                  </p>
                </div>
              </div>

              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all self-start md:self-auto"
              >
                <span>Get Free Key (Google AI Studio)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Paste your Gemini API Key (e.g. AIzaSy...)"
                className="flex-1 w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSaveGeminiKey(keyInput)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 hover:opacity-90 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap"
                >
                  Save API Key
                </button>
                {geminiApiKey && (
                  <button
                    type="button"
                    onClick={() => handleSaveGeminiKey('')}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all"
                    title="Remove saved key"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {saveMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveMsg}</span>
              </div>
            )}
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* PayPal Sandbox Status */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0070ba]/20 text-[#009cde] flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">PayPal REST API</h3>
                    <div className="text-[11px] text-slate-400">Sandbox Environment</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  {health?.services?.paypal?.mode || 'SANDBOX_ACTIVE'}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">Orders API v2:</span>
                  <span className="text-emerald-400 font-semibold">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payouts API:</span>
                  <span className="text-emerald-400 font-semibold">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Webhooks Verification:</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
              </div>
            </div>

            {/* AI Agent Status */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Agent Engine</h3>
                    <div className="text-[11px] text-slate-400">OpenAI GPT-4o</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-bold">
                  {health?.services?.aiAgent?.mode || 'HIGH_FIDELITY_AGENT'}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">Function Calling / Tools:</span>
                  <span className="text-emerald-400 font-semibold">8 Registered Tools</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Strict Budget Enforcer:</span>
                  <span className="text-emerald-400 font-semibold">Hard Backend Validation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Execution Transparency:</span>
                  <span className="text-sky-400 font-semibold">AgentRun Logging</span>
                </div>
              </div>
            </div>

            {/* Database Engine */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Database Architecture</h3>
                    <div className="text-[11px] text-slate-400">PostgreSQL / Prisma ORM 6</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                  {health?.services?.database?.mode || 'PRISMA_POSTGRES'}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">Financial Precision:</span>
                  <span className="text-emerald-400 font-semibold">Decimal(10,2) BigNumber</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">State Machine:</span>
                  <span className="text-emerald-400 font-semibold">12 Enforced Transitions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Audit Trail:</span>
                  <span className="text-emerald-400 font-semibold">Immutable AuditLog Table</span>
                </div>
              </div>
            </div>

            {/* Email Integration */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Email Service</h3>
                    <div className="text-[11px] text-slate-400">Resend & Inbound Webhooks</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                  {health?.services?.email?.configured ? 'LIVE_RESEND' : 'SIMULATED_EMAIL'}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">Outbound Counteroffers:</span>
                  <span className="text-emerald-400 font-semibold">Supported</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inbound Reply Webhook:</span>
                  <span className="text-emerald-400 font-semibold">/api/email/inbound</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shared History:</span>
                  <span className="text-emerald-400 font-semibold">Unified Chat & Email Stream</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

