import React, { useState, useMemo } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Workflow as WorkflowIcon,
    Zap,
    GitFork,
    MessageSquare,
    UserCheck,
    ShieldCheck,
    Play,
    ArrowRight,
    CheckCircle2,
    Plus,
    Edit3,
    Trash2,
    AlertTriangle,
    X,
    Cpu,
    Radio
} from 'lucide-react';

interface Workflow {
    id: number;
    name: string;
    is_active: boolean;
    definition: {
        trigger?: string;
        action?: string;
        description?: string;
        nodes?: Array<{
            id: string;
            type: string;
            title: string;
            description: string;
        }>;
    } | null;
    created_at: string;
}

interface Props {
    workflows: Workflow[];
}

export default function AutomationsIndex({ workflows = [] }: Props) {
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(workflows[0] || null);

    // Create Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const createForm = useForm({
        name: '',
        trigger: 'incoming_message',
        action: 'auto_reply_ai',
        description: '',
    });

    // Edit Modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const editForm = useForm({
        name: '',
        trigger: 'incoming_message',
        action: 'auto_reply_ai',
        description: '',
        is_active: true,
    });

    // Delete Modal
    const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);

    const openEdit = (wf: Workflow) => {
        setEditingWorkflow(wf);
        editForm.setData({
            name: wf.name || '',
            trigger: wf.definition?.trigger || 'incoming_message',
            action: wf.definition?.action || 'auto_reply_ai',
            description: wf.definition?.description || '',
            is_active: wf.is_active ?? true,
        });
        setIsEditOpen(true);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/app/automations', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWorkflow) return;
        editForm.put(`/app/automations/${editingWorkflow.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                setEditingWorkflow(null);
            },
        });
    };

    const handleDelete = () => {
        if (!deletingWorkflow) return;
        router.delete(`/app/automations/${deletingWorkflow.id}`, {
            onSuccess: () => {
                if (selectedWorkflow?.id === deletingWorkflow.id) {
                    setSelectedWorkflow(workflows.find(w => w.id !== deletingWorkflow.id) || null);
                }
                setDeletingWorkflow(null);
            },
        });
    };

    const toggleActive = (wf: Workflow) => {
        router.put(`/app/automations/${wf.id}`, {
            name: wf.name,
            trigger: wf.definition?.trigger || 'incoming_message',
            action: wf.definition?.action || 'auto_reply_ai',
            description: wf.definition?.description || '',
            is_active: !wf.is_active,
        });
    };

    // Metrics
    const totalCount = workflows.length;
    const activeCount = workflows.filter(w => w.is_active).length;

    // Visual Node Representation for selected workflow
    const currentNodes = useMemo(() => {
        if (selectedWorkflow?.definition?.nodes && selectedWorkflow.definition.nodes.length > 0) {
            return selectedWorkflow.definition.nodes;
        }

        const trigger = selectedWorkflow?.definition?.trigger || 'incoming_message';
        const action = selectedWorkflow?.definition?.action || 'auto_reply_ai';

        const triggerLabel = trigger === 'incoming_message' ? 'Pesan Masuk WhatsApp' :
            trigger === 'inactivity_24h' ? 'Jendela 24 Jam Berakhir' :
            trigger === 'keyword_quote' ? 'Deteksi Permintaan Penawaran Harga' : trigger;

        const actionLabel = action === 'auto_reply_ai' ? 'AI Sales Orchestrator Membalas Otomatis' :
            action === 'handoff_human' ? 'Eskalasi ke Antrean Manusia Utama' :
            action === 'send_template' ? 'Kirim WhatsApp Template Resmi Meta' : action;

        return [
            { id: '1', type: 'trigger', title: triggerLabel, description: 'Event pemicu webhook dari server WhatsApp Gateway' },
            { id: '2', type: 'condition', title: 'Pengecekan Kebijakan & Eligibility', description: 'Validasi jendela 24 jam, batas margin harga (Floor Price), dan status pause' },
            { id: '3', type: 'action', title: actionLabel, description: selectedWorkflow?.definition?.description || 'Eksekusi instruksi aksi otonom' },
            { id: '4', type: 'handoff', title: 'Sinkronisasi CRM & Audit Log', description: 'Catat log eksekusi dan update riwayat kontak secara real-time' }
        ];
    }, [selectedWorkflow]);

    return (
        <AppLayout title="Workflow Otomatisasi & Chatbot">
            <Head title="Automasi Logika Bisnis" />

            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                Automasi Alur Percakapan & Routing Chatbot
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Desain alur kerja logika percakapan, penjadwalan reminder outbound, dan jembatan eskalasi manusia otomatis.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambah Aturan Automasi</span>
                    </button>
                </div>

                {/* 4 Pastel Top Stat Cards - CRM HQ Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#eff6ff] border border-blue-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">Total Automasi</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</div>
                            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Terdaftar di sistem
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                            <WorkflowIcon className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Status Aktif</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{activeCount}</div>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Bekerja memproses chat
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff7ed] border border-amber-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">SSRF & Loop Guard</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">PROTECTED</div>
                            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Anti-infinite reply bot
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#f5f3ff] border border-purple-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-purple-500 uppercase tracking-wider block">AI Orchestrator</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">REALTIME</div>
                            <span className="text-[11px] text-purple-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Pricing & Handoff Engine
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600">
                            <Cpu className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Grid Layout: Workflow Selector & Visual Pipeline */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Workflows List */}
                    <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                                Daftar Aturan ({workflows.length})
                            </h3>
                            <span className="text-[11px] text-slate-400">Pilih untuk melihat alur</span>
                        </div>

                        <div className="space-y-2">
                            {workflows.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <WorkflowIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                    <p className="font-semibold text-slate-600">Belum ada aturan automasi</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Klik "+ Tambah Aturan Automasi" di atas.</p>
                                </div>
                            ) : (
                                workflows.map((wf) => {
                                    const isSelected = selectedWorkflow?.id === wf.id;
                                    return (
                                        <div
                                            key={wf.id}
                                            onClick={() => setSelectedWorkflow(wf)}
                                            className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                                                isSelected
                                                    ? 'bg-indigo-50/50 border-indigo-200 shadow-xs'
                                                    : 'border-slate-200/70 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-slate-800">{wf.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleActive(wf);
                                                        }}
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                            wf.is_active
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                                        }`}
                                                    >
                                                        {wf.is_active ? 'AKTIF' : 'NON-AKTIF'}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2">
                                                    {wf.definition?.description || 'Tidak ada deskripsi tambahan.'}
                                                </p>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 font-mono">
                                                    <span>Trigger: {wf.definition?.trigger || 'incoming_message'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => openEdit(wf)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    title="Ubah Automasi"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingWorkflow(wf)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="Hapus Automasi"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Visual Execution Pipeline Flow */}
                    <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <span>Pipeline Eksekusi Alur: {selectedWorkflow?.name || 'Pilih Workflow'}</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Visualisasi rantai logika event-driven yang dijalankan pada saat event terjadi.
                                </p>
                            </div>
                            {selectedWorkflow && (
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                    selectedWorkflow.is_active
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                    {selectedWorkflow.is_active ? 'Status: Active' : 'Status: Paused'}
                                </span>
                            )}
                        </div>

                        {/* Pipeline Node Cards */}
                        <div className="space-y-4">
                            {currentNodes.map((node, index) => (
                                <div key={node.id} className="relative">
                                    <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white transition shadow-2xs">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-xs">
                                            0{index + 1}
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-xs text-slate-800">{node.title}</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">{node.description}</p>
                                        </div>
                                    </div>
                                    {index < currentNodes.length - 1 && (
                                        <div className="w-0.5 h-4 bg-indigo-200 mx-auto my-1" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MODAL CREATE WORKFLOW */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Tambah Aturan Automasi Baru</h3>
                                </div>
                                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nama Aturan Automasi *</label>
                                    <input
                                        type="text"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="contoh: Auto Reply & Handoff Escalation"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Pemicu (Trigger) *</label>
                                        <select
                                            value={createForm.data.trigger}
                                            onChange={(e) => createForm.setData('trigger', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="incoming_message">Pesan Masuk WhatsApp</option>
                                            <option value="keyword_quote">Permintaan Penawaran Harga</option>
                                            <option value="inactivity_24h">Jendela 24 Jam Berakhir</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Aksi Eksekusi *</label>
                                        <select
                                            value={createForm.data.action}
                                            onChange={(e) => createForm.setData('action', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="auto_reply_ai">AI Sales Balas Mandiri</option>
                                            <option value="handoff_human">Eskalasi ke Agen Manusia</option>
                                            <option value="send_template">Kirim Template Resmi Meta</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Deskripsi Tambahan</label>
                                    <textarea
                                        value={createForm.data.description}
                                        onChange={(e) => createForm.setData('description', e.target.value)}
                                        rows={3}
                                        placeholder="Keterangan aturan automasi ini..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                                    >
                                        {createForm.processing ? 'Menyimpan...' : 'Simpan Automasi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL EDIT WORKFLOW */}
                {isEditOpen && editingWorkflow && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Edit3 className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Ubah Aturan Automasi</h3>
                                </div>
                                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEdit} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nama Aturan *</label>
                                    <input
                                        type="text"
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Pemicu (Trigger) *</label>
                                        <select
                                            value={editForm.data.trigger}
                                            onChange={(e) => editForm.setData('trigger', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="incoming_message">Pesan Masuk WhatsApp</option>
                                            <option value="keyword_quote">Permintaan Penawaran Harga</option>
                                            <option value="inactivity_24h">Jendela 24 Jam Berakhir</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Aksi Eksekusi *</label>
                                        <select
                                            value={editForm.data.action}
                                            onChange={(e) => editForm.setData('action', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="auto_reply_ai">AI Sales Balas Mandiri</option>
                                            <option value="handoff_human">Eskalasi ke Agen Manusia</option>
                                            <option value="send_template">Kirim Template Resmi Meta</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Deskripsi Tambahan</label>
                                    <textarea
                                        value={editForm.data.description}
                                        onChange={(e) => editForm.setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="is_active_check"
                                        checked={editForm.data.is_active}
                                        onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="is_active_check" className="text-slate-700 font-semibold text-xs cursor-pointer">
                                        Aktifkan automasi ini sekarang
                                    </label>
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                                    >
                                        {editForm.processing ? 'Menyimpan...' : 'Perbarui Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DELETE WORKFLOW */}
                {deletingWorkflow && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Hapus Aturan Automasi?</h3>
                                    <p className="text-[11px] text-slate-500">Tindakan ini permanen.</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Aturan <strong className="text-slate-800">{deletingWorkflow.name}</strong> akan dihapus dari sistem.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setDeletingWorkflow(null)}
                                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
