import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import {
    TrendingUp,
    ShoppingBag,
    Tag,
    UserPlus,
    Download,
    ShieldAlert,
    CheckCircle2,
    MessageSquare,
    Sparkles,
    Bot,
    UserCheck,
    Target,
    BarChart3,
    ArrowUpRight,
} from 'lucide-react';

interface Props {
    metrics: {
        total_sales?: number;
        total_orders?: number;
        products_sold?: number;
        total_contacts?: number;
        hot_leads?: number;
        active_conversations?: number;
        pending_takeovers?: number;
        quotes_issued?: number;
        ai_messages_count?: number;
        human_messages_count?: number;
        inbound_messages_count?: number;
        ai_automation_pct?: number;
        satisfaction_rate?: number;
        total_tickets?: number;
        resolved_tickets?: number;
        monthly_target?: number;
        realization_pct?: number;
    };
    chat_insights?: Array<{
        day: string;
        date: string;
        inbound: number;
        ai: number;
        human: number;
        total: number;
    }>;
    weekly_revenue?: Array<{
        day: string;
        date: string;
        wa_ai: number;
        direct: number;
        total: number;
    }>;
    urgent_takeovers: Array<{
        id: number;
        conversation_id: number;
        contact_name: string;
        channel_name: string;
        priority: string;
        reasons: string[];
        intent_score: number;
        status: string;
        created_at: string;
    }>;
    channels: Array<{
        id: number;
        name: string;
        phone_e164: string;
        connection_status: string;
        ai_mode: string;
        is_emergency_paused: boolean;
    }>;
    emergency_stop: boolean;
}

