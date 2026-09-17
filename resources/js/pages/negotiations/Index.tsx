import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { History, AlertTriangle, CheckCircle2, TrendingDown, ArrowRight } from 'lucide-react';

interface Props {
    negotiations: Array<any>;
}

export default function NegotiationsIndex({ negotiations }: Props) {
    return (
        <AppLayout title="Riwayat Negosiasi & Concession Ledger">
            <Head title="Riwayat Negosiasi" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-400" />
                        <span>Riwayat Negosiasi & Concession Ledger</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                        Ledger konsesi terikat deal yang tidak ter-reset saat chat ditutup atau server restart. Mendeteksi negosiasi alot (3 putaran tanpa kesepakatan).
                    </p>
                </div>

                <div className="space-y-4">
                    {negotiations.map((nego) => (
                        <div
                            key={nego.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-white">{nego.contact?.name}</h3>
                                        <span className="text-xs text-slate-400 font-mono">({nego.contact?.phone_e164})</span>
                                        {nego.is_stalled ? (
                                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                NEGOSIASI ALOT (STALLED)
                                            </span>
                                        ) : (
                                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                STATUS: {nego.status.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">Channel: {nego.conversation?.channel?.name}</p>
                                </div>

                                <div className="flex items-center gap-4 text-xs">
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-500 block">Harga Awal:</span>
                                        <span className="font-bold text-slate-300">
                                            Rp {Number(nego.asking_total).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-500 block">Tawaran Terakhir AI:</span>
                                        <span className="font-extrabold text-emerald-400 text-sm">
                                            Rp {Number(nego.current_offer_total).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-500 block">Bid Pelanggan:</span>
                                        <span className="font-extrabold text-amber-400 text-sm">
                                            {nego.customer_bid_total ? `Rp ${Number(nego.customer_bid_total).toLocaleString('id-ID')}` : 'Tidak ada angka'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Concessions Ledger Table */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                                    <TrendingDown className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Buku Besar Konsesi (Concession Ledger Putaran):</span>
                                </h4>

                                {nego.concessions?.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic">Belum ada konsesi yang diberikan pada sesi ini.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {nego.concessions?.map((c: any) => (
                                            <div
                                                key={c.id}
                                                className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs"
                                            >
                                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                                                    <span>Putaran #{c.round_number}</span>
                                                    <span className="text-emerald-400">Diskon +{c.granted_pct}%</span>
                                                </div>
                                                <p className="text-sm font-extrabold text-white">
                                                    Rp {Number(c.price_after).toLocaleString('id-ID')}
                                                </p>
                                                <p className="text-[10px] text-slate-500">{c.conditions || 'Diskon negosiasi'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
