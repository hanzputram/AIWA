import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Send, Users, Calendar, Clock, AlertTriangle, CheckCircle2, Play, Pause, XCircle, Plus, Eye, ShieldAlert } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Channel {
  id: number;
  phone_number: string;
  name: string;
}

interface Template {
  id: number;
  name: string;
  category: string;
  language: string;
  body_text: string;
}

interface Campaign {
  id: number;
  channel_id: number;
  template_id: number;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
  scheduled_at: string | null;
  created_at: string;
  channel?: Channel;
  template?: Template;
}

interface Props {
  campaigns: Campaign[];
  channels: Channel[];
  templates: Template[];
  total_contacts: number;
}

export default function CampaignsIndex({ campaigns, channels, templates, total_contacts }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [channelId, setChannelId] = useState(channels[0]?.id ? String(channels[0].id) : '');
  const [templateId, setTemplateId] = useState(templates[0]?.id ? String(templates[0].id) : '');
  const [scheduledAt, setScheduledAt] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    router.post('/app/campaigns', {
      name,
      channel_id: channelId,
      template_id: templateId,
      scheduled_at: scheduledAt || null,
    }, {
      onSuccess: () => {
        setShowModal(false);
        setName('');
      }
    });
  };

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
            <Play className="w-3.5 h-3.5" /> Sedang Mengirim
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Pause className="w-3.5 h-3.5" /> Dijeda
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Dibatalkan
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Clock className="w-3.5 h-3.5" /> Terjadwal
          </span>
        );
    }
  };

  return (
    <AppLayout title="Campaign Siaran WhatsApp">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Manajemen Campaign & Broadcast Resmi
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kirim siaran pemberitahuan resmi berbasis template Meta dengan perlindungan suppression otomatis.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Jadwalkan Campaign Baru
          </button>
        </div>

        {/* Suppression & Policy Banner */}
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>Aturan Perlindungan Penawaran & Negosiasi Aktif (Suppression):</strong> Pelanggan yang sedang dalam antrean negosiasi aktif, takeover manusia, atau penawaran pending secara otomatis di-exclude dari broadcast promo agar tidak merusak komitmen harga dan negosiasi berjalan.
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3">Nama Campaign</th>
                  <th className="px-5 py-3">Nomor Pengirim</th>
                  <th className="px-5 py-3">Template Meta</th>
                  <th className="px-5 py-3">Jadwal Eksekusi</th>
                  <th className="px-5 py-3 text-center">Penerima</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Terkirim / Gagal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {campaigns.map(camp => (
                  <tr key={camp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      {camp.name}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                      {camp.channel?.name} ({camp.channel?.phone_number})
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                        {camp.template?.name || 'Template'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                      {camp.scheduled_at ? new Date(camp.scheduled_at).toLocaleString('id-ID') : 'Segera'}
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                      {camp.total_recipients}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {getStatusBadge(camp.status)}
                    </td>
                    <td className="px-5 py-4 text-right text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{camp.successful_sends || 0}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">{camp.failed_sends || 0}</span>
                    </td>
                  </tr>
                ))}

                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                      Belum ada jadwal broadcast campaign WhatsApp yang dibuat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Wizard Create Campaign */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Jadwalkan Campaign WhatsApp Baru
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Campaign *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Contoh: Pengumuman Katalog Panel Schneider Q4"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Bisnis Pengirim *
                    </label>
                    <select
                      value={channelId}
                      onChange={e => setChannelId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
                    >
                      {channels.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Template Resmi Meta *
                    </label>
                    <select
                      value={templateId}
                      onChange={e => setTemplateId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
                    >
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.language})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jadwal Pengiriman (WIB - Asia/Jakarta)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Biarkan kosong untuk segera dieksekusi oleh queue worker setelah konfirmasi.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Estimasi Kontak Terjangkau:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{total_contacts} kontak</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kebijakan Suppression:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Aktif (Keluarkan Nego/Takeover)</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                  >
                    Konfirmasi & Simpan Jadwal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
