import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import {
    MessageSquare,
    Flame,
    UserCheck,
    FileSignature,
    TrendingUp,
    Bot,
    PhoneCall,
    ArrowUpRight,
    Clock,
    AlertCircle,
    CheckCircle2,
    ShieldAlert,
} from 'lucide-react';

interface Props {
    metrics: {
        active_conversations: number;
        hot_leads: number;
        pending_takeovers: number;
        quotes_issued: number;
        total_deals_value: number;
        ai_messages_count: number;
        human_messages_count: number;
        ai_automation_pct: number;
    };
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

export default function Dashboard({ metrics, urgent_takeovers, channels, emergency_stop }: Props) {
    return (
        <AppLayout title="Operasional AI Sales & Human Takeover">
            <Head title="Dashboard Operasional" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Emergency Stop Banner if Active */}
                {emergency_stop && (
                    <div className="bg-rose-950/70 border border-rose-800 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-rose-950/40">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                            <div>
                                <h4 className="text-xs font-bold text-white">EMERGENCY STOP AI AKTIF</h4>
                                <p className="text-[11px] text-rose-300">Seluruh respon otomatis AI dihentikan. Semua percakapan dialihkan ke operator manusia.</p>
                            </div>
                        </div>
                        <Link
                            href="/app/takeover"
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
                        >
                            Buka Antrean
                        </Link>
                    </div>
                )}

                {/* Primary Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Active Conversations */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Percakapan Aktif
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-white">{metrics.active_conversations}</span>
                            <span className="text-[11px] text-slate-500">sesi saat ini</span>
                        </div>
                    </div>

                    {/* HOT Leads */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                                HOT Leads (Niat Beli &ge;75)
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                                <Flame className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-rose-400">{metrics.hot_leads}</span>
                            <span className="text-[11px] text-slate-500">siap closing</span>
                        </div>
                    </div>

                    {/* Pending Takeovers */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                                Antrean Takeover Manusia
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                                <UserCheck className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-amber-400">{metrics.pending_takeovers}</span>
                            <span className="text-[11px] text-slate-500">menunggu klaim</span>
                        </div>
                    </div>

                    {/* Automation Ratio */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                                Rasio Respon AI
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                <Bot className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-emerald-400">{metrics.ai_automation_pct}%</span>
                            <span className="text-[11px] text-slate-500">beban terotomasi</span>
                        </div>
                    </div>
                </div>

                {/* Second Row: Urgent Takeover Queue & WhatsApp Numbers Health */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Urgent Takeovers Queue (2 Cols) */}
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-400" />
                                    <span>Prioritas Takeover Manusia Utama</span>
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    Pelanggan siap beli, minta invoice, atau negosiasi alot yang membutuhkan intervensi sales
                                </p>
                            </div>
                            <Link
                                href="/app/takeover"
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                            >
                                <span>Lihat Semua</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {urgent_takeovers.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                                Tidak ada antrean takeover tertunda saat ini. Seluruh percakapan tertangani dengan baik.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {urgent_takeovers.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-white">{item.contact_name}</span>
                                                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                                    {item.channel_name}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    item.priority === 'urgent'
                                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                }`}>
                                                    Skor {item.intent_score}/100
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                <Clock className="w-3 h-3 text-slate-500" />
                                                <span>Masuk: {item.created_at}</span>
                                                <span>·</span>
                                                <span className="text-slate-300">{item.reasons.join(', ')}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/app/inbox/${item.conversation_id}`}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                                        >
                                            Buka Chat
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* WhatsApp Numbers Status */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                <PhoneCall className="w-4 h-4 text-emerald-400" />
                                <span>Nomor Bisnis Aktif</span>
                            </h3>
                            <Link
                                href="/app/numbers"
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                            >
                                Kelola
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {channels.map((ch) => (
                                <div
                                    key={ch.id}
                                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-white truncate">{ch.name}</span>
                                        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            {ch.connection_status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>{ch.phone_e164}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            ch.ai_mode === 'autonomous'
                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                : ch.ai_mode === 'assist'
                                                ? 'bg-amber-500/20 text-amber-300'
                                                : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            AI: {ch.ai_mode.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
