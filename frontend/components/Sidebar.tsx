'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquareCode,
  Users,
  FileSignature,
  CreditCard,
  BarChart3,
  Settings,
  Bot,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentRole: 'CLIENT' | 'FREELANCER';
  onToggleRole: (role: 'CLIENT' | 'FREELANCER') => void;
}

export function Sidebar({ currentRole, onToggleRole }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Negotiations', href: '/negotiations', icon: MessageSquareCode, badge: 'AI Live' },
    { name: 'Freelancers', href: '/freelancers', icon: Users },
    { name: 'Contracts', href: '/contracts', icon: FileSignature },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-[#1a233b] flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#1a233b] justify-between">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0ea5e9] to-[#6366f1] flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>Nexus</span>
              <span className="text-sky-400 font-extrabold">PayAI</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Autonomous Agentic Commerce</div>
          </div>
        </Link>
      </div>

      {/* Hackathon Badge Pill */}
      <div className="mx-4 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/20 flex items-center space-x-2.5">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-sky-200">PayPal AI Hackathon 2026</div>
          <div className="text-[10px] text-slate-400 truncate">Agentic Negotiation & Payouts</div>
        </div>
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Workspace
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/15 to-indigo-500/10 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role Switcher Pill (Alex Morgan Client vs Jordan Smith Freelancer) */}
      <div className="p-4 border-t border-[#1a233b] bg-[#070b14]/60">
        <div className="text-[10px] uppercase font-semibold text-slate-500 mb-2 px-1">
          Active Persona
        </div>
        <div className="flex bg-[#10172a] p-1 rounded-xl border border-[#1e293b]">
          <button
            onClick={() => onToggleRole('CLIENT')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
              currentRole === 'CLIENT'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Alex Morgan
            <span className="block text-[9px] opacity-80">(Client)</span>
          </button>
          <button
            onClick={() => onToggleRole('FREELANCER')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
              currentRole === 'FREELANCER'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Jordan Smith
            <span className="block text-[9px] opacity-80">(Freelancer)</span>
          </button>
        </div>

        {/* PayPal Sandbox Status Indicator */}
        <div className="mt-3 flex items-center justify-between px-2 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            PayPal Sandbox
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold">READY</span>
        </div>
      </div>
    </aside>
  );
}

