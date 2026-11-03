'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Star,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Briefcase,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);
        const data = await api.getFreelancers();
        setFreelancers(data);
      } catch (err) {
        console.error('Error fetching freelancers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancers();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Verified Freelancer Marketplace</h1>
        <p className="text-xs text-slate-400">
          Vetted creative & technical freelancers ready for autonomous AI-brokered procurement.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {freelancers.map((freelancer) => (
            <div
              key={freelancer.id}
              className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-sky-500/30 transition-all space-y-6"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={freelancer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={freelancer.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h3 className="text-base font-bold text-white">{freelancer.name}</h3>
                        <ShieldCheck className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="text-xs text-slate-400">{freelancer.title}</div>
                      <div className="mt-1 flex items-center space-x-2 text-[11px] text-amber-400 font-semibold">
                        <span className="flex items-center">
                          <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                          {freelancer.rating}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{freelancer.completedProjects} Projects Completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-white">${freelancer.hourlyRate}</span>
                    <span className="text-[10px] text-slate-400">/hr</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {freelancer.skills?.map((s: string) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* PayPal Connected Payout Badge */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">PayPal Verified Payout:</span>
                  <span className="font-mono text-sky-300 font-semibold">{freelancer.paypalEmail || 'Connected'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href={`/projects`}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 flex items-center space-x-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start AI Negotiation with {freelancer.name.split(' ')[0]}</span>
                </Link>

                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Available for Hire
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

