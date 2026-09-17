import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import { BookOpen, Search, Shield, Tag, Cpu, CheckCircle2 } from 'lucide-react';

interface Props {
    products: Array<any>;
}

export default function Products({ products }: Props) {
    const { auth } = usePage().props as any;
    const canViewCost = auth.user?.permissions?.includes('cost.view') || ['owner', 'admin'].includes(auth.user?.role);
    const [search, setSearch] = useState('');

    const filtered = products.filter(
        (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout title="Katalog Produk & Spesifikasi Teknis">
            <Head title="Katalog Produk" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-400" />
                            <span>Katalog Komponen Listrik & Switchgear</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Knowledge terstruktur untuk AI Sales Engineer dalam mengenali kode SKU, varian pole, ampere, voltage, dan breaking capacity.
                        </p>
                    </div>

                    <div className="relative w-72">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari SKU atau nama komponen..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {filtered.map((prod) => {
                        const priceEntry = prod.price_entries?.[0];
                        const costEntry = prod.cost_entries?.[0];

                        return (
                            <div
                                key={prod.id}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded font-mono">
                                            {prod.sku}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{prod.brand}</span>
                                    </div>
                                    <h3 className="font-bold text-xs text-white leading-snug">{prod.name}</h3>
                                    <p className="text-[11px] text-slate-400">{prod.category}</p>
                                </div>

                                {/* Technical Specs Grid */}
                                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5 text-[11px]">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                        Spesifikasi Teknis
                                    </span>
                                    <div className="grid grid-cols-2 gap-1 text-slate-300">
                                        {prod.specs?.map((s: any) => (
                                            <div key={s.id}>
                                                <span className="text-slate-500">{s.spec_name}:</span>{' '}
                                                <strong className="text-white">{s.spec_value}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Commercial Prices & Cost Guard */}
                                <div className="pt-2 border-t border-slate-800 flex items-end justify-between">
                                    <div>
                                        <span className="text-[10px] text-slate-500 block">Harga Resmi Jual:</span>
                                        <span className="text-base font-extrabold text-emerald-400">
                                            Rp {priceEntry ? Number(priceEntry.base_price).toLocaleString('id-ID') : 'Belum diisi'}
                                        </span>
                                    </div>

                                    {canViewCost && costEntry && (
                                        <div className="text-right text-[10px] text-slate-400">
                                            <span className="text-rose-400 flex items-center gap-1 justify-end font-semibold">
                                                <Shield className="w-3 h-3" />
                                                HPP: Rp {Number(costEntry.hpp_cost).toLocaleString('id-ID')}
                                            </span>
                                            <span>Margin Floor: {costEntry.margin_floor_pct}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
