import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, usePage, router } from '@inertiajs/react';
import {
    BookOpen,
    Search,
    Plus,
    Upload,
    Download,
    Sparkles,
    Shield,
    Tag,
    Edit2,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    FileText,
    Globe,
    Layers,
    X,
    Filter,
} from 'lucide-react';

interface Props {
    products: Array<any>;
}

export default function Products({ products }: Props) {
    const { auth } = usePage().props as any;
    const canViewCost =
        auth.user?.permissions?.includes('cost.view') || ['owner', 'admin'].includes(auth.user?.role);

    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('all');

    // Modals state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isLearning, setIsLearning] = useState<number | null>(null);

    // Form state for Create / Edit
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        brand: 'Schneider Electric',
        category: 'Miniature Circuit Breaker (MCB)',
        unit: 'pcs',
        moq: 1,
        price_list: '',
        coefficient: '1.0000',
        discount_pct: '0.00',
        description: '',
        datasheet_url: '',
        datasheet_pdf: null as File | null,
    });

    const [importFile, setImportFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter products
    const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
    const filtered = products.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase());
        const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
        return matchesSearch && matchesBrand;
    });

    // Dynamic floor price calculation preview
    const calcFloorPrice = () => {
        const pl = parseFloat(formData.price_list) || 0;
        const coeff = parseFloat(formData.coefficient) || 1.0;
        const disc = parseFloat(formData.discount_pct) || 0;
        return Math.round(pl * coeff * Math.max(0, 1.0 - disc / 100));
    };

    const openCreate = () => {
        setFormData({
            sku: '',
            name: '',
            brand: 'Schneider Electric',
            category: 'Miniature Circuit Breaker (MCB)',
            unit: 'pcs',
            moq: 1,
            price_list: '',
            coefficient: '1.0000',
            discount_pct: '0.00',
            description: '',
            datasheet_url: '',
            datasheet_pdf: null,
        });
        setIsCreateOpen(true);
    };

    const openEdit = (product: any) => {
        setSelectedProduct(product);
        setFormData({
            sku: product.sku || '',
            name: product.name || '',
            brand: product.brand || 'Schneider Electric',
            category: product.category || '',
            unit: product.unit || 'pcs',
            moq: product.moq || 1,
            price_list: product.price_list?.toString() || '',
            coefficient: product.coefficient?.toString() || '1.0000',
            discount_pct: product.discount_pct?.toString() || '0.00',
            description: product.description || '',
            datasheet_url: product.datasheet_url || '',
            datasheet_pdf: null,
        });
        setIsEditOpen(true);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = new FormData();
        Object.entries(formData).forEach(([key, val]) => {
            if (val !== null && val !== undefined) {
                data.append(key, val as any);
            }
        });

        router.post('/app/knowledge/products', data, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setIsSubmitting(false);
            },
            onError: () => setIsSubmitting(false),
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        setIsSubmitting(true);

        const data = new FormData();
        data.append('_method', 'PUT');
        Object.entries(formData).forEach(([key, val]) => {
            if (val !== null && val !== undefined) {
                data.append(key, val as any);
            }
        });

        router.post(`/app/knowledge/products/${selectedProduct.id}`, data, {
            onSuccess: () => {
                setIsEditOpen(false);
                setIsSubmitting(false);
            },
            onError: () => setIsSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!selectedProduct) return;
        setIsSubmitting(true);

        router.delete(`/app/knowledge/products/${selectedProduct.id}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setIsSubmitting(false);
            },
            onError: () => setIsSubmitting(false),
        });
    };

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;
        setIsSubmitting(true);

        const data = new FormData();
        data.append('file', importFile);

        router.post('/app/knowledge/products/import', data, {
            onSuccess: () => {
                setIsImportOpen(false);
                setIsSubmitting(false);
                setImportFile(null);
            },
            onError: () => setIsSubmitting(false),
        });
    };

    const triggerAiLearn = async (product: any) => {
        setIsLearning(product.id);
        try {
            const res = await window.axios.post(`/app/knowledge/products/${product.id}/learn`);
            if (res.data.success) {
                alert(
                    `Berhasil! AI mempelajari ${res.data.data.specs_count} spesifikasi teknis dari sumber [${res.data.data.source}].`
                );
                window.location.reload();
            }
        } catch (err: any) {
            alert('Gagal mempelajari produk: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsLearning(null);
        }
    };

    return (
        <AppLayout title="Katalog Produk & Penentuan Base Price">
            <Head title="Katalog Produk — AIWA HQ" />

            <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
                {/* Header & Actions Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                                    Knowledge Base Produk & Spesifikasi
                                </h1>
                                <p className="text-xs text-slate-500">
                                    Daftar harga (PL), koefisien, dan diskon menentukan Base Price mutlak untuk negosiasi AI.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <a
                            href="/app/knowledge/products/template"
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Format Excel (.xlsx)</span>
                        </a>

                        <button
                            onClick={() => setIsImportOpen(true)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition shadow-2xs"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Import Excel (.xlsx)</span>
                        </button>

                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ Tambah Produk</span>
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari SKU atau nama produk..."
                            className="w-full bg-slate-100/90 border-none rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">Merek:</span>
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="bg-slate-100 border-none rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Semua Brand ({products.length})</option>
                            {brands.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map((prod) => {
                        const priceEntry = prod.price_entries?.[0];
                        const pl = prod.price_list || priceEntry?.base_price || 0;
                        const coeff = prod.coefficient || 1.0;
                        const disc = prod.discount_pct || 0;
                        const floorPrice = prod.floor_price || Math.round(pl * coeff * (1 - disc / 100));

                        return (
                            <div
                                key={prod.id}
                                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-blue-200 transition"
                            >
                                <div className="space-y-3">
                                    {/* SKU & Brand Header */}
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                                            {prod.sku}
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-500">
                                            {prod.brand}
                                        </span>
                                    </div>

                                    {/* Name & Category */}
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                                            {prod.name}
                                        </h3>
                                        <p className="text-[11px] text-slate-400">{prod.category}</p>
                                    </div>

                                    {/* Technical Specs Pills */}
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-bold text-slate-600">Spesifikasi Teknis</span>
                                            <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    prod.specs_source === 'datasheet_pdf'
                                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                        : prod.specs_source === 'brand_web'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : 'bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                {prod.specs_source === 'datasheet_pdf'
                                                    ? '📄 PDF Datasheet'
                                                    : prod.specs_source === 'brand_web'
                                                    ? '🌐 Web Brand'
                                                    : 'Manual'}
                                            </span>
                                        </div>

                                        {prod.specs && prod.specs.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                                {prod.specs.slice(0, 6).map((s: any) => (
                                                    <div key={s.id} className="truncate">
                                                        <span className="text-slate-400 font-medium">
                                                            {s.spec_name}:
                                                        </span>{' '}
                                                        <strong className="text-slate-800 font-semibold">
                                                            {s.spec_value}
                                                        </strong>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-slate-400 italic">
                                                Belum ada spesifikasi. Klik tombol "Pelajari dengan AI" di bawah.
                                            </p>
                                        )}
                                    </div>

                                    {/* Commercial Formula Breakdown */}
                                    <div className="p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100/70 rounded-xl space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                                            <span>Price List (PL):</span>
                                            <span className="font-semibold text-slate-900">
                                                Rp {Number(pl).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                                            <span>Koefisien & Diskon:</span>
                                            <span className="font-semibold text-slate-700">
                                                x{coeff} · Disc {disc}%
                                            </span>
                                        </div>
                                        <div className="pt-1.5 border-t border-blue-200/60 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                                                Floor Price (Batas Mati):
                                            </span>
                                            <span className="text-sm font-extrabold text-emerald-600">
                                                Rp {Number(floorPrice).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => triggerAiLearn(prod)}
                                        disabled={isLearning === prod.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold transition shadow-2xs"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>
                                            {isLearning === prod.id ? 'Memindai...' : 'Pelajari Spesifikasi (AI)'}
                                        </span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEdit(prod)}
                                            title="Ubah Produk"
                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedProduct(prod);
                                                setIsDeleteOpen(true);
                                            }}
                                            title="Hapus Produk"
                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filtered.length === 0 && (
                    <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">Tidak ada produk yang cocok</h3>
                        <p className="text-xs text-slate-500">
                            Coba ubah kata kunci pencarian atau klik "+ Tambah Produk" untuk mendaftarkan SKU baru.
                        </p>
                    </div>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {(isCreateOpen || isEditOpen) && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-5 my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">
                                {isCreateOpen ? 'Tambah Produk & Price List Baru' : 'Ubah Data Produk & Formula'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setIsEditOpen(false);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={isCreateOpen ? handleCreate : handleUpdate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Kode SKU *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        placeholder="DOM11340SNI"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Brand</label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        placeholder="Schneider Electric"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    Nama Produk Lengkap *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="MCB Domae 1P 16A 4.5kA"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="Miniature Circuit Breaker"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Satuan (Unit) & MOQ
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            placeholder="pcs"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 text-center focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.moq}
                                            onChange={(e) =>
                                                setFormData({ ...formData, moq: parseInt(e.target.value) || 1 })
                                            }
                                            placeholder="MOQ"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 text-center focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Commercial Formula Box */}
                            <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-3">
                                <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                    <Shield className="w-4 h-4 text-blue-600" />
                                    Penentuan Base Price Negosiasi AI
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                            Price List (PL)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.price_list}
                                            onChange={(e) =>
                                                setFormData({ ...formData, price_list: e.target.value })
                                            }
                                            placeholder="84500"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                            Koefisien (x)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={formData.coefficient}
                                            onChange={(e) =>
                                                setFormData({ ...formData, coefficient: e.target.value })
                                            }
                                            placeholder="1.0000"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                            Diskon (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.discount_pct}
                                            onChange={(e) =>
                                                setFormData({ ...formData, discount_pct: e.target.value })
                                            }
                                            placeholder="20.00"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-700">
                                        Hasil Base / Floor Price:
                                    </span>
                                    <span className="font-extrabold text-base text-emerald-700">
                                        Rp {calcFloorPrice().toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            {/* PDF Datasheet Upload */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    File Datasheet (PDF)
                                </label>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            datasheet_pdf: e.target.files?.[0] || null,
                                        })
                                    }
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Jika tidak menyertakan file PDF, AI akan mencari spesifikasi langsung ke website resmi brand.
                                </p>
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
                                    disabled={isSubmitting}
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* IMPORT EXCEL MODAL */}
            {isImportOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-emerald-600" />
                                Import Produk dari Excel (.xlsx)
                            </h3>
                            <button
                                onClick={() => setIsImportOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleImport} className="space-y-4">
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Upload file format <strong>.xlsx</strong>. Sistem akan
                                secara otomatis memetakan kolom Price List, koefisien, dan diskon untuk menghitung Base
                                Price proteksi margin AI.
                            </p>

                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2 hover:border-blue-400 transition bg-slate-50/50">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                                <input
                                    type="file"
                                    required
                                    accept=".xlsx, .xls, .csv"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                                />
                                {importFile && (
                                    <p className="text-xs font-semibold text-emerald-700">
                                        Terpilih: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2">
                                <a
                                    href="/app/knowledge/products/template"
                                    className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                                >
                                    <Download className="w-3.5 h-3.5" /> Unduh Template Excel (.xlsx)
                                </a>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsImportOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!importFile || isSubmitting}
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                                >
                                    {isSubmitting ? 'Mengimpor...' : 'Mulai Import'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {isDeleteOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-base text-slate-900">Hapus Produk?</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Apakah Anda yakin ingin menghapus produk <strong>[{selectedProduct.sku}]</strong>{' '}
                            {selectedProduct.name}? Seluruh data spesifikasi dan harga terkait akan dihapus.
                        </p>
                        <div className="flex justify-center gap-2 pt-2">
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                            >
                                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
