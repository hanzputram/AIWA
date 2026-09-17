import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { TrendingUp, Plus, DollarSign, Building2, User } from 'lucide-react';

interface Props {
    deals: Array<any>;
    contacts: Array<any>;
    companies: Array<any>;
}

export default function DealsIndex({ deals, contacts, companies }: Props) {
    const stages = [
        { id: 'baru', label: '1. Baru', color: 'border-indigo-500' },
        { id: 'kualifikasi', label: '2. Kualifikasi', color: 'border-cyan-500' },
        { id: 'penawaran', label: '3. Penawaran', color: 'border-amber-500' },
        { id: 'negosiasi', label: '4. Negosiasi', color: 'border-purple-500' },
        { id: 'menang', label: '5. Menang (Won)', color: 'border-emerald-500' },
        { id: 'kalah', label: '6. Kalah (Lost)', color: 'border-rose-500' },
    ];

    const handleMoveStage = async (dealId: number, nextStage: string) => {
        try {
            await window.axios.patch(`/api/v1/deals/${dealId}/stage`, { stage: nextStage });
            router.reload();
        } catch (e) {
            alert('Gagal memindahkan stage deal');
        }
    };

    return (
        <AppLayout title="Pipeline Penjualan (Deals Pipeline)">
            <Head title="Pipeline Deals" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                            <span>Pipeline Penjualan B2B</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Pantau pergerakan prospek dari kualifikasi awal hingga negosiasi dan konfirmasi closing.
                        </p>
                    </div>
                </div>

                {/* Kanban Board Columns */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 overflow-x-auto pb-4">
                    {stages.map((st) => {
                        const stageDeals = deals.filter((d) => d.stage === st.id);
                        const totalVal = stageDeals.reduce((sum, d) => sum + Number(d.amount), 0);

                        return (
                            <div
                                key={st.id}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col min-w-[210px] space-y-3"
                            >
                                <div className={`pb-2 border-b-2 ${st.color} flex items-center justify-between`}>
                                    <span className="font-bold text-xs text-white">{st.label}</span>
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full font-bold">
                                        {stageDeals.length}
                                    </span>
                                </div>

                                <div className="text-[10px] text-slate-400 font-mono">
                                    Total: Rp {totalVal.toLocaleString('id-ID')}
                                </div>

                                <div className="space-y-2 flex-1 overflow-y-auto">
                                    {stageDeals.map((d) => (
                                        <div
                                            key={d.id}
                                            className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2 shadow-sm"
                                        >
                                            <h4 className="font-bold text-xs text-white leading-tight">{d.title}</h4>
                                            <div className="space-y-0.5 text-[10px] text-slate-400">
                                                <p className="flex items-center gap-1 truncate">
                                                    <Building2 className="w-3 h-3 text-slate-500" />
                                                    <span>{d.company?.name || d.contact?.name}</span>
                                                </p>
                                                <p className="text-emerald-400 font-extrabold text-xs">
                                                    Rp {Number(d.amount).toLocaleString('id-ID')}
                                                </p>
                                            </div>

                                            {/* Quick stage transition buttons */}
                                            <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px]">
                                                {st.id !== 'menang' && (
                                                    <button
                                                        onClick={() => handleMoveStage(d.id, 'menang')}
                                                        className="text-emerald-400 hover:underline font-bold"
                                                    >
                                                        Mark Won
                                                    </button>
                                                )}
                                                {st.id !== 'kalah' && (
                                                    <button
                                                        onClick={() => handleMoveStage(d.id, 'kalah')}
                                                        className="text-rose-400 hover:underline font-bold"
                                                    >
                                                        Mark Lost
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
