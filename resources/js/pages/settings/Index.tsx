import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import {
    Settings as SettingsIcon,
    Users,
    Shield,
    ShieldAlert,
    History,
    Key,
    Check,
    Plus,
    Globe,
    Clock,
    AlertTriangle,
    Building2,
    Lock
} from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Membership {
    id: number;
    user_id: number;
    role: string;
    permissions: string[] | null;
    status: string;
    user?: User;
}

interface Team {
    id: number;
    name: string;
    routing_policy: string;
    members?: any[];
}

interface AuditLog {
    id: number;
    action: string;
    entity_type: string | null;
    entity_id: number | null;
    details: any;
    created_at: string;
    user?: User;
}

interface Workspace {
    id: number;
    name: string;
    slug: string;
    timezone: string;
    locale: string;
}

interface Props {
    workspace: Workspace;
    memberships: Membership[];
    teams: Team[];
    audit_logs: AuditLog[];
}

export default function SettingsIndex({
    workspace,
    memberships = [],
    teams = [],
    audit_logs = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'members' | 'teams' | 'audit' | 'general'>('members');
    const [stopping, setStopping] = useState(false);

    const handleEmergencyStop = async () => {
        if (!confirm('PERINGATAN: Apakah Anda yakin ingin mematikan SELURUH runtime AI Sales di workspace ini? Semua giliran AI yang sedang berjalan akan di-invalidasi seketika.')) {
            return;
        }

        setStopping(true);
        try {
            await fetch('/app/ai/emergency-stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            alert('Semua runtime AI Sales berhasil dihentikan (Emergency Stop aktif).');
            router.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setStopping(false);
        }
    };

    return (
        <AppLayout title="Pengaturan Workspace & Akses">
            <Head title="Pengaturan Workspace" />

            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                Pengaturan Ruang Kerja & Manajemen Akses
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Konfigurasi hak akses multi-role (IAM), tim penjualan internal, dan log audit kepatuhan.
                        </p>
                    </div>

                    <button
                        onClick={handleEmergencyStop}
                        disabled={stopping}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
                    >
                        <ShieldAlert className="w-4 h-4" />
                        <span>{stopping ? 'Menghentikan...' : 'Emergency Stop Seluruh AI'}</span>
                    </button>
                </div>

                {/* 4 Pastel Top Stat Cards - CRM HQ Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#eff6ff] border border-blue-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">Anggota Workspace</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{memberships.length}</div>
                            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5 mt-0.5">
                                User terdaftar
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ecfdf5] border border-emerald-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Tim Penjualan</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{teams.length}</div>
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Unit routing eskalasi
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                            <Shield className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fff7ed] border border-amber-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">Log Audit Kepatuhan</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{audit_logs.length}</div>
                            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Jejak rekam aktivitas
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <History className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#f5f3ff] border border-purple-100 flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs font-semibold text-purple-500 uppercase tracking-wider block">Isolasi Keamanan</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">ACTIVE</div>
                            <span className="text-[11px] text-purple-600 font-medium flex items-center gap-0.5 mt-0.5">
                                Tenant data terisolasi
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600">
                            <Lock className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                            activeTab === 'members'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Anggota & Hak Akses ({memberships.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('teams')}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                            activeTab === 'teams'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <Shield className="w-4 h-4" />
                        <span>Tim & Routing ({teams.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                            activeTab === 'audit'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        <span>Log Audit Kepatuhan ({audit_logs.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                            activeTab === 'general'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <Globe className="w-4 h-4" />
                        <span>Profil Workspace</span>
                    </button>
                </div>

                {/* Tab 1: Memberships & Roles */}
                {activeTab === 'members' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Daftar Pengguna Internal
                            </span>
                            <span className="text-xs text-slate-400">
                                Isolasi Hak Akses Workspace
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {memberships.map((m) => (
                                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">
                                            {m.user?.name}
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono">
                                            {m.user?.email}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                                            {m.role}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            Status: <strong className="text-emerald-600 font-bold">{m.status}</strong>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab 2: Teams */}
                {activeTab === 'teams' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {teams.map((t) => (
                            <div key={t.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 text-base">
                                        {t.name}
                                    </h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                                        Routing: {t.routing_policy}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Tim operasional yang ditugaskan sebagai penerima eskalasi otomatis dari AI Sales Workspace.
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab 3: Audit Logs */}
                {activeTab === 'audit' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                        <div className="p-4 bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-700 uppercase tracking-wider">
                            20 Aktivitas Kepatuhan & Audit Terakhir
                        </div>

                        <div className="divide-y divide-slate-100 font-mono text-xs">
                            {audit_logs.map((log) => (
                                <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition">
                                    <div>
                                        <span className="font-bold text-indigo-600">
                                            [{log.action}]
                                        </span>
                                        <span className="text-slate-700 ml-2 font-sans font-medium">
                                            Aktor: {log.user?.name || 'Sistem Policy'}
                                        </span>
                                        {log.details && (
                                            <div className="text-[11px] text-slate-400 mt-1">
                                                {JSON.stringify(log.details)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-slate-400 shrink-0 text-[11px]">
                                        {new Date(log.created_at).toLocaleString('id-ID')}
                                    </div>
                                </div>
                            ))}

                            {audit_logs.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-xs font-sans">
                                    Belum ada catatan log audit.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab 4: General Workspace Profile */}
                {activeTab === 'general' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs max-w-xl space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
                            Informasi Umum Ruang Kerja (Workspace)
                        </h3>

                        <div className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-500 mb-1">Nama Perusahaan / Workspace</label>
                                <div className="font-bold text-slate-800 text-sm">{workspace.name}</div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-500 mb-1">Workspace Identifier (Slug)</label>
                                <div className="font-mono text-xs text-indigo-600 font-semibold">{workspace.slug}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block font-semibold text-slate-500 mb-1">Zona Waktu Sistem</label>
                                    <div className="text-slate-800 font-medium">{workspace.timezone} (WIB)</div>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-500 mb-1">Bahasa Sistem</label>
                                    <div className="text-slate-800 font-medium">Bahasa Indonesia ({workspace.locale})</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
