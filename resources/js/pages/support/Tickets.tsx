import React, { useState, useMemo } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Ticket as TicketIcon,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Plus,
    Edit3,
    Trash2,
    Search,
    X,
    UserCheck,
    ShieldAlert,
    HelpCircle,
    Flame
} from 'lucide-react';

interface Contact {
    id: number;
    name: string;
    phone_e164: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Ticket {
    id: number;
    ticket_number: string;
    title: string;
    contact_id: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
    assigned_user_id: number | null;
    sla_due_at: string | null;
    resolved_at: string | null;
    created_at: string;
    contact?: Contact;
    assignedUser?: User;
}

interface Props {
    tickets: Ticket[];
    contacts: Contact[];
    users: User[];
}

export default function TicketsIndex({ tickets = [], contacts = [], users = [] }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Create Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const createForm = useForm({
        title: '',
        contact_id: contacts[0]?.id ? String(contacts[0].id) : '',
        priority: 'medium',
        assigned_user_id: users[0]?.id ? String(users[0].id) : '',
        sla_hours: 24,
    });

    // Edit Modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
    const editForm = useForm({
        title: '',
        contact_id: '',
        priority: 'medium',
        status: 'new',
        assigned_user_id: '',
    });

    // Delete Modal
    const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);

    const openEdit = (t: Ticket) => {
        setEditingTicket(t);
        editForm.setData({
            title: t.title || '',
            contact_id: String(t.contact_id),
            priority: t.priority || 'medium',
            status: t.status || 'new',
            assigned_user_id: t.assigned_user_id ? String(t.assigned_user_id) : '',
        });
        setIsEditOpen(true);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/app/tickets', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTicket) return;
        editForm.put(`/app/tickets/${editingTicket.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                setEditingTicket(null);
            },
        });
    };

    const handleDelete = () => {
        if (!deletingTicket) return;
        router.delete(`/app/tickets/${deletingTicket.id}`, {
            onSuccess: () => setDeletingTicket(null),
        });
    };

    const handleQuickResolve = (id: number) => {
        router.patch(`/app/tickets/${id}/status`, { status: 'resolved' });
    };

    // Filter tickets
    const filteredTickets = useMemo(() => {
        return tickets.filter((t) => {
            const matchesSearch =
                (t.ticket_number || '').toLowerCase().includes(search.toLowerCase()) ||
                (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
                (t.contact?.name || '').toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tickets, search, statusFilter]);

    // Metrics
    const totalCount = tickets.length;
    const newCount = tickets.filter(t => t.status === 'new' || t.status === 'in_progress').length;
    const urgentCount = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

    const getPriorityBadge = (p: Ticket['priority']) => {
        switch (p) {
            case 'urgent':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">URGENT</span>;
            case 'high':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">HIGH</span>;
            case 'medium':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">MEDIUM</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">LOW</span>;
        }
    };

    const getStatusBadge = (s: Ticket['status']) => {
        switch (s) {
            case 'resolved':
                return (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> SELESAI
                    </span>
                );
            case 'waiting_customer':
                return (
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> MENUNGGU KLIEN
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                        DIPROSES
                    </span>
                );
            default:
                return (
                    <span className="text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                        TIKET BARU
                    </span>
                );
        }
    };

    return (
        <AppLayout title="Tiket Dukungan & SLA Pelanggan">
            <Head title="Pusat Bantuan & Tiket" />

            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                Tiket Dukungan Teknis & Kepatuhan SLA
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Lacak eskalasi masalah klien, penugasan teknisi, dan kepatuhan batas waktu Service Level Agreement (SLA).
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Buka Tiket Baru</span>
                    </button>
                </div>

                {/* 4 Pastel Top Stat Cards - CRM HQ Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#eff6ff] border border-blue-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">Total Tiket</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</div>
                            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Seluruh riwayat komplain
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                            <TicketIcon className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff7ed] border border-amber-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">Tiket Aktif</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{newCount}</div>
                            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Sedang ditangani tim
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff1f2] border border-rose-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">Prioritas Urgent</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{urgentCount}</div>
                            <span className="text-[11px] text-rose-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Butuh respon segera
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600">
                            <Flame className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Tiket Terselesaikan</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{resolvedCount}</div>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Pelanggan puas
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nomor tiket, judul, atau nama klien..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="text-xs text-slate-500 whitespace-nowrap">Status:</span>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                            {['all', 'new', 'in_progress', 'waiting_customer', 'resolved'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1 text-xs rounded-lg font-medium capitalize transition ${
                                        statusFilter === st
                                            ? 'bg-white text-indigo-600 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {st === 'all' ? 'Semua' : st.replace('_', ' ')}
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
                                <th className="p-4">Nomor Tiket</th>
                                <th className="p-4">Subjek / Masalah</th>
                                <th className="p-4">Pelanggan</th>
                                <th className="p-4">Petugas Ditugaskan</th>
                                <th className="p-4">Prioritas</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Target SLA</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        <TicketIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                        <p className="font-semibold text-slate-600">Belum ada tiket dukungan</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Klik "+ Buka Tiket Baru" untuk mencatat keluhan atau kendala klien.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                                        <td className="p-4 font-mono font-bold text-indigo-600 text-xs">
                                            {t.ticket_number}
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-slate-800 block text-xs">{t.title}</span>
                                            <span className="text-[10px] text-slate-400 block mt-0.5">
                                                Dibuat: {new Date(t.created_at).toLocaleDateString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-slate-800 block">{t.contact?.name || 'Anonim'}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{t.contact?.phone_e164 || '-'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium text-slate-700 flex items-center gap-1.5">
                                                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{t.assignedUser?.name || 'Belum ditugaskan'}</span>
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {getPriorityBadge(t.priority)}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(t.status)}
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            {t.sla_due_at ? (
                                                <span className="text-xs font-mono">
                                                    {new Date(t.sla_due_at).toLocaleDateString('id-ID')} {new Date(t.sla_due_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {t.status !== 'resolved' && t.status !== 'closed' && (
                                                    <button
                                                        onClick={() => handleQuickResolve(t.id)}
                                                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-semibold transition flex items-center gap-1"
                                                        title="Tandai Selesai"
                                                    >
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>Resolve</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openEdit(t)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    title="Ubah Tiket"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingTicket(t)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="Hapus Tiket"
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

                {/* MODAL CREATE TICKET */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Buka Tiket Dukungan Baru</h3>
                                </div>
                                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Judul Masalah / Tiket *</label>
                                    <input
                                        type="text"
                                        value={createForm.data.title}
                                        onChange={(e) => createForm.setData('title', e.target.value)}
                                        placeholder="contoh: Kendala Pengiriman MCB Proyek Cikarang"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Pelanggan / Klien *</label>
                                    <select
                                        value={createForm.data.contact_id}
                                        onChange={(e) => createForm.setData('contact_id', e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    >
                                        {contacts.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.phone_e164})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Prioritas *</label>
                                        <select
                                            value={createForm.data.priority}
                                            onChange={(e) => createForm.setData('priority', e.target.value as any)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="low">Low (Santai)</option>
                                            <option value="medium">Medium (Normal)</option>
                                            <option value="high">High (Tinggi)</option>
                                            <option value="urgent">Urgent (Kritis / Darurat)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Petugas Ditugaskan</label>
                                        <select
                                            value={createForm.data.assigned_user_id}
                                            onChange={(e) => createForm.setData('assigned_user_id', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="">-- Belum Ditugaskan --</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Target Batas Waktu SLA (Jam)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={createForm.data.sla_hours}
                                        onChange={(e) => createForm.setData('sla_hours', parseInt(e.target.value) || 24)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">Waktu penyelesaian otomatis dihitung sejak tiket dibuat.</span>
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
                                        {createForm.processing ? 'Menyimpan...' : 'Terbitkan Tiket'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL EDIT TICKET */}
                {isEditOpen && editingTicket && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Edit3 className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Ubah Detail Tiket #{editingTicket.ticket_number}</h3>
                                </div>
                                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEdit} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Judul Masalah *</label>
                                    <input
                                        type="text"
                                        value={editForm.data.title}
                                        onChange={(e) => editForm.setData('title', e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Prioritas *</label>
                                        <select
                                            value={editForm.data.priority}
                                            onChange={(e) => editForm.setData('priority', e.target.value as any)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Status Tiket *</label>
                                        <select
                                            value={editForm.data.status}
                                            onChange={(e) => editForm.setData('status', e.target.value as any)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="new">New</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="waiting_customer">Waiting Customer</option>
                                            <option value="resolved">Resolved (Selesai)</option>
                                            <option value="closed">Closed (Tutup)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Petugas Ditugaskan</label>
                                    <select
                                        value={editForm.data.assigned_user_id}
                                        onChange={(e) => editForm.setData('assigned_user_id', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">-- Belum Ditugaskan --</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
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
                                        {editForm.processing ? 'Menyimpan...' : 'Perbarui Tiket'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DELETE TICKET */}
                {deletingTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Hapus Tiket Dukungan?</h3>
                                    <p className="text-[11px] text-slate-500">Tindakan ini permanen.</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Tiket <strong className="text-slate-800">#{deletingTicket.ticket_number}</strong> ({deletingTicket.title}) akan dihapus dari histori.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setDeletingTicket(null)}
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
