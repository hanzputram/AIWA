import React, { useMemo, useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import {
    History,
    AlertTriangle,
    CheckCircle2,
    TrendingDown,
    ArrowRight,
    Search,
    Flame,
    DollarSign,
    Layers,
    Receipt
} from 'lucide-react';

interface Props {
    negotiations: Array<any>;
}

export default function NegotiationsIndex({ negotiations = [] }: Props) {
    const [search, setSearch] = useState('');

    const filteredNegotiations = useMemo(() => {
        return negotiations.filter((nego) => {
            const matchesSearch =
                (nego.contact?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (nego.contact?.phone_e164 || '').includes(search);
            return matchesSearch;
        });
    }, [negotiations, search]);

    // Metrics
    const totalSessions = negotiations.length;
    const stalledCount = negotiations.filter(n => n.is_stalled).length;
    const totalConcessions = negotiations.reduce((acc, n) => acc + (n.concessions?.length || 0), 0);
    const agreedCount = negotiations.filter(n => n.status === 'agreed' || n.status === 'completed').length;

    return (
        <AppLayout title="Riwayat Negosiasi & Concession Ledger">
            <Head title="Riwayat Negosiasi" />

            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                Riwayat Negosiasi AI & Concession Ledger
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Buku besar konsesi deterministik terikat sesi percakapan. Menjamin batas Floor Price tidak pernah dilanggar saat AI bernegosiasi.
                        </p>
                    </div>
                </div>

                {/* 4 Pastel Top Stat Cards - CRM HQ Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#eff6ff] border border-blue-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">Sesi Negosiasi</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{totalSessions}</div>
                            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Terbuka dengan prospek
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                            <History className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff1f2] border border-rose-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">Negosiasi Alot (Stalled)</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{stalledCount}</div>
                            <span className="text-[11px] text-rose-600 font-medium flex items-center gap-0.5 mt-0.5">
                                &ge; 3 putaran tanpa deal
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff7ed] border border-amber-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">Total Putaran Konsesi</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{totalConcessions}</div>
                            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Concession ledger terdata
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Sepakat / Closed Won</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{agreedCount}</div>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Sukses menghasilkan order
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Search Filter */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama kontak pelanggan atau nomor HP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                    <span className="text-xs text-slate-400">Menampilkan {filteredNegotiations.length} sesi</span>
                </div>

                {/* Negotiations Cards */}
                <div className="space-y-4">
                    {filteredNegotiations.length === 0 ? (
                        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-2">
                            <History className="w-10 h-10 mx-auto text-slate-300" />
                            <p className="font-semibold text-slate-600">Belum ada riwayat tawar-menawar negosiasi</p>
                            <p className="text-xs text-slate-400">Sesi negosiasi otomatis tercatat saat pelanggan meminta diskon harga.</p>
                        </div>
                    ) : (
                        filteredNegotiations.map((nego) => (
                            <div
                                key={nego.id}
                                className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-sm text-slate-800">{nego.contact?.name || 'Pelanggan'}</h3>
                                            <span className="text-xs text-slate-500 font-mono">({nego.contact?.phone_e164})</span>
                                            {nego.is_stalled ? (
                                                <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                                    NEGOSIASI ALOT (STALLED)
                                                </span>
                                            ) : (
                                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    STATUS: {nego.status.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400">Saluran WhatsApp: <strong className="text-slate-600 font-medium">{nego.conversation?.channel?.name || 'Manual CRM'}</strong></p>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-400 block font-medium">Harga Awal:</span>
                                            <span className="font-semibold text-slate-700">
                                                Rp {Number(nego.asking_total || 0).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-400 block font-medium">Tawaran Terakhir AI:</span>
                                            <span className="font-extrabold text-emerald-600 text-sm">
                                                Rp {Number(nego.current_offer_total || 0).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-400 block font-medium">Bid Pelanggan:</span>
                                            <span className="font-extrabold text-amber-600 text-sm">
                                                {nego.customer_bid_total ? `Rp ${Number(nego.customer_bid_total).toLocaleString('id-ID')}` : 'Belum menawar'}
                                            </span>
                                        </div>
                                        {nego.conversation_id && (
                                            <Link
                                                href={`/app/inbox/${nego.conversation_id}`}
                                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                                            >
                                                <span>Buka Chat</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Concessions Ledger Table */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                        <TrendingDown className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Buku Besar Konsesi (Concession Ledger Putaran):</span>
                                    </h4>

                                    {nego.concessions?.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">Belum ada konsesi yang diberikan pada sesi ini.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                            {nego.concessions?.map((c: any) => (
                                                <div
                                                    key={c.id}
                                                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs"
                                                >
                                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                                                        <span>Putaran #{c.round_number}</span>
                                                        <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">Diskon +{c.granted_pct}%</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900">
                                                        Rp {Number(c.price_after).toLocaleString('id-ID')}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">{c.conditions || 'Diskon negosiasi otonom'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
