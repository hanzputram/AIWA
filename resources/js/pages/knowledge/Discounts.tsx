import React, { useState, useMemo } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Percent,
    Shield,
    Plus,
    Edit2,
    Trash2,
    Info,
    X,
    Upload,
    Download,
    Search,
    SlidersHorizontal,
    CheckCircle2,
    AlertTriangle,
    Layers,
    FileSpreadsheet,
    Zap,
    Lock
} from 'lucide-react';

interface BrandDiscountMatrix {
    id: number;
    brand: string;
    category: string;
    coefficient: number | string;
    series_type: string;
    standard_discount_pct: number | string | null;
    max_1_discount_pct: number | string | null;
    max_2_discount_pct: number | string | null;
    khusus_discount_pct: number | string | null;
    notes: string | null;
    is_active: boolean;
    sort_order: number;
}

interface DiscountPolicy {
    id: number;
    name: string;
    version: string;
    max_autonomous_discount_pct: number | string;
    discount_step_pct: number | string;
    max_discount_rounds: number;
    stacking_rule: string;
    minimum_gross_margin_pct: number | string;
    requires_manager_approval_above_pct: number | string;
    is_active: boolean;
}

interface Props {
    discount_policies: DiscountPolicy[];
    discount_matrices: BrandDiscountMatrix[];
    available_brands: string[];
}

