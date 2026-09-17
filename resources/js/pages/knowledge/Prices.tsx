import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Tag, Calendar, CheckCircle2 } from 'lucide-react';

interface Props {
    price_books: Array<any>;
}

export default function Prices({ price_books }: Props) {
    return (
        <AppLayout title="Daftar Harga & Price Book Versioning">
            <Head title="Price Books" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <Tag className="w-5 h-5 text-emerald-400" />
                        <span>Daftar Harga Resmi (Price Book)</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                        Penentuan harga berbasis price book versioned, koefisien, dan batas minimum order (MOQ).
                    </p>
                </div>

                <div className="space-y-6">
                    {price_books.map((pb) => (
                        <div key={pb.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-sm text-white">{pb.name} ({pb.version})</h3>
                                    <p className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                                        <span>Mata Uang: <strong>{pb.currency}</strong></span>
                                        <span>·</span>
                                        <span>Pajak: <strong>{pb.tax_mode}</strong></span>
                                        <span>·</span>
                                        <span>Koefisien: <strong>{pb.coefficient}x</strong></span>
                                    </p>
                                </div>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                                    AKTIF BERLAKU
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-300">
                                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                                        <tr>
                                            <th className="p-3">SKU</th>
                                            <th className="p-3">Nama Produk</th>
                                            <th className="p-3">Tier</th>
                                            <th className="p-3">Min Qty</th>
                                            <th className="p-3 text-right">Harga Jual Resmi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {pb.entries?.map((entry: any) => (
                                            <tr key={entry.id} className="hover:bg-slate-800/40">
                                                <td className="p-3 font-mono font-bold text-indigo-300">{entry.sku}</td>
                                                <td className="p-3 text-white font-medium">{entry.product?.name}</td>
                                                <td className="p-3 uppercase text-[10px] font-semibold text-slate-400">{entry.tier}</td>
                                                <td className="p-3">{entry.min_quantity} {entry.product?.unit}</td>
                                                <td className="p-3 text-right font-extrabold text-emerald-400">
                                                    Rp {Number(entry.base_price).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
