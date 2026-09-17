import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import {
    PhoneCall,
    Plus,
    Bot,
    UserCheck,
    Users,
    Shield,
    Activity,
    Play,
    AlertTriangle,
    CheckCircle2,
    X,
} from 'lucide-react';

interface Props {
    channels: Array<any>;
    agent_profiles: Array<any>;
    releases: Array<any>;
    price_books: Array<any>;
    discount_policies: Array<any>;
    users: Array<any>;
    teams: Array<any>;
}

export default function NumbersIndex({
    channels,
    agent_profiles,
    releases,
    price_books,
    discount_policies,
    users,
    teams,
}: Props) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [simulateModalOpen, setSimulateModalOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<any>(null);

    // Simulation Form
    const [simCustomerName, setSimCustomerName] = useState('Budi Santoso');
    const [simCustomerPhone, setSimCustomerPhone] = useState('081299887766');
    const [simMessageText, setSimMessageText] = useState('Halo, kami mau tanya harga MCB Schneider A9F74216 10 pcs, butuh cepat.');
    const [simResult, setSimResult] = useState<any>(null);
    const [simLoading, setSimLoading] = useState(false);

    // Create Channel Form
    const { data, setData, post, processing, reset } = useForm({
        name: '',
        phone_e164: '',
        display_number: '',
        branch: 'Jakarta Barat',
        provider: 'fake_sandbox',
        waba_id: 'WABA-SIM-01',
        phone_number_id: 'PNID-SIM-01',
        ai_mode: 'autonomous',
        primary_human_id: users[0]?.id || '',
        backup_team_id: teams[0]?.id || '',
    });

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/app/numbers', {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    const toggleAiMode = async (channelId: number, currentMode: string) => {
        const nextMode = currentMode === 'autonomous' ? 'assist' : currentMode === 'assist' ? 'off' : 'autonomous';
        try {
            await window.axios.patch(`/api/v1/numbers/${channelId}/ai-mode`, { ai_mode: nextMode });
            router.reload();
        } catch (e) {
            alert('Gagal mengubah mode AI');
        }
    };

    const toggleEmergencyPause = async (channelId: number) => {
        try {
            await window.axios.post(`/api/v1/numbers/${channelId}/emergency-pause`);
            router.reload();
        } catch (e) {
            alert('Gagal mengubah status pause');
        }
    };

    const runSimulation = async () => {
        if (!selectedChannel) return;
        setSimLoading(true);
        setSimResult(null);

        try {
            const res = await window.axios.post(`/api/v1/numbers/${selectedChannel.id}/simulate`, {
                customer_name: simCustomerName,
                customer_phone: simCustomerPhone,
                message_text: simMessageText,
            });
            setSimResult(res.data.orchestrator_result);
        } catch (e: any) {
            alert('Gagal menjalankan simulasi: ' + (e.response?.data?.message || e.message));
        } finally {
            setSimLoading(false);
        }
    };

    return (
        <AppLayout title="Kelola Nomor WhatsApp & Konfigurasi AI">
            <Head title="Nomor WhatsApp Bisnis" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">
                            Nomor WhatsApp Bisnis & Routing AI
                        </h2>
                        <p className="text-xs text-slate-400">
                            Hubungkan nomor bisnis resmi, tetapkan profil AI, manusia utama, dan batasan negosiasi otonom.
                        </p>
                    </div>

                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Nomor WhatsApp</span>
                    </button>
                </div>

                {/* Numbers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {channels.map((ch) => (
                        <div
                            key={ch.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-white">{ch.name}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            ch.connection_status === 'connected'
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        }`}>
                                            {ch.connection_status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                                        <span>{ch.phone_e164}</span>
                                        <span>·</span>
                                        <span className="text-slate-500">{ch.branch || 'Pusat'}</span>
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedChannel(ch);
                                        setSimulateModalOpen(true);
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold transition"
                                >
                                    <Play className="w-3.5 h-3.5" />
                                    <span>Simulasi</span>
                                </button>
                            </div>

                            {/* Configuration Badges */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                                        <Bot className="w-3 h-3 text-indigo-400" />
                                        Mode AI
                                    </span>
                                    <button
                                        onClick={() => toggleAiMode(ch.id, ch.ai_mode)}
                                        className={`font-bold block text-left hover:underline ${
                                            ch.ai_mode === 'autonomous'
                                                ? 'text-emerald-400'
                                                : ch.ai_mode === 'assist'
                                                ? 'text-amber-400'
                                                : 'text-slate-500'
                                        }`}
                                    >
                                        {ch.ai_mode.toUpperCase()} (Klik Ubah)
                                    </button>
                                </div>

                                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                                        <UserCheck className="w-3 h-3 text-emerald-400" />
                                        Manusia Utama
                                    </span>
                                    <span className="font-bold text-slate-200 block truncate">
                                        {ch.primary_human?.name || 'Belum diatur'}
                                    </span>
                                </div>

                                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                                        <Users className="w-3 h-3 text-cyan-400" />
                                        Backup Team
                                    </span>
                                    <span className="font-bold text-slate-200 block truncate">
                                        {ch.backup_team?.name || 'Semua Agent'}
                                    </span>
                                </div>

                                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                                        <Shield className="w-3 h-3 text-rose-400" />
                                        Emergency Pause
                                    </span>
                                    <button
                                        onClick={() => toggleEmergencyPause(ch.id)}
                                        className={`font-bold block text-left hover:underline ${
                                            ch.is_emergency_paused ? 'text-rose-400' : 'text-slate-400'
                                        }`}
                                    >
                                        {ch.is_emergency_paused ? 'PAUSED (Klik Resume)' : 'Normal'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Create Channel */}
                {createModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h3 className="font-bold text-sm text-white">Hubungkan Nomor WhatsApp Bisnis Baru</h3>
                                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitCreate} className="space-y-3 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Nama Label Channel</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Contoh: ATS Sales Surabaya"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Nomor E.164</label>
                                        <input
                                            type="text"
                                            value={data.phone_e164}
                                            onChange={(e) => setData('phone_e164', e.target.value)}
                                            placeholder="+6281234567890"
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Provider Adapter</label>
                                        <select
                                            value={data.provider}
                                            onChange={(e) => setData('provider', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        >
                                            <option value="fake_sandbox">Fake Sandbox (DEMO - Tanpa Kuota)</option>
                                            <option value="meta">Meta Cloud API (Akun Resmi)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Mode Layanan AI</label>
                                        <select
                                            value={data.ai_mode}
                                            onChange={(e) => setData('ai_mode', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        >
                                            <option value="autonomous">Autonomous (AI Menjawab & Nego)</option>
                                            <option value="assist">Assist (AI Hanya Buat Draft)</option>
                                            <option value="off">Off (Manual Manusia)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Manusia Utama (Routing)</label>
                                        <select
                                            value={data.primary_human_id}
                                            onChange={(e) => setData('primary_human_id', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        >
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-3">
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
                                        {processing ? 'Menyimpan...' : 'Simpan & Hubungkan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Simulation Sandbox Modal */}
                {simulateModalOpen && selectedChannel && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <h3 className="font-bold text-sm text-white">Simulasi Pesan Pelanggan (Sandbox)</h3>
                                    <p className="text-[11px] text-slate-400">Saluran: {selectedChannel.name} ({selectedChannel.phone_e164})</p>
                                </div>
                                <button onClick={() => setSimulateModalOpen(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Nama Pelanggan Simulasi</label>
                                        <input
                                            type="text"
                                            value={simCustomerName}
                                            onChange={(e) => setSimCustomerName(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Nomor WhatsApp Pelanggan</label>
                                        <input
                                            type="text"
                                            value={simCustomerPhone}
                                            onChange={(e) => setSimCustomerPhone(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Pesan Masuk Pelanggan</label>
                                    <textarea
                                        value={simMessageText}
                                        onChange={(e) => setSimMessageText(e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                                    />
                                </div>

                                {/* Preset Buttons */}
                                <div className="flex flex-wrap gap-1.5 text-[10px]">
                                    <button
                                        type="button"
                                        onClick={() => setSimMessageText('Halo, kami butuh Schneider MCB A9F74216 20 pcs untuk proyek minggu ini. Harga berapa?')}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                    >
                                        Tanya Produk & Qty
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSimMessageText('Harga kemahalan mas, bisa diskon 15% gak?')}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                    >
                                        Nego Alot / Keberatan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSimMessageText('Baik kami setuju harganya, tolong buatkan invoice dan kirim nomor rekening PT ATS sekarang.')}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                    >
                                        Siap Order (HOT Lead)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSimMessageText('Bisa tolong sambungkan saya dengan sales manusia?')}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                    >
                                        Minta Manusia
                                    </button>
                                </div>

                                <button
                                    onClick={runSimulation}
                                    disabled={simLoading}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                                >
                                    <Play className="w-4 h-4" />
                                    <span>{simLoading ? 'AI Sedang Berpikir...' : 'Kirim Pesan Simulasi & Lihat Respon AI'}</span>
                                </button>

                                {/* Simulation Result */}
                                {simResult && (
                                    <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-white">Hasil Respon Sistem:</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                                                Aksi: {simResult.action}
                                            </span>
                                        </div>

                                        <div className="text-[11px] text-slate-300 space-y-1">
                                            <p>Skor Niat Beli: <strong className="text-white">{simResult.intent_score}/100</strong></p>
                                            {simResult.reply && (
                                                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-300">
                                                    <strong>Balasan AI Otonom:</strong>
                                                    <p className="mt-1 text-slate-200">{simResult.reply}</p>
                                                </div>
                                            )}
                                            {simResult.action === 'takeover_queued' && (
                                                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 space-y-1">
                                                    <p className="font-bold">🚨 AI DIBEKUKAN! Percakapan Masuk Antrean Takeover:</p>
                                                    <p className="text-white">Alasan: {simResult.reasons?.join(', ')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
