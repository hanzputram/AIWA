import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
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
        <AppLayout title="Company Profile (Compro) & Business Profile">
            <Head title="Profil Perusahaan & Compro" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-400" />
                            <span>Profil Bisnis & Dokumen Company Profile (Compro)</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Unggah dokumen compro untuk autofill profil secara otomatis dengan penelusuran sumber, serta buat PDF resmi versi approved untuk dibagikan ke WhatsApp pelanggan.
                        </p>
                    </div>

                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition self-start sm:self-auto"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload Compro (Autofill AI)</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Structured Business Profile Form */}
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div>
                                <h3 className="font-bold text-sm text-white">Data Profil Perusahaan Terstruktur</h3>
                                <p className="text-[11px] text-slate-400">Sumber: {profile.source_document_name || 'Input Manual'}</p>
                            </div>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {profile.is_approved ? 'APPROVED RESMI' : 'DRAFT'}
                            </span>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Nama Legal Perusahaan</label>
                                    <input
                                        type="text"
                                        value={data.legal_name}
                                        onChange={(e) => setData('legal_name', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Nama Brand / Merk</label>
                                    <input
                                        type="text"
                                        value={data.brand_name}
                                        onChange={(e) => setData('brand_name', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Deskripsi Perusahaan</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Website Resmi</label>
                                <input
                                    type="text"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan & Approve Profil Bisnis'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right 1 Col: Customer-Shareable Documents & Compro PDF */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                        <div className="pb-3 border-b border-slate-800">
                            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                                <FileCheck className="w-4 h-4 text-emerald-400" />
                                <span>Dokumen Approved untuk Pelanggan</span>
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                Dokumen berklasifikasi <code className="text-emerald-300">customer_shareable</code> yang diizinkan dikirimkan oleh AI ke pelanggan WhatsApp.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-bold text-xs text-white leading-snug">{doc.title}</h4>
                                            <span className="text-[10px] text-emerald-400 uppercase font-bold">
                                                {doc.classification}
                                            </span>
                                        </div>
                                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                    </div>
                                    <p className="text-[11px] text-slate-400 line-clamp-3">
                                        {doc.file_content_text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Upload & Extraction Preview Modal */}
                {uploadModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h3 className="font-bold text-sm text-white">Upload Dokumen Company Profile (Compro)</h3>
                                <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {!extractionPreview ? (
                                <div className="space-y-3 text-xs">
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Nama File Dokumen</label>
                                        <input
                                            type="text"
                                            value={filename}
                                            onChange={(e) => setFilename(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Konten / Hasil Ekstraksi OCR Teks Dokumen</label>
                                        <textarea
                                            value={docText}
                                            onChange={(e) => setDocText(e.target.value)}
                                            rows={6}
                                            placeholder="Paste isi company profile di sini untuk diekstrak otomatis menjadi data terstruktur..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setUploadModalOpen(false)}
                                            className="px-3 py-2 text-slate-400 hover:text-white"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleUploadCompro}
                                            disabled={uploading}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>{uploading ? 'Mengekstrak Field...' : 'Ekstrak Profil Otomatis'}</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 text-xs">
                                    <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 font-semibold">
                                        Field berhasil diekstrak! Tinjau hasil ekstraksi berdampingan dengan sumber sebelum disimpan:
                                    </div>

                                    <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300">
                                        <p><strong>Nama Legal:</strong> {extractionPreview.legal_name}</p>
                                        <p><strong>Brand:</strong> {extractionPreview.brand_name}</p>
                                        <p><strong>Deskripsi:</strong> {extractionPreview.description}</p>
                                        <p><strong>Website:</strong> {extractionPreview.website}</p>
                                        <p><strong>Layanan ({extractionPreview.services?.length}):</strong> {extractionPreview.services?.join(', ')}</p>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setExtractionPreview(null)}
                                            className="px-3 py-2 text-slate-400 hover:text-white"
                                        >
                                            Ulangi
                                        </button>
                                        <button
                                            type="button"
                                            onClick={applyExtractedData}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                                        >
                                            Terapkan ke Form Profil
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
