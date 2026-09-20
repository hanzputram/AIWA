import React, { useState, useMemo } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    FileSignature,
    Plus,
    Search,
    Eye,
    Trash2,
    CheckCircle2,
    Clock,
    AlertTriangle,
    X,
    ShoppingCart,
    ArrowUpRight,
    FileText,
    Receipt,
    ShieldCheck
} from 'lucide-react';

interface Props {
    quotes: Array<any>;
    contacts: Array<any>;
    products: Array<any>;
}

interface LineItemInput {
    product_id: number | '';
    quantity: number;
    discount_pct: number;
}

export default function QuotesIndex({ quotes = [], contacts = [], products = [] }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Create Quote Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [contactId, setContactId] = useState<number | ''>('');
    const [paymentTerms, setPaymentTerms] = useState('Cash Before Delivery');
    const [deliveryTerms, setDeliveryTerms] = useState('Franco Jabodetabek');
    const [items, setItems] = useState<LineItemInput[]>([
        { product_id: '', quantity: 1, discount_pct: 0 }
    ]);
    const [submitting, setSubmitting] = useState(false);

    // Delete Modal
    const [deletingQuote, setDeletingQuote] = useState<any>(null);

    // Filter quotes
    const filteredQuotes = useMemo(() => {
        return quotes.filter((q) => {
            const matchesSearch =
                (q.quote_number || '').toLowerCase().includes(search.toLowerCase()) ||
                (q.contact?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (q.contact?.phone_e164 || '').includes(search);
            const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [quotes, search, statusFilter]);

    // Live calculation for create modal
    const calculatedItems = useMemo(() => {
        return items.map((item) => {
            const prod = products.find((p) => p.id === Number(item.product_id));
            const listPrice = prod ? Number(prod.price_list || prod.floor_price || 100000) : 0;
            const disc = Number(item.discount_pct) || 0;
            const netPrice = Math.round(listPrice * (1 - disc / 100));
            const total = netPrice * (Number(item.quantity) || 0);
            return {
                ...item,
                product: prod,
                listPrice,
                netPrice,
                total,
            };
        });
    }, [items, products]);

    const modalSubtotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
    const modalTax = Math.round(modalSubtotal * 0.11);
    const modalGrandTotal = modalSubtotal + modalTax;

    const addItemRow = () => {
        setItems([...items, { product_id: '', quantity: 1, discount_pct: 0 }]);
    };

    const removeItemRow = (index: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItemRow = (index: number, field: keyof LineItemInput, val: any) => {
        const copy = [...items];
        copy[index] = { ...copy[index], [field]: val };
        setItems(copy);
    };

    const handleCreateQuote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactId) {
            alert('Pilih kontak pelanggan terlebih dahulu.');
            return;
        }
        const validItems = items.filter((i) => i.product_id !== '');
        if (validItems.length === 0) {
            alert('Pilih minimal satu produk untuk penawaran.');
            return;
        }

        setSubmitting(true);
        router.post('/app/quotes', {
            contact_id: contactId,
            payment_terms: paymentTerms,
            delivery_terms: deliveryTerms,
            items: validItems.map((i) => ({
                product_id: Number(i.product_id),
                quantity: Number(i.quantity) || 1,
                discount_pct: Number(i.discount_pct) || 0,
            })),
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setContactId('');
                setItems([{ product_id: '', quantity: 1, discount_pct: 0 }]);
                setSubmitting(false);
            },
            onError: () => setSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!deletingQuote) return;
        router.delete(`/app/quotes/${deletingQuote.id}`, {
            onSuccess: () => setDeletingQuote(null),
        });
    };

    // Metric aggregates
    const totalQuoteSum = quotes.reduce((acc, q) => acc + Number(q.grand_total || 0), 0);
    const approvedCount = quotes.filter((q) => q.status === 'approved' || q.status === 'issued').length;
    const pendingCount = quotes.filter((q) => q.status === 'draft' || q.status === 'pending_approval').length;

    return (
        <AppLayout title="Penawaran Harga Resmi (Quotations)">
            <Head title="Daftar Penawaran" />

            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                Penawaran Harga Resmi (Official Quotations)
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Kelola penerbitan penawaran formal dengan perlindungan batas harga mati (Floor Price) & tanda tangan digital token.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Buat Penawaran Baru</span>
                    </button>
                </div>

                {/* 4 Pastel Top Stat Cards - CRM HQ Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#fff1f2] border border-rose-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">Total Quotations</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{quotes.length}</div>
                            <span className="text-[11px] text-rose-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Terdaftar di sistem
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600">
                            <FileSignature className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff7ed] border border-amber-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">Total Nilai Penawaran</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">Rp {(totalQuoteSum / 1_000_000).toFixed(1)}M</div>
                            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Akumulasi nilai bruto
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <Receipt className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Disetujui / Issued</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{approvedCount}</div>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Siap di-invoice
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#f0f9ff] border border-sky-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-sky-500 uppercase tracking-wider block">Draft / In Review</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{pendingCount}</div>
                            <span className="text-[11px] text-sky-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Menunggu finalisasi
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-600">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nomor penawaran, nama klien, atau nomor HP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="text-xs text-slate-500 whitespace-nowrap">Status:</span>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                            {['all', 'draft', 'approved', 'issued'].map((st) => (
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
                                <th className="p-4">Nomor Quote</th>
                                <th className="p-4">Pelanggan</th>
                                <th className="p-4">Channel / Sumber</th>
                                <th className="p-4">Revisi</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Total Nilai Penawaran</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredQuotes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                        <p className="font-medium text-slate-500">Belum ada dokumen penawaran harga</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Klik "+ Buat Penawaran Baru" untuk membuat penawaran resmi.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredQuotes.map((q) => (
                                    <tr key={q.id} className="hover:bg-slate-50/60 transition">
                                        <td className="p-4">
                                            <span className="font-mono font-bold text-indigo-600 text-xs">{q.quote_number}</span>
                                            <span className="text-[10px] text-slate-400 block mt-0.5">
                                                {new Date(q.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-slate-800 block">{q.contact?.name || 'Kontak Anonim'}</span>
                                            <span className="text-[11px] text-slate-500 font-mono">{q.contact?.phone_e164 || '-'}</span>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-medium text-slate-700">
                                                {q.conversation?.channel?.name || 'Manual CRM'}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-700">
                                            Rev #{q.current_revision_number}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                                q.status === 'approved' || q.status === 'issued'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {q.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-extrabold text-slate-900 text-sm">
                                                Rp {Number(q.grand_total || 0).toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Link
                                                    href={`/app/quotes/${q.id}`}
                                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>Lihat Detail</span>
                                                </Link>
                                                <button
                                                    onClick={() => setDeletingQuote(q)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="Hapus Penawaran"
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

            {/* CREATE QUOTE MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-3xl shadow-xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <FileSignature className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-base">Buat Penawaran Harga Baru</h3>
                            </div>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateQuote} className="space-y-4">
                            {/* Customer and terms */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Pilih Pelanggan / Lead *
                                    </label>
                                    <select
                                        value={contactId}
                                        onChange={(e) => setContactId(e.target.value === '' ? '' : Number(e.target.value))}
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    >
                                        <option value="">-- Pilih Kontak --</option>
                                        {contacts.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.phone_e164})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Syarat Pembayaran
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentTerms}
                                        onChange={(e) => setPaymentTerms(e.target.value)}
                                        placeholder="CBD / TOP 30 Hari"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Syarat Pengiriman
                                    </label>
                                    <input
                                        type="text"
                                        value={deliveryTerms}
                                        onChange={(e) => setDeliveryTerms(e.target.value)}
                                        placeholder="Franco Jabodetabek / Loco Gudang"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Product Line Items */}
                            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Daftar Item Produk</span>
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={addItemRow}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Tambah Baris Produk</span>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {calculatedItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                                            <div className="col-span-12 md:col-span-5">
                                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Produk *</label>
                                                <select
                                                    value={item.product_id}
                                                    onChange={(e) => updateItemRow(idx, 'product_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                    required
                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                >
                                                    <option value="">-- Pilih Produk --</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            [{p.sku}] {p.name} (PL: Rp {Number(p.price_list || p.floor_price || 0).toLocaleString('id-ID')})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-span-4 md:col-span-2">
                                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Qty</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItemRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 text-center"
                                                />
                                            </div>

                                            <div className="col-span-4 md:col-span-2">
                                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Diskon %</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                    value={item.discount_pct}
                                                    onChange={(e) => updateItemRow(idx, 'discount_pct', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 text-center"
                                                />
                                            </div>

                                            <div className="col-span-3 md:col-span-2 text-right">
                                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Subtotal</label>
                                                <span className="text-xs font-bold text-slate-800 block pt-1">
                                                    Rp {item.total.toLocaleString('id-ID')}
                                                </span>
                                            </div>

                                            <div className="col-span-1 text-center md:pt-4">
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItemRow(idx)}
                                                        className="text-slate-400 hover:text-rose-600 transition"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Live Summary Calculation */}
                                <div className="pt-3 border-t border-slate-200/80 flex flex-col items-end text-xs space-y-1">
                                    <div className="flex justify-between w-64 text-slate-600">
                                        <span>Subtotal:</span>
                                        <span>Rp {modalSubtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between w-64 text-slate-600">
                                        <span>PPN (11%):</span>
                                        <span>Rp {modalTax.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between w-64 font-bold text-slate-900 pt-1 border-t border-slate-200">
                                        <span>Grand Total:</span>
                                        <span className="text-indigo-600 text-sm">Rp {modalGrandTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                                >
                                    {submitting ? 'Menerbitkan...' : 'Terbitkan Penawaran Resmi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deletingQuote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-600">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Hapus Penawaran Harga?</h3>
                                <p className="text-[11px] text-slate-500">Tindakan ini permanen.</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Penawaran <strong className="text-slate-800">{deletingQuote.quote_number}</strong> sebesar{' '}
                            <strong>Rp {Number(deletingQuote.grand_total).toLocaleString('id-ID')}</strong> akan dihapus beserta histori revisinya.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setDeletingQuote(null)}
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
        </AppLayout>
    );
}
