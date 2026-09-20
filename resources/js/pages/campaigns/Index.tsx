import React, { useState, useMemo } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Send,
    Users,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Play,
    Pause,
    XCircle,
    Plus,
    Edit3,
    Trash2,
    Search,
    X,
    Megaphone,
    Sparkles,
    Radio
} from 'lucide-react';

interface Channel {
    id: number;
    phone_e164?: string;
    phone_number?: string;
    name: string;
}

interface Template {
    id: number;
    name: string;
    category: string;
    language: string;
    body_content?: string;
    body_text?: string;
}

interface Campaign {
    id: number;
    channel_id: number;
    template_id: number;
    name: string;
    status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';
    total_recipients: number;
    sent_count?: number;
    successful_sends?: number;
    failed_count?: number;
    failed_sends?: number;
    scheduled_at: string | null;
    created_at: string;
    channel?: Channel;
    template?: Template;
}

interface Props {
    campaigns: Campaign[];
    channels: Channel[];
    templates: Template[];
    total_contacts: number;
}

export default function CampaignsIndex({
    campaigns = [],
    channels = [],
    templates = [],
    total_contacts = 0,
}: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Create Campaign Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const createForm = useForm({
        name: '',
        channel_id: channels[0]?.id ? String(channels[0].id) : '',
        template_id: templates[0]?.id ? String(templates[0].id) : '',
        scheduled_at: '',
    });

    // Edit Campaign Modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const editForm = useForm({
        name: '',
        channel_id: '',
        template_id: '',
        scheduled_at: '',
        status: 'scheduled',
    });

    // Delete Campaign Modal
    const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

    const openEdit = (c: Campaign) => {
        setEditingCampaign(c);
        editForm.setData({
            name: c.name || '',
            channel_id: String(c.channel_id),
            template_id: String(c.template_id),
            scheduled_at: c.scheduled_at ? c.scheduled_at.slice(0, 16) : '',
            status: c.status || 'scheduled',
        });
        setIsEditOpen(true);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/app/campaigns', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCampaign) return;
        editForm.put(`/app/campaigns/${editingCampaign.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                setEditingCampaign(null);
            },
        });
    };

    const handleDelete = () => {
        if (!deletingCampaign) return;
        router.delete(`/app/campaigns/${deletingCampaign.id}`, {
            onSuccess: () => setDeletingCampaign(null),
        });
    };

    // Filter campaigns
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter((c) => {
            const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [campaigns, search, statusFilter]);

    // Metrics
    const totalCount = campaigns.length;
    const runningCount = campaigns.filter(c => c.status === 'running').length;
    const completedCount = campaigns.filter(c => c.status === 'completed').length;
    const totalSent = campaigns.reduce((acc, c) => acc + (c.sent_count || c.successful_sends || 0), 0);

    const getStatusBadge = (status: Campaign['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> SELESAI
                    </span>
                );
            case 'running':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                        <Play className="w-3 h-3 fill-current" /> BERJALAN
                    </span>
                );
            case 'paused':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Pause className="w-3 h-3" /> DIJEDA
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" /> DIBATALKAN
                    </span>
                );
            case 'scheduled':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Clock className="w-3 h-3" /> TERJADWAL
                    </span>
                );
        }
    };

    return (
        <AppLayout title="Campaign Broadcast WhatsApp">
            <Head title="Siaran Pesan Massal" />

            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                WhatsApp Broadcast & Outbound Campaigns
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Kirim pesan massal aman terverifikasi Meta ke {total_contacts} kontak terdaftar sesuai kuota dan batasan anti-spam.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/app/campaigns/templates"
                            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                        >
                            <span>Lihat Template Meta</span>
                        </Link>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ Buat Campaign Baru</span>
                        </button>
                    </div>
                </div>

                {/* 4 Pastel Top Stat Cards - CRM HQ Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#eff6ff] border border-blue-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">Total Campaign</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</div>
                            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Terdaftar di sistem
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                            <Megaphone className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Selesai Terkirim</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{completedCount}</div>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Sukses sampai ke pelanggan
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff7ed] border border-amber-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">Sedang Berjalan</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{runningCount}</div>
                            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Antrean aktif
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <Radio className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#f5f3ff] border border-purple-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-purple-500 uppercase tracking-wider block">Audiens Terjangkau</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{total_contacts}</div>
                            <span className="text-[11px] text-purple-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Kontak CRM siap disapa
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama campaign..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="text-xs text-slate-500 whitespace-nowrap">Status:</span>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                            {['all', 'scheduled', 'running', 'completed', 'paused'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1 text-xs rounded-lg font-medium capitalize transition ${
                                        statusFilter === st
                                            ? 'bg-white text-indigo-600 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {st === 'all' ? 'Semua' : st}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="p-4">Nama Campaign</th>
                                <th className="p-4">Template Resmi</th>
                                <th className="p-4">Saluran WhatsApp</th>
                                <th className="p-4">Jadwal / Waktu</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Target Kontak</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCampaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                        <p className="font-semibold text-slate-600">Belum ada campaign siaran pesan</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Klik "+ Buat Campaign Baru" untuk menjadwalkan siaran.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCampaigns.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                                        <td className="p-4">
                                            <span className="font-bold text-slate-800 block text-xs">{c.name}</span>
                                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                                ID: #{c.id} · Dibuat: {new Date(c.created_at).toLocaleDateString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-mono font-medium">
                                                {c.template?.name || 'Template Default'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            <span className="font-semibold text-slate-800 block">{c.channel?.name || 'Semua Channel'}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{c.channel?.phone_e164 || '-'}</span>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            {c.scheduled_at ? (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{new Date(c.scheduled_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">Langsung Kirim</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(c.status)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-extrabold text-slate-800 text-sm">
                                                {c.total_recipients || total_contacts}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block">penerima</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    title="Ubah Campaign"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingCampaign(c)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="Hapus Campaign"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MODAL CREATE CAMPAIGN */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Jadwalkan Siaran Campaign Baru</h3>
                                </div>
                                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nama Campaign *</label>
                                    <input
                                        type="text"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="contoh: Penawaran Spesial MCB Schneider Q3"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Nomor Pengirim *</label>
                                        <select
                                            value={createForm.data.channel_id}
                                            onChange={(e) => createForm.setData('channel_id', e.target.value)}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            {channels.map((ch) => (
                                                <option key={ch.id} value={ch.id}>{ch.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Template WhatsApp *</label>
                                        <select
                                            value={createForm.data.template_id}
                                            onChange={(e) => createForm.setData('template_id', e.target.value)}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            {templates.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Waktu Pelaksanaan / Jadwal</label>
                                    <input
                                        type="datetime-local"
                                        value={createForm.data.scheduled_at}
                                        onChange={(e) => createForm.setData('scheduled_at', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">Kosongkan jika ingin langsung dikirim setelah dibuat.</span>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                                    <p className="font-semibold text-slate-800">Ringkasan Pengiriman:</p>
                                    <p>Pesan akan dikirimkan ke <strong className="text-indigo-600">{total_contacts} kontak CRM</strong> aktif menggunakan laju pengiriman bertahap (rate-limited) untuk menjaga skor reputasi nomor.</p>
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
                                        {createForm.processing ? 'Menjadwalkan...' : 'Jadwalkan Campaign'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL EDIT CAMPAIGN */}
                {isEditOpen && editingCampaign && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Edit3 className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Ubah Campaign Siaran</h3>
                                </div>
                                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEdit} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nama Campaign *</label>
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
                                        <label className="block text-slate-700 font-semibold mb-1">Nomor Pengirim *</label>
                                        <select
                                            value={editForm.data.channel_id}
                                            onChange={(e) => editForm.setData('channel_id', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            {channels.map((ch) => (
                                                <option key={ch.id} value={ch.id}>{ch.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Status Campaign</label>
                                        <select
                                            value={editForm.data.status}
                                            onChange={(e) => editForm.setData('status', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="scheduled">Scheduled (Terjadwal)</option>
                                            <option value="running">Running (Berjalan)</option>
                                            <option value="paused">Paused (Dijeda)</option>
                                            <option value="completed">Completed (Selesai)</option>
                                            <option value="cancelled">Cancelled (Dibatalkan)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Waktu Pelaksanaan</label>
                                    <input
                                        type="datetime-local"
                                        value={editForm.data.scheduled_at}
                                        onChange={(e) => editForm.setData('scheduled_at', e.target.value)}
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
                                        {editForm.processing ? 'Menyimpan...' : 'Perbarui Campaign'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DELETE CAMPAIGN */}
                {deletingCampaign && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Hapus Campaign Siaran?</h3>
                                    <p className="text-[11px] text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Campaign <strong className="text-slate-800">{deletingCampaign.name}</strong> akan dihapus permanen.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setDeletingCampaign(null)}
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
