import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Ticket as TicketIcon, Clock, AlertTriangle, CheckCircle2, UserCheck, Search, Filter, ShieldAlert, Check } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Contact {
  id: number;
  name: string;
  phone_e164: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  sla_due_at: string | null;
  resolved_at: string | null;
  contact?: Contact;
  assignedUser?: User;
  conversation_id: number | null;
}

interface Props {
  tickets: Ticket[];
  contacts: Contact[];
  users: User[];
}

export default function TicketsIndex({ tickets, contacts, users }: Props) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch = 
      t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.contact && t.contact.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleResolve = async (id: number) => {
    try {
      await fetch(`/app/tickets/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ status: 'resolved' })
      });
      router.reload({ only: ['tickets'] });
    } catch (e) {
      console.error(e);
    }
  };

  const getPriorityBadge = (p: Ticket['priority']) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200">URGENT</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">LOW</span>;
    }
  };

  const getStatusBadge = (s: Ticket['status']) => {
    switch (s) {
      case 'resolved':
        return <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Selesai</span>;
      case 'waiting_customer':
        return <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Menunggu Klien</span>;
      case 'in_progress':
        return <span className="text-blue-600 dark:text-blue-400 font-semibold">Sedang Diproses</span>;
      default:
        return <span className="text-slate-600 dark:text-slate-400 font-medium">Tiket Baru</span>;
    }
  };

  return (
    <AppLayout title="Tiket Dukungan & SLA">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TicketIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Tiket Dukungan & Pemantauan SLA
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kelola eskalasi teknis, pertanyaan spesifikasi panel khusus, dan komplain pelanggan bergaransi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari nomor tiket, subjek, pelanggan..."
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-72 dark:text-white"
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="new">Tiket Baru</option>
              <option value="in_progress">Sedang Diproses</option>
              <option value="waiting_customer">Menunggu Klien</option>
              <option value="resolved">Selesai</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3">Nomor & Subjek</th>
                  <th className="px-5 py-3">Pelanggan</th>
                  <th className="px-5 py-3 text-center">Prioritas</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3">Batas Waktu SLA</th>
                  <th className="px-5 py-3">Penanggung Jawab</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredTickets.map(ticket => {
                  const isBreached = ticket.sla_due_at && new Date(ticket.sla_due_at) < new Date() && ticket.status !== 'resolved';

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                          {ticket.ticket_number}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {ticket.subject}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {ticket.contact?.name || 'Anonim'}
                        </div>
                        <div className="text-slate-400 font-mono">
                          {ticket.contact?.phone_e164}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {getPriorityBadge(ticket.priority)}
                      </td>
                      <td className="px-5 py-4 text-xs capitalize text-slate-600 dark:text-slate-300">
                        {ticket.category}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {ticket.sla_due_at ? (
                          <div className={`flex items-center gap-1 font-medium ${isBreached ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                            {isBreached && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
                            <span>{new Date(ticket.sla_due_at).toLocaleString('id-ID')}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                        {ticket.assignedUser?.name || <span className="text-amber-500 italic">Belum Di-assign</span>}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {ticket.status !== 'resolved' ? (
                          <button
                            onClick={() => handleResolve(ticket.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-lg text-xs font-semibold transition-colors border border-emerald-200 dark:border-emerald-800"
                          >
                            <Check className="w-3.5 h-3.5" /> Selesaikan
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Tuntas</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                      Tidak ada tiket dukungan yang sesuai dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
