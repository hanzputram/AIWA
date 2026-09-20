import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import {
    TrendingUp,
    Plus,
    Building2,
    Edit2,
    Trash2,
    X,
    DollarSign,
    CheckCircle2,
    ArrowRight,
} from 'lucide-react';

interface Props {
    deals: Array<any>;
    contacts: Array<any>;
    companies: Array<any>;
}

export default function DealsIndex({ deals, contacts, companies }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<any>(null);

    const stages = [
        { id: 'baru', label: '1. Baru', dot: 'bg-slate-400', bg: 'bg-slate-50' },
        { id: 'kualifikasi', label: '2. Kualifikasi', dot: 'bg-blue-500', bg: 'bg-blue-50/40' },
        { id: 'penawaran', label: '3. Penawaran', dot: 'bg-amber-500', bg: 'bg-amber-50/40' },
        { id: 'negosiasi', label: '4. Negosiasi', dot: 'bg-indigo-500', bg: 'bg-indigo-50/40' },
        { id: 'menang', label: '5. Menang (Won)', dot: 'bg-emerald-500', bg: 'bg-emerald-50/40' },
        { id: 'kalah', label: '6. Kalah (Lost)', dot: 'bg-rose-500', bg: 'bg-rose-50/40' },
    ];

    const [form, setForm] = useState({
        title: '',
        contact_id: '',
        company_id: '',
        stage: 'baru',
        amount: '',
        expected_close_date: '',
    });

    const openCreate = () => {
        setSelectedDeal(null);
        setForm({
            title: '',
            contact_id: contacts[0]?.id?.toString() || '',
            company_id: companies[0]?.id?.toString() || '',
            stage: 'baru',
            amount: '',
            expected_close_date: '',
        });
        setIsCreateOpen(true);
    };

    const openEdit = (d: any) => {
        setSelectedDeal(d);
        setForm({
            title: d.title,
            contact_id: d.contact_id?.toString() || '',
            company_id: d.company_id?.toString() || '',
            stage: d.stage || 'baru',
            amount: d.amount?.toString() || '',
            expected_close_date: d.expected_close_date || '',
        });
        setIsEditOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedDeal) {
            router.put(`/app/deals/${selectedDeal.id}`, form, {
                onSuccess: () => setIsEditOpen(false),
            });
        } else {
            router.post('/app/deals', form, {
                onSuccess: () => setIsCreateOpen(false),
            });
        }
    };

    const handleDelete = (id: number, title: string) => {
        if (confirm(`Hapus deal [${title}]?`)) {
            router.delete(`/app/deals/${id}`);
        }
    };

    const handleMoveStage = async (dealId: number, nextStage: string) => {
        try {
            await window.axios.patch(`/api/v1/deals/${dealId}/stage`, { stage: nextStage });
            router.reload();
        } catch (e) {
            alert('Gagal memindahkan stage deal');
        }
    };

    return (
        <AppLayout title="Pipeline Deals Penjualan">
            <Head title="Pipeline Deals — AIWA HQ" />

            <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 tracking-tight">
                                Pipeline Penjualan & Peluang Deals B2B
                            </h1>
                            <p className="text-xs text-slate-500">
                                Pantau pergerakan prospek dari kualifikasi awal hingga tahap penawaran, negosiasi AI, dan konfirmasi closing.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Buat Deal Baru</span>
                    </button>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 overflow-x-auto pb-4">
                    {stages.map((st) => {
                        const stageDeals = deals.filter((d) => d.stage === st.id);
                        const totalVal = stageDeals.reduce((sum, d) => sum + Number(d.amount), 0);

                        return (
                            <div
                                key={st.id}
                                className={`bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col min-w-[220px] space-y-3 shadow-xs`}
                            >
                                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`}></span>
                                        <span className="font-bold text-xs text-slate-900">{st.label}</span>
                                    </div>
                                    <span className="text-[10px] bg-slate-100 text-slate-700 font-extrabold px-2 py-0.5 rounded-full font-mono">
                                        {stageDeals.length}
                                    </span>
                                </div>

                                <div className="text-[11px] font-bold text-slate-500">
                                    Total: <strong className="text-slate-900">Rp {totalVal.toLocaleString('id-ID')}</strong>
                                </div>

                                <div className="space-y-3 flex-1 overflow-y-auto">
                                    {stageDeals.map((d) => (
                                        <div
                                            key={d.id}
                                            className="p-4 bg-white border border-slate-200/70 rounded-xl space-y-2.5 shadow-2xs hover:border-blue-300 transition"
                                        >
                                            <div className="flex items-start justify-between gap-1">
                                                <h4 className="font-bold text-xs text-slate-900 leading-snug">{d.title}</h4>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => openEdit(d)}
                                                        className="text-slate-400 hover:text-blue-600 p-0.5"
                                                        title="Ubah Deal"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(d.id, d.title)}
                                                        className="text-slate-400 hover:text-rose-600 p-0.5"
                                                        title="Hapus Deal"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-1 text-[11px] text-slate-500">
                                                <p className="flex items-center gap-1 truncate font-medium">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span className="truncate">{d.company?.name || d.contact?.name}</span>
                                                </p>
                                                <p className="text-blue-600 font-extrabold text-xs">
                                                    Rp {Number(d.amount).toLocaleString('id-ID')}
                                                </p>
                                            </div>

                                            {/* Stage Mover Selector */}
                                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                                <span className="text-slate-400 font-medium">Pindah stage:</span>
                                                <select
                                                    value={d.stage}
                                                    onChange={(e) => handleMoveStage(d.id, e.target.value)}
                                                    className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700"
                                                >
                                                    {stages.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}

                                    {stageDeals.length === 0 && (
                                        <div className="py-6 text-center text-slate-400 text-[11px] italic">
                                            Kosong
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CREATE / EDIT DEAL MODAL */}
            {(isCreateOpen || isEditOpen) && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">
                                {isCreateOpen ? 'Buat Deal Baru' : 'Ubah Data Deal'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setIsEditOpen(false);
                                }}
                                className="text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Judul Peluang / Proyek *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="Pengadaan Panel MCB Gedung SCBD"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Kontak PIC *</label>
                                    <select
                                        required
                                        value={form.contact_id}
                                        onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                                    >
                                        <option value="">-- Pilih Kontak --</option>
                                        {contacts.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.phone_e164})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Perusahaan</label>
                                    <select
                                        value={form.company_id}
                                        onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                                    >
                                        <option value="">-- Individu / None --</option>
                                        {companies.map((co) => (
                                            <option key={co.id} value={co.id}>
                                                {co.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Nilai Peluang (Rp) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        placeholder="15000000"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Tahap Pipeline</label>
                                    <select
                                        value={form.stage}
                                        onChange={(e) => setForm({ ...form, stage: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                                    >
                                        {stages.map((st) => (
                                            <option key={st.id} value={st.id}>
                                                {st.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Target Tanggal Closing</label>
                                <input
                                    type="date"
                                    value={form.expected_close_date}
                                    onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setIsEditOpen(false);
                                    }}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                                >
                                    Simpan Deal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
