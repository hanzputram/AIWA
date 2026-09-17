import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Users, Plus, Search, Phone, Mail, Building2, Tag, X } from 'lucide-react';

interface Props {
    contacts: Array<any>;
    companies: Array<any>;
}

export default function ContactsIndex({ contacts, companies }: Props) {
    const [search, setSearch] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        name: '',
        phone: '',
        email: '',
        company_id: '',
        job_title: '',
        customer_tier: 'standard',
    });

    const filtered = contacts.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) || c.phone_e164.includes(search)
    );

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/app/contacts', {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout title="Kontak & Database Pelanggan">
            <Head title="Kontak Pelanggan" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-400" />
                            <span>Database Pelanggan & Kontak WhatsApp</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Nomor pelanggan (penerima) dikelola terpisah dari nomor bisnis pengirim. Normalisasi nomor Indonesia E.164 otomatis (+62).
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau nomor..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500"
                            />
                        </div>
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Kontak</span>
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                            <tr>
                                <th className="p-3.5">Nama Kontak</th>
                                <th className="p-3.5">Nomor E.164</th>
                                <th className="p-3.5">Perusahaan</th>
                                <th className="p-3.5">Jabatan</th>
                                <th className="p-3.5">Tier Pelanggan</th>
                                <th className="p-3.5">Aktivitas Terakhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filtered.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-800/40">
                                    <td className="p-3.5 font-bold text-white">{c.name}</td>
                                    <td className="p-3.5 font-mono text-indigo-300">{c.phone_e164}</td>
                                    <td className="p-3.5 text-slate-300">{c.company?.name || 'Individu'}</td>
                                    <td className="p-3.5 text-slate-400">{c.job_title || '-'}</td>
                                    <td className="p-3.5">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                            c.customer_tier === 'gold'
                                                ? 'bg-amber-500/20 text-amber-300'
                                                : c.customer_tier === 'silver'
                                                ? 'bg-slate-700 text-slate-200'
                                                : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {c.customer_tier}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-slate-500">
                                        {c.last_inbound_at ? new Date(c.last_inbound_at).toLocaleString('id-ID') : 'Belum ada chat'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Create Modal */}
                {createModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h3 className="font-bold text-sm text-white">Tambah Kontak Pelanggan Baru</h3>
                                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitCreate} className="space-y-3 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Nomor WhatsApp (08... / +62...)</label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="08123456789"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Perusahaan</label>
                                    <select
                                        value={data.company_id}
                                        onChange={(e) => setData('company_id', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                    >
                                        <option value="">Pilih Perusahaan (Opsional)</option>
                                        {companies.map((co) => (
                                            <option key={co.id} value={co.id}>{co.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Jabatan</label>
                                        <input
                                            type="text"
                                            value={data.job_title}
                                            onChange={(e) => setData('job_title', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Tier Pelanggan</label>
                                        <select
                                            value={data.customer_tier}
                                            onChange={(e) => setData('customer_tier', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        >
                                            <option value="standard">Standard</option>
                                            <option value="silver">Silver</option>
                                            <option value="gold">Gold</option>
                                            <option value="platinum">Platinum</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="px-3 py-2 text-slate-400 hover:text-white"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
                                    >
                                        Simpan Kontak
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
