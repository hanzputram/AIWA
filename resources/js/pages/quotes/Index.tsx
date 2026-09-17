import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { FileSignature, Eye, CheckCircle2, Clock } from 'lucide-react';

interface Props {
    quotes: Array<any>;
}

export default function QuotesIndex({ quotes }: Props) {
    return (
        <AppLayout title="Penawaran Harga Resmi (Quotations)">
            <Head title="Daftar Penawaran" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <FileSignature className="w-5 h-5 text-indigo-400" />
                        <span>Penawaran Harga Resmi (Official Quotations)</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                        Penawaran diikat token kanonik bertanda tangan digital. Angka harga dijamin deterministik dan tidak dapat dimanipulasi teks bebas.
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                            <tr>
                                <th className="p-3.5">Nomor Quote</th>
                                <th className="p-3.5">Pelanggan</th>
                                <th className="p-3.5">Channel</th>
                                <th className="p-3.5">Revisi</th>
                                <th className="p-3.5">Status</th>
                                <th className="p-3.5 text-right">Total Nilai Penawaran</th>
                                <th className="p-3.5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {quotes.map((q) => (
                                <tr key={q.id} className="hover:bg-slate-800/40">
                                    <td className="p-3.5 font-mono font-bold text-indigo-300">{q.quote_number}</td>
                                    <td className="p-3.5">
                                        <span className="font-bold text-white block">{q.contact?.name}</span>
                                        <span className="text-[11px] text-slate-500 font-mono">{q.contact?.phone_e164}</span>
                                    </td>
                                    <td className="p-3.5 text-slate-400">{q.conversation?.channel?.name}</td>
                                    <td className="p-3.5 font-bold text-white">Rev #{q.current_revision_number}</td>
                                    <td className="p-3.5">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            q.status === 'approved' || q.status === 'issued'
                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                : 'bg-amber-500/20 text-amber-300'
                                        }`}>
                                            {q.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-right font-extrabold text-white text-sm">
                                        Rp {Number(q.grand_total).toLocaleString('id-ID')}
                                    </td>
                                    <td className="p-3.5 text-center">
                                        <Link
                                            href={`/app/quotes/${q.id}`}
                                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>Buka</span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
