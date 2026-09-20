import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    UserCheck,
    Flame,
    Clock,
    AlertTriangle,
    Shield,
    FileText,
    ArrowRight,
    CheckCircle2,
    Building2,
    Phone,
    X,
    Zap,
    Tag,
    HelpCircle
} from 'lucide-react';

interface Props {
    handoffs: Array<any>;
    current_tab: string;
}

export default function TakeoverIndex({ handoffs = [], current_tab = 'all' }: Props) {
    const [selectedBrief, setSelectedBrief] = useState<any>(null);
    const [claimingId, setClaimingId] = useState<number | null>(null);

    const tabs = [
        { id: 'all', label: 'Semua Antrean' },
        { id: 'hot', label: '🔥 Potensi Beli Tinggi' },
        { id: 'ready', label: '⚡ Siap Order' },
        { id: 'stalled', label: '⚠️ Negosiasi Alot' },
        { id: 'discount', label: '🏷️ Approval Diskon' },
        { id: 'data', label: '🔍 Perlu Data Teknis' },
        { id: 'mine', label: '👤 Milik Saya' },
    ];

    const handleClaim = async (handoffId: number) => {
        setClaimingId(handoffId);
        try {
            await (window as any).axios.post(`/api/v1/handoffs/${handoffId}/claim`);
            router.reload();
        } catch (e: any) {
            alert(e.response?.data?.error?.message || 'Gagal klaim takeover');
        } finally {
            setClaimingId(null);
        }
    };

    // Metrics
    const totalCount = handoffs.length;
    const hotCount = handoffs.filter(h => h.intent_score >= 80 || h.reason_codes?.includes('hot_lead')).length;
    const urgentCount = handoffs.filter(h => h.priority === 'urgent').length;
    const claimedCount = handoffs.filter(h => h.status === 'claimed').length;

    return (
        <AppLayout title="Antrean Prioritas Takeover Manusia">
            <Head title="Antrean Takeover Manusia" />

            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                Antrean Prioritas Intervensi & Takeover Manusia
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            AI secara otomatis menghentikan penawaran otonom dan memanggil tim sales manusia saat mendeteksi niat beli tinggi atau negosiasi alot.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>Target SLA Claim: &le; 2 Menit (Jam Kerja)</span>
                    </div>
                </div>

                {/* 4 Pastel Top Stat Cards - CRM HQ Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#eff6ff] border border-blue-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">Total Antrean</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</div>
                            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Percakapan menunggu
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                            <UserCheck className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff1f2] border border-rose-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">HOT Leads (80+)</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{hotCount}</div>
                            <span className="text-[11px] text-rose-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Peluang closing besar
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600">
                            <Flame className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff7ed] border border-amber-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">Prioritas Urgent</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{urgentCount}</div>
                            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Klien mendesak
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <Zap className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Sudah Diklaim</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{claimedCount}</div>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Sedang ditangani sales
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.id}
                            href={`/app/takeover?tab=${tab.id}`}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                                current_tab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {/* Handoff Requests List */}
                {handoffs.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl space-y-3 shadow-xs">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h3 className="font-bold text-base text-slate-800">Tidak Ada Antrean Menunggu</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Semua prospek dan negosiasi sedang ditangani dengan baik atau dilayani oleh AI dalam batas aman floor price.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {handoffs.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <span className="font-bold text-sm text-slate-800">{item.contact?.name || 'Kontak Pelanggan'}</span>
                                            <span className="text-xs text-slate-500 font-mono">({item.contact?.phone_e164})</span>
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                                                {item.channel?.name}
                                            </span>

                                            {/* Priority Badge */}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                item.priority === 'urgent'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                Prioritas: {item.priority.toUpperCase()}
                                            </span>

                                            {/* Intent Score Badge */}
                                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                Skor Niat Beli: {item.intent_score}/100
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                                            <span className="flex items-center gap-1 text-rose-600 font-semibold">
                                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                                <strong>Alasan:</strong> {item.reason_codes?.join(', ')}
                                            </span>
                                            <span>·</span>
                                            <span>Target SLA: {item.sla_target_at}</span>
                                            <span>·</span>
                                            <span>Manusia Utama: <strong className="text-slate-700">{item.primary_human || 'Belum diatur'}</strong></span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => setSelectedBrief(item.brief)}
                                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Lihat Brief</span>
                                        </button>

                                        {item.status !== 'claimed' ? (
                                            <button
                                                onClick={() => handleClaim(item.id)}
                                                disabled={claimingId === item.id}
                                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                                            >
                                                <UserCheck className="w-4 h-4" />
                                                <span>{claimingId === item.id ? 'Mengklaim...' : 'Klaim Takeover'}</span>
                                            </button>
                                        ) : (
                                            <Link
                                                href={`/app/inbox/${item.conversation_id}`}
                                                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                                            >
                                                <span>Buka Chat ({item.claimed_by})</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Handover Brief Modal */}
                {selectedBrief && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-rose-600" />
                                    <span>Handover Brief Sales (Ringkasan Pengalihan)</span>
                                </h3>
                                <button onClick={() => setSelectedBrief(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs text-slate-700">
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Kebutuhan Pelanggan</span>
                                    <p className="font-semibold text-slate-900">{selectedBrief.customer_needs}</p>
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Penawaran Sah Terakhir</span>
                                    <p className="font-semibold text-emerald-700">{selectedBrief.last_valid_quote_summary}</p>
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Tawaran Pelanggan (Bid) & Konsesi</span>
                                    <p className="text-amber-800 font-semibold">{selectedBrief.customer_last_bid}</p>
                                    <p className="text-slate-500 text-[11px] mt-1">{selectedBrief.concessions_summary}</p>
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Pemicu Takeover</span>
                                    <p className="text-rose-700 font-bold">{selectedBrief.trigger_reasons_summary}</p>
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Saran Tindakan Sales Selanjutnya</span>
                                    <p className="whitespace-pre-wrap text-slate-700 mt-1 leading-relaxed">{selectedBrief.suggested_next_actions}</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setSelectedBrief(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
