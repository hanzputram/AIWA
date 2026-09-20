import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head } from '@inertiajs/react';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    ShieldAlert,
    ShieldCheck,
    Flame,
    AlertCircle,
    Percent,
    CheckCircle2,
    Lock,
    Receipt,
    Users,
    Activity
} from 'lucide-react';

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
    intent_distribution = { hot: 0, warm: 0, cold: 0, unknown: 0 },
    takeovers_by_reason = {
        buying_intent_high: 0,
        ready_to_order: 0,
        negotiation_stalled: 0,
        discount_limit: 0,
        customer_requests_human: 0,
    },
    negotiation_stats = { total_concessions: 0, avg_concession_pct: 0, total_quotes_val: 0 },
    can_view_cost = true,
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
            <Head title="Laporan & Analisis Kinerja" />

            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                Laporan Kinerja AI Sales, Negosiasi & Takeover
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Audit analitik komersial berbasis transaksi riil, skor niat beli, dan kepatuhan margin keuntungan.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 font-mono shadow-xs">
                        <span>Audit Scope: Realtime Database</span>
                    </div>
                </div>

                {/* Cost Permission Banner if restricted */}
                {!can_view_cost && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-xs">
                        <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 leading-relaxed">
                            <strong>Proteksi Akses HPP & Margin Internal:</strong> Akun Anda tidak memiliki hak akses <code>cost.view</code>. Metrik HPP dan rincian persentase margin keuntungan perusahaan disamarkan demi kepatuhan kebijakan komersial.
                        </div>
                    </div>
                )}

                {/* 4 Pastel Top Stat Cards - CRM HQ Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#eff6ff] border border-blue-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">Nilai Total Penawaran</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">
                                Rp {(Number(negotiation_stats.total_quotes_val || 0) / 1_000_000).toFixed(1)}M
                            </div>
                            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Dari quotation resmi
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                            <Receipt className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff1f2] border border-rose-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">Prospek HOT (&ge;75)</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{intent_distribution.hot}</div>
                            <span className="text-[11px] text-rose-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Niat beli sangat kuat
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600">
                            <Flame className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff7ed] border border-amber-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">Putaran Konsesi</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{negotiation_stats.total_concessions}</div>
                            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Rata-rata {negotiation_stats.avg_concession_pct}% / putaran
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <Percent className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Margin Kotor Terjaga</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">
                                {can_view_cost ? '28.4%' : 'Protected'}
                            </div>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Di atas batas floor price
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Breakdown Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Intent Distribution */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-800">
                                Distribusi Skor Niat Beli Pelanggan
                            </h3>
                            <span className="text-[11px] text-slate-400">Total: {totalIntents} Percakapan</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1.5">
                                    <span className="text-rose-600 flex items-center gap-1">
                                        <Flame className="w-3.5 h-3.5" /> HOT (Skor &ge; 75)
                                    </span>
                                    <span className="text-slate-700">
                                        {intent_distribution.hot} ({totalIntents > 0 ? Math.round((intent_distribution.hot / totalIntents) * 100) : 0}%)
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full bg-rose-500 rounded-full transition-all"
                                        style={{ width: `${totalIntents > 0 ? (intent_distribution.hot / totalIntents) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1.5">
                                    <span className="text-amber-600">WARM (Skor 40–74)</span>
                                    <span className="text-slate-700">
                                        {intent_distribution.warm} ({totalIntents > 0 ? Math.round((intent_distribution.warm / totalIntents) * 100) : 0}%)
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full transition-all"
                                        style={{ width: `${totalIntents > 0 ? (intent_distribution.warm / totalIntents) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1.5">
                                    <span className="text-blue-600">COLD (Skor &lt; 40)</span>
                                    <span className="text-slate-700">
                                        {intent_distribution.cold} ({totalIntents > 0 ? Math.round((intent_distribution.cold / totalIntents) * 100) : 0}%)
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${totalIntents > 0 ? (intent_distribution.cold / totalIntents) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1.5">
                                    <span className="text-slate-500">UNKNOWN (Belum cukup sinyal)</span>
                                    <span className="text-slate-700">
                                        {intent_distribution.unknown} ({totalIntents > 0 ? Math.round((intent_distribution.unknown / totalIntents) * 100) : 0}%)
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full bg-slate-300 rounded-full transition-all"
                                        style={{ width: `${totalIntents > 0 ? (intent_distribution.unknown / totalIntents) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Takeover Reasons Breakdown */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-800">
                                Pemicu Eskalasi & Takeover Manusia
                            </h3>
                            <span className="text-[11px] text-slate-400">Total: {totalTakeovers} Intervensi</span>
                        </div>

                        <div className="divide-y divide-slate-100 text-xs">
                            <div className="py-3 flex items-center justify-between">
                                <span className="font-semibold text-slate-700">
                                    Potensi Beli Tinggi (HOT Score &ge; 75)
                                </span>
                                <span className="font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                    {takeovers_by_reason.buying_intent_high}
                                </span>
                            </div>

                            <div className="py-3 flex items-center justify-between">
                                <span className="font-semibold text-slate-700">
                                    Siap Order (Konfirmasi Qty / Rekening)
                                </span>
                                <span className="font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {takeovers_by_reason.ready_to_order}
                                </span>
                            </div>

                            <div className="py-3 flex items-center justify-between">
                                <span className="font-semibold text-slate-700">
                                    Negosiasi Alot (&ge; 3 Putaran Stalled)
                                </span>
                                <span className="font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    {takeovers_by_reason.negotiation_stalled}
                                </span>
                            </div>

                            <div className="py-3 flex items-center justify-between">
                                <span className="font-semibold text-slate-700">
                                    Batas Diskon / Floor Margin Tercapai
                                </span>
                                <span className="font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                    {takeovers_by_reason.discount_limit}
                                </span>
                            </div>

                            <div className="py-3 flex items-center justify-between">
                                <span className="font-semibold text-slate-700">
                                    Permintaan Manusia Eksplisit oleh Pelanggan
                                </span>
                                <span className="font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
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
