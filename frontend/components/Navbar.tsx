'use client';

import React, { useState } from 'react';
import { Bot, Play, CheckCircle2, Shield, Bell, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

interface NavbarProps {
  currentRole: 'CLIENT' | 'FREELANCER';
  onDemoRunComplete?: () => void;
}

export function Navbar({ currentRole, onDemoRunComplete }: NavbarProps) {
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [demoBanner, setDemoBanner] = useState<string | null>(null);

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
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 agent-active-badge" />
          <span className="font-semibold text-white">AI Agent:</span>
          <span>Gemini 1.5 Flash (1,500 Free Requests/Day)</span>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#0070ba]/10 border border-[#0070ba]/30 text-[11px] text-[#009cde]">
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
    </header>
  );
}

