import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { Users, Plus, Search, Edit2, Trash2, Phone, Mail, Building2, Tag, X } from 'lucide-react';

interface Props {
    contacts: Array<any>;
    companies: Array<any>;
}

export default function ContactsIndex({ contacts, companies }: Props) {
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<any>(null);

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        company_id: '',
        job_title: '',
        customer_tier: 'standard',
    });

    const filtered = contacts.filter(
        (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone_e164.includes(search)
    );

    const openCreate = () => {
        setSelectedContact(null);
        setForm({
            name: '',
            phone: '',
            email: '',
            company_id: '',
            job_title: '',
            customer_tier: 'standard',
        });
        setIsCreateOpen(true);
    };

    const openEdit = (c: any) => {
        setSelectedContact(c);
        setForm({
            name: c.name,
            phone: c.phone_e164,
            email: c.email || '',
            company_id: c.company_id?.toString() || '',
            job_title: c.job_title || '',
            customer_tier: c.customer_tier || 'standard',
        });
        setIsEditOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedContact) {
            router.put(`/app/contacts/${selectedContact.id}`, form, {
                onSuccess: () => setIsEditOpen(false),
            });
        } else {
            router.post('/app/contacts', form, {
                onSuccess: () => setIsCreateOpen(false),
            });
        }
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Hapus kontak [${name}]?`)) {
            router.delete(`/app/contacts/${id}`);
        }
    };

    return (
        <AppLayout title="Kontak & Database Pelanggan">
            <Head title="Kontak Pelanggan — AIWA HQ" />

            <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 tracking-tight">
                                Database Pelanggan & Kontak WhatsApp
                            </h1>
                            <p className="text-xs text-slate-500">
                                Normalisasi otomatis format E.164 (+62), penugasan tier pelanggan, dan relasi B2B perusahaan.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau nomor..."
                                className="w-full bg-slate-100/90 border-none rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ Tambah Kontak</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/50">
                                <th className="p-4 font-semibold">Nama Kontak</th>
                                <th className="p-4 font-semibold">Nomor WhatsApp E.164</th>
                                <th className="p-4 font-semibold">Perusahaan B2B</th>
                                <th className="p-4 font-semibold">Jabatan</th>
                                <th className="p-4 font-semibold">Tier</th>
                                <th className="p-4 font-semibold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50/60 transition">
                                    <td className="p-4 font-bold text-slate-900">{c.name}</td>
                                    <td className="p-4 font-mono font-semibold text-blue-600">{c.phone_e164}</td>
                                    <td className="p-4 font-medium text-slate-600">
                                        {c.company?.name || <span className="text-slate-400 italic">Individu</span>}
                                    </td>
                                    <td className="p-4 text-slate-500">{c.job_title || '-'}</td>
                                    <td className="p-4">
                                        <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                c.customer_tier === 'gold' || c.customer_tier === 'platinum'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : c.customer_tier === 'silver'
                                                    ? 'bg-slate-200 text-slate-800'
                                                    : 'bg-blue-50 text-blue-700'
                                            }`}
                                        >
                                            {c.customer_tier}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openEdit(c)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                                                title="Ubah Kontak"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c.id, c.name)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                                                title="Hapus Kontak"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE / EDIT MODAL */}
            {(isCreateOpen || isEditOpen) && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">
                                {isCreateOpen ? 'Tambah Kontak Baru' : 'Ubah Data Kontak'}
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
                                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Budi Santoso"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Nomor Telepon *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="08123456789"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="budi@ptmaju.com"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
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
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Tier Pelanggan</label>
                                    <select
                                        value={form.customer_tier}
                                        onChange={(e) => setForm({ ...form, customer_tier: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="silver">Silver</option>
                                        <option value="gold">Gold</option>
                                        <option value="platinum">Platinum</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Jabatan / Role</label>
                                <input
                                    type="text"
                                    value={form.job_title}
                                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                                    placeholder="Purchasing Manager"
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
                                    Simpan Kontak
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
