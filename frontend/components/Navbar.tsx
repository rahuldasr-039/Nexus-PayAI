'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Play, CheckCircle2, Shield, Bell, Sparkles, Key, ExternalLink, X } from 'lucide-react';
import { api } from '@/lib/api';

interface NavbarProps {
  currentRole: 'CLIENT' | 'FREELANCER';
  onDemoRunComplete?: () => void;
}

export function Navbar({ currentRole, onDemoRunComplete }: NavbarProps) {
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [demoBanner, setDemoBanner] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key') || '';
    setGeminiApiKey(saved);

    const handleKeyUpdate = () => {
      const updated = localStorage.getItem('gemini_api_key') || '';
      setGeminiApiKey(updated);
    };

    window.addEventListener('storage', handleKeyUpdate);
    window.addEventListener('gemini_key_updated', handleKeyUpdate);
    return () => {
      window.removeEventListener('storage', handleKeyUpdate);
      window.removeEventListener('gemini_key_updated', handleKeyUpdate);
    };
  }, []);

  const handleSaveKey = (key: string) => {
    const cleanKey = key.trim();
    if (cleanKey) {
      localStorage.setItem('gemini_api_key', cleanKey);
      setGeminiApiKey(cleanKey);
    } else {
      localStorage.removeItem('gemini_api_key');
      setGeminiApiKey('');
    }
    window.dispatchEvent(new Event('gemini_key_updated'));
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowKeyModal(false);
    }, 1200);
  };

  const runQuickDemoScenario = async () => {
    try {
      setIsRunningDemo(true);
      setDemoBanner('Initializing autonomous $500 budget logo design scenario...');

      // 1. Fetch negotiations
      const negotiations = await api.getNegotiations();
      let targetNeg = negotiations[0];

      if (!targetNeg) {
        setDemoBanner('Creating demo project and negotiation...');
        const freelancers = await api.getFreelancers();
        const jordan = freelancers[0];
        const proj = await api.createProject({
          title: 'Professional Logo Design for a Technology Startup',
          description: 'High-end branding, visual identity, vector logo suite with dark/light variants.',
          requirements: '1. Primary vector logo (SVG, AI, EPS). 2. App icon mark (512x512). 3. Brand guide. 4. 3 rounds of creative revisions.',
          budget: 500,
          currency: 'USD',
          freelancerId: jordan?.id,
        });
        targetNeg = proj.negotiation!;
      }

      setDemoBanner('Triggering AI Agent evaluation...');
      await api.runAIAgent(targetNeg.id);

      setDemoBanner('Simulating Freelancer initial quote & compromise...');
      await api.simulateFreelancer(targetNeg.id);
      await api.runAIAgent(targetNeg.id);

      setDemoBanner('Agreement reached at $475! Finalizing contract...');
      await api.simulateFreelancer(targetNeg.id);
      await api.runAIAgent(targetNeg.id);

      setDemoBanner('Demo scenario completed successfully!');
      setTimeout(() => setDemoBanner(null), 4000);

      if (onDemoRunComplete) onDemoRunComplete();
    } catch (err: any) {
      console.error('Quick demo error:', err);
      setDemoBanner(`Demo run notice: ${err.message || 'Action executed'}`);
      setTimeout(() => setDemoBanner(null), 4000);
    } finally {
      setIsRunningDemo(false);
    }
  };

  return (
    <header className="h-16 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-[#1a233b] fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-8">
      {/* Left: Environment & Agent Info */}
      <div className="flex items-center space-x-3">
        {/* Clickable Gemini Key Button */}
        <button
          onClick={() => setShowKeyModal(true)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all text-[11px] font-semibold cursor-pointer ${
            geminiApiKey
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 shadow-sm shadow-emerald-500/10'
              : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/40 shadow-sm shadow-emerald-500/20 animate-pulse'
          }`}
          title="Click to add or change Google Gemini API Key"
        >
          <Key className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-white">AI Agent:</span>
          <span>{geminiApiKey ? 'Gemini 1.5 Flash Active' : '🔑 Connect Gemini Key (Free)'}</span>
        </button>

        <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-[#0070ba]/10 border border-[#0070ba]/30 text-[11px] text-[#009cde]">
          <Shield className="w-3.5 h-3.5" />
          <span className="font-medium">PayPal Sandbox Orders & Payouts</span>
        </div>
      </div>

      {/* Center: Live Demo Status Banner */}
      {demoBanner && (
        <div className="hidden lg:flex items-center gap-2 px-4 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>{demoBanner}</span>
        </div>
      )}

      {/* Right: Quick Demo Button & Persona Info */}
      <div className="flex items-center space-x-4">
        <button
          onClick={runQuickDemoScenario}
          disabled={isRunningDemo}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
        >
          {isRunningDemo ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Running Flow...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Hackathon Demo Flow</span>
            </>
          )}
        </button>

        {/* User Persona Profile Pill */}
        <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center font-bold text-xs text-white border border-white/10">
            {currentRole === 'CLIENT' ? 'AM' : 'JS'}
          </div>
          <div className="text-left text-xs">
            <div className="font-semibold text-slate-200">
              {currentRole === 'CLIENT' ? 'Alex Morgan' : 'Jordan Smith'}
            </div>
            <div className="text-[10px] text-slate-400">
              {currentRole === 'CLIENT' ? 'Tech Startup Client' : 'Freelance Brand Designer'}
            </div>
          </div>
        </div>
      </div>

      {/* Global Gemini API Key Modal (Accessible from any page) */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google Gemini 1.5 Flash (Free Tier)</h3>
                  <p className="text-xs text-emerald-400 font-medium">1,500 Free Requests/Day • Zero Billing Required</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-emerald-300 flex items-center justify-between">
                <span>Free Tier Quotas:</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">100% Free Forever</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>1,500 Requests Per Day</strong> (30x more free requests than OpenAI or Pro models)</li>
                <li><strong>15 Requests Per Minute</strong> (Instant, real-time responses)</li>
                <li><strong>1M Token Context Window</strong> for complete negotiation transparency</li>
              </ul>
              <div className="pt-1">
                Get your free API key at:{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline font-bold inline-flex items-center gap-1 hover:text-emerald-300"
                >
                  Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Paste Gemini API Key:
              </label>
              <input
                type="password"
                defaultValue={geminiApiKey}
                placeholder="AIzaSy..."
                id="globalGeminiKeyInput"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {saveSuccess && (
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>API Key saved successfully! Active across all pages.</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSaveKey('')}
                className="text-xs text-rose-400 hover:underline"
              >
                Clear Key (Use Simulator)
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
                    const el = document.getElementById('globalGeminiKeyInput') as HTMLInputElement;
                    handleSaveKey(el?.value || '');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 hover:opacity-90 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  Save & Activate Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

