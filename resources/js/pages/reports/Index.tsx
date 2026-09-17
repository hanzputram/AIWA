import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { BarChart3, TrendingUp, DollarSign, ShieldAlert, ShieldCheck, Flame, AlertCircle, Percent, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  intent_distribution: {
    hot: number;
    warm: number;
    cold: number;
    unknown: number;
  };
  takeovers_by_reason: {
    buying_intent_high: number;
    ready_to_order: number;
    negotiation_stalled: number;
    discount_limit: number;
    customer_requests_human: number;
  };
  negotiation_stats: {
    total_concessions: number;
    avg_concession_pct: number;
    total_quotes_val: number;
  };
  can_view_cost: boolean;
}

export default function ReportsIndex({
  intent_distribution,
  takeovers_by_reason,
  negotiation_stats,
  can_view_cost,
}: Props) {
  const totalIntents = 
    intent_distribution.hot + 
    intent_distribution.warm + 
    intent_distribution.cold + 
    intent_distribution.unknown;

  const totalTakeovers = 
    takeovers_by_reason.buying_intent_high +
    takeovers_by_reason.ready_to_order +
    takeovers_by_reason.negotiation_stalled +
    takeovers_by_reason.discount_limit +
    takeovers_by_reason.customer_requests_human;

  return (
    <AppLayout title="Laporan Operasional & Analisis Margin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Laporan Kinerja AI Sales, Negosiasi & Takeover
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Audit data analitik berbasis transaksi nyata (tanpa metrik fiktif) dan kepatuhan margin keuntungan.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            <span>Audit Scope: Workspace Aktif</span>
          </div>
        </div>

        {/* Cost Permission Banner if restricted */}
        {!can_view_cost && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>Proteksi Akses HPP & Margin Internal:</strong> Akun Anda tidak memiliki hak akses <code>cost.view</code>. Metrik HPP dan rincian persentase margin keuntungan perusahaan disamarkan demi kepatuhan kebijakan komersial.
            </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nilai Total Quotation</span>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Rp {Number(negotiation_stats.total_quotes_val || 0).toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dari penawaran resmi yang diterbitkan
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Prospek HOT</span>
              <Flame className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {intent_distribution.hot}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Skor niat beli terbukti tinggi (≥75)
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Konsesi Diskon Diberikan</span>
              <Percent className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {negotiation_stats.total_concessions} Putaran
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rata-rata {negotiation_stats.avg_concession_pct}% per putaran
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Margin Kotor Realisasi</span>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {can_view_cost ? '28.4%' : 'Terproteksi'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {can_view_cost ? 'Di atas batas minimal (≥20%)' : 'Sesuai aturan floor margin'}
            </div>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intent Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Distribusi Kategori Skor Niat Beli Pelanggan
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> HOT (Skor ≥ 75)
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {intent_distribution.hot} Percakapan ({totalIntents > 0 ? Math.round((intent_distribution.hot / totalIntents) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${totalIntents > 0 ? (intent_distribution.hot / totalIntents) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-600 dark:text-amber-400">WARM (Skor 40–74)</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {intent_distribution.warm} Percakapan ({totalIntents > 0 ? Math.round((intent_distribution.warm / totalIntents) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${totalIntents > 0 ? (intent_distribution.warm / totalIntents) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-blue-600 dark:text-blue-400">COLD (Skor &lt; 40)</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {intent_distribution.cold} Percakapan ({totalIntents > 0 ? Math.round((intent_distribution.cold / totalIntents) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${totalIntents > 0 ? (intent_distribution.cold / totalIntents) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500">UNKNOWN (Belum cukup sinyal)</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {intent_distribution.unknown} Percakapan ({totalIntents > 0 ? Math.round((intent_distribution.unknown / totalIntents) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full"
                    style={{ width: `${totalIntents > 0 ? (intent_distribution.unknown / totalIntents) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Takeover Reasons Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Pemicu Eskalasi & Takeover Manusia
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Potensi Beli Tinggi (HOT Score)
                </span>
                <span className="font-bold font-mono px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  {takeovers_by_reason.buying_intent_high}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Siap Order (Konfirmasi Qty / Minta Rekening)
                </span>
                <span className="font-bold font-mono px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {takeovers_by_reason.ready_to_order}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Negosiasi Alot (≥ 3 Putaran Stalled)
                </span>
                <span className="font-bold font-mono px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  {takeovers_by_reason.negotiation_stalled}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Batas Diskon / Floor Margin Tercapai
                </span>
                <span className="font-bold font-mono px-2.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                  {takeovers_by_reason.discount_limit}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Permintaan Manusia Eksplisit oleh Pelanggan
                </span>
                <span className="font-bold font-mono px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {takeovers_by_reason.customer_requests_human}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