export default function Dashboard({
    metrics,
    chat_insights = [],
    weekly_revenue = [],
    urgent_takeovers = [],
    channels = [],
    emergency_stop,
}: Props) {
    const formatRupiah = (val?: number) => {
        const num = val ?? 0;
        if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(2)}M`;
        if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`;
        return `Rp ${num.toLocaleString('id-ID')}`;
    };

    // Real values without dummy fallbacks
    const totalSales = metrics.total_sales ?? 0;
    const totalOrders = metrics.total_orders ?? 0;
    const productsSold = metrics.products_sold ?? 0;
    const totalContacts = metrics.total_contacts ?? 0;
    const hotLeads = metrics.hot_leads ?? 0;
    const quotesIssued = metrics.quotes_issued ?? 0;
    const monthlyTarget = metrics.monthly_target ?? 100000000;
    const realizationPct = metrics.realization_pct ?? 0;
    const satisfactionRate = metrics.satisfaction_rate ?? 100;
    const totalTickets = metrics.total_tickets ?? 0;
    const resolvedTickets = metrics.resolved_tickets ?? 0;

    // Calculate max values for real dynamic charts
    const maxChatVal = Math.max(
        1,
        ...chat_insights.flatMap((d) => [d.inbound, d.ai, d.human])
    );

    const maxRevVal = Math.max(
        1,
        ...weekly_revenue.flatMap((w) => [w.wa_ai, w.direct])
    );

    const totalWeeklyRev = weekly_revenue.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <AppLayout title="Dashboard CRM & Penjualan">
            <Head title="Dashboard CRM Real — AIWA HQ" />

            <div className="p-6 md:p-8 space-y-7 max-w-[1600px] mx-auto">
                {/* Emergency Stop Banner if Active */}
                {emergency_stop && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
                            <div>
                                <h4 className="text-xs font-bold text-rose-900">EMERGENCY STOP AI AKTIF</h4>
                                <p className="text-xs text-rose-700">
                                    Seluruh respon otomatis bot AI dihentikan. Semua percakapan dialihkan ke antrean operator manusia.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/app/takeover"
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                            Buka Antrean Takeover
                        </Link>
                    </div>
                )}

                {/* ROW 1: Real Sales KPIs (4 Pastel Cards) + Live Chat Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Real Sales KPI with 4 Pastel Cards */}
                    <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Performa Penjualan Riil</h2>
                                <p className="text-xs text-slate-500">Ringkasan transaksi riil & konversi aktif database</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Database Real
                                </span>
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-3 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                                >
                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Export</span>
                                </button>
                            </div>
                        </div>

                        {/* 4 Pastel Cards: Real DB Data Only */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {/* Card 1: Real Total Sales (Coral/Red Pastel) */}
                            <div className="rounded-2xl p-4 bg-[#ffeae9] border border-red-100/70 space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-600 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                        {formatRupiah(totalSales)}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-600">Total Penjualan</p>
                                </div>
                                <span className="inline-block text-[11px] font-bold text-red-700 bg-red-500/10 px-2 py-0.5 rounded-full">
                                    {totalSales > 0 ? 'Deal Won / Quote Sah' : 'Menunggu deal won'}
                                </span>
                            </div>

                            {/* Card 2: Real Total Orders (Peach/Amber Pastel) */}
                            <div className="rounded-2xl p-4 bg-[#fff4de] border border-amber-100/70 space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                        {totalOrders}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-600">Total Pesanan & Quote</p>
                                </div>
                                <span className="inline-block text-[11px] font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                    {quotesIssued} Penawaran resmi
                                </span>
                            </div>

                            {/* Card 3: Real Products Sold (Mint/Teal Pastel) */}
                            <div className="rounded-2xl p-4 bg-[#dcfae6] border border-emerald-100/70 space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                        {productsSold} <span className="text-xs font-semibold text-slate-500">Unit</span>
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-600">Produk Terjual</p>
                                </div>
                                <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    Total Qty PO / Terjual
                                </span>
                            </div>

                            {/* Card 4: Real Contacts / Leads (Sky/Blue Pastel) */}
                            <div className="rounded-2xl p-4 bg-[#e8f4fd] border border-sky-100/70 space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                        {totalContacts} <span className="text-xs font-semibold text-slate-500">Klien</span>
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-600">Kontak Tersimpan</p>
                                </div>
                                <span className="inline-block text-[11px] font-bold text-sky-700 bg-sky-500/10 px-2 py-0.5 rounded-full">
                                    {hotLeads} Hot Leads aktif
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Real Chat Activity Insights */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Aktivitas Chat Riil (7 Hari)</h3>
                                <p className="text-xs text-slate-500">Pesan masuk & respon AI / Human</p>
                            </div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                Live WA
                            </span>
                        </div>

                        {/* Real Dynamic Chart based on chat_insights */}
                        <div className="h-44 w-full relative flex items-center justify-center bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                            {chat_insights.length === 0 || maxChatVal === 1 && chat_insights.every(c => c.total === 0) ? (
                                <div className="text-center space-y-1">
                                    <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
                                    <p className="text-xs font-semibold text-slate-500">Belum ada riwayat pesan masuk</p>
                                    <p className="text-[10px] text-slate-400">Grafik akan terisi otomatis saat nomor WA menerima chat asli</p>
                                </div>
                            ) : (
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120">
                                    {/* Grid Lines */}
                                    <line x1="10" y1="20" x2="290" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                                    <line x1="10" y1="60" x2="290" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
                                    <line x1="10" y1="100" x2="290" y2="100" stroke="#f1f5f9" />

                                    {/* Inbound Line (Blue) */}
                                    <polyline
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={chat_insights
                                            .map((c, i) => `${25 + i * 40},${100 - (c.inbound / maxChatVal) * 80}`)
                                            .join(' ')}
                                    />
                                    {/* AI Outbound Line (Green) */}
                                    <polyline
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={chat_insights
                                            .map((c, i) => `${25 + i * 40},${100 - (c.ai / maxChatVal) * 80}`)
                                            .join(' ')}
                                    />
                                    {/* Human Takeover Line (Rose) */}
                                    <polyline
                                        fill="none"
                                        stroke="#ef4444"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={chat_insights
                                            .map((c, i) => `${25 + i * 40},${100 - (c.human / maxChatVal) * 80}`)
                                            .join(' ')}
                                    />

                                    {/* Data Points */}
                                    {chat_insights.map((c, i) => (
                                        <g key={i}>
                                            <circle
                                                cx={25 + i * 40}
                                                cy={100 - (c.inbound / maxChatVal) * 80}
                                                r="3.5"
                                                className="fill-white stroke-blue-600 stroke-2"
                                            />
                                            <text
                                                x={25 + i * 40}
                                                y="116"
                                                textAnchor="middle"
                                                className="text-[9px] fill-slate-400 font-medium"
                                            >
                                                {c.day}
                                            </text>
                                        </g>
                                    ))}
                                </svg>
                            )}
                        </div>

                        {/* Real Summary Footprint */}
                        <div className="flex items-center justify-between text-[11px] font-semibold pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-blue-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span>Inbound ({chat_insights.reduce((s, c) => s + c.inbound, 0)})</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span>Bot AI ({chat_insights.reduce((s, c) => s + c.ai, 0)})</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-rose-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                <span>Sales ({chat_insights.reduce((s, c) => s + c.human, 0)})</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 2: Total Pendapatan Riil, CS Tiket, Realisasi vs Target */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Real Weekly Revenue Bars */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Pendapatan Mingguan Riil</h3>
                                <p className="text-xs text-slate-500">Distribusi omzet minggu ini (Sen - Min)</p>
                            </div>
                            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                                {formatRupiah(totalWeeklyRev)}
                            </span>
                        </div>

                        {/* Real Bars based on weekly_revenue */}
                        <div className="h-44 flex items-end justify-between gap-2 pt-4 px-1 bg-slate-50/50 rounded-xl border border-slate-100">
                            {weekly_revenue.map((item, i) => {
                                const waHeight = maxRevVal > 0 && item.wa_ai > 0 ? Math.max(8, (item.wa_ai / maxRevVal) * 100) : 0;
                                const dirHeight = maxRevVal > 0 && item.direct > 0 ? Math.max(8, (item.direct / maxRevVal) * 100) : 0;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full flex items-end justify-center gap-1 h-32">
                                            <div
                                                title={`WA AI: ${formatRupiah(item.wa_ai)}`}
                                                style={{ height: `${waHeight}%` }}
                                                className={`w-2.5 rounded-t-sm transition-all ${waHeight > 0 ? 'bg-blue-500' : 'bg-slate-200 h-1'}`}
                                            />
                                            <div
                                                title={`Direct: ${formatRupiah(item.direct)}`}
                                                style={{ height: `${dirHeight}%` }}
                                                className={`w-2.5 rounded-t-sm transition-all ${dirHeight > 0 ? 'bg-emerald-500' : 'bg-slate-200 h-1'}`}
                                            />
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-400">{item.day}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-600 pt-2">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                Penjualan WA AI
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                Tim Sales Langsung
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Customer Satisfaction (Real CS Ticket Data) */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Kepuasan Pelanggan</h3>
                                <p className="text-xs text-slate-500">Skor resolusi tiket bantuan & komplain</p>
                            </div>
                            <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                {satisfactionRate}%
                            </span>
                        </div>

                        <div className="h-44 w-full relative flex flex-col items-center justify-center bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                            <div className="w-24 h-24 rounded-full border-4 border-slate-100 relative flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-slate-200"
                                        strokeWidth="3.5"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-emerald-500 transition-all duration-700"
                                        strokeDasharray={`${satisfactionRate}, 100`}
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-lg font-extrabold text-slate-800">{satisfactionRate}%</span>
                                    <span className="text-[9px] font-bold text-slate-400">RESOLUSI</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-2">
                                {totalTickets === 0 ? 'Belum ada komplain atau tiket masalah' : `${resolvedTickets} dari ${totalTickets} tiket selesai`}
                            </p>
                        </div>

                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
                            <span>Total Tiket: {totalTickets}</span>
                            <span className="text-emerald-600 font-bold">Tiket Selesai: {resolvedTickets}</span>
                        </div>
                    </div>

                    {/* Card 3: Reality Vs Target Bar */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Realisasi vs Target</h3>
                                <p className="text-xs text-slate-500">Capaian target omzet bulan berjalan</p>
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                {realizationPct}%
                            </span>
                        </div>

                        {/* Real Gauge / Bar representation */}
                        <div className="h-44 flex flex-col justify-center space-y-4 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-600">Progres Omzet</span>
                                    <span className="text-blue-600">{realizationPct}% Tercapai</span>
                                </div>
                                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${Math.min(100, realizationPct)}%` }}
                                        className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                                    <span className="text-[10px] font-medium text-slate-400 block">Terkumpul Riil</span>
                                    <span className="text-xs font-extrabold text-blue-700">{formatRupiah(totalSales)}</span>
                                </div>
                                <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                                    <span className="text-[10px] font-medium text-slate-400 block">Target Bulanan</span>
                                    <span className="text-xs font-extrabold text-amber-700">{formatRupiah(monthlyTarget)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
                            <span>Sisa Target: {formatRupiah(Math.max(0, monthlyTarget - totalSales))}</span>
                            <span className="text-slate-600 font-bold">Q3 2026</span>
                        </div>
                    </div>
                </div>

                {/* ROW 3: Sales Analytics & Urgent Takeover Queue */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Urgent Takeover Table */}
                    <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <span>Antrean Prioritas Human Takeover</span>
                                    {urgent_takeovers.length > 0 && (
                                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {urgent_takeovers.length} Mendesak
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-500">Percakapan yang dialihkan AI ke sales manusia</p>
                            </div>
                            <Link
                                href="/app/takeover"
                                className="text-xs font-bold text-blue-600 hover:text-blue-700"
                            >
                                Lihat Semua &rarr;
                            </Link>
                        </div>

                        {urgent_takeovers.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <h4 className="text-xs font-bold text-slate-800">Tidak ada antrean takeover aktif</h4>
                                <p className="text-[11px] text-slate-500">Semua percakapan berjalan lancar atau belum ada eskalasi dari bot AI.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 font-bold">
                                            <th className="pb-3 font-semibold">Pelanggan</th>
                                            <th className="pb-3 font-semibold">Nomor WA</th>
                                            <th className="pb-3 font-semibold">Alasan Pengalihan</th>
                                            <th className="pb-3 font-semibold">Intent Score</th>
                                            <th className="pb-3 font-semibold text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {urgent_takeovers.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3 font-bold text-slate-900">{t.contact_name}</td>
                                                <td className="py-3 text-slate-600">{t.channel_name}</td>
                                                <td className="py-3">
                                                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-medium">
                                                        {t.reasons?.[0] || 'Negosiasi Mandek'}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <span className="font-extrabold text-blue-600">
                                                        {t.intent_score}/100
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <Link
                                                        href={`/app/inbox/${t.conversation_id}`}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                                                    >
                                                        Ambil Alih
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Right Col: Active WhatsApp Channels Status */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Saluran WhatsApp</h3>
                                <p className="text-xs text-slate-500">Status koneksi & mode AI</p>
                            </div>
                            <Link href="/app/numbers" className="text-xs font-bold text-blue-600 hover:underline">
                                Kelola
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {channels.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    Belum ada nomor WhatsApp terdaftar.
                                </div>
                            ) : (
                                channels.map((ch) => (
                                    <div
                                        key={ch.id}
                                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                                    >
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-slate-900">{ch.name}</span>
                                                <span
                                                    className={`w-2 h-2 rounded-full ${
                                                        ch.connection_status === 'connected'
                                                            ? 'bg-emerald-500'
                                                            : ch.connection_status === 'connecting'
                                                            ? 'bg-amber-500 animate-pulse'
                                                            : 'bg-slate-400'
                                                    }`}
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-500">{ch.phone_e164}</p>
                                        </div>

                                        <div className="text-right">
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                    ch.ai_mode === 'autonomous'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : ch.ai_mode === 'assist'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                AI: {ch.ai_mode}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

