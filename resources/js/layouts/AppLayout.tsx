import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    MessageSquare,
    UserCheck,
    PhoneCall,
    BookOpen,
    FileText,
    TrendingUp,
    History,
    Megaphone,
    Cpu,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    Building2,
    Users,
    Layers,
    FileSignature,
    Search,
    Bell,
    Moon,
    Sun,
    Maximize,
    SlidersHorizontal,
    Globe,
    Sparkles,
    ChevronDown,
} from 'lucide-react';

interface Props {
    title?: string;
    children: React.ReactNode;
}

export default function AppLayout({ title, children }: Props) {
    const { auth, stats, flash } = usePage().props as any;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const currentPath = window.location.pathname;

    const navSections = [
        {
            title: 'DASHBOARD',
            items: [
                { name: 'Dashboard CRM', href: '/app/dashboard', icon: LayoutDashboard },
            ],
        },
        {
            title: 'CRM & SALES',
            items: [
                { name: 'Kontak & Klien', href: '/app/contacts', icon: Users },
                { name: 'Perusahaan B2B', href: '/app/companies', icon: Building2 },
                { name: 'Pipeline Deals', href: '/app/deals', icon: TrendingUp },
                { name: 'Penawaran Harga', href: '/app/quotes', icon: FileSignature },
                { name: 'Riwayat Negosiasi', href: '/app/negotiations', icon: History },
            ],
        },
        {
            title: 'KNOWLEDGE & PRICING',
            items: [
                { name: 'Katalog Produk & PL', href: '/app/knowledge/products', icon: BookOpen },
                { name: 'Price Lists & Formula', href: '/app/knowledge/prices', icon: Layers },
                { name: 'Kebijakan Diskon', href: '/app/knowledge/discounts', icon: SlidersHorizontal },
                { name: 'Profil Bisnis & Compro', href: '/app/knowledge/company', icon: FileText },
            ],
        },
        {
            title: 'OMNICHANNEL & BOT',
            items: [
                {
                    name: 'Kotak Masuk (Inbox)',
                    href: '/app/inbox',
                    icon: MessageSquare,
                },
                {
                    name: 'Antrean Takeover',
                    href: '/app/takeover',
                    icon: UserCheck,
                    badge: stats?.urgent_handoffs_count > 0 ? stats.urgent_handoffs_count : null,
                    badgeColor: 'bg-rose-100 text-rose-700 border border-rose-200',
                },
                { name: 'Nomor WhatsApp', href: '/app/numbers', icon: PhoneCall },
                { name: 'Kampanye Broadcast', href: '/app/campaigns', icon: Megaphone },
                { name: 'Template Pesan', href: '/app/templates', icon: Layers },
            ],
        },
        {
            title: 'SUPPORT & AUTOMATION',
            items: [
                { name: 'Automasi Workflow', href: '/app/automations', icon: Cpu },
                { name: 'Tiket Support SLA', href: '/app/tickets', icon: FileText },
                { name: 'Laporan & Audit', href: '/app/reports', icon: BarChart3 },
                { name: 'Manajemen Pengguna', href: '/app/users', icon: Users },
                { name: 'Pengaturan Sistem', href: '/app/settings', icon: Settings },
            ],
        },
    ];

    const toggleEmergencyStop = async () => {
        setIsStopping(true);
        try {
            await window.axios.post('/api/v1/ai/emergency-stop', {
                emergency_stop: !auth.workspace?.emergency_stop,
            });
            window.location.reload();
        } catch (e) {
            alert('Gagal mengubah status emergency stop');
        } finally {
            setIsStopping(false);
            setEmergencyModalOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row antialiased">
            {/* Desktop Sidebar (CRM HQ Admin Style) */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/90 shrink-0 sticky top-0 h-screen z-30 shadow-xs">
                {/* Logo & Brand matching Reference CRM HQ Admin */}
                <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-100 bg-white">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-sm">
                        <span className="tracking-tighter">AI</span>
                    </div>
                    <div className="leading-tight overflow-hidden">
                        <div className="flex items-center gap-1.5">
                            <h1 className="font-bold text-sm tracking-tight text-slate-900">
                                AIWA CRM
                            </h1>
                            <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-1.5 py-0.2 rounded-full border border-blue-100">
                                HQ
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                            Sales & Knowledge Suite
                        </p>
                    </div>
                </div>

                {/* Navigation Sections */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                    {navSections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 block">
                                {section.title}
                            </span>
                            <div className="space-y-0.5">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = currentPath.startsWith(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                                active
                                                    ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 truncate">
                                                <Icon
                                                    className={`w-4 h-4 shrink-0 ${
                                                        active ? 'text-blue-600' : 'text-slate-400'
                                                    }`}
                                                />
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                            {item.badge && (
                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Bottom Illustration Card (Matching reference CRM HQ Admin) */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-slate-50 border border-blue-100/80 shadow-xs space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                🤖
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">AI Negotiation Bot</h4>
                                <p className="text-[10px] text-slate-500">Autonomous & Safe Margin</p>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                            Floor price dihitung otomatis dari PL, koefisien, dan diskon.
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[10px] font-semibold text-blue-600">
                            <span>Status: Aktif</span>
                            <span className="bg-white border border-blue-200 px-2 py-0.5 rounded-full text-blue-700 shadow-2xs">
                                v2.6 Stable
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Bottom: Emergency Stop & Profile */}
                <div className="p-3 border-t border-slate-100 bg-white space-y-2">
                    <button
                        onClick={() => setEmergencyModalOpen(true)}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                            auth.workspace?.emergency_stop
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        <span>
                            {auth.workspace?.emergency_stop ? 'AI Sedang PAUSED' : 'Emergency Stop AI'}
                        </span>
                    </button>

                    <div className="flex items-center justify-between px-2 pt-1">
                        <div className="flex items-center gap-2 truncate">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                                {auth.user?.name?.[0] || 'U'}
                            </div>
                            <div className="truncate">
                                <p className="text-xs font-semibold text-slate-900 truncate">
                                    {auth.user?.name}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                    {auth.user?.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.post('/logout')}
                            title="Keluar"
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                        AI
                    </div>
                    <span className="font-bold text-sm text-slate-900">AIWA CRM HQ</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-slate-600 hover:text-slate-900"
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex">
                    <div className="w-72 bg-white h-full p-4 flex flex-col justify-between border-r border-slate-200 shadow-xl">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <span className="font-bold text-sm text-slate-900">Navigasi AIWA</span>
                                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-1 overflow-y-auto max-h-[70vh]">
                                {navSections.map((section) => (
                                    <div key={section.title} className="py-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                            {section.title}
                                        </span>
                                        {section.items.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-4 h-4 text-slate-400" />
                                                    <span>{item.name}</span>
                                                </div>
                                                {item.badge && (
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor}`}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => router.post('/logout')}
                            className="flex items-center gap-2 text-rose-600 text-xs font-semibold pt-3 border-t border-slate-100"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Keluar Aplikasi</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area (Topbar + Content) */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar Matching Reference CRM HQ Admin */}
                <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
                    {/* Left: Hamburger & Search Pill */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-64 md:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search here..."
                                className="w-full bg-slate-100/90 border border-slate-200/50 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            />
                        </div>

                        {auth.workspace?.emergency_stop && (
                            <span className="hidden sm:flex bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold px-3 py-1 rounded-full items-center gap-1.5 shadow-2xs">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                AI SEDANG BERHENTI (EMERGENCY STOP)
                            </span>
                        )}
                    </div>

                    {/* Right: Action Icons & User Profile matching image */}
                    <div className="flex items-center gap-3">
                        {/* Urgent Takeover Indicator */}
                        {stats?.urgent_handoffs_count > 0 && (
                            <Link
                                href="/app/takeover"
                                className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-xl text-xs font-semibold hover:bg-rose-100 transition shadow-2xs"
                            >
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span>{stats.urgent_handoffs_count} Takeover</span>
                            </Link>
                        )}

                        {/* Notification Bell with Red Badge */}
                        <div className="relative">
                            <button
                                title="Notifikasi"
                                className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition"
                            >
                                <Bell className="w-4 h-4" />
                            </button>
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                                {stats?.urgent_handoffs_count > 0 ? stats.urgent_handoffs_count : 8}
                            </span>
                        </div>

                        {/* Message Icon */}
                        <Link
                            href="/app/inbox"
                            title="Chat WhatsApp"
                            className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </Link>

                        {/* Language flag indicator */}
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 text-xs text-slate-700 font-medium">
                            <span className="text-sm">🇮🇩</span>
                            <span>ID</span>
                        </div>

                        {/* Settings Icon */}
                        <Link
                            href="/app/settings"
                            title="Pengaturan"
                            className="hidden sm:flex w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 items-center justify-center text-slate-600 transition"
                        >
                            <Settings className="w-4 h-4" />
                        </Link>

                        {/* User Avatar & Info with Dropdown Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hover:opacity-80 transition cursor-pointer text-left"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs border-2 border-white">
                                    {auth.user?.name?.[0] || 'A'}
                                </div>
                                <div className="hidden lg:block text-left">
                                    <p className="text-xs font-bold text-slate-900 leading-tight">
                                        {auth.user?.name}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-indigo-600 font-mono font-semibold">
                                            @{auth.user?.username || 'user'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">·</span>
                                        <span className="text-[10px] text-slate-500 capitalize font-medium">
                                            {auth.user?.role || 'User'}
                                        </span>
                                    </div>
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                            </button>

                            {/* Dropdown Menu */}
                            {userMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setUserMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 space-y-1 text-xs">
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <div className="font-bold text-slate-900 text-sm">{auth.user?.name}</div>
                                            <div className="text-indigo-600 font-mono font-semibold text-[11px]">@{auth.user?.username}</div>
                                            <div className="text-[10px] text-slate-400 capitalize mt-0.5">{auth.user?.role || 'Staff'}</div>
                                        </div>

                                        <Link
                                            href="/app/users"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium transition"
                                        >
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span>Manajemen Pengguna</span>
                                        </Link>

                                        <Link
                                            href="/app/settings"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium transition"
                                        >
                                            <Settings className="w-4 h-4 text-slate-400" />
                                            <span>Pengaturan Sistem</span>
                                        </Link>

                                        <div className="border-t border-slate-100 my-1" />

                                        <button
                                            onClick={() => router.post('/logout')}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold transition"
                                        >
                                            <LogOut className="w-4 h-4 text-rose-500" />
                                            <span>Keluar (Logout)</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-2xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Main View Area */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* Emergency Stop Confirmation Modal */}
            {emergencyModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-600">
                            <ShieldAlert className="w-7 h-7 shrink-0" />
                            <h3 className="font-bold text-base text-slate-900">
                                {auth.workspace?.emergency_stop
                                    ? 'Batalkan Emergency Stop AI?'
                                    : 'Konfirmasi Emergency Stop AI'}
                            </h3>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            {auth.workspace?.emergency_stop
                                ? 'AI akan diizinkan kembali membalas percakapan pelanggan secara otonom sesuai aturan pada setiap nomor.'
                                : 'PERINGATAN: Seluruh balasan AI yang sedang berjalan akan seketika dihentikan. Semua percakapan otomatis dialihkan ke antrean operator manusia.'}
                        </p>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setEmergencyModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={toggleEmergencyStop}
                                disabled={isStopping}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm"
                            >
                                {isStopping
                                    ? 'Memproses...'
                                    : auth.workspace?.emergency_stop
                                    ? 'Ya, Aktifkan AI'
                                    : 'Ya, Hentikan AI Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
