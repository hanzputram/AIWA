import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, Layers, X, Shield } from 'lucide-react';

interface Props {
    price_books: Array<any>;
    products?: Array<any>;
}

export default function Prices({ price_books, products = [] }: Props) {
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any>(null);

    const [bookForm, setBookForm] = useState({
        name: '',
        version: 'v1.0',
        price_basis: 'list_with_coefficient',
        coefficient: '1.0000',
        currency: 'IDR',
    });

    const [entryForm, setEntryForm] = useState({
        price_book_id: '',
        product_id: '',
        base_price: '',
        tier: 'standard',
        min_quantity: 1,
    });

    const openCreateBook = () => {
        setSelectedBook(null);
        setBookForm({
            name: '',
            version: 'v1.0',
            price_basis: 'list_with_coefficient',
            coefficient: '1.0000',
            currency: 'IDR',
        });
        setIsBookModalOpen(true);
    };

    const openEditBook = (book: any) => {
        setSelectedBook(book);
        setBookForm({
            name: book.name,
            version: book.version,
            price_basis: book.price_basis,
            coefficient: book.coefficient?.toString() || '1.0000',
            currency: book.currency || 'IDR',
        });
        setIsBookModalOpen(true);
    };

    const handleSaveBook = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedBook) {
            router.put(`/app/knowledge/prices/books/${selectedBook.id}`, bookForm, {
                onSuccess: () => setIsBookModalOpen(false),
            });
        } else {
            router.post('/app/knowledge/prices/books', bookForm, {
                onSuccess: () => setIsBookModalOpen(false),
            });
        }
    };

    const handleDeleteBook = (id: number, name: string) => {
        if (confirm(`Hapus Price Book [${name}]?`)) {
            router.delete(`/app/knowledge/prices/books/${id}`);
        }
    };

    const openAddEntry = (bookId: number) => {
        setEntryForm({
            price_book_id: bookId.toString(),
            product_id: products[0]?.id?.toString() || '',
            base_price: '',
            tier: 'standard',
            min_quantity: 1,
        });
        setIsEntryModalOpen(true);
    };

    const handleSaveEntry = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/app/knowledge/prices/entries', entryForm, {
            onSuccess: () => setIsEntryModalOpen(false),
        });
    };

    const handleDeleteEntry = (id: number) => {
        if (confirm('Hapus entri harga ini?')) {
            router.delete(`/app/knowledge/prices/entries/${id}`);
        }
    };

    return (
        <AppLayout title="Daftar Harga & Price Book Versioning">
            <Head title="Price Books — AIWA HQ" />

            <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 tracking-tight">
                                Daftar Harga Resmi & Versioning
                            </h1>
                            <p className="text-xs text-slate-500">
                                Konfigurasi Price Book, faktor pengali koefisien, dan batasan tier kuantitas.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateBook}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Buat Price Book</span>
                    </button>
                </div>

                <div className="space-y-6">
                    {price_books.map((pb) => (
                        <div
                            key={pb.id}
                            className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-slate-900">{pb.name}</h3>
                                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                                            {pb.version}
                                        </span>
                                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                            AKTIF
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                                        <span>Mata Uang: <strong>{pb.currency}</strong></span>
                                        <span>·</span>
                                        <span>Basis: <strong>{pb.price_basis}</strong></span>
                                        <span>·</span>
                                        <span>Koefisien Pengali: <strong className="text-blue-600">{pb.coefficient}x</strong></span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openAddEntry(pb.id)}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                                    >
                                        + Tambah Entri SKU
                                    </button>
                                    <button
                                        onClick={() => openEditBook(pb)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                                        title="Ubah Price Book"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBook(pb.id, pb.name)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                                        title="Hapus Price Book"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-700">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 font-bold">
                                            <th className="pb-3 font-semibold">SKU</th>
                                            <th className="pb-3 font-semibold">Nama Produk</th>
                                            <th className="pb-3 font-semibold">Tier Pelanggan</th>
                                            <th className="pb-3 font-semibold">Min Qty</th>
                                            <th className="pb-3 text-right font-semibold">Harga Jual Resmi</th>
                                            <th className="pb-3 text-right font-semibold">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pb.entries?.map((entry: any) => (
                                            <tr key={entry.id} className="hover:bg-slate-50/60 transition">
                                                <td className="py-3 font-mono font-bold text-blue-600">{entry.sku}</td>
                                                <td className="py-3 font-semibold text-slate-900">{entry.product?.name}</td>
                                                <td className="py-3 uppercase text-[10px] font-bold text-slate-500">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">{entry.tier}</span>
                                                </td>
                                                <td className="py-3">{entry.min_quantity} {entry.product?.unit || 'pcs'}</td>
                                                <td className="py-3 text-right font-extrabold text-slate-900">
                                                    Rp {Number(entry.base_price).toLocaleString('id-ID')}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <button
                                                        onClick={() => handleDeleteEntry(entry.id)}
                                                        className="text-slate-400 hover:text-rose-600 p-1"
                                                        title="Hapus Entri"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CREATE / EDIT PRICE BOOK MODAL */}
            {isBookModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">
                                {selectedBook ? 'Ubah Price Book' : 'Buat Price Book Baru'}
                            </h3>
                            <button onClick={() => setIsBookModalOpen(false)} className="text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveBook} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Price Book</label>
                                <input
                                    type="text"
                                    required
                                    value={bookForm.name}
                                    onChange={(e) => setBookForm({ ...bookForm, name: e.target.value })}
                                    placeholder="Price List Resmi Schneider 2026"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Versi</label>
                                    <input
                                        type="text"
                                        value={bookForm.version}
                                        onChange={(e) => setBookForm({ ...bookForm, version: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Koefisien</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={bookForm.coefficient}
                                        onChange={(e) => setBookForm({ ...bookForm, coefficient: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Basis Harga</label>
                                <select
                                    value={bookForm.price_basis}
                                    onChange={(e) => setBookForm({ ...bookForm, price_basis: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                                >
                                    <option value="list_with_coefficient">Price List with Coefficient (Pengali)</option>
                                    <option value="net">Net Price (Harga Bersih Tetap)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsBookModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                                >
                                    Simpan Price Book
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD ENTRY MODAL */}
            {isEntryModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">Tambah Entri Harga SKU</h3>
                            <button onClick={() => setIsEntryModalOpen(false)} className="text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEntry} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Produk (SKU)</label>
                                <select
                                    required
                                    value={entryForm.product_id}
                                    onChange={(e) => {
                                        const prod = products.find((p) => p.id.toString() === e.target.value);
                                        setEntryForm({
                                            ...entryForm,
                                            product_id: e.target.value,
                                            base_price: prod?.price_list?.toString() || '',
                                        });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                                >
                                    <option value="">-- Pilih Produk --</option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            [{p.sku}] {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Tier Pelanggan</label>
                                    <select
                                        value={entryForm.tier}
                                        onChange={(e) => setEntryForm({ ...entryForm, tier: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="tier1">Tier 1 (Silver)</option>
                                        <option value="tier2">Tier 2 (Gold/Distributor)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Min Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={entryForm.min_quantity}
                                        onChange={(e) =>
                                            setEntryForm({ ...entryForm, min_quantity: parseInt(e.target.value) || 1 })
                                        }
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 text-center"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Harga Jual Resmi (Rp)</label>
                                <input
                                    type="number"
                                    required
                                    value={entryForm.base_price}
                                    onChange={(e) => setEntryForm({ ...entryForm, base_price: e.target.value })}
                                    placeholder="85000"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEntryModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                                >
                                    Simpan Entri
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
