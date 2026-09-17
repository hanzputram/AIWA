import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Search,
    Send,
    Flame,
    Clock,
    UserCheck,
    Bot,
    FileText,
    FileSignature,
    CheckCheck,
    Check,
    AlertTriangle,
    Shield,
    Building2,
    Phone,
    Mail,
    Plus,
    Tag,
    ChevronRight,
    RotateCcw,
} from 'lucide-react';

interface Props {
    conversations: Array<any>;
    active_conversation: any;
    messages: Array<any>;
    internal_notes: Array<any>;
    handover_brief: any;
    active_quote: any;
    products: Array<any>;
}

export default function InboxIndex({
    conversations,
    active_conversation,
    messages,
    internal_notes,
    handover_brief,
    active_quote,
    products,
}: Props) {
    const { auth } = usePage().props as any;

    const [messageText, setMessageText] = useState('');
    const [noteText, setNoteText] = useState('');
    const [isInternalNoteMode, setIsInternalNoteMode] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tabFilter, setTabFilter] = useState<'all' | 'mine' | 'unhandled'>('all');
    const [releaseModalOpen, setReleaseModalOpen] = useState(false);
    const [releaseNotes, setReleaseNotes] = useState('');

    const filteredConversations = conversations.filter((c) => {
        const matchesSearch = c.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.contact_phone.includes(searchQuery);

        if (!matchesSearch) return false;

        if (tabFilter === 'mine') {
            return c.assigned_to === auth.user?.name;
        }
        if (tabFilter === 'unhandled') {
            return c.control_owner === 'handoff_requested';
        }
        return true;
    });

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!active_conversation || sending) return;

        if (isInternalNoteMode) {
            if (!noteText.trim()) return;
            setSending(true);
            try {
                await window.axios.post(`/api/v1/conversations/${active_conversation.id}/notes`, {
                    content: noteText,
                });
                setNoteText('');
                router.reload();
            } catch (err: any) {
                alert('Gagal mengirim catatan internal');
            } finally {
                setSending(false);
            }
        } else {
            if (!messageText.trim()) return;
            setSending(true);
            try {
                await window.axios.post(`/api/v1/conversations/${active_conversation.id}/messages`, {
                    content: messageText,
                    kind: 'text',
                });
                setMessageText('');
                router.reload();
            } catch (err: any) {
                const msg = err.response?.data?.error?.message || 'Gagal mengirim pesan';
                alert(msg);
            } finally {
                setSending(false);
            }
        }
    };

    const handleClaimTakeover = async () => {
        if (!active_conversation) return;
        try {
            // Find active handoff request
            const res = await window.axios.post(`/api/v1/handoffs/${active_conversation.id}/claim`);
            router.reload();
        } catch (e: any) {
            alert(e.response?.data?.error?.message || 'Gagal mengambil alih');
        }
    };

    const handleReleaseToAi = async () => {
        if (!active_conversation) return;
        try {
            await window.axios.post(`/api/v1/conversations/${active_conversation.id}/release-to-ai`, {
                context_notes: releaseNotes,
            });
            setReleaseModalOpen(false);
            setReleaseNotes('');
            router.reload();
        } catch (e: any) {
            alert('Gagal mengembalikan ke AI');
        }
    };

    return (
        <AppLayout title="Kotak Masuk Multiagen (WhatsApp Inbox)">
            <Head title="Kotak Masuk" />

            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                {/* COLUMN 1: Conversation List (320px per spec) */}
                <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
                    {/* Header & Filter Tabs */}
                    <div className="p-3 border-b border-slate-800 space-y-2">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama atau nomor..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="flex gap-1 text-[11px]">
                            <button
                                onClick={() => setTabFilter('all')}
                                className={`flex-1 py-1 rounded-md font-semibold transition ${
                                    tabFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setTabFilter('mine')}
                                className={`flex-1 py-1 rounded-md font-semibold transition ${
                                    tabFilter === 'mine' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                                }`}
                            >
                                Milik Saya
                            </button>
                            <button
                                onClick={() => setTabFilter('unhandled')}
                                className={`flex-1 py-1 rounded-md font-semibold transition ${
                                    tabFilter === 'unhandled' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                                }`}
                            >
                                Takeover
                            </button>
                        </div>
                    </div>

                    {/* Conversations Scroll Area */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                        {filteredConversations.map((conv) => {
                            const isSelected = active_conversation?.id === conv.id;

                            return (
                                <Link
                                    key={conv.id}
                                    href={`/app/inbox/${conv.id}`}
                                    className={`p-3 block transition hover:bg-slate-800/50 ${
                                        isSelected ? 'bg-slate-800/90 border-l-4 border-indigo-500' : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-1">
                                        <div className="truncate font-bold text-xs text-white">
                                            {conv.contact_name}
                                        </div>
                                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                                            {conv.last_message_time || 'Baru'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] text-indigo-300 font-mono">
                                            {conv.contact_phone}
                                        </span>
                                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                                            {conv.channel_name}
                                        </span>
                                    </div>

                                    <p className="text-[11px] text-slate-400 truncate mt-1">
                                        {conv.last_message || 'Belum ada pesan.'}
                                    </p>

                                    {/* Badges footer */}
                                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/40 text-[10px]">
                                        <div className="flex items-center gap-1.5">
                                            {conv.intent_band === 'hot' && (
                                                <span className="flex items-center gap-0.5 bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold">
                                                    <Flame className="w-2.5 h-2.5" />
                                                    <span>HOT {conv.intent_score}</span>
                                                </span>
                                            )}
                                            {conv.control_owner === 'handoff_requested' && (
                                                <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                                    Antrean Takeover
                                                </span>
                                            )}
                                            {conv.control_owner === 'human_active' && (
                                                <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                                                    Manusia Aktif
                                                </span>
                                            )}
                                        </div>

                                        {conv.unread_count > 0 && (
                                            <span className="bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-full text-[9px]">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* COLUMN 2: Chat Timeline & Composer (360px+ flexible) */}
                <div className="flex-1 bg-slate-950 flex flex-col min-w-[360px] border-r border-slate-800">
                    {active_conversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-white">
                                            {active_conversation.contact.name}
                                        </h3>
                                        <span className="text-xs text-slate-400 font-mono">
                                            ({active_conversation.contact.phone_e164})
                                        </span>
                                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                                            Channel: {active_conversation.channel.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                        <span className="flex items-center gap-1">
                                            Status Kontrol:{' '}
                                            <strong className={`font-bold ${
                                                active_conversation.control_owner === 'human_active'
                                                    ? 'text-emerald-400'
                                                    : active_conversation.control_owner === 'handoff_requested'
                                                    ? 'text-rose-400'
                                                    : 'text-indigo-400'
                                            }`}>
                                                {active_conversation.control_owner.toUpperCase()}
                                            </strong>
                                        </span>
                                        <span>·</span>
                                        <span>Epoch: #{active_conversation.control_epoch}</span>
                                        <span>·</span>
                                        <span className={`font-semibold ${
                                            active_conversation.is_within_window ? 'text-emerald-400' : 'text-amber-400'
                                        }`}>
                                            {active_conversation.is_within_window ? '24h Window Aktif' : 'Window 24h Berakhir (Wajib Template)'}
                                        </span>
                                    </div>
                                </div>

                                {/* Header Actions: Takeover or Release to AI */}
                                <div className="flex items-center gap-2">
                                    {active_conversation.control_owner !== 'human_active' ? (
                                        <button
                                            onClick={handleClaimTakeover}
                                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition"
                                        >
                                            <UserCheck className="w-3.5 h-3.5" />
                                            <span>Takeover Percakapan</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setReleaseModalOpen(true)}
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>Kembalikan ke AI</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Takeover Active Alert Banner */}
                            {active_conversation.control_owner === 'handoff_requested' && (
                                <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2 flex items-center justify-between text-xs text-rose-300 font-medium">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                        <span>Pelanggan dialihkan ke antrean takeover: {active_conversation.handoff_reasons?.join(', ')}</span>
                                    </div>
                                    <button
                                        onClick={handleClaimTakeover}
                                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded"
                                    >
                                        Klaim Sekarang
                                    </button>
                                </div>
                            )}

                            {/* Messages Timeline */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                                {messages.map((msg) => {
                                    const isInbound = msg.direction === 'inbound';
                                    const isAi = msg.sender_type === 'ai';
                                    const isSystem = msg.sender_type === 'system';

                                    if (isSystem) {
                                        return (
                                            <div key={msg.id} className="flex justify-center my-2">
                                                <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[11px] px-3 py-1 rounded-full text-center max-w-md">
                                                    {msg.content}
                                                </span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm space-y-1 ${
                                                    isInbound
                                                        ? 'bg-slate-900 border border-slate-800 text-slate-100'
                                                        : isAi
                                                        ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-800/70 text-indigo-100'
                                                        : 'bg-indigo-600 text-white'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 text-[10px] opacity-70 pb-0.5 border-b border-white/10">
                                                    <span className="font-semibold">
                                                        {isInbound
                                                            ? active_conversation.contact.name
                                                            : isAi
                                                            ? '🤖 ATS AI Assistant'
                                                            : '👤 Sales Human'}
                                                    </span>
                                                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>

                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                                                {/* Delivery Status Indicator */}
                                                {!isInbound && (
                                                    <div className="flex justify-end items-center gap-1 text-[10px] opacity-70 pt-0.5">
                                                        <span>{msg.state}</span>
                                                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Internal Notes Timeline (Amber color strictly distinct) */}
                                {internal_notes.map((note) => (
                                    <div key={note.id} className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-1 my-2">
                                        <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold">
                                            <span>🔒 Catatan Internal (Hanya Terlihat Tim ATS)</span>
                                            <span>{note.user?.name} · {new Date(note.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-xs text-amber-200">{note.content}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Chat Composer */}
                            <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
                                {/* Toggle Catatan Internal vs Balasan Pelanggan */}
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsInternalNoteMode(false)}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                                                !isInternalNoteMode
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Balas WhatsApp Pelanggan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsInternalNoteMode(true)}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                                                isInternalNoteMode
                                                    ? 'bg-amber-600 text-white'
                                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            🔒 Catatan Internal
                                        </button>
                                    </div>

                                    {!active_conversation.is_within_window && !isInternalNoteMode && (
                                        <span className="text-[10px] text-amber-400">
                                            Di luar window 24 jam!
                                        </span>
                                    )}
                                </div>

                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={isInternalNoteMode ? noteText : messageText}
                                        onChange={(e) =>
                                            isInternalNoteMode ? setNoteText(e.target.value) : setMessageText(e.target.value)
                                        }
                                        placeholder={
                                            isInternalNoteMode
                                                ? 'Tulis catatan internal untuk rekan tim...'
                                                : 'Ketik pesan balasan WhatsApp... (Enter kirim)'
                                        }
                                        className={`flex-1 border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition ${
                                            isInternalNoteMode
                                                ? 'bg-amber-950/20 border-amber-800/80 focus:border-amber-500'
                                                : 'bg-slate-950 border-slate-800 focus:border-indigo-500'
                                        }`}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition ${
                                            isInternalNoteMode
                                                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                        }`}
                                    >
                                        <span>{isInternalNoteMode ? 'Simpan' : 'Kirim'}</span>
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-6">
                            <Bot className="w-12 h-12 text-slate-700 mb-2" />
                            <p>Pilih percakapan dari daftar di sebelah kiri untuk melihat timeline dan dokumen penawaran.</p>
                        </div>
                    )}
                </div>

                {/* COLUMN 3: Customer & Handover Brief Panel (304px per spec) */}
                <div className="hidden lg:flex flex-col w-76 bg-slate-900 border-l border-slate-800 shrink-0 p-4 space-y-4 overflow-y-auto">
                    {active_conversation ? (
                        <>
                            {/* Contact Card */}
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Profil Pelanggan</span>
                                </h4>

                                <div className="space-y-1.5 text-xs">
                                    <div className="font-bold text-white text-sm">
                                        {active_conversation.contact.name}
                                    </div>
                                    <p className="text-slate-400 flex items-center gap-2 text-[11px]">
                                        <Phone className="w-3 h-3 text-slate-500" />
                                        <span>{active_conversation.contact.phone_e164}</span>
                                    </p>
                                    <p className="text-slate-400 flex items-center gap-2 text-[11px]">
                                        <Tag className="w-3 h-3 text-slate-500" />
                                        <span>Tier: <strong className="text-emerald-400 uppercase">{active_conversation.contact.customer_tier}</strong></span>
                                    </p>
                                </div>
                            </div>

                            {/* Handover Brief Panel */}
                            {handover_brief && (
                                <div className="bg-slate-950 p-4 rounded-xl border border-rose-950/80 space-y-3">
                                    <h4 className="font-bold text-xs text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5 text-rose-400" />
                                        <span>Handover Brief Sales</span>
                                    </h4>

                                    <div className="space-y-2 text-[11px] text-slate-300">
                                        <div>
                                            <span className="text-slate-500 block">Kebutuhan Pelanggan:</span>
                                            <p className="font-medium text-white">{handover_brief.customer_needs}</p>
                                        </div>

                                        <div>
                                            <span className="text-slate-500 block">Penawaran Sah Terakhir:</span>
                                            <p className="font-medium text-emerald-400">{handover_brief.last_valid_quote_summary}</p>
                                        </div>

                                        <div>
                                            <span className="text-slate-500 block">Penawaran / Bid Pelanggan:</span>
                                            <p className="font-medium text-amber-300">{handover_brief.customer_last_bid}</p>
                                        </div>

                                        <div>
                                            <span className="text-slate-500 block">Alasan Takeover:</span>
                                            <p className="font-medium text-rose-300">{handover_brief.trigger_reasons_summary}</p>
                                        </div>

                                        <div>
                                            <span className="text-slate-500 block">Tindakan Selanjutnya:</span>
                                            <p className="whitespace-pre-wrap text-slate-300 mt-0.5">{handover_brief.suggested_next_actions}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Active Quote Card */}
                            {active_quote && (
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-xs text-white uppercase flex items-center gap-1">
                                            <FileSignature className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>Quotation #{active_quote.quote_number}</span>
                                        </h4>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                                            {active_quote.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-xs space-y-1">
                                        <p className="text-slate-400">Total Penawaran:</p>
                                        <p className="text-lg font-extrabold text-white">
                                            Rp {Number(active_quote.grand_total).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/app/quotes/${active_quote.id}`}
                                        className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-center text-[11px] font-bold block"
                                    >
                                        Lihat Detail Penawaran
                                    </Link>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-xs text-slate-500 text-center pt-8">
                            Pilih percakapan untuk melihat data profil pelanggan.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Release to AI */}
            {releaseModalOpen && active_conversation && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <h3 className="font-bold text-sm text-white">Kembalikan Percakapan ke AI Assistant</h3>
                        <p className="text-xs text-slate-300">
                            AI akan diaktifkan kembali untuk melayani percakapan ini. Control Epoch akan dinaikkan agar AI merespon dengan konteks baru yang telah disetujui.
                        </p>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan Konteks untuk AI (Opsional)</label>
                            <textarea
                                value={releaseNotes}
                                onChange={(e) => setReleaseNotes(e.target.value)}
                                placeholder="Contoh: Stok sudah dikonfirmasi 20 unit, boleh beri diskon 2.5% jika minta."
                                rows={3}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setReleaseModalOpen(false)}
                                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleReleaseToAi}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md"
                            >
                                Aktifkan AI Kembali
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
