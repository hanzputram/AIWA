import React, { useState, useMemo } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    MessageSquareText,
    CheckCircle2,
    Clock,
    XCircle,
    Plus,
    Edit3,
    Trash2,
    ShieldCheck,
    Search,
    AlertTriangle,
    X,
    Sparkles,
    FileText,
    Smartphone
} from 'lucide-react';

interface Channel {
    id: number;
    phone_e164?: string;
    phone_number?: string;
    name: string;
}

interface Template {
    id: number;
    channel_id: number | null;
    name: string;
    category: string;
    language: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paused';
    header_type: 'none' | 'text' | 'image' | 'document' | null;
    header_content: string | null;
    body_content: string;
    footer_content: string | null;
    buttons: any[] | null;
    channel?: Channel;
}

interface Props {
    templates: Template[];
    channels: Channel[];
}

export default function TemplatesPage({ templates = [], channels = [] }: Props) {
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(templates[0] || null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Create Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const createForm = useForm({
        name: '',
        channel_id: channels[0]?.id ? String(channels[0].id) : '',
        category: 'marketing',
        language: 'id',
        header_type: 'none',
        header_content: '',
        body_content: 'Halo {{1}}, terima kasih telah menghubungi kami. Berikut adalah informasi katalog penawaran terbaru kami...',
        footer_content: 'Balas STOP untuk berhenti berlangganan',
    });

    // Edit Modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const editForm = useForm({
        name: '',
        channel_id: '',
        category: 'marketing',
        language: 'id',
        header_type: 'none',
        header_content: '',
        body_content: '',
        footer_content: '',
    });

    // Delete Modal
    const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);

    const openEdit = (tmpl: Template) => {
        setEditingTemplate(tmpl);
        editForm.setData({
            name: tmpl.name || '',
            channel_id: tmpl.channel_id ? String(tmpl.channel_id) : '',
            category: tmpl.category || 'marketing',
            language: tmpl.language || 'id',
            header_type: tmpl.header_type || 'none',
            header_content: tmpl.header_content || '',
            body_content: tmpl.body_content || '',
            footer_content: tmpl.footer_content || '',
        });
        setIsEditOpen(true);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/app/campaigns/templates', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTemplate) return;
        editForm.put(`/app/campaigns/templates/${editingTemplate.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                setEditingTemplate(null);
            },
        });
    };

    const handleDelete = () => {
        if (!deletingTemplate) return;
        router.delete(`/app/campaigns/templates/${deletingTemplate.id}`, {
            onSuccess: () => setDeletingTemplate(null),
        });
    };

    // Filter templates
    const filteredTemplates = useMemo(() => {
        return templates.filter((t) => {
            const matchesSearch =
                (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (t.body_content || '').toLowerCase().includes(search.toLowerCase());
            const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
            return matchesSearch && matchesCat;
        });
    }, [templates, search, categoryFilter]);

    // Metrics
    const totalCount = templates.length;
    const approvedCount = templates.filter(t => t.status === 'approved').length;
    const marketingCount = templates.filter(t => t.category === 'marketing').length;
    const utilityCount = templates.filter(t => t.category === 'utility' || t.category === 'authentication').length;

    return (
        <AppLayout title="Template WhatsApp Resmi (WABA)">
            <Head title="Katalog Template Pesan" />

            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                Katalog Template WhatsApp Resmi (WABA)
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Template resmi pre-approved Meta untuk pesan outbound di luar jendela 24 jam dan siaran campaign pemasaran.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambah Template Baru</span>
                    </button>
                </div>

                {/* 4 Pastel Top Stat Cards - CRM HQ Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#eff6ff] border border-blue-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">Total Template</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</div>
                            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Terdaftar di sistem
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                            <MessageSquareText className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Disetujui Meta</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{approvedCount}</div>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Siap kirim pesan broadcast
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff7ed] border border-amber-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">Kategori Marketing</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{marketingCount}</div>
                            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Promosi & penawaran
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <Sparkles className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#f5f3ff] border border-purple-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-purple-500 uppercase tracking-wider block">Utility & Transaksi</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{utilityCount}</div>
                            <span className="text-[11px] text-purple-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Konfirmasi & notifikasi
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama atau isi teks template..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="text-xs text-slate-500 whitespace-nowrap">Kategori:</span>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                            {['all', 'marketing', 'utility', 'authentication'].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCategoryFilter(c)}
                                    className={`px-3 py-1 text-xs rounded-lg font-medium capitalize transition ${
                                        categoryFilter === c
                                            ? 'bg-white text-indigo-600 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {c === 'all' ? 'Semua' : c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Two-Column Grid: List & WhatsApp Balloon Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Template List */}
                    <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
                        {filteredTemplates.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <MessageSquareText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                <p className="font-semibold text-slate-600">Belum ada template yang cocok</p>
                                <p className="text-xs text-slate-400 mt-0.5">Buat template baru dengan tombol di atas.</p>
                            </div>
                        ) : (
                            filteredTemplates.map((t) => {
                                const isSelected = selectedTemplate?.id === t.id;
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t)}
                                        className={`p-4 cursor-pointer transition flex items-start justify-between gap-3 ${
                                            isSelected ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm text-slate-800">{t.name}</h4>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    APPROVED
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                {t.body_content}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                                                <span className="capitalize font-medium text-slate-600">{t.category}</span>
                                                <span>·</span>
                                                <span className="font-mono">{t.language.toUpperCase()}</span>
                                                {t.channel && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="text-indigo-600 font-medium">{t.channel.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => openEdit(t)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                title="Ubah Template"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeletingTemplate(t)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                title="Hapus Template"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Interactive WhatsApp Device Preview */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-emerald-600" />
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Preview Pesan WhatsApp</h3>
                                </div>
                                <span className="text-[11px] text-slate-400">WhatsApp Business Client</span>
                            </div>

                            {selectedTemplate ? (
                                <div className="bg-[#efeae2] p-4 rounded-xl space-y-3 min-h-[220px] flex flex-col justify-end">
                                    {/* Chat Bubble */}
                                    <div className="bg-white rounded-xl rounded-tl-none p-3.5 shadow-xs max-w-[90%] space-y-2 text-xs">
                                        {selectedTemplate.header_content && (
                                            <div className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1">
                                                {selectedTemplate.header_content}
                                            </div>
                                        )}
                                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                                            {selectedTemplate.body_content}
                                        </p>
                                        {selectedTemplate.footer_content && (
                                            <p className="text-[10px] text-slate-400 pt-1">
                                                {selectedTemplate.footer_content}
                                            </p>
                                        )}
                                        <div className="text-[10px] text-slate-400 text-right">
                                            12:00 ✓✓
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400">
                                    Pilih template di sebelah kiri untuk melihat preview live.
                                </div>
                            )}

                            {selectedTemplate && (
                                <div className="pt-2 text-xs text-slate-500 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Nama Resmi:</span>
                                        <span className="font-mono text-slate-800 font-medium">{selectedTemplate.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Bahasa:</span>
                                        <span className="text-slate-800 font-medium">{selectedTemplate.language}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kategori:</span>
                                        <span className="text-slate-800 capitalize font-medium">{selectedTemplate.category}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MODAL CREATE TEMPLATE */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Buat Template WhatsApp Baru</h3>
                                </div>
                                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nama Template (Huruf kecil & underscore) *</label>
                                    <input
                                        type="text"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                        placeholder="contoh: promo_katalog_september"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Kategori *</label>
                                        <select
                                            value={createForm.data.category}
                                            onChange={(e) => createForm.setData('category', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="marketing">Marketing (Promosi)</option>
                                            <option value="utility">Utility (Transaksi / Order)</option>
                                            <option value="authentication">Authentication (OTP)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Bahasa *</label>
                                        <select
                                            value={createForm.data.language}
                                            onChange={(e) => createForm.setData('language', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="id">Indonesian (id)</option>
                                            <option value="en">English (en)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Header (Opsional Judul)</label>
                                    <input
                                        type="text"
                                        value={createForm.data.header_content}
                                        onChange={(e) => createForm.setData('header_content', e.target.value)}
                                        placeholder="PENAWARAN KHUSUS PELANGGAN SETIA"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">
                                        Isi Pesan (Body) * <span className="text-slate-400 font-normal">(Gunakan &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; untuk variabel nama, dsb)</span>
                                    </label>
                                    <textarea
                                        value={createForm.data.body_content}
                                        onChange={(e) => createForm.setData('body_content', e.target.value)}
                                        rows={4}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Footer Pesan (Opsional)</label>
                                    <input
                                        type="text"
                                        value={createForm.data.footer_content}
                                        onChange={(e) => createForm.setData('footer_content', e.target.value)}
                                        placeholder="Ketik STOP untuk berhenti berlangganan"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
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
                                        {createForm.processing ? 'Menyimpan...' : 'Simpan Template'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL EDIT TEMPLATE */}
                {isEditOpen && editingTemplate && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Edit3 className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Ubah Template WhatsApp</h3>
                                </div>
                                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEdit} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nama Template *</label>
                                    <input
                                        type="text"
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Kategori *</label>
                                        <select
                                            value={editForm.data.category}
                                            onChange={(e) => editForm.setData('category', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="marketing">Marketing</option>
                                            <option value="utility">Utility</option>
                                            <option value="authentication">Authentication</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Bahasa *</label>
                                        <select
                                            value={editForm.data.language}
                                            onChange={(e) => editForm.setData('language', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="id">Indonesian (id)</option>
                                            <option value="en">English (en)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Header</label>
                                    <input
                                        type="text"
                                        value={editForm.data.header_content}
                                        onChange={(e) => editForm.setData('header_content', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Isi Pesan (Body) *</label>
                                    <textarea
                                        value={editForm.data.body_content}
                                        onChange={(e) => editForm.setData('body_content', e.target.value)}
                                        rows={4}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Footer</label>
                                    <input
                                        type="text"
                                        value={editForm.data.footer_content}
                                        onChange={(e) => editForm.setData('footer_content', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
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

                {/* MODAL DELETE TEMPLATE */}
                {deletingTemplate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Hapus Template WhatsApp?</h3>
                                    <p className="text-[11px] text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Template <strong className="text-slate-800">{deletingTemplate.name}</strong> akan dihapus permanen dari sistem.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setDeletingTemplate(null)}
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