export default function Discounts({
    discount_policies = [],
    discount_matrices = [],
    available_brands = [],
}: Props) {
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('all');

    // Create / Edit Matrix Modal
    const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
    const [editingMatrix, setEditingMatrix] = useState<BrandDiscountMatrix | null>(null);
    const matrixForm = useForm({
        brand: 'Schneider',
        category: '',
        coefficient: '1.20',
        series_type: '',
        standard_discount_pct: '',
        max_1_discount_pct: '',
        max_2_discount_pct: '',
        khusus_discount_pct: '',
        notes: '',
    });

    // Delete Matrix Modal
    const [deletingMatrix, setDeletingMatrix] = useState<BrandDiscountMatrix | null>(null);

    // Import Excel Modal
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const importForm = useForm<{ file: File | null }>({
        file: null,
    });

    // Global Policy Modal
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<DiscountPolicy | null>(null);
    const policyForm = useForm({
        name: '',
        version: 'v1.0',
        max_autonomous_discount_pct: '10.00',
        discount_step_pct: '2.50',
        max_discount_rounds: 3,
        stacking_rule: 'sequential',
        minimum_gross_margin_pct: '15.00',
        requires_manager_approval_above_pct: '10.00',
    });

    const openCreateMatrix = () => {
        setEditingMatrix(null);
        matrixForm.setData({
            brand: selectedBrand !== 'all' ? selectedBrand : 'Schneider',
            category: '',
            coefficient: '1.20',
            series_type: '',
            standard_discount_pct: '',
            max_1_discount_pct: '',
            max_2_discount_pct: '',
            khusus_discount_pct: '',
            notes: '(EXC PPN) (Jika Barang Ready Add 10%) (Contactor Add 20%)',
        });
        setIsMatrixModalOpen(true);
    };

    const openEditMatrix = (rule: BrandDiscountMatrix) => {
        setEditingMatrix(rule);
        matrixForm.setData({
            brand: rule.brand,
            category: rule.category,
            coefficient: rule.coefficient?.toString() || '1.0',
            series_type: rule.series_type,
            standard_discount_pct: rule.standard_discount_pct?.toString() || '',
            max_1_discount_pct: rule.max_1_discount_pct?.toString() || '',
            max_2_discount_pct: rule.max_2_discount_pct?.toString() || '',
            khusus_discount_pct: rule.khusus_discount_pct?.toString() || '',
            notes: rule.notes || '',
        });
        setIsMatrixModalOpen(true);
    };

    const submitMatrix = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMatrix) {
            matrixForm.put(`/app/knowledge/discount-matrices/${editingMatrix.id}`, {
                onSuccess: () => setIsMatrixModalOpen(false),
            });
        } else {
            matrixForm.post('/app/knowledge/discount-matrices', {
                onSuccess: () => setIsMatrixModalOpen(false),
            });
        }
    };

    const submitDeleteMatrix = () => {
        if (!deletingMatrix) return;
        router.delete(`/app/knowledge/discount-matrices/${deletingMatrix.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingMatrix(null),
            onError: () => setDeletingMatrix(null),
            onFinish: () => setDeletingMatrix(null),
        });
    };

    const submitImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importForm.data.file) {
            alert('Pilih file spreadsheet Excel / CSV terlebih dahulu.');
            return;
        }
        importForm.post('/app/knowledge/discount-matrices/import', {
            onSuccess: () => {
                setIsImportModalOpen(false);
                importForm.reset();
            },
        });
    };

    // Filter matrix rows
    const filteredMatrices = useMemo(() => {
        return discount_matrices.filter((item) => {
            const matchesBrand = selectedBrand === 'all' || item.brand.toLowerCase() === selectedBrand.toLowerCase();
            const matchesSearch =
                (item.category || '').toLowerCase().includes(search.toLowerCase()) ||
                (item.series_type || '').toLowerCase().includes(search.toLowerCase()) ||
                (item.notes || '').toLowerCase().includes(search.toLowerCase());
            return matchesBrand && matchesSearch;
        });
    }, [discount_matrices, selectedBrand, search]);

    // Metrics
    const totalMatrixCount = discount_matrices.length;
    const uniqueBrandsCount = new Set(discount_matrices.map(m => m.brand)).size;
    const highestKhusus = Math.max(...discount_matrices.map(m => Number(m.khusus_discount_pct || 0)), 0);
    const avgStandard = (
        discount_matrices
            .filter(m => m.standard_discount_pct !== null)
            .reduce((acc, curr) => acc + Number(curr.standard_discount_pct), 0) /
        (discount_matrices.filter(m => m.standard_discount_pct !== null).length || 1)
    ).toFixed(1);

    return (
        <AppLayout title="Knowledge Base Kebijakan Diskon Matrix">
            <Head title="Matriks Diskon & Koefisien Brand — AIWA HQ" />

            <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
                            <Percent className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                                    Knowledge Base Kebijakan Diskon Matrix
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    Discount August 2026 Revision 1
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Matriks bertingkat resmi berdasar Brand, Kategori (Koefisien) dan Tipe/Seri. Kolom <strong>KHUSUS</strong> adalah <em>Batas Mati (Floor Limit)</em> yang tidak boleh dilanggar AI.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <a
                            href="/app/knowledge/discount-matrices/template"
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition"
                            title="Unduh Format Spreadsheet Excel (.xlsx)"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Format Excel (.xlsx)</span>
                        </a>

                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold shadow-xs transition"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Import Matrix Excel (.xlsx)</span>
                        </button>

                        <button
                            onClick={openCreateMatrix}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ Tambah Aturan Matrix</span>
                        </button>
                    </div>
                </div>

                {/* 4 Pastel Top Stat Cards - CRM HQ Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#eff6ff] border border-blue-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">Total Aturan Matrix</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{totalMatrixCount}</div>
                            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Terdaftar di knowledge base
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Brand Terpetakan</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{uniqueBrandsCount} Merk</div>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Termasuk Schneider Electric
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff7ed] border border-amber-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">Rata-Rata Standard</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{avgStandard}%</div>
                            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Diskon pembuka penawaran
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <Percent className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fefce8] border border-amber-200 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>Diskon Khusus Maksimal</span>
                            </span>
                            <div className="text-2xl font-extrabold text-amber-900 mt-1">{highestKhusus}%</div>
                            <span className="text-[11px] text-amber-700 font-medium flex items-center gap-0.5 mt-0.5">
                                Batas mati penawaran AI
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-800 font-extrabold">
                            KHUSUS
                        </div>
                    </div>
                </div>

                {/* Info Guide Card Matching Spreadsheet Legend */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5" />
                        </div>
                        <div className="text-slate-600 leading-relaxed">
                            <strong className="text-slate-800">Struktur Hierarki Diskon Otonom AI:</strong>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-semibold">1. Standard</span>
                                <span>&rarr; Penawaran awal</span>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-semibold">2. MAX 1</span>
                                <span>&rarr; Nego putaran 1</span>
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-semibold">3. MAX 2</span>
                                <span>&rarr; Nego volume / alot</span>
                                <span className="px-2.5 py-0.5 bg-amber-200 text-amber-950 border border-amber-400 rounded-md font-extrabold">4. KHUSUS (Floor Limit)</span>
                                <span>&rarr; Batas mati mutlak AI</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-medium shrink-0">
                        Catatan Brand: <strong>(EXC PPN) · Ready Add 10% · Contactor Add 20%</strong>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-96">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari kategori atau tipe/seri (misal: Domae, NSX, LC1D, CVS)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    {/* Brand Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                        <button
                            onClick={() => setSelectedBrand('all')}
                            className={`px-3.5 py-1.5 text-xs rounded-xl font-semibold transition ${
                                selectedBrand === 'all'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Semua Brand ({discount_matrices.length})
                        </button>
                        {available_brands.map((b) => (
                            <button
                                key={b}
                                onClick={() => setSelectedBrand(b)}
                                className={`px-3.5 py-1.5 text-xs rounded-xl font-semibold transition ${
                                    selectedBrand.toLowerCase() === b.toLowerCase()
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {b}
                            </button>
                        ))}
                    </div>
                </div>

                {/* THE MATRIX TABLE - Exact replica of user's photo with CRM HQ Light styling */}
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b-2 border-slate-200 uppercase text-[11px] tracking-wider">
                                    <th className="p-3.5 border-r border-slate-200 w-36 bg-emerald-50 text-emerald-900">
                                        Brand & Ketentuan
                                    </th>
                                    <th className="p-3.5 border-r border-slate-200 w-48">
                                        Kategori Produk
                                    </th>
                                    <th className="p-3.5 border-r border-slate-200">
                                        Tipe / Seri / Model
                                    </th>
                                    <th className="p-3.5 border-r border-slate-200 text-center w-24 bg-blue-50/60 text-blue-900">
                                        Standard
                                    </th>
                                    <th className="p-3.5 border-r border-slate-200 text-center w-24 bg-indigo-50/60 text-indigo-900">
                                        MAX 1
                                    </th>
                                    <th className="p-3.5 border-r border-slate-200 text-center w-24 bg-purple-50/60 text-purple-900">
                                        MAX 2
                                    </th>
                                    <th className="p-3.5 border-r border-slate-200 text-center w-28 bg-[#fef08a] text-amber-950 font-extrabold shadow-inner">
                                        KHUSUS (Floor)
                                    </th>
                                    <th className="p-3.5 text-center w-24">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredMatrices.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-400">
                                            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                            <p className="font-semibold text-slate-600">Tidak ada data matriks diskon yang cocok</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Coba ganti filter atau klik "+ Tambah Aturan Matrix".</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMatrices.map((row, idx) => (
                                        <tr
                                            key={row.id}
                                            className={`hover:bg-slate-50 transition ${
                                                idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                                            }`}
                                        >
                                            {/* Column 1: Brand & Add-ons */}
                                            <td className="p-3.5 border-r border-slate-200 font-bold text-slate-800 align-top bg-emerald-50/20">
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-extrabold text-[11px] block text-center mb-1">
                                                    {row.brand}
                                                </span>
                                                {row.notes && (
                                                    <span className="text-[10px] text-slate-500 font-normal leading-tight block">
                                                        {row.notes}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Column 2: Category + Koefisien */}
                                            <td className="p-3.5 border-r border-slate-200 font-bold text-slate-800 align-top">
                                                <div className="text-xs text-slate-800">{row.category}</div>
                                                <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold">
                                                    Koef X {Number(row.coefficient).toFixed(2).replace(/\.00$/, '')}
                                                </span>
                                            </td>

                                            {/* Column 3: Series / Type / Subcategory */}
                                            <td className="p-3.5 border-r border-slate-200 font-semibold text-slate-900 align-top">
                                                <span className="font-bold text-slate-800 block text-xs">
                                                    {row.series_type}
                                                </span>
                                            </td>

                                            {/* Column 4: Standard % */}
                                            <td className="p-3.5 border-r border-slate-200 text-center font-bold text-xs align-middle">
                                                {row.standard_discount_pct !== null ? (
                                                    <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                                        {Number(row.standard_discount_pct)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>

                                            {/* Column 5: MAX 1 % */}
                                            <td className="p-3.5 border-r border-slate-200 text-center font-bold text-xs align-middle">
                                                {row.max_1_discount_pct !== null ? (
                                                    <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                        {Number(row.max_1_discount_pct)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>

                                            {/* Column 6: MAX 2 % */}
                                            <td className="p-3.5 border-r border-slate-200 text-center font-bold text-xs align-middle">
                                                {row.max_2_discount_pct !== null ? (
                                                    <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                                        {Number(row.max_2_discount_pct)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>

                                            {/* Column 7: KHUSUS % (Yellow Highlight - Floor Limit) */}
                                            <td className="p-3.5 border-r border-slate-200 text-center font-extrabold text-xs align-middle bg-amber-50/70">
                                                {row.khusus_discount_pct !== null ? (
                                                    <span className="px-3 py-1 rounded-lg bg-[#fef08a] text-amber-950 border border-amber-300 shadow-2xs font-extrabold text-sm block">
                                                        {Number(row.khusus_discount_pct)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>

                                            {/* Column 8: Actions */}
                                            <td className="p-3.5 text-center align-middle">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => openEditMatrix(row)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                        title="Ubah Aturan"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingMatrix(row)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                        title="Hapus Aturan"
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
                </div>

                {/* MODAL CREATE / EDIT MATRIX */}
                {isMatrixModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-xl shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                        <Percent className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">
                                        {editingMatrix ? 'Ubah Aturan Diskon Matrix' : 'Tambah Aturan Diskon Matrix Baru'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsMatrixModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitMatrix} className="space-y-3.5 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Brand / Merk *</label>
                                        <input
                                            type="text"
                                            value={matrixForm.data.brand}
                                            onChange={(e) => matrixForm.setData('brand', e.target.value)}
                                            placeholder="Contoh: Schneider, ABB, Siemens"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Kategori Produk *</label>
                                        <input
                                            type="text"
                                            value={matrixForm.data.category}
                                            onChange={(e) => matrixForm.setData('category', e.target.value)}
                                            placeholder="Contoh: MCB, MCCB, Contactor"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Koefisien Pengali (Koef X) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.1"
                                            max="10"
                                            value={matrixForm.data.coefficient}
                                            onChange={(e) => matrixForm.setData('coefficient', e.target.value)}
                                            placeholder="1.13, 1.20, dll."
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Tipe / Seri / Model *</label>
                                        <input
                                            type="text"
                                            value={matrixForm.data.series_type}
                                            onChange={(e) => matrixForm.setData('series_type', e.target.value)}
                                            placeholder="Contoh: Domae, IC, IK, NSX BARU C1F"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* 4 Tier Discount Inputs */}
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                                        Persentase Tier Diskon (Sesuai Foto Spreadsheet)
                                    </span>
                                    <div className="grid grid-cols-4 gap-2.5">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-blue-700 mb-0.5">Standard (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={matrixForm.data.standard_discount_pct}
                                                onChange={(e) => matrixForm.setData('standard_discount_pct', e.target.value)}
                                                placeholder="e.g. 25"
                                                className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 text-center font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-indigo-700 mb-0.5">MAX 1 (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={matrixForm.data.max_1_discount_pct}
                                                onChange={(e) => matrixForm.setData('max_1_discount_pct', e.target.value)}
                                                placeholder="e.g. 30"
                                                className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 text-center font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-purple-700 mb-0.5">MAX 2 (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={matrixForm.data.max_2_discount_pct}
                                                onChange={(e) => matrixForm.setData('max_2_discount_pct', e.target.value)}
                                                placeholder="e.g. 50"
                                                className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 text-center font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-amber-900 mb-0.5">KHUSUS (Floor %)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={matrixForm.data.khusus_discount_pct}
                                                onChange={(e) => matrixForm.setData('khusus_discount_pct', e.target.value)}
                                                placeholder="e.g. 34"
                                                className="w-full bg-[#fef08a] border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-amber-950 text-center font-extrabold"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic">
                                        * Kosongkan kolom tier jika kategori/tipe tersebut tidak memiliki batas diskon tersebut.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Catatan / Syarat Tambahan</label>
                                    <input
                                        type="text"
                                        value={matrixForm.data.notes}
                                        onChange={(e) => matrixForm.setData('notes', e.target.value)}
                                        placeholder="Contoh: (EXC PPN) (Jika Barang Ready Add 10%) (Contactor Add 20%)"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsMatrixModalOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={matrixForm.processing}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-xs disabled:opacity-50"
                                    >
                                        {matrixForm.processing ? 'Menyimpan...' : 'Simpan Aturan Matrix'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DELETE MATRIX */}
                {deletingMatrix && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Hapus Aturan Matrix?</h3>
                                    <p className="text-[11px] text-slate-500">Tindakan ini permanen.</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Aturan diskon untuk <strong className="text-slate-800">{deletingMatrix.brand} - {deletingMatrix.category} ({deletingMatrix.series_type})</strong> akan dihapus dari sistem.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setDeletingMatrix(null)}
                                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={submitDeleteMatrix}
                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL IMPORT EXCEL MATRIX */}
                {isImportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <FileSpreadsheet className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Import Matriks Diskon Excel (.xlsx)</h3>
                                </div>
                                <button
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitImport} className="space-y-4 text-xs">
                                <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                                    <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto" />
                                    <div className="text-slate-700 font-semibold">Pilih file Microsoft Excel (.xlsx)</div>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => importForm.setData('file', e.target.files ? e.target.files[0] : null)}
                                        required
                                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        Format kolom: Brand, Kategori, Koefisien, Tipe/Seri, Standard, MAX 1, MAX 2, KHUSUS, Catatan
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <a
                                        href="/app/knowledge/discount-matrices/template"
                                        className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Unduh Format Excel (.xlsx)</span>
                                    </a>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsImportModalOpen(false)}
                                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={importForm.processing}
                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition disabled:opacity-50"
                                        >
                                            {importForm.processing ? 'Mengimpor...' : 'Mulai Import'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
