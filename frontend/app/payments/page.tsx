'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  DollarSign,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { api, Payment, Payout, Contract } from '@/lib/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const [pays, pos, cts] = await Promise.all([
        api.getPayments(),
        api.getPayouts(),
        api.getContracts(),
      ]);
      setPayments(pays);
      setPayouts(pos);
      setContracts(cts);
    } catch (err: any) {
      console.error('Failed to load payment records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentData();
  }, []);

  const handleCreateOrder = async (contractId: string) => {
    try {
      setActionLoading(true);
      setBanner(null);
      const res = await api.createPaymentOrder(contractId);
      setBanner(`PayPal Order Created: ${res.orderId} (${res.isSimulated ? 'Sandbox Simulated Mode' : 'PayPal Sandbox REST Live'})`);
      await loadPaymentData();
    } catch (err: any) {
      setBanner(`Order creation error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCaptureOrder = async (orderId: string, contractId: string) => {
    try {
      setActionLoading(true);
      setBanner(null);
      const res = await api.capturePayment(orderId, contractId);
      setBanner(`Payment captured successfully! PayPal Capture ID: ${res.captureId}`);
      await loadPaymentData();
    } catch (err: any) {
      setBanner(`Capture error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePayout = async (paymentId: string) => {
    try {
      setActionLoading(true);
      setBanner(null);
      const res = await api.createPayout(paymentId, 'Freelance deliverable completion payout via PayPal Payouts API');
      setBanner(`PayPal Payout initiated successfully! Batch ID: ${res.batchId}`);
      await loadPaymentData();
    } catch (err: any) {
      setBanner(`Payout error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CAPTURED':
      case 'SUCCESSFUL':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'AWAITING_APPROVAL':
      case 'PROCESSING':
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              PayPal Payments & Payouts Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0070ba]/20 text-[#009cde] border border-[#0070ba]/40 text-[10px] font-bold">
              Sandbox REST v2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end payment workflow: Orders API v2 capture and PayPal Payouts API freelancer disbursement.
          </p>
        </div>

        <button
          onClick={loadPaymentData}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {banner && (
        <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{banner}</span>
          </div>
          <button onClick={() => setBanner(null)} className="font-bold text-sky-400">✕</button>
        </div>
      )}

      {/* Contracts Ready For Payment Card */}
      {contracts.filter(c => c.status === 'WORK_APPROVED' || c.status === 'FULLY_SIGNED').length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-900 border border-sky-500/30 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Approved Contracts Ready for Payment Authorization</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts
              .filter(c => c.status === 'WORK_APPROVED' || c.status === 'FULLY_SIGNED')
              .map((c) => {
                const hasPayment = payments.some(p => p.contractId === c.id);
                return (
                  <div key={c.id} className="p-4 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{c.project?.title || 'Contract Deliverables'}</div>
                      <div className="text-[11px] text-slate-400">Agreed Amount: <strong className="text-emerald-400">${c.agreedAmount} {c.currency}</strong></div>
                    </div>
                    {!hasPayment && (
                      <button
                        onClick={() => handleCreateOrder(c.id)}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0070ba] to-[#009cde] hover:opacity-90 text-white text-xs font-bold shadow-md shadow-[#0070ba]/20 disabled:opacity-50"
                      >
                        Create PayPal Order
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SECTION 1: Client PayPal Payments (Orders API v2) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0070ba]/20 text-[#009cde] flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Client Payment Orders (PayPal Orders API v2)</h2>
              <p className="text-[11px] text-slate-400">Client authorization and fund capture records</p>
            </div>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No payment orders created yet. Contracts require mutual signing & work approval first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-3">PayPal Order ID</th>
                  <th className="pb-3">Contract / Project</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Capture ID</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 font-mono text-sky-400 font-semibold">
                      {payment.paypalOrderId || 'PENDING'}
                    </td>
                    <td className="py-3.5 text-slate-300">
                      {payment.contract?.project?.title || payment.contractId.slice(0, 8)}
                    </td>
                    <td className="py-3.5 font-bold text-white">
                      ${payment.amount} {payment.currency}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-slate-400">
                      {payment.paypalCaptureId || '—'}
                    </td>
                    <td className="py-3.5 text-right">
                      {payment.status === 'AWAITING_APPROVAL' ? (
                        <button
                          onClick={() => handleCaptureOrder(payment.paypalOrderId!, payment.contractId)}
                          disabled={actionLoading}
                          className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-bold shadow-sm disabled:opacity-50"
                        >
                          Capture Payment
                        </button>
                      ) : payment.status === 'CAPTURED' ? (
                        <button
                          onClick={() => handleCreatePayout(payment.id)}
                          disabled={actionLoading || payouts.some(po => po.paymentId === payment.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm disabled:opacity-50"
                        >
                          {payouts.some(po => po.paymentId === payment.id) ? '✓ Payout Sent' : 'Disburse Payout'}
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: Freelancer Payouts (PayPal Payouts API) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Freelancer Payouts (PayPal Payouts API)</h2>
              <p className="text-[11px] text-slate-400">Independent disbursement tracking and batch item delivery</p>
            </div>
          </div>
        </div>

        {payouts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No payouts disbursed yet. Once a payment order is captured, client initiates payout to freelancer PayPal account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-3">Payout Batch ID</th>
                  <th className="pb-3">Freelancer</th>
                  <th className="pb-3">Recipient PayPal</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 font-mono text-purple-400 font-semibold">
                      {payout.paypalPayoutBatchId}
                    </td>
                    <td className="py-3.5 font-semibold text-white">
                      {payout.freelancer?.name || 'Jordan Smith'}
                    </td>
                    <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                      {payout.freelancer?.paypalEmail || 'sb-payouts-freelancer@business.example.com'}
                    </td>
                    <td className="py-3.5 font-bold text-emerald-400">
                      ${payout.amount} {payout.currency}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(payout.status)}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 text-[10px]">
                      {new Date(payout.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

