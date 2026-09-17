import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { MessageSquareText, CheckCircle2, Clock, XCircle, Send, AlertTriangle, ShieldCheck, Plus, Globe } from 'lucide-react';

interface Channel {
  id: number;
  phone_number: string;
  name: string;
}

interface Template {
  id: number;
  channel_id: number;
  name: string;
  category: string;
  language: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paused';
  header_text: string | null;
  body_text: string;
  footer_text: string | null;
  buttons: any[] | null;
  channel?: Channel;
}

interface Props {
  templates: Template[];
  channels: Channel[];
}

export default function Templates({ templates, channels }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(templates[0] || null);

  const getStatusBadge = (status: Template['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Disetujui Meta
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Menunggu Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-500" /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Draft Lokal
          </span>
        );
    }
  };

  return (
    <AppLayout title="Template WhatsApp Resmi">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquareText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Katalog Template WhatsApp Resmi (WABA)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Template pre-approved Meta untuk pesan outbound di luar jendela 24 jam dan siaran campaign resmi.
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
            <strong>Kepatuhan Kebijakan WhatsApp Resmi:</strong> Outbound di luar 24 jam wajib menggunakan template terdaftar dengan status <span className="font-semibold text-emerald-700 dark:text-emerald-400">Disetujui Meta</span>. Pengiriman pesan teks bebas di luar jendela pesan pengguna akan ditolak otomatis oleh <code>MessagingEligibilityService</code>.
          </div>
        </div>

        {/* Two-Column Grid: List & Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Templates List */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Daftar Template Terdaftar ({templates.length})
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Sinkronisasi Terakhir: Realtime
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {templates.map(tmpl => (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedTemplate?.id === tmpl.id
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          {tmpl.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase font-medium">
                          {tmpl.category}
                        </span>
                      </div>
                      {getStatusBadge(tmpl.status)}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                      {tmpl.body_text}
                    </p>

                    <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" /> {tmpl.language}
                      </span>
                      {tmpl.channel && (
                        <span>Channel: {tmpl.channel.name} ({tmpl.channel.phone_number})</span>
                      )}
                    </div>
                  </div>
                ))}

                {templates.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    Belum ada template WhatsApp resmi yang terdaftar.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Realistic WhatsApp Chat Balloon Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm sticky top-24">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                <span>Simulasi Preview Layar WhatsApp Pelanggan</span>
                <span className="text-xs font-normal text-slate-400">Mock Display</span>
              </h3>

              {selectedTemplate ? (
                <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
                  {/* WhatsApp Message Bubble */}
                  <div className="bg-[#E7FFDB] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-sm p-4 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50 text-sm space-y-2">
                    {selectedTemplate.header_text && (
                      <div className="font-bold text-sm text-slate-900 dark:text-white border-b border-emerald-200/40 dark:border-emerald-800/40 pb-1">
                        {selectedTemplate.header_text}
                      </div>
                    )}
                    <div className="text-xs leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
                      {selectedTemplate.body_text}
                    </div>
                    {selectedTemplate.footer_text && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-emerald-200/30 dark:border-emerald-800/30">
                        {selectedTemplate.footer_text}
                      </div>
                    )}
                  </div>

                  {/* Buttons if any */}
                  {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {selectedTemplate.buttons.map((btn, idx) => (
                        <div
                          key={idx}
                          className="w-full py-2 bg-white dark:bg-slate-800 rounded-lg text-center text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                          {btn.text || 'Lihat Detail'}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metadata Specs */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs space-y-2 text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Kode Template:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{selectedTemplate.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kategori:</span>
                      <span className="text-slate-800 dark:text-slate-200 capitalize">{selectedTemplate.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bahasa Resmi:</span>
                      <span className="text-slate-800 dark:text-slate-200">{selectedTemplate.language}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Pilih salah satu template di sebelah kiri untuk melihat simulasi tampilan.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
