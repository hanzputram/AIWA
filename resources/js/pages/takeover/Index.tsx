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
} from 'lucide-react';

interface Props {
    handoffs: Array<any>;
    current_tab: string;
}

export default function TakeoverIndex({ handoffs, current_tab }: Props) {
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
            const res = await window.axios.post(`/api/v1/handoffs/${handoffId}/claim`);
            router.reload();
        } catch (e: any) {
            alert(e.response?.data?.error?.message || 'Gagal klaim takeover');
        } finally {
            setClaimingId(null);
        }
    };

    return (
        <AppLayout title="Antrean Prioritas Takeover Manusia">
            <Head title="Antrean Takeover Manusia" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-rose-400" />
                            <span>Antrean Prioritas Intervensi Manusia</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            AI secara otomatis memprioritaskan dan menghentikan penawaran saat mendeteksi niat beli tinggi, negosiasi alot, atau permintaan pelanggan.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-rose-400" />
                        <span>Target SLA Claim: &le; 2 Menit (Jam Kerja)</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-800">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.id}
                            href={`/app/takeover?tab=${tab.id}`}
                            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                                current_tab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {/* Handoff Requests List */}
                {handoffs.length === 0 ? (
                    <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                        <h3 className="font-bold text-sm text-white">Tidak Ada Antrean Menunggu</h3>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                            Semua prospek dan negosiasi sedang ditangani dengan baik atau dilayani oleh AI dalam batas aman margin.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {handoffs.map((item) => (
                            <div
                                key={item.id}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <span className="font-bold text-sm text-white">{item.contact?.name}</span>
                                            <span className="text-xs text-slate-400 font-mono">({item.contact?.phone_e164})</span>
                                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                                                {item.channel?.name}
                                            </span>

                                            {/* Priority Badge */}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                item.priority === 'urgent'
                                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                            }`}>
                                                Prioritas: {item.priority.toUpperCase()}
                                            </span>

                                            {/* Intent Score Badge */}
                                            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                Skor Niat Beli: {item.intent_score}/100
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                                            <span className="flex items-center gap-1 text-rose-300">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                <strong>Alasan:</strong> {item.reason_codes.join(', ')}
                                            </span>
                                            <span>·</span>
                                            <span>Target SLA: {item.sla_target_at}</span>
                                            <span>·</span>
                                            <span>Manusia Utama: <strong className="text-white">{item.primary_human || 'Belum diatur'}</strong></span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => setSelectedBrief(item.brief)}
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>Lihat Brief</span>
                                        </button>

                                        {item.status !== 'claimed' ? (
                                            <button
                                                onClick={() => handleClaim(item.id)}
                                                disabled={claimingId === item.id}
                                                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition"
                                            >
                                                <UserCheck className="w-4 h-4" />
                                                <span>{claimingId === item.id ? 'Mengklaim...' : 'Klaim Takeover'}</span>
                                            </button>
                                        ) : (
                                            <Link
                                                href={`/app/inbox/${item.conversation_id}`}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition"
                                            >
                                                <span>Buka Chat (Dikelola: {item.claimed_by})</span>
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
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-rose-400" />
                                    <span>Handover Brief Sales (Ringkasan Pengalihan)</span>
                                </h3>
                                <button onClick={() => setSelectedBrief(null)} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs text-slate-300">
                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Kebutuhan Pelanggan</span>
                                    <p className="font-medium text-white">{selectedBrief.customer_needs}</p>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Penawaran Sah Terakhir</span>
                                    <p className="font-medium text-emerald-400">{selectedBrief.last_valid_quote_summary}</p>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Tawaran Pelanggan (Bid) & Konsesi</span>
                                    <p className="text-amber-300">{selectedBrief.customer_last_bid}</p>
                                    <p className="text-slate-400 text-[11px] mt-1">{selectedBrief.concessions_summary}</p>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Pemicu Takeover</span>
                                    <p className="text-rose-300 font-medium">{selectedBrief.trigger_reasons_summary}</p>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Saran Tindakan Sales Selanjutnya</span>
                                    <p className="whitespace-pre-wrap text-slate-200 mt-1">{selectedBrief.suggested_next_actions}</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setSelectedBrief(null)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
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
