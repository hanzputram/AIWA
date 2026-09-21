import React, { useState, useEffect, useRef } from 'react';
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
    X,
    Lock,
    Pencil,
    Sparkles,
    ExternalLink
} from 'lucide-react';

const QUICK_REPLIES = [
    { label: '💡 Sapa & Tanya Kebutuhan', text: 'Halo! Terima kasih sudah menghubungi Siriso WhatsApp. Ada yang bisa kami bantu seputar spesifikasi & kebutuhan Anda?' },
    { label: '📦 Info Stok & Kualitas', text: 'Produk kami ready stock, 100% original dengan sertifikat & garansi resmi pabrikan. Siap diproses untuk pengiriman.' },
    { label: '📄 Siapkan Penawaran (Quotation)', text: 'Baik, segera kami buatkan Surat Penawaran Harga (Quotation) resmi dari sistem untuk Bapak/Ibu.' },
];

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
    conversations = [],
    active_conversation,
    messages = [],
    internal_notes = [],
    handover_brief,
    active_quote,
    products = [],
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
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [contactNameInput, setContactNameInput] = useState('');
    const [contactPhoneInput, setContactPhoneInput] = useState('');
    const [savingContact, setSavingContact] = useState(false);

    const isLid = (phone?: string) => {
        if (!phone) return false;
        const clean = phone.replace(/[^0-9]/g, '');
        return clean.length >= 14 && !clean.startsWith('62');
    };

    const handleSaveContact = async () => {
        if (!active_conversation?.contact || savingContact) return;
        setSavingContact(true);
        try {
            await (window as any).axios.patch(`/api/v1/contacts/${active_conversation.contact.id}`, {
                name: contactNameInput.trim() || active_conversation.contact.name,
                phone_e164: contactPhoneInput.trim(),
            });
            setIsEditingContact(false);
            router.reload();
        } catch (err) {
            alert('Gagal memperbarui info kontak');
        } finally {
            setSavingContact(false);
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll down when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // Live Real-Time Auto Polling (every 2.5 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!document.hidden) {
                router.reload({
                    only: ['conversations', 'active_conversation', 'messages', 'internal_notes', 'handover_brief'],
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        }, 2500);

        return () => clearInterval(interval);
    }, [active_conversation?.id]);

    const renderMessageStatus = (state?: string, size: 'sm' | 'md' = 'md') => {
        const s = (state || 'sent').toLowerCase();
        if (s === 'read') {
            return (
                <span
                    className="inline-flex items-center gap-0.5 text-[#53bdeb] drop-shadow-2xs font-bold"
                    title="Sudah Dilihat / Dibaca oleh Pelanggan (Centang Biru Meta WhatsApp)"
                >
                    <CheckCheck className={size === 'sm' ? 'w-3.5 h-3.5 text-[#53bdeb] stroke-[2.5]' : 'w-4 h-4 text-[#53bdeb] stroke-[2.5]'} />
                </span>
            );
        }
        if (s === 'delivered') {
            return (
                <span
                    className="inline-flex items-center gap-0.5 text-slate-400"
                    title="Tersampaikan ke HP Pelanggan (Dua Centang Abu-Abu)"
                >
                    <CheckCheck className={size === 'sm' ? 'w-3.5 h-3.5 stroke-[2]' : 'w-4 h-4 stroke-[2]'} />
                </span>
            );
        }
        if (s === 'sent') {
            return (
                <span
                    className="inline-flex items-center gap-0.5 text-slate-400"
                    title="Terkirim ke Server WhatsApp (Satu Centang Abu-Abu)"
                >
                    <Check className={size === 'sm' ? 'w-3.5 h-3.5 stroke-[2]' : 'w-4 h-4 stroke-[2]'} />
                </span>
            );
        }
        if (s === 'failed') {
            return (
                <span className="inline-flex items-center gap-0.5 text-rose-500" title="Gagal Terkirim">
                    <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-0.5 text-slate-400" title="Terkirim">
                <Check className={size === 'sm' ? 'w-3.5 h-3.5 stroke-[2]' : 'w-4 h-4 stroke-[2]'} />
            </span>
        );
    };

    const filteredConversations = conversations.filter((c) => {
        const matchesSearch = (c.contact_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.contact_phone || '').includes(searchQuery);

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
                await (window as any).axios.post(`/api/v1/conversations/${active_conversation.id}/notes`, {
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
                await (window as any).axios.post(`/api/v1/conversations/${active_conversation.id}/messages`, {
                    content: messageText,
                    kind: 'text',
                });
                setMessageText('');
                router.reload();
            } catch (err: any) {
                const msg = err.response?.data?.error?.message || 'Gagal mengirim pesan';
                alert('Pengiriman gagal: ' + msg);
            } finally {
                setSending(false);
            }
        }
    };

    const handleClaimTakeover = async () => {
        if (!active_conversation) return;
        try {
            await (window as any).axios.post(`/api/v1/conversations/${active_conversation.id}/takeover`, {
                reason: 'Agen sales mengambil alih via UI Inbox CRM HQ',
            });
            router.reload();
        } catch (err) {
            alert('Gagal mengambil alih percakapan');
        }
    };

    const handleReleaseToAi = async () => {
        if (!active_conversation) return;
        try {
            await (window as any).axios.post(`/api/v1/conversations/${active_conversation.id}/release-to-ai`, {
                notes: releaseNotes,
            });
            setReleaseModalOpen(false);
            setReleaseNotes('');
            router.reload();
        } catch (err) {
            alert('Gagal mengembalikan ke AI');
        }
    };

    return (
        <AppLayout title="Kotak Masuk Multiagen (WhatsApp Inbox)">
            <Head title="Kotak Masuk" />

            <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-[#f8fafc]">
                {/* COLUMN 1: Conversation List (320px) */}
                <div className="w-80 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
                    {/* Header & Filter Tabs */}
                    <div className="p-3 border-b border-slate-100 space-y-2.5">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama atau nomor..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                            />
                        </div>

                        <div className="flex bg-slate-100 p-0.5 rounded-xl text-[11px]">
                            <button
                                onClick={() => setTabFilter('all')}
                                className={`flex-1 py-1 rounded-lg font-medium transition ${
                                    tabFilter === 'all' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setTabFilter('mine')}
                                className={`flex-1 py-1 rounded-lg font-medium transition ${
                                    tabFilter === 'mine' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Milik Saya
                            </button>
                            <button
                                onClick={() => setTabFilter('unhandled')}
                                className={`flex-1 py-1 rounded-lg font-medium transition ${
                                    tabFilter === 'unhandled' ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Takeover
                            </button>
                        </div>
                    </div>

                    {/* Conversations Scroll Area */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">
                                Tidak ada percakapan
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const isSelected = active_conversation?.id === conv.id;

                                return (
                                    <Link
                                        key={conv.id}
                                        href={`/app/inbox/${conv.id}`}
                                        className={`p-3.5 block transition hover:bg-slate-50 relative ${
                                            isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            {/* Avatar */}
                                            <div className="relative shrink-0 mt-0.5">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                                                    {conv.contact_name ? conv.contact_name.charAt(0).toUpperCase() : 'P'}
                                                </div>
                                                {conv.is_within_window && (
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title="24h Window Aktif" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-1">
                                                    <div className="truncate font-bold text-xs text-slate-800">
                                                        {conv.contact_name}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                                        {conv.last_message_time || 'Baru'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {isLid(conv.contact_phone) ? (
                                                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/70 px-1.5 py-0.2 rounded font-mono truncate" title={`ID WhatsApp: ${conv.contact_phone}`}>
                                                            ID: {conv.contact_phone}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10.5px] text-slate-500 font-mono truncate">
                                                            {conv.contact_phone}
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium shrink-0">
                                                        {conv.channel_name}
                                                    </span>
                                                </div>

                                                {/* Last Message snippet with tick status */}
                                                <p className="text-[11px] text-slate-500 truncate mt-1 flex items-center gap-1">
                                                    {conv.last_message_direction === 'outbound' && (
                                                        <span className="shrink-0">
                                                            {renderMessageStatus(conv.last_message_state, 'sm')}
                                                        </span>
                                                    )}
                                                    <span className="truncate">{conv.last_message || 'Belum ada pesan.'}</span>
                                                </p>

                                                {/* Badges footer */}
                                                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80 text-[10px]">
                                                    <div className="flex items-center gap-1.5">
                                                        {conv.intent_band === 'hot' && (
                                                            <span className="flex items-center gap-0.5 bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-md font-bold">
                                                                <Flame className="w-2.5 h-2.5 text-rose-600" />
                                                                <span>HOT {conv.intent_score}</span>
                                                            </span>
                                                        )}
                                                        {conv.control_owner === 'handoff_requested' && (
                                                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold">
                                                                Antrean Takeover
                                                            </span>
                                                        )}
                                                        {conv.control_owner === 'human_active' && (
                                                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md font-bold">
                                                                Manusia Aktif
                                                            </span>
                                                        )}
                                                    </div>

                                                    {conv.unread_count > 0 && (
                                                        <span className="bg-[#25d366] text-white font-bold px-1.5 py-0.2 rounded-full text-[9px] shadow-2xs">
                                                            {conv.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* COLUMN 2: Chat Timeline & Composer (Flexible) */}
                <div className="flex-1 bg-[#f8fafc] flex flex-col min-w-[360px] border-r border-slate-200/80">
                    {active_conversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-18 px-5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs z-10">
                                <div className="flex items-center gap-3">
                                    <div className="relative shrink-0">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 text-white font-bold flex items-center justify-center text-sm shadow-xs ring-2 ring-slate-100">
                                            {active_conversation.contact?.name ? active_conversation.contact.name.charAt(0).toUpperCase() : 'P'}
                                        </div>
                                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" title="Pelanggan Aktif" />
                                    </div>

                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            {isEditingContact ? (
                                                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-50 border border-indigo-200 rounded-xl shadow-xs">
                                                    <input
                                                        type="text"
                                                        value={contactNameInput}
                                                        onChange={(e) => setContactNameInput(e.target.value)}
                                                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-36"
                                                        autoFocus
                                                        placeholder="Nama kontak..."
                                                    />
                                                    <input
                                                        type="text"
                                                        value={contactPhoneInput}
                                                        onChange={(e) => setContactPhoneInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveContact();
                                                            if (e.key === 'Escape') setIsEditingContact(false);
                                                        }}
                                                        className="px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-36"
                                                        placeholder="No HP (+628...)"
                                                    />
                                                    <button
                                                        onClick={handleSaveContact}
                                                        disabled={savingContact}
                                                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition shadow-xs cursor-pointer"
                                                        title="Simpan Perubahan Kontak"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditingContact(false)}
                                                        className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition cursor-pointer"
                                                        title="Batal"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <div className="flex items-center gap-1.5 group">
                                                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                                                            <span>{active_conversation.contact?.name || 'Pelanggan'}</span>
                                                        </h3>
                                                    </div>

                                                    {isLid(active_conversation.contact?.phone_e164) ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-mono" title={`ID WhatsApp: ${active_conversation.contact?.phone_e164}`}>
                                                                ID: {active_conversation.contact?.phone_e164}
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    setContactNameInput(active_conversation.contact?.name || '');
                                                                    setContactPhoneInput('');
                                                                    setIsEditingContact(true);
                                                                }}
                                                                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200"
                                                                title="Ubah ID ini menjadi nomor HP asli pelanggan"
                                                            >
                                                                <Pencil className="w-2.5 h-2.5" />
                                                                <span>Set Nomor HP</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-slate-500 font-mono">
                                                                ({active_conversation.contact?.phone_e164})
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    setContactNameInput(active_conversation.contact?.name || '');
                                                                    setContactPhoneInput(active_conversation.contact?.phone_e164 || '');
                                                                    setIsEditingContact(true);
                                                                }}
                                                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                                                                title="Ubah Nama & Nomor HP"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            {active_conversation.contact?.phone_e164 && (
                                                                <a
                                                                    href={`https://wa.me/${active_conversation.contact.phone_e164.replace(/[^0-9]/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                                                                    title="Buka Langsung di WhatsApp Web/App"
                                                                >
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                Mode:{' '}
                                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] tracking-wide uppercase ${
                                                    active_conversation.control_owner === 'human_active'
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : active_conversation.control_owner === 'handoff_requested'
                                                        ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                                                        : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                }`}>
                                                    {active_conversation.control_owner === 'human_active' ? '👤 Human Takeover' : active_conversation.control_owner === 'handoff_requested' ? '⚠️ Need Takeover' : '🤖 AI Autonomous'}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Header Actions: Takeover or Release to AI */}
                                <div className="flex items-center gap-2">
                                    {active_conversation.control_owner !== 'human_active' ? (
                                        <button
                                            onClick={handleClaimTakeover}
                                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                                        >
                                            <UserCheck className="w-3.5 h-3.5" />
                                            <span>Takeover Percakapan</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setReleaseModalOpen(true)}
                                            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Kembalikan ke AI</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Status Subheader & Centang Biru Legend */}
                            <div className="bg-[#f0f2f5]/90 border-b border-slate-200/70 px-5 py-1.5 flex items-center justify-between text-[11px] text-slate-500">
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                        Live Sync
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <div className="flex items-center gap-2 text-[10.5px]">
                                        <span className="text-slate-400">Status Centang:</span>
                                        <span className="inline-flex items-center gap-0.5 text-slate-500" title="Terkirim ke server WhatsApp">
                                            <Check className="w-3.5 h-3.5 text-slate-400" /> Terkirim
                                        </span>
                                        <span>·</span>
                                        <span className="inline-flex items-center gap-0.5 text-slate-500" title="Tersampaikan ke HP penerima">
                                            <CheckCheck className="w-3.5 h-3.5 text-slate-400" /> Sampai
                                        </span>
                                        <span>·</span>
                                        <span className="inline-flex items-center gap-0.5 text-[#53bdeb] font-bold" title="Telah dibuka & dibaca oleh penerima di WhatsApp">
                                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] stroke-[2.5]" /> Dilihat (Centang Biru)
                                        </span>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono hidden md:block">
                                    WA: {active_conversation.channel?.display_number || active_conversation.channel?.phone_e164}
                                </div>
                            </div>

                            {/* Takeover Active Alert Banner */}
                            {active_conversation.control_owner === 'handoff_requested' && (
                                <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800 font-medium">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                        <span>Pelanggan dialihkan ke antrean takeover: {active_conversation.handoff_reasons?.join(', ')}</span>
                                    </div>
                                    <button
                                        onClick={handleClaimTakeover}
                                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                                    >
                                        Klaim Sekarang
                                    </button>
                                </div>
                            )}

                            {/* Messages Timeline */}
                            <div
                                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative bg-[#efeae2]/35"
                                style={{
                                    backgroundImage: 'radial-gradient(#94a3b8 0.65px, transparent 0.65px)',
                                    backgroundSize: '18px 18px',
                                }}
                            >
                                {/* Date Divider Pill */}
                                <div className="flex justify-center mb-4 sticky top-0 z-10 pointer-events-none">
                                    <span className="bg-white/95 backdrop-blur-xs text-slate-600 text-[10.5px] px-3.5 py-1 rounded-full shadow-2xs border border-slate-200/80 font-medium tracking-wide">
                                        Hari Ini
                                    </span>
                                </div>

                                {messages.map((msg) => {
                                    const isInbound = msg.direction === 'inbound';
                                    const isAi = msg.sender_type === 'ai';
                                    const isSystem = msg.sender_type === 'system';

                                    if (isSystem) {
                                        return (
                                            <div key={msg.id} className="flex justify-center my-2">
                                                <span className="bg-amber-100/90 backdrop-blur-xs text-amber-900 border border-amber-200 text-[11px] px-3.5 py-1 rounded-full text-center max-w-md font-medium shadow-2xs">
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
                                                className={`max-w-[85%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 text-xs space-y-1.5 shadow-sm transition-all ${
                                                    isInbound
                                                        ? 'bg-white text-[#111b21] rounded-tl-xs border border-slate-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                                                        : isAi
                                                        ? 'bg-[#eef2ff] text-[#111b21] rounded-tr-xs border border-indigo-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                                                        : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs border border-[#bbf7d0]/80 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                                                }`}
                                            >
                                                <div className={`flex items-center justify-between gap-3 text-[10.5px] pb-1 border-b ${
                                                    isInbound
                                                        ? 'border-slate-100 text-[#0f766e] font-bold'
                                                        : isAi
                                                        ? 'border-indigo-100 text-indigo-700 font-bold'
                                                        : 'border-emerald-200/60 text-emerald-800 font-bold'
                                                }`}>
                                                    <span className="flex items-center gap-1.5">
                                                        {isInbound ? (
                                                            <span>{active_conversation.contact?.name || 'Pelanggan'}</span>
                                                        ) : isAi ? (
                                                            <>
                                                                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                                                                <span>AI Sales Specialist</span>
                                                                <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded-full">Otonom</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                                                                <span>Tim Sales (Human)</span>
                                                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">Takeover</span>
                                                            </>
                                                        )}
                                                    </span>

                                                    {msg.metadata?.product_sku && (
                                                        <span className="text-[10px] text-indigo-600 font-mono font-medium">
                                                            SKU: {msg.metadata.product_sku}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#111b21] selection:bg-indigo-100">{msg.content}</p>

                                                <div className="flex items-center justify-end gap-1.5 text-[10.5px] text-slate-500 pt-0.5">
                                                    <span className="font-mono text-[10px]">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {!isInbound && renderMessageStatus(msg.state, 'md')}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Internal Notes Timeline */}
                                {internal_notes.map((note) => (
                                    <div key={note.id} className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl space-y-1.5 my-2 shadow-2xs">
                                        <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold">
                                            <span className="flex items-center gap-1.5">
                                                <Lock className="w-3.5 h-3.5 text-amber-700" />
                                                <span>Catatan Internal Tim</span>
                                            </span>
                                            <span className="text-amber-700/80 text-[10.5px] font-normal">{note.user?.name} · {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Composer */}
                            <div className="p-3.5 bg-white border-t border-slate-200/80 space-y-2.5">
                                {/* Quick Replies Row */}
                                {!isInternalNoteMode && (
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                        <span className="text-[10.5px] text-slate-400 font-medium shrink-0">Template Cepat:</span>
                                        {QUICK_REPLIES.map((qr, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setMessageText(qr.text)}
                                                className="text-[11px] bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2.5 py-1 rounded-full shrink-0 border border-slate-200 transition cursor-pointer"
                                            >
                                                {qr.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsInternalNoteMode(false)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                                !isInternalNoteMode
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Balas WhatsApp Pelanggan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsInternalNoteMode(true)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                                isInternalNoteMode
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            🔒 Catatan Internal
                                        </button>
                                    </div>

                                    {!active_conversation.is_within_window && !isInternalNoteMode && (
                                        <span className="text-xs text-amber-600 font-medium">
                                            Di luar window 24 jam (wajib Template Meta)
                                        </span>
                                    )}
                                </div>

                                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                                    <textarea
                                        rows={2}
                                        value={isInternalNoteMode ? noteText : messageText}
                                        onChange={(e) =>
                                            isInternalNoteMode ? setNoteText(e.target.value) : setMessageText(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        placeholder={
                                            isInternalNoteMode
                                                ? 'Tulis catatan internal untuk rekan tim sales... (Tekan Enter untuk simpan)'
                                                : 'Ketik pesan balasan WhatsApp... (Enter kirim, Shift+Enter baris baru)'
                                        }
                                        className={`flex-1 border rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition resize-none ${
                                            isInternalNoteMode
                                                ? 'bg-amber-50/50 border-amber-200 focus:ring-2 focus:ring-amber-400/20'
                                                : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white'
                                        }`}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className={`px-4.5 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer ${
                                            isInternalNoteMode
                                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                : 'bg-[#00a884] hover:bg-[#008f6f] text-white'
                                        }`}
                                    >
                                        <span>{isInternalNoteMode ? 'Simpan' : 'Kirim'}</span>
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-6">
                            <Bot className="w-12 h-12 text-slate-300 mb-2" />
                            <p className="font-semibold text-slate-600">Pilih Percakapan Pelanggan</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Pilih percakapan dari daftar di sebelah kiri untuk melihat riwayat pesan.</p>
                        </div>
                    )}
                </div>

                {/* COLUMN 3: Customer & Handover Brief Panel (304px) */}
                <div className="hidden lg:flex flex-col w-76 bg-white border-l border-slate-200/80 shrink-0 p-4 space-y-4 overflow-y-auto">
                    {active_conversation ? (
                        <>
                            {/* Contact Card */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
                                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Profil Pelanggan</span>
                                </h4>

                                <div className="space-y-1 text-xs">
                                    {isEditingContact ? (
                                        <div className="flex items-center gap-1 py-1">
                                            <input
                                                type="text"
                                                value={contactNameInput}
                                                onChange={(e) => setContactNameInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveContactName();
                                                    if (e.key === 'Escape') setIsEditingContact(false);
                                                }}
                                                className="w-full px-2 py-1 text-xs font-bold bg-white border border-indigo-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs"
                                                autoFocus
                                                placeholder="Nama kontak..."
                                            />
                                            <button
                                                onClick={handleSaveContactName}
                                                disabled={savingContact}
                                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition shadow-xs shrink-0 cursor-pointer"
                                                title="Simpan"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setIsEditingContact(false)}
                                                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition shrink-0 cursor-pointer"
                                                title="Batal"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between group">
                                            <div className="font-bold text-slate-800 text-sm">
                                                {active_conversation.contact?.name || 'Pelanggan'}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setContactNameInput(active_conversation.contact?.name || '');
                                                    setIsEditingContact(true);
                                                }}
                                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                                                title="Ubah Nama Kontak"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-slate-600 flex items-center gap-2 text-xs">
                                        <Phone className="w-3 h-3 text-slate-400" />
                                        <span className="font-mono">{active_conversation.contact?.phone_e164}</span>
                                    </p>
                                    <p className="text-slate-600 flex items-center gap-2 text-xs pt-1">
                                        <Tag className="w-3 h-3 text-slate-400" />
                                        <span>Tier: <strong className="text-indigo-600 uppercase font-bold">{active_conversation.contact?.customer_tier || 'Reguler'}</strong></span>
                                    </p>
                                </div>
                            </div>

                            {/* Handover Brief Panel */}
                            {handover_brief && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
                                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Handover Brief Sales</span>
                                    </h4>

                                    <div className="space-y-2 text-xs text-slate-600">
                                        <div>
                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Kebutuhan:</span>
                                            <p className="font-semibold text-slate-800">{handover_brief.customer_needs}</p>
                                        </div>

                                        <div>
                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Penawaran Sah Terakhir:</span>
                                            <p className="font-medium text-slate-700">{handover_brief.last_valid_quote_summary}</p>
                                        </div>

                                        <div>
                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Penawaran / Bid Pelanggan:</span>
                                            <p className="font-medium text-slate-700">{handover_brief.customer_last_bid}</p>
                                        </div>

                                        <div>
                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Alasan Takeover:</span>
                                            <p className="font-bold text-rose-600">{handover_brief.trigger_reasons_summary}</p>
                                        </div>

                                        <div>
                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Tindakan Disarankan:</span>
                                            <p className="whitespace-pre-wrap text-slate-700 mt-0.5">{handover_brief.suggested_next_actions}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Active Quote Card */}
                            {active_quote && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-xs text-slate-800 uppercase flex items-center gap-1">
                                            <FileSignature className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Quotation #{active_quote.quote_number}</span>
                                        </h4>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {active_quote.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-xs space-y-1">
                                        <p className="text-slate-400">Total Nilai Penawaran:</p>
                                        <p className="text-lg font-extrabold text-slate-900">
                                            Rp {Number(active_quote.grand_total).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/app/quotes/${active_quote.id}`}
                                        className="w-full mt-2 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-center text-xs font-semibold block transition shadow-2xs"
                                    >
                                        Buka Penawaran Formal
                                    </Link>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-xs text-slate-400 text-center pt-8">
                            Pilih percakapan untuk melihat profil dan berkas penawaran.
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL RELEASE TO AI */}
            {releaseModalOpen && active_conversation && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-sm text-slate-800">Kembalikan Percakapan ke AI Assistant</h3>
                            <button onClick={() => setReleaseModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            AI akan diaktifkan kembali untuk melayani percakapan ini secara otomatis sesuai konteks dan instruksi terbaru yang Anda tentukan.
                        </p>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Konteks untuk AI (Opsional)</label>
                            <textarea
                                value={releaseNotes}
                                onChange={(e) => setReleaseNotes(e.target.value)}
                                placeholder="Contoh: Stok sudah dikonfirmasi 20 unit, boleh beri diskon 2.5% jika minta."
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                onClick={() => setReleaseModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleReleaseToAi}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
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
