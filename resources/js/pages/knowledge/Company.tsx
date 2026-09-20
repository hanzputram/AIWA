import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import {
    Building2,
    Upload,
    FileText,
    CheckCircle2,
    Eye,
    Shield,
    FileCheck,
    ArrowRight,
    X,
    ExternalLink,
    Save,
} from 'lucide-react';

interface Props {
    profile: any;
    documents: Array<any>;
    recent_imports: Array<any>;
}

export default function Company({ profile, documents, recent_imports }: Props) {
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [docText, setDocText] = useState('');
    const [filename, setFilename] = useState('Company-Profile-2026.pdf');
    const [uploading, setUploading] = useState(false);
    const [extractionPreview, setExtractionPreview] = useState<any>(null);

    // Profile form for editing / approving
    const { data, setData, post, processing } = useForm({
        legal_name: profile.legal_name || 'PT Artha Teknik Sejahtera',
        brand_name: profile.brand_name || 'ATS',
        description: profile.description || '',
        website: profile.website || '',
        services: profile.services || [],
        branches: profile.branches || [],
        contact_info: profile.contact_info || {},
        working_hours: profile.working_hours || {},
        portfolio_highlights: profile.portfolio_highlights || [],
    });

    const handleUploadCompro = async () => {
        if (!docText.trim()) return;
        setUploading(true);
        try {
            const res = await window.axios.post('/api/v1/knowledge/compro/upload', {
                document_text: docText,
                filename: filename,
            });
            setExtractionPreview(res.data.extracted_data);
        } catch (e) {
            alert('Gagal mengekstrak dokumen compro');
        } finally {
            setUploading(false);
        }
    };

    const applyExtractedData = () => {
        if (!extractionPreview) return;
        setData({
            legal_name: extractionPreview.legal_name,
            brand_name: extractionPreview.brand_name,
            description: extractionPreview.description,
            website: extractionPreview.website,
            services: extractionPreview.services,
            branches: extractionPreview.branches,
            contact_info: extractionPreview.contact_info,
            working_hours: extractionPreview.working_hours,
            portfolio_highlights: extractionPreview.portfolio_highlights,
        });
        setExtractionPreview(null);
        setUploadModalOpen(false);
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        post('/api/v1/knowledge/compro/approve');
    };

    return (
        <AppLayout title="Profil Perusahaan & Dokumen Compro">
            <Head title="Profil Perusahaan — AIWA HQ" />

            <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 tracking-tight">
                                Profil Bisnis & Dokumen Company Profile (Compro)
                            </h1>
                            <p className="text-xs text-slate-500">
                                Ekstraksi otomatis dokumen profil perusahaan dengan sitasi sumber untuk menjawab pertanyaan pelanggan via WhatsApp.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-xs"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload Compro PDF</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Form Profil Bisnis Approved */}
                    <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">
                                    Informasi Profil Resmi Perusahaan
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Data ini digunakan oleh AI untuk menjawab profil, legalitas, dan layanan perusahaan.
                                </p>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                TERVERIFIKASI
                            </span>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Nama Legal (PT / CV) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.legal_name}
                                        onChange={(e) => setData('legal_name', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Nama Merk / Brand *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.brand_name}
                                        onChange={(e) => setData('brand_name', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    Deskripsi Perusahaan & Bidang Usaha *
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 leading-relaxed"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    Website Resmi
                                </label>
                                <input
                                    type="text"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end pt-3 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{processing ? 'Menyimpan...' : 'Simpan & Terapkan Profil'}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Col: Dokumen Terbitan & Histori Ekstraksi */}
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                            <h3 className="font-bold text-sm text-slate-900">Dokumen Resmi (Compro PDF)</h3>
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                                    <FileText className="w-4 h-4" />
                                    <span>Company_Profile_ATS_2026.pdf</span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Dokumen resmi yang otomatis dilampirkan oleh bot WhatsApp saat pelanggan meminta katalog atau profil perusahaan.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                            <h3 className="font-bold text-sm text-slate-900">Riwayat Ekstraksi AI</h3>
                            <div className="space-y-2.5">
                                {recent_imports.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Belum ada riwayat ekstraksi.</p>
                                ) : (
                                    recent_imports.map((imp) => (
                                        <div
                                            key={imp.id}
                                            className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1"
                                        >
                                            <div className="flex items-center justify-between font-bold text-slate-800">
                                                <span className="truncate">{imp.document_name}</span>
                                                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                    {imp.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400">
                                                {new Date(imp.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* UPLOAD & EXTRACT MODAL */}
            {uploadModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-900">
                                Ekstraksi Teks Dokumen Company Profile (Compro)
                            </h3>
                            <button onClick={() => setUploadModalOpen(false)} className="text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!extractionPreview ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Nama File Referensi
                                    </label>
                                    <input
                                        type="text"
                                        value={filename}
                                        onChange={(e) => setFilename(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Isi Teks Dokumen Company Profile
                                    </label>
                                    <textarea
                                        rows={8}
                                        value={docText}
                                        onChange={(e) => setDocText(e.target.value)}
                                        placeholder="Paste isi teks dari dokumen PDF profil perusahaan di sini..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono leading-relaxed"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        onClick={() => setUploadModalOpen(false)}
                                        className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleUploadCompro}
                                        disabled={uploading || !docText.trim()}
                                        className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                                    >
                                        {uploading ? 'Membedah Dokumen...' : 'Ekstrak dengan AI'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 text-xs">
                                    <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        Hasil Ekstraksi AI Berhasil Ditemukan
                                    </h4>
                                    <p className="text-emerald-800">
                                        <strong>Legal Name:</strong> {extractionPreview.legal_name}
                                    </p>
                                    <p className="text-emerald-800">
                                        <strong>Brand Name:</strong> {extractionPreview.brand_name}
                                    </p>
                                    <p className="text-emerald-800">
                                        <strong>Deskripsi:</strong> {extractionPreview.description}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        onClick={() => setExtractionPreview(null)}
                                        className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                                    >
                                        Ulangi
                                    </button>
                                    <button
                                        onClick={applyExtractedData}
                                        className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                                    >
                                        Terapkan ke Formulir Profil
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
