import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import {
    Users,
    UserPlus,
    Shield,
    KeyRound,
    Mail,
    Phone,
    Edit2,
    Trash2,
    X,
    CheckCircle2,
    AlertTriangle,
    Search,
    UserCheck,
    Briefcase,
} from 'lucide-react';

interface UserItem {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    created_at: string;
}

interface Props {
    users: UserItem[];
}

export default function UsersIndex({ users }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

    const createForm = useForm({
        name: '',
        username: '',
        role: 'sales',
        email: '',
        phone: '',
        password: '',
    });

    const editForm = useForm({
        name: '',
        username: '',
        role: 'sales',
        email: '',
        phone: '',
        password: '',
    });

    const openCreateModal = () => {
        createForm.reset();
        createForm.clearErrors();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (user: UserItem) => {
        setEditingUser(user);
        editForm.setData({
            name: user.name,
            username: user.username,
            role: user.role,
            email: user.email,
            phone: user.phone || '',
            password: '',
        });
        editForm.clearErrors();
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/app/users', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        editForm.put(`/app/users/${editingUser.id}`, {
            onSuccess: () => {
                setEditingUser(null);
                editForm.reset();
            },
        });
    };

    const submitDelete = () => {
        if (!deletingUser) return;

        useForm().delete(`/app/users/${deletingUser.id}`, {
            onSuccess: () => setDeletingUser(null),
        });
    };

    const filteredUsers = users.filter((u) => {
        const query = searchTerm.toLowerCase();
        return (
            u.name.toLowerCase().includes(query) ||
            u.username.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.role.toLowerCase().includes(query)
        );
    });

    const getRoleBadge = (role: string) => {
        switch (role.toLowerCase()) {
            case 'owner':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'admin':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'manager':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'pricing_approver':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role.toLowerCase()) {
            case 'owner':
                return 'Owner / Direktur';
            case 'admin':
                return 'Administrator';
            case 'manager':
                return 'Sales Manager';
            case 'pricing_approver':
                return 'Pricing Approver';
            case 'sales':
            case 'agent':
                return 'Sales Representative';
            case 'operator':
                return 'Customer Support';
            default:
                return role;
        }
    };

    return (
        <AppLayout title="Manajemen Pengguna & Tim">
            <Head title="Manajemen Pengguna & Tim — AIWA HQ" />

            <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                                    Manajemen Pengguna & Hak Akses Tim
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Login via Username
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Tambahkan dan kelola akun pengguna tim internal. Seluruh pengguna masuk menggunakan <strong>Username</strong>.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Tambah Pengguna Baru</span>
                    </button>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-800 tracking-tight">{users.length}</div>
                            <div className="text-xs font-semibold text-slate-500">Total Pengguna Terdaftar</div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Shield className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-800 tracking-tight">
                                {users.filter((u) => ['owner', 'admin'].includes(u.role.toLowerCase())).length}
                            </div>
                            <div className="text-xs font-semibold text-slate-500">Owner & Administrator</div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-800 tracking-tight">
                                {users.filter((u) => ['sales', 'agent', 'manager'].includes(u.role.toLowerCase())).length}
                            </div>
                            <div className="text-xs font-semibold text-slate-500">Tim Sales & Negosiasi</div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-800 tracking-tight">
                                {users.filter((u) => u.status === 'active').length}
                            </div>
                            <div className="text-xs font-semibold text-slate-500">Akun Aktif</div>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari nama, username, atau email..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="text-xs font-semibold text-slate-500">
                        Menampilkan <strong className="text-slate-800">{filteredUsers.length}</strong> dari {users.length} pengguna
                    </div>
                </div>

                {/* Table of Users */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                    <th className="py-3 px-4">Nama Lengkap & Username</th>
                                    <th className="py-3 px-4">Peran (Role)</th>
                                    <th className="py-3 px-4">Email Kantor</th>
                                    <th className="py-3 px-4">Nomor Telepon</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-center">Tgl Daftar</th>
                                    <th className="py-3 px-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-400">
                                            Tidak ada pengguna yang cocok dengan pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{u.name}</div>
                                                        <div className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-indigo-600 bg-indigo-50/80 px-1.5 py-0.2 rounded border border-indigo-100">
                                                            @{u.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRoleBadge(u.role)}`}>
                                                    {getRoleLabel(u.role)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                                                {u.email}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                                                {u.phone || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Aktif
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center text-slate-500 text-[11px]">
                                                {u.created_at}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => openEditModal(u)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                        title="Ubah Pengguna"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingUser(u)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                        title="Hapus Pengguna"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL CREATE USER */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 my-8">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <UserPlus className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Tambah Pengguna Baru</h3>
                                        <p className="text-[11px] text-slate-400">Pengguna akan login menggunakan username</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitCreate} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap *</label>
                                    <input
                                        type="text"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Budi Prasetyo"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                    {createForm.errors.name && (
                                        <p className="text-rose-500 text-[10px] mt-0.5">{createForm.errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                                        <span>Username (Untuk Login) *</span>
                                        <span className="text-[10px] text-indigo-600 font-normal">Huruf, angka, tanpa spasi</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">@</span>
                                        <input
                                            type="text"
                                            value={createForm.data.username}
                                            onChange={(e) => createForm.setData('username', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                            placeholder="budi_sales"
                                            required
                                            className="w-full bg-indigo-50/40 border border-indigo-200 rounded-xl pl-7 pr-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    {createForm.errors.username && (
                                        <p className="text-rose-500 text-[10px] mt-0.5">{createForm.errors.username}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Peran / Hak Akses *</label>
                                        <select
                                            value={createForm.data.role}
                                            onChange={(e) => createForm.setData('role', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="sales">Sales Representative</option>
                                            <option value="manager">Sales Manager</option>
                                            <option value="pricing_approver">Pricing Approver</option>
                                            <option value="admin">Administrator</option>
                                            <option value="owner">Owner / Direktur</option>
                                            <option value="operator">Operator Support</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Kata Sandi Awal *</label>
                                        <input
                                            type="password"
                                            value={createForm.data.password}
                                            onChange={(e) => createForm.setData('password', e.target.value)}
                                            placeholder="Minimal 6 karakter"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                        {createForm.errors.password && (
                                            <p className="text-rose-500 text-[10px] mt-0.5">{createForm.errors.password}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Email Kantor (Opsional)</label>
                                    <input
                                        type="email"
                                        value={createForm.data.email}
                                        onChange={(e) => createForm.setData('email', e.target.value)}
                                        placeholder="budi@ats.co.id (otomatis jika kosong)"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nomor WhatsApp / HP (Opsional)</label>
                                    <input
                                        type="text"
                                        value={createForm.data.phone}
                                        onChange={(e) => createForm.setData('phone', e.target.value)}
                                        placeholder="08123456789"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                                    >
                                        {createForm.processing ? 'Menyimpan...' : 'Tambah Pengguna'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL EDIT USER */}
                {editingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 my-8">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Edit2 className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">
                                        Ubah Pengguna [@{editingUser.username}]
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitEdit} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap *</label>
                                    <input
                                        type="text"
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Username (Login) *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">@</span>
                                        <input
                                            type="text"
                                            value={editForm.data.username}
                                            onChange={(e) => editForm.setData('username', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                            required
                                            className="w-full bg-indigo-50/40 border border-indigo-200 rounded-xl pl-7 pr-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    {editForm.errors.username && (
                                        <p className="text-rose-500 text-[10px] mt-0.5">{editForm.errors.username}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Peran / Hak Akses</label>
                                        <select
                                            value={editForm.data.role}
                                            onChange={(e) => editForm.setData('role', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="sales">Sales Representative</option>
                                            <option value="manager">Sales Manager</option>
                                            <option value="pricing_approver">Pricing Approver</option>
                                            <option value="admin">Administrator</option>
                                            <option value="owner">Owner / Direktur</option>
                                            <option value="operator">Operator Support</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Ubah Sandi (Opsional)</label>
                                        <input
                                            type="password"
                                            value={editForm.data.password}
                                            onChange={(e) => editForm.setData('password', e.target.value)}
                                            placeholder="Kosongkan jika tetap"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editForm.data.email}
                                        onChange={(e) => editForm.setData('email', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nomor Telepon</label>
                                    <input
                                        type="text"
                                        value={editForm.data.phone}
                                        onChange={(e) => editForm.setData('phone', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                                    >
                                        {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DELETE CONFIRMATION */}
                {deletingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4 text-center">
                            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Hapus Pengguna Ini?</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Akun <strong>{deletingUser.name}</strong> (@{deletingUser.username}) akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                            <div className="flex justify-center gap-2 pt-2">
                                <button
                                    onClick={() => setDeletingUser(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={submitDelete}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                                >
                                    Ya, Hapus Pengguna
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
