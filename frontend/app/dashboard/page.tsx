'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  MessageSquareCode,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardMetrics();
      setData(res);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load dashboard metrics:', err);
      setError(err.message || 'Failed to load metrics from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading autonomous analytics from engine...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-rose-400" />
          <h3 className="font-semibold text-lg">Failed to connect to backend engine</h3>
        </div>
        <p className="mt-2 text-sm text-slate-300">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, charts, recentActivity } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-slate-900 via-[#0b1329] to-[#0f1f44] border border-sky-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PayPal AI Agentic Commerce Hub</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Autonomous Freelancer Negotiator & Payer
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              AI agents represent clients to negotiate deliverables within strict budget constraints, verify mutual agreement, generate legally structured agreements, and execute PayPal Sandbox authorizations and freelancer payouts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/projects"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 transition-all flex items-center space-x-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Create Project</span>
            </Link>
            <Link
              href="/negotiations"
              className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center space-x-2"
            >
              <MessageSquareCode className="w-4 h-4 text-sky-400" />
              <span>Active Negotiations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Money Saved */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Money Saved via AI</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              ${metrics.totalMoneySaved}
            </div>
            <div className="mt-1 flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
              <span>{charts.averageSavingsPercentage}% under initial quote</span>
            </div>
          </div>
        </div>

        {/* Total Contracted Value */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Agreed Contract Value</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              ${metrics.totalContractValue}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Across {metrics.totalProjects} registered projects
            </div>
          </div>
        </div>

        {/* Active Negotiations */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Negotiations</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <MessageSquareCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.activeNegotiations}
            </div>
            <div className="mt-1 text-xs text-indigo-400 font-medium">
              Strict budget ceiling enforced
            </div>
          </div>
        </div>

        {/* PayPal Captured Payments */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-[#009cde]/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>PayPal Sandbox Captured</span>
            <div className="w-8 h-8 rounded-lg bg-[#0070ba]/20 text-[#009cde] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              ${metrics.totalPaidAmount}
            </div>
            <div className="mt-1 flex items-center space-x-1 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{metrics.successfulPaymentsCount} Orders Captured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Strip: Pending Approvals & Payouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Pending Actions Required</div>
              <div className="text-sm font-semibold text-white">
                {metrics.pendingApprovals} Contract Signatures & Deliverable Reviews
              </div>
            </div>
          </div>
          <Link
            href="/contracts"
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-all"
          >
            Review Contracts
          </Link>
        </div>

        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Freelancer Payout Status</div>
              <div className="text-sm font-semibold text-white">
                {metrics.pendingPayoutsCount} Milestone Payouts In Queue via PayPal API
              </div>
            </div>
          </div>
          <Link
            href="/payments"
            className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold transition-all"
          >
            Manage Payouts
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending & Savings Volume Area Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Transaction Volume & AI Savings Trend
              </h3>
              <p className="text-xs text-slate-400">
                Monthly spending volume vs budget savings negotiated by AI Agent
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-sky-500" />
                <span className="text-slate-300">Contract Spending</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-400" />
                <span className="text-slate-300">Negotiated Savings</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="spending" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
                <Area type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSave)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Negotiation Outcome Distribution */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Negotiation Success Rate
            </h3>
            <p className="text-xs text-slate-400">
              Contract execution and budget compliance distribution
            </p>
          </div>

          <div className="h-48 my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.outcomeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.outcomeDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Overall Success Rate</span>
              <span className="font-bold text-emerald-400">{charts.successRate}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Budget Ceiling Breaches</span>
              <span className="font-bold text-sky-400">0 (Blocked by Backend)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white tracking-tight">
            Recent Agentic Commerce Activity
          </h3>
          <span className="text-xs text-slate-400">Real-time audit log</span>
        </div>

        <div className="divide-y divide-slate-800">
          {recentActivity.map((item: any) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs">
                  {item.status === 'AGREED' ? <FileText className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-400">
                    {item.project} • {item.freelancer}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-200">{item.amount}</div>
                <div className="text-[10px] text-emerald-400 font-medium">Saved {item.saved}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

