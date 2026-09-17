import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    FileSignature,
    Printer,
    ArrowLeft,
    CheckCircle2,
    Shield,
    Clock,
    Lock,
} from 'lucide-react';

interface Props {
    quote: any;
}

export default function QuoteShow({ quote }: Props) {
    const { auth } = usePage().props as any;
    const canApprove = ['owner', 'admin', 'manager', 'pricing_approver'].includes(auth.user?.role);
    const rev = quote.revisions?.[quote.revisions.length - 1];

    const handleApprove = () => {
        if (!rev) return;
        router.post(`/app/quotes/${quote.id}/revisions/${rev.id}/approve`);
    };

    return (
        <AppLayout title={`Quotation #${quote.quote_number}`}>
            <Head title={`Quote #${quote.quote_number}`} />

            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <Link
                        href="/app/quotes"
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Daftar Penawaran</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {canApprove && quote.status === 'pending_approval' && (
                            <button
                                onClick={handleApprove}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Setujui Penawaran Khusus</span>
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak / Simpan PDF</span>
                        </button>
                    </div>
                </div>

                {/* Formal Printable Document Card */}
                <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-xl space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm">
                                    ATS
                                </div>
                                <h1 className="font-extrabold text-xl tracking-tight text-slate-900">
                                    PT ARTHA TEKNIK SEJAHTERA
                                </h1>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 max-w-md">
                                Komplek Pergudangan Daan Mogot, Jakarta Barat · Telp: +62 21 5566 7788 · Email: sales@arthateknik.co.id
                            </p>
                        </div>

                        <div className="text-right space-y-1">
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 block">
                                OFFICIAL QUOTATION
                            </span>
                            <span className="text-lg font-mono font-extrabold text-slate-900 block">
                                #{quote.quote_number}
                            </span>
                            <span className="text-xs text-slate-500 block">
                                Revisi #{quote.current_revision_number} · Tanggal: {new Date(quote.created_at).toLocaleDateString('id-ID')}
                            </span>
                        </div>
                    </div>

                    {/* Customer Meta */}
                    <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
                        <div>
                            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                                DITUJUKAN KEPADA:
                            </span>
                            <p className="font-bold text-sm text-slate-900">{quote.contact?.name}</p>
                            <p className="text-slate-600">{quote.contact?.phone_e164}</p>
                            <p className="text-slate-600">{quote.contact?.email || 'Email belum diisi'}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                                KETENTUAN PENJUALAN:
                            </span>
                            <p className="text-slate-700">Masa Berlaku: <strong>7 Hari Kalender</strong></p>
                            <p className="text-slate-700">Syarat Pembayaran: <strong>{rev?.payment_terms || 'CBD'}</strong></p>
                            <p className="text-slate-700">Pengiriman: <strong>{rev?.delivery_terms || 'Franco Gudang'}</strong></p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-left text-xs">
                        <thead className="border-b-2 border-slate-200 uppercase text-[10px] text-slate-500">
                            <tr>
                                <th className="py-2.5">No</th>
                                <th className="py-2.5">Kode SKU</th>
                                <th className="py-2.5">Deskripsi Produk</th>
                                <th className="py-2.5 text-center">Qty</th>
                                <th className="py-2.5 text-right">Harga Satuan</th>
                                <th className="py-2.5 text-right">Diskon</th>
                                <th className="py-2.5 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rev?.lines?.map((line: any, idx: number) => (
                                <tr key={line.id}>
                                    <td className="py-3 text-slate-400">{idx + 1}</td>
                                    <td className="py-3 font-mono font-bold text-indigo-700">{line.sku}</td>
                                    <td className="py-3 font-medium text-slate-900">{line.product_name}</td>
                                    <td className="py-3 text-center">{line.quantity} {line.unit}</td>
                                    <td className="py-3 text-right">Rp {Number(line.unit_list_price).toLocaleString('id-ID')}</td>
                                    <td className="py-3 text-right text-emerald-600 font-bold">{line.unit_discount_pct}%</td>
                                    <td className="py-3 text-right font-extrabold text-slate-900">
                                        Rp {Number(line.total_price).toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals Summary */}
                    <div className="flex justify-end pt-4 border-t border-slate-200">
                        <div className="w-72 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal Sebelum Diskon:</span>
                                <span>Rp {Number(rev?.subtotal || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 font-bold">
                                <span>Total Diskon Resmi:</span>
                                <span>- Rp {Number(rev?.total_discount || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-300">
                                <span>TOTAL PEMBAYARAN:</span>
                                <span>Rp {Number(quote.grand_total).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Cryptographic Signed Token Badge */}
                    <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1 text-slate-500">
                            <Lock className="w-3 h-3 text-indigo-600" />
                            <span>Signed Reference Token: {quote.signed_token?.slice(0, 32)}...</span>
                        </div>
                        <span>Diterbitkan oleh Sistem Kebijakan Otonom ATS</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
