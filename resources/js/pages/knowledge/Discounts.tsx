import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Percent, Shield, AlertCircle, Info } from 'lucide-react';

interface Props {
    discount_policies: Array<any>;
}

export default function Discounts({ discount_policies }: Props) {
    return (
        <AppLayout title="Kebijakan Diskon & Perlindungan Margin">
            <Head title="Kebijakan Diskon" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <Percent className="w-5 h-5 text-amber-400" />
                        <span>Kebijakan Diskon & Margin Protection Engine</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                        Aturan deterministik yang membatasi konsesi AI agar tidak memotong keuntungan perusahaan secara sembarangan.
                    </p>
                </div>

                {/* Mathematical Formula Explanation Alert */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <Info className="w-4 h-4 text-indigo-400" />
                        <span>Prinsip Perhitungan Diskon Sekuensial & Gross Margin Floor</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                            <span className="font-bold text-indigo-300 block">1. Diskon Bertingkat Sekuensial:</span>
                            <p className="font-mono text-[11px] text-slate-400">Net = Base &times; (1 - d1) &times; (1 - d2)...</p>
                            <p className="text-[11px] text-slate-300">
                                Contoh: Diskon 10% lalu 5% menghasilkan total diskon <strong>14.5%</strong> (bukan penjumlahan 15%).
                            </p>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                            <span className="font-bold text-rose-300 block">2. Gross Margin Floor Protection:</span>
                            <p className="font-mono text-[11px] text-slate-400">Margin = (Pendapatan - HPP) / Pendapatan &ge; Floor</p>
                            <p className="text-[11px] text-slate-300">
                                Jika tawaran pelanggan menurunkan margin di bawah floor (misal &lt;20%), AI dilarang menawarkan harga tersebut dan wajib eskalasi.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Policies List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {discount_policies.map((policy) => (
                        <div key={policy.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm text-white">{policy.name}</h3>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                                    {policy.version}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 text-xs">
                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                    <span className="text-[10px] text-slate-500 block">Diskon Maksimal AI Otonom:</span>
                                    <span className="text-base font-extrabold text-amber-400">{policy.max_autonomous_discount_pct}%</span>
                                </div>
                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                    <span className="text-[10px] text-slate-500 block">Tahapan Konsesi Per Putaran:</span>
                                    <span className="text-base font-extrabold text-white">{policy.discount_step_pct}%</span>
                                </div>
                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                    <span className="text-[10px] text-slate-500 block">Maksimal Putaran Negosiasi:</span>
                                    <span className="text-base font-extrabold text-white">{policy.max_discount_rounds} Kali</span>
                                </div>
                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                    <span className="text-[10px] text-slate-500 block">Gross Margin Minimum (Floor):</span>
                                    <span className="text-base font-extrabold text-rose-400">{policy.minimum_gross_margin_pct}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
