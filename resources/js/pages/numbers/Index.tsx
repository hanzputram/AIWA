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
    Edit3,
    Trash2,
    Radio,
    Sparkles,
    Settings2,
    ShieldAlert
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
    channels = [],
    agent_profiles = [],
    releases = [],
    price_books = [],
    discount_policies = [],
    users = [],
    teams = [],
}: Props) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<any>(null);
    const [deletingChannel, setDeletingChannel] = useState<any>(null);
    const [simulateModalOpen, setSimulateModalOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<any>(null);

    // Simulation Form
    const [simCustomerName, setSimCustomerName] = useState('Budi Santoso');
    const [simCustomerPhone, setSimCustomerPhone] = useState('081299887766');
    const [simMessageText, setSimMessageText] = useState('Halo, kami mau tanya harga MCB Schneider A9F74216 10 pcs, butuh cepat.');
    const [simResult, setSimResult] = useState<any>(null);
    const [simLoading, setSimLoading] = useState(false);

    // Create Channel Form
    const createForm = useForm({
        name: '',
        phone_e164: '',
        display_number: '',
        branch: 'Jakarta Barat',
        provider: 'fake_sandbox',
        waba_id: '',
        phone_number_id: '',
        secret_reference: '',
        ai_mode: 'autonomous',
        primary_human_id: users[0]?.id || '',
        backup_team_id: teams[0]?.id || '',
    });

    // Edit Channel Form
    const editForm = useForm({
        name: '',
        phone_e164: '',
        display_number: '',
        branch: 'Jakarta Barat',
        provider: 'fake_sandbox',
        waba_id: '',
        phone_number_id: '',
        secret_reference: '',
        ai_mode: 'autonomous',
        primary_human_id: '',
        backup_team_id: '',
    });

    const openEdit = (ch: any) => {
        setEditingChannel(ch);
        editForm.setData({
            name: ch.name || '',
            phone_e164: ch.phone_e164 || '',
            display_number: ch.display_number || '',
            branch: ch.branch || 'Jakarta Barat',
            provider: ch.provider || 'fake_sandbox',
            waba_id: ch.waba_id || '',
            phone_number_id: ch.phone_number_id || '',
            secret_reference: ch.secret_reference || '',
            ai_mode: ch.ai_mode || 'autonomous',
            primary_human_id: ch.primary_human_id || users[0]?.id || '',
            backup_team_id: ch.backup_team_id || teams[0]?.id || '',
        });
        setEditModalOpen(true);
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/app/numbers', {
            onSuccess: () => {
                setCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChannel) return;
        editForm.put(`/app/numbers/${editingChannel.id}`, {
            onSuccess: () => {
                setEditModalOpen(false);
                setEditingChannel(null);
            },
        });
    };

    const submitDelete = () => {
        if (!deletingChannel) return;
        router.delete(`/app/numbers/${deletingChannel.id}`, {
            onSuccess: () => setDeletingChannel(null),
        });
    };

    const toggleAiMode = async (channelId: number, currentMode: string) => {
        const nextMode = currentMode === 'autonomous' ? 'assist' : currentMode === 'assist' ? 'off' : 'autonomous';
        try {
            await (window as any).axios.patch(`/api/v1/numbers/${channelId}/ai-mode`, { ai_mode: nextMode });
            router.reload();
        } catch (e) {
            alert('Gagal mengubah mode AI');
        }
    };

    const toggleEmergencyPause = async (channelId: number) => {
        try {
            await (window as any).axios.post(`/api/v1/numbers/${channelId}/emergency-pause`);
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
            const res = await (window as any).axios.post(`/api/v1/numbers/${selectedChannel.id}/simulate`, {
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

    // Metrics
    const totalChannels = channels.length;
    const connectedChannels = channels.filter(c => c.connection_status === 'connected').length;
    const autonomousChannels = channels.filter(c => c.ai_mode === 'autonomous').length;
    const pausedChannels = channels.filter(c => c.is_emergency_paused).length;

    return (
        <AppLayout title="Kelola Nomor WhatsApp & Konfigurasi AI">
            <Head title="Nomor WhatsApp Bisnis" />

            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                Nomor WhatsApp Bisnis & Routing AI
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Hubungkan nomor WhatsApp resmi Meta Cloud API, atur mode AI otonom/assist, dan simulasikan interaksi percakapan.
                        </p>
                    </div>

                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambah Nomor WhatsApp</span>
                    </button>
                </div>

                {/* 4 Pastel Top Stat Cards - CRM HQ Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#fff1f2] border border-rose-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">Total Nomor</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{totalChannels}</div>
                            <span className="text-[11px] text-rose-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Terdaftar di sistem
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600">
                            <PhoneCall className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Terhubung Aktif</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{connectedChannels}</div>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Siap terima pesan
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#eff6ff] border border-blue-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">AI Autonomous</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{autonomousChannels}</div>
                            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Menjawab & nego mandiri
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                            <Bot className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff7ed] border border-amber-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">Emergency Pause</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{pausedChannels}</div>
                            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Status intervensi
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Numbers Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {channels.length === 0 ? (
                        <div className="col-span-2 bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 shadow-xs">
                            <PhoneCall className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p className="font-semibold text-slate-700">Belum ada nomor WhatsApp terdaftar</p>
                            <p className="text-xs text-slate-400 mt-1">Klik "+ Tambah Nomor WhatsApp" untuk menghubungkan nomor baru.</p>
                        </div>
                    ) : (
                        channels.map((ch) => (
                            <div
                                key={ch.id}
                                className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 relative hover:border-slate-300 transition"
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-sm text-slate-800">{ch.name}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                ch.connection_status === 'connected'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {ch.connection_status.toUpperCase()}
                                            </span>
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                                {ch.provider === 'meta' ? 'Meta Cloud API' : 'Sandbox DEMO'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                                            <span className="font-semibold text-indigo-600">{ch.phone_e164}</span>
                                            <span>·</span>
                                            <span className="text-slate-500 font-sans">{ch.branch || 'Pusat'}</span>
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => {
                                                setSelectedChannel(ch);
                                                setSimulateModalOpen(true);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition"
                                            title="Buka Sandbox Percakapan"
                                        >
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            <span>Simulasi AI</span>
                                        </button>
                                        <button
                                            onClick={() => openEdit(ch)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                            title="Ubah Konfigurasi"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingChannel(ch)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                            title="Hapus Nomor"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Configuration Badges */}
                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                                            <Bot className="w-3.5 h-3.5 text-indigo-600" />
                                            Mode AI
                                        </span>
                                        <button
                                            onClick={() => toggleAiMode(ch.id, ch.ai_mode)}
                                            className={`font-bold block text-left hover:underline ${
                                                ch.ai_mode === 'autonomous'
                                                    ? 'text-emerald-600'
                                                    : ch.ai_mode === 'assist'
                                                    ? 'text-amber-600'
                                                    : 'text-slate-500'
                                            }`}
                                        >
                                            {ch.ai_mode.toUpperCase()} 🔄
                                        </button>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                                            Manusia Utama
                                        </span>
                                        <span className="font-semibold text-slate-700 block truncate">
                                            {ch.primary_human?.name || 'Belum diatur'}
                                        </span>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                                            Backup Team
                                        </span>
                                        <span className="font-semibold text-slate-700 block truncate">
                                            {ch.backup_team?.name || 'Semua Agent'}
                                        </span>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5 text-indigo-600" />
                                            Emergency Pause
                                        </span>
                                        <button
                                            onClick={() => toggleEmergencyPause(ch.id)}
                                            className={`font-bold block text-left hover:underline ${
                                                ch.is_emergency_paused ? 'text-rose-600' : 'text-slate-600'
                                            }`}
                                        >
                                            {ch.is_emergency_paused ? 'PAUSED ⚠️ (Klik Resume)' : 'Normal (Aktif)'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* MODAL CREATE CHANNEL */}
                {createModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Hubungkan Nomor WhatsApp Bisnis Baru</h3>
                                </div>
                                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitCreate} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nama Label Channel *</label>
                                    <input
                                        type="text"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="Contoh: ATS Sales Surabaya"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Nomor E.164 *</label>
                                        <input
                                            type="text"
                                            value={createForm.data.phone_e164}
                                            onChange={(e) => createForm.setData('phone_e164', e.target.value)}
                                            placeholder="+6281234567890"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Provider Adapter *</label>
                                        <select
                                            value={createForm.data.provider}
                                            onChange={(e) => createForm.setData('provider', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="fake_sandbox">Fake Sandbox (DEMO - Tanpa Kuota)</option>
                                            <option value="meta">Meta Cloud API (Akun Resmi)</option>
                                        </select>
                                    </div>
                                </div>

                                {createForm.data.provider === 'meta' && (
                                    <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                                        <div className="text-[11px] text-slate-600 leading-relaxed space-y-1">
                                            <p className="font-bold text-slate-800">Kredensial Meta WhatsApp Cloud API:</p>
                                            <p className="text-slate-500">Dapatkan data ini dari portal <strong className="text-slate-700">Meta for Developers &gt; WhatsApp &gt; API Setup</strong>.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Phone Number ID *</label>
                                                <input
                                                    type="text"
                                                    value={createForm.data.phone_number_id}
                                                    onChange={(e) => createForm.setData('phone_number_id', e.target.value)}
                                                    placeholder="Contoh: 104523678912345"
                                                    required={createForm.data.provider === 'meta'}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">WABA ID *</label>
                                                <input
                                                    type="text"
                                                    value={createForm.data.waba_id}
                                                    onChange={(e) => createForm.setData('waba_id', e.target.value)}
                                                    placeholder="Contoh: 102345678901234"
                                                    required={createForm.data.provider === 'meta'}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-slate-700 font-semibold mb-1 text-[11px]">System User Access Token</label>
                                            <input
                                                type="password"
                                                value={createForm.data.secret_reference}
                                                onChange={(e) => createForm.setData('secret_reference', e.target.value)}
                                                placeholder="EAAG... (Atau kosongkan jika sudah diatur di .env)"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Mode Layanan AI</label>
                                        <select
                                            value={createForm.data.ai_mode}
                                            onChange={(e) => createForm.setData('ai_mode', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="autonomous">Autonomous (AI Menjawab & Nego)</option>
                                            <option value="assist">Assist (AI Hanya Buat Draft)</option>
                                            <option value="off">Off (Manual Manusia)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Manusia Utama (Routing)</label>
                                        <select
                                            value={createForm.data.primary_human_id}
                                            onChange={(e) => createForm.setData('primary_human_id', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setCreateModalOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                                    >
                                        {createForm.processing ? 'Menyimpan...' : 'Simpan & Hubungkan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL EDIT CHANNEL */}
                {editModalOpen && editingChannel && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Edit3 className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Ubah Konfigurasi Saluran WhatsApp</h3>
                                </div>
                                <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitEdit} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Nama Label Channel *</label>
                                    <input
                                        type="text"
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Nomor E.164 *</label>
                                        <input
                                            type="text"
                                            value={editForm.data.phone_e164}
                                            onChange={(e) => editForm.setData('phone_e164', e.target.value)}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Provider *</label>
                                        <select
                                            value={editForm.data.provider}
                                            onChange={(e) => editForm.setData('provider', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="fake_sandbox">Fake Sandbox (DEMO)</option>
                                            <option value="meta">Meta Cloud API (Official)</option>
                                        </select>
                                    </div>
                                </div>

                                {editForm.data.provider === 'meta' && (
                                    <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Phone Number ID</label>
                                                <input
                                                    type="text"
                                                    value={editForm.data.phone_number_id}
                                                    onChange={(e) => editForm.setData('phone_number_id', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">WABA ID</label>
                                                <input
                                                    type="text"
                                                    value={editForm.data.waba_id}
                                                    onChange={(e) => editForm.setData('waba_id', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Mode AI</label>
                                        <select
                                            value={editForm.data.ai_mode}
                                            onChange={(e) => editForm.setData('ai_mode', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="autonomous">Autonomous</option>
                                            <option value="assist">Assist</option>
                                            <option value="off">Off</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Manusia Utama</label>
                                        <select
                                            value={editForm.data.primary_human_id}
                                            onChange={(e) => editForm.setData('primary_human_id', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setEditModalOpen(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                                    >
                                        {editForm.processing ? 'Menyimpan...' : 'Perbarui Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DELETE CONFIRMATION */}
                {deletingChannel && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Hapus Saluran WhatsApp?</h3>
                                    <p className="text-[11px] text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Nomor <strong className="text-slate-800">{deletingChannel.name} ({deletingChannel.phone_e164})</strong> akan dihapus dari sistem routing AI.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setDeletingChannel(null)}
                                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={submitDelete}
                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SIMULATION SANDBOX MODAL */}
                {simulateModalOpen && selectedChannel && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-600" />
                                        <span>Simulasi Pesan Pelanggan (Sandbox AI)</span>
                                    </h3>
                                    <p className="text-[11px] text-slate-500">Saluran: {selectedChannel.name} ({selectedChannel.phone_e164})</p>
                                </div>
                                <button onClick={() => setSimulateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Nama Pelanggan Simulasi</label>
                                        <input
                                            type="text"
                                            value={simCustomerName}
                                            onChange={(e) => setSimCustomerName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 font-semibold mb-1">Nomor WhatsApp Pelanggan</label>
                                        <input
                                            type="text"
                                            value={simCustomerPhone}
                                            onChange={(e) => setSimCustomerPhone(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Pesan Masuk Pelanggan</label>
                                    <textarea
                                        value={simMessageText}
                                        onChange={(e) => setSimMessageText(e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>

                                {/* Preset Buttons */}
                                <div className="flex flex-wrap gap-1.5 text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() => setSimMessageText('Halo, kami butuh Schneider MCB A9F74216 20 pcs untuk proyek minggu ini. Harga berapa?')}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                    >
                                        Tanya Produk & Qty
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSimMessageText('Harga kemahalan mas, bisa diskon 15% gak?')}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                    >
                                        Nego Alot / Diskon
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSimMessageText('Baik kami setuju harganya, tolong buatkan invoice dan kirim nomor rekening PT ATS sekarang.')}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                    >
                                        Siap Order (HOT Lead)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSimMessageText('Bisa tolong sambungkan saya dengan sales manusia?')}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                    >
                                        Minta Manusia
                                    </button>
                                </div>

                                <button
                                    onClick={runSimulation}
                                    disabled={simLoading}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    <span>{simLoading ? 'AI Sedang Berpikir...' : 'Kirim Pesan Simulasi & Lihat Respon AI'}</span>
                                </button>

                                {/* Simulation Result */}
                                {simResult && (
                                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-slate-800">Hasil Respon Sistem:</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                Aksi: {simResult.action}
                                            </span>
                                        </div>

                                        <div className="text-[11px] text-slate-700 space-y-2">
                                            <p>Skor Niat Beli: <strong className="text-slate-900">{simResult.intent_score}/100</strong></p>
                                            {simResult.reply && (
                                                <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs text-slate-800">
                                                    <strong className="text-emerald-700 block mb-1">Balasan AI Otonom:</strong>
                                                    <p className="leading-relaxed">{simResult.reply}</p>
                                                </div>
                                            )}
                                            {simResult.action === 'takeover_queued' && (
                                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                                                    <p className="font-bold">Takeover Diperlukan:</p>
                                                    <p className="text-xs">Alasan: {simResult.reasons?.join(', ')}</p>
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
