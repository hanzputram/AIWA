import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Settings as SettingsIcon, Users, Shield, ShieldAlert, History, Key, Check, Plus, Globe, Clock, AlertTriangle } from 'lucide-react';
import { router } from '@inertiajs/react';

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

export default function SettingsIndex({ workspace, memberships, teams, audit_logs }: Props) {
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
        }
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <SettingsIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Pengaturan Workspace & Manajemen Akses
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Konfigurasi hak akses multi-role (IAM), tim penjualan, dan log audit kepatuhan.
            </p>
          </div>

          <button
            onClick={handleEmergencyStop}
            disabled={stopping}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            {stopping ? 'Menghentikan...' : 'Emergency Stop Seluruh AI'}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'members'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Anggota & Hak Akses ({memberships.length})
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'teams'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" /> Tim & Routing ({teams.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" /> Log Audit Kepatuhan ({audit_logs.length})
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'general'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" /> Profil Workspace
          </button>
        </div>

        {/* Tab 1: Memberships & Roles */}
        {activeTab === 'members' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Daftar Pengguna Internal
              </span>
              <span className="text-xs text-slate-500">
                Isolasi Hak Akses Scoped Workspace
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {memberships.map(m => (
                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      {m.user?.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {m.user?.email}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase">
                      {m.role}
                    </span>
                    <span className="text-xs text-slate-400">
                      Status: <strong className="text-emerald-500">{m.status}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Teams */}
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map(t => (
              <div key={t.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {t.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                    Routing: {t.routing_policy}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tim operasional yang ditugaskan sebagai penerima eskalasi otomatis dari AI Sales Workspace.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase">
              20 Aktivitas Kepatuhan & Audit Terakhir
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-xs">
              {audit_logs.map(log => (
                <div key={log.id} className="p-3.5 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <div>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      [{log.action}]
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 ml-2">
                      Aktor: {log.user?.name || 'Sistem Policy'}
                    </span>
                    {log.details && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                  <div className="text-slate-400 shrink-0">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}

              {audit_logs.length === 0 && (
                <div className="p-6 text-center text-slate-400">
                  Belum ada catatan log audit.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: General Workspace Profile */}
        {activeTab === 'general' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm max-w-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Informasi Umum Ruang Kerja (Workspace)
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Workspace</label>
                <div className="font-bold text-slate-900 dark:text-white">{workspace.name}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Workspace Slug</label>
                <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{workspace.slug}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Zona Waktu Default</label>
                  <div className="text-slate-800 dark:text-slate-200 font-medium">{workspace.timezone} (WIB)</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Bahasa Sistem</label>
                  <div className="text-slate-800 dark:text-slate-200 font-medium">Bahasa Indonesia ({workspace.locale})</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
