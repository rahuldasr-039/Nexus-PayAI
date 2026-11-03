'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileSignature,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Printer,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { api, Contract } from '@/lib/api';

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const data = await api.getContractById(id);
      setContract(data);
    } catch (err: any) {
      console.error('Failed to load contract:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [id]);

  const handleSign = async (role: 'CLIENT' | 'FREELANCER') => {
    try {
      setSigning(true);
      setMessage(null);
      await api.signContract(id, role);
      setMessage(`Successfully recorded digital signature for ${role}!`);
      await fetchContract();
    } catch (err: any) {
      setMessage(`Signing error: ${err.message}`);
    } finally {
      setSigning(false);
    }
  };

  const handleApproveWork = async () => {
    try {
      setApproving(true);
      setMessage(null);
      await api.approveWork(id);
      setMessage('Work approved! Contract deliverables accepted. Ready for PayPal payment.');
      await fetchContract();
    } catch (err: any) {
      setMessage(`Approval error: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  if (loading || !contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Retrieving verified contract agreement...</p>
      </div>
    );
  }

  const isClientSigned = !!contract.clientSignedAt;
  const isFreelancerSigned = !!contract.freelancerSignedAt;
  const isFullySigned = contract.status === 'FULLY_SIGNED' || contract.status === 'WORK_APPROVED' || contract.status === 'COMPLETED';
  const isWorkApproved = contract.status === 'WORK_APPROVED' || contract.status === 'COMPLETED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/contracts"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contracts</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export / Print</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-200 text-xs flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="font-bold text-sky-400 ml-2">✕</button>
        </div>
      )}

      {/* Main Document Card */}
      <div className="glass-panel rounded-3xl p-8 border border-slate-700 shadow-2xl space-y-6">
        {/* Document Header */}
        <div className="border-b border-slate-700/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
              Legal Master Agreement
            </div>
            <h1 className="text-xl font-black text-white mt-1">
              Freelance Professional Services Contract
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Ref: <code className="text-sky-300">{contract.id}</code>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Total Agreed Consideration:</span>
            <div className="text-2xl font-black text-emerald-400">
              ${contract.agreedAmount} {contract.currency}
            </div>
          </div>
        </div>

        {/* Contract Text Body */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap select-text max-h-[460px] overflow-y-auto">
          {contract.documentText}
        </div>

        {/* Signatures & Execution Box */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Digital Signatures & Mutual Legal Assent
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Signature Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Client Signature</div>
                <div className="text-sm font-bold text-white mt-1">{contract.client?.name || 'Alex Morgan'}</div>
                <div className="text-[11px] text-slate-500">{contract.client?.email || 'alex.morgan@techventures.io'}</div>
              </div>

              {isClientSigned ? (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Signed {new Date(contract.clientSignedAt!).toLocaleDateString()}</span>
                </div>
              ) : (
                <button
                  onClick={() => handleSign('CLIENT')}
                  disabled={signing}
                  className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
                >
                  {signing ? 'Signing...' : 'Sign as Client (Alex Morgan)'}
                </button>
              )}
            </div>

            {/* Freelancer Signature Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Freelancer Signature</div>
                <div className="text-sm font-bold text-white mt-1">{contract.freelancer?.name || 'Jordan Smith'}</div>
                <div className="text-[11px] text-slate-500">{contract.freelancer?.email || 'jordan.smith@designstudio.co'}</div>
              </div>

              {isFreelancerSigned ? (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Signed {new Date(contract.freelancerSignedAt!).toLocaleDateString()}</span>
                </div>
              ) : (
                <button
                  onClick={() => handleSign('FREELANCER')}
                  disabled={signing}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {signing ? 'Signing...' : 'Sign as Freelancer (Jordan Smith)'}
                </button>
              )}
            </div>
          </div>

          {/* Deliverables Approval & PayPal Trigger Workflow */}
          {isFullySigned && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Both Parties Fully Signed & Executed</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Deliverables completed. Client approval triggers payment authorization.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {!isWorkApproved ? (
                  <button
                    onClick={handleApproveWork}
                    disabled={approving}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {approving ? 'Approving...' : 'Client Review: Approve Deliverables'}
                  </button>
                ) : (
                  <Link
                    href="/payments"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0070ba] to-[#009cde] hover:opacity-90 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Proceed to PayPal Sandbox Payment & Payout</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

