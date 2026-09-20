import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import {
    Building2,
    Users,
    Briefcase,
    Plus,
    Search,
    Globe,
    Phone,
    MapPin,
    Edit2,
    Trash2,
    X,
} from 'lucide-react';

interface Company {
    id: number;
    name: string;
    industry: string | null;
    website: string | null;
    phone: string | null;
    email?: string | null;
    address: string | null;
    contacts_count: number;
    deals_count: number;
    created_at: string;
}

interface Props {
    companies: Company[];
}

export default function Companies({ companies }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    const [form, setForm] = useState({
        name: '',
        industry: '',
        website: '',
        phone: '',
        email: '',
        address: '',
    });

    const filtered = companies.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const openCreate = () => {
        setSelectedCompany(null);
        setForm({
            name: '',
            industry: 'Panel Maker & Kontraktor',
            website: '',
            phone: '',
            email: '',
            address: '',
        });
        setIsCreateOpen(true);
    };

    const openEdit = (c: Company) => {
        setSelectedCompany(c);
        setForm({
            name: c.name,
            industry: c.industry || '',
            website: c.website || '',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
        });
        setIsEditOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCompany) {
            router.put(`/app/companies/${selectedCompany.id}`, form, {
                onSuccess: () => setIsEditOpen(false),
            });
        } else {
            router.post('/app/companies', form, {
                onSuccess: () => setIsCreateOpen(false),
            });
        }
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Hapus perusahaan [${name}]? Seluruh relasi deals dan kontak akan diperbarui.`)) {
            router.delete(`/app/companies/${id}`);
        }
    };

    return (
        <AppLayout title="Perusahaan & Klien B2B">
            <Head title="Perusahaan B2B — AIWA HQ" />

            <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 tracking-tight">
                                Direktori Perusahaan & Klien B2B
                            </h1>
                            <p className="text-xs text-slate-500">
                                Kelola entitas bisnis, panel builder, kontraktor EPC, dan akun korporat.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari perusahaan atau industri..."
                                className="w-full bg-slate-100/90 border-none rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ Tambah Perusahaan</span>
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((company) => (
                        <div
                            key={company.id}
                            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-blue-200 transition flex flex-col justify-between space-y-4"
                        >
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-sm border border-blue-100">
                                        {company.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700">
                                        {company.industry || 'B2B Client'}
                                    </span>
                                </div>

                                <h3 className="text-sm font-bold text-slate-900 mb-2">{company.name}</h3>

                                <div className="space-y-1.5 text-xs text-slate-500">
                                    {company.website && (
                                        <div className="flex items-center gap-2 truncate">
                                            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <a
                                                href={company.website}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:underline text-blue-600 truncate"
                                            >
                                                {company.website}
                                            </a>
                                        </div>
                                    )}
                                    {company.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>{company.phone}</span>
                                        </div>
                                    )}
                                    {company.address && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate">{company.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>{company.contacts_count || 0} Kontak</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                                        <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                                        <span>{company.deals_count || 0} Deals</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEdit(company)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                                        title="Ubah Perusahaan"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(company.id, company.name)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                                        title="Hapus Perusahaan"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                            <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <h3 className="text-sm font-bold text-slate-800">Tidak ada perusahaan ditemukan</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                {searchTerm
                                    ? 'Coba ubah kata kunci pencarian.'
                                    : 'Klik "+ Tambah Perusahaan" untuk mendaftarkan akun B2B baru.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE / EDIT MODAL */}
            {(isCreateOpen || isEditOpen) && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">
                                {isCreateOpen ? 'Tambah Perusahaan Baru' : 'Ubah Data Perusahaan'}
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
                                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Perusahaan *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="PT Trias Panelindo Indonesia"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Bidang Industri</label>
                                    <input
                                        type="text"
                                        value={form.industry}
                                        onChange={(e) => setForm({ ...form, industry: e.target.value })}
                                        placeholder="Panel Maker / EPC"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Nomor Telepon</label>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="021-55667788"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Website</label>
                                    <input
                                        type="text"
                                        value={form.website}
                                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                                        placeholder="https://triaspanel.co.id"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Email Perusahaan</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="info@triaspanel.co.id"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Kantor / Workshop</label>
                                <textarea
                                    rows={2}
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    placeholder="Kawasan Industri Jababeka 1, Cikarang"
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
                                    Simpan Perusahaan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
