'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquareCode,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { api, Negotiation } from '@/lib/api';

export default function NegotiationsIndexPage() {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNegotiations = async () => {
      try {
        setLoading(true);
        const data = await api.getNegotiations();
        setNegotiations(data);
      } catch (err) {
        console.error('Error fetching negotiations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNegotiations();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGREED':
      case 'CONTRACT_PENDING':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'NEGOTIATING':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Active AI Negotiations</h1>
          <p className="text-xs text-slate-400">
            Autonomous procurement agents negotiating deliverable terms and price anchoring on your behalf.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : negotiations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel space-y-4">
          <MessageSquareCode className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No active negotiations</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create a project and select a freelancer to start an autonomous negotiation.
          </p>
          <Link
            href="/projects"
            className="inline-block px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold"
          >
            Go to Projects
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {negotiations.map((neg) => {
            const lastOffer = neg.offers?.[0];
            const ceiling = neg.project?.budget || 500;
            const agreed = neg.agreedAmount;

            return (
              <div
                key={neg.id}
                className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-sky-500/30 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(neg.status)}`}>
                      {neg.status}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Freelancer: <strong className="text-slate-200">{neg.freelancer?.name}</strong></span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {neg.project?.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <div>
                      Budget Ceiling: <strong className="text-slate-200">${ceiling} {neg.currency}</strong>
                    </div>
                    {lastOffer && (
                      <div>
                        Latest Proposal: <strong className="text-sky-400">${lastOffer.amount} ({lastOffer.source})</strong>
                      </div>
                    )}
                    {agreed && (
                      <div className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Agreed: ${agreed} {neg.currency}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Link
                    href={`/negotiations/${neg.id}`}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all flex items-center space-x-2"
                  >
                    <span>Enter Negotiation Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

