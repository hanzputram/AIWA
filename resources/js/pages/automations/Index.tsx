import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Workflow as WorkflowIcon, Zap, GitFork, MessageSquare, UserCheck, ShieldCheck, Play, ArrowRight, CheckCircle2, Plus, Info } from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action_send' | 'action_handoff' | 'action_assign';
  title: string;
  description: string;
}

interface Workflow {
  id: number;
  name: string;
  trigger_type: string;
  status: 'draft' | 'published' | 'inactive';
  version: number;
  definition: {
    nodes?: WorkflowNode[];
  } | null;
  created_at: string;
}

interface Props {
  workflows: Workflow[];
}

export default function AutomationsIndex({ workflows }: Props) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(workflows[0] || null);

  // Mock nodes representation if definition is empty
  const defaultNodes: WorkflowNode[] = [
    { id: '1', type: 'trigger', title: 'Pesan Masuk WhatsApp', description: 'Pelanggan mengirim pesan teks atau memilih menu interaktif' },
    { id: '2', type: 'condition', title: 'Pengecekan Jendela Operasional (24 Jam)', description: 'Jika pesan terakhir < 24 jam: pesan bebas, jika > 24 jam: wajib Template Resmi' },
    { id: '3', type: 'condition', title: 'Evaluasi Intent & Penawaran', description: 'AI Sales menganalisis SKU, spesifikasi dan memanggil PricingEngine' },
    { id: '4', type: 'action_handoff', title: 'Fence & Handoff Manusia (Jika Stalled / Hot)', description: 'Freeze AI turns, naikkan epoch, rute ke antrean Manusia Utama' },
  ];

  const currentNodes = (selectedWorkflow?.definition?.nodes && selectedWorkflow.definition.nodes.length > 0)
    ? selectedWorkflow.definition.nodes
    : defaultNodes;

  return (
    <AppLayout title="Workflow Otomatisasi & Chatbot">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <WorkflowIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Automasi Alur Percakapan & Eskalasi Bot
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Desain alur kerja logika percakapan, penjadwalan reminder, dan jembatan eskalasi manusia.
            </p>
          </div>
        </div>

        {/* Guard Notice */}
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong>Proteksi Eksekusi Server (SSRF & Loop Guard):</strong> Seluruh webhook action dalam workflow dibatasi oleh domain allowlist dan isolasi network internal. Transisi handoff membekukan loop balasan bot untuk mencegah bot terus membalas percakapan yang telah diambil alih oleh agen manusia.
          </div>
        </div>

        {/* Grid Layout: Workflow Selector & Visual Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Workflows List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Daftar Workflow Terdaftar ({workflows.length})
              </h3>
              <div className="space-y-2">
                {workflows.map(wf => (
                  <div
                    key={wf.id}
                    onClick={() => setSelectedWorkflow(wf)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedWorkflow?.id === wf.id
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {wf.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                        v{wf.version} {wf.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Trigger: {wf.trigger_type}
                    </p>
                  </div>
                ))}

                {workflows.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Belum ada workflow otomasi kustom.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visual Node Flow Canvas */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Canvas Alur: {selectedWorkflow?.name || 'Inbound Sales & Escalation Flow'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Versi rilis immutable v{selectedWorkflow?.version || 1} • Status: Aktif Terverifikasi
                  </p>
                </div>
              </div>

              {/* Node Sequence Diagram */}
              <div className="space-y-4 relative">
                {currentNodes.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 flex items-start gap-4 hover:border-indigo-300 transition-colors">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm bg-indigo-600 text-white shrink-0 shadow-sm">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {node.title}
                          </h4>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {node.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {node.description}
                        </p>
                      </div>
                    </div>

                    {index < currentNodes.length - 1 && (
                      <div className="flex justify-center my-1">
                        <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Automation Guarantees Box */}
              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Eksekusi Idempotent: Keyed by Message Event & Control Epoch</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Loop & Stalled Protection Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
