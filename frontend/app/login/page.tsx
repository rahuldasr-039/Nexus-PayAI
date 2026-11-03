'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, Sparkles, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('alex.morgan@techventures.io');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = (role: 'CLIENT' | 'FREELANCER') => {
    api.setDemoRole(role);
    window.location.href = '/dashboard';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      // Proceed to dashboard with current demo persona
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/25">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">NexusPayAI Platform</h1>
          <p className="text-xs text-slate-400">Autonomous Freelancer Negotiator & Payer</p>
        </div>

        {/* 1-Click Demo Quick Access Buttons */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            1-Click Demo Persona Access
          </div>

          <button
            onClick={() => handleDemoLogin('CLIENT')}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center justify-between transition-all"
          >
            <span>Login as Alex Morgan (Client)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleDemoLogin('FREELANCER')}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-between transition-all"
          >
            <span>Login as Jordan Smith (Freelancer)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Sign In with Email
          </button>
        </form>
      </div>
    </div>
  );
}

