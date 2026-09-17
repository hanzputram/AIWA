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

    const currentPath = window.location.pathname;

    const navItems = [
        { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
        { name: 'Kotak Masuk', href: '/app/inbox', icon: MessageSquare },
        {
            name: 'Antrean Takeover',
            href: '/app/takeover',
            icon: UserCheck,
            badge: stats?.urgent_handoffs_count > 0 ? stats.urgent_handoffs_count : null,
            badgeColor: 'bg-rose-500 text-white animate-pulse',
        },
        { name: 'Nomor WhatsApp', href: '/app/numbers', icon: PhoneCall },
        { name: 'Katalog Produk', href: '/app/knowledge/products', icon: BookOpen },
        { name: 'Profil & Compro', href: '/app/knowledge/company', icon: Building2 },
        { name: 'Penawaran Harga', href: '/app/quotes', icon: FileSignature },
        { name: 'Pipeline Deals', href: '/app/deals', icon: TrendingUp },
        { name: 'Riwayat Negosiasi', href: '/app/negotiations', icon: History },
        { name: 'Kontak & Klien', href: '/app/contacts', icon: Users },
        { name: 'Kampanye Broadcast', href: '/app/campaigns', icon: Megaphone },
        { name: 'Template Pesan', href: '/app/templates', icon: Layers },
        { name: 'Automasi Workflow', href: '/app/automations', icon: Cpu },
        { name: 'Tiket Support SLA', href: '/app/tickets', icon: FileText },
        { name: 'Laporan & Audit', href: '/app/reports', icon: BarChart3 },
        { name: 'Pengaturan', href: '/app/settings', icon: Settings },
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
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
            {/* Desktop Sidebar (224px per spec) */}
            <aside className="hidden md:flex flex-col w-56 bg-slate-900 border-r border-slate-800 shrink-0 sticky top-0 h-screen z-30">
                {/* Logo & Brand */}
                <div className="h-16 flex items-center px-4 gap-2.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold text-white tracking-wider text-sm">
                        ATS
                    </div>
                    <div className="leading-tight overflow-hidden">
                        <h1 className="font-bold text-sm tracking-tight text-white truncate">
                            ATS AI Sales
                        </h1>
                        <p className="text-[11px] font-medium text-emerald-400 truncate">
                            Workspace Internal
                        </p>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = currentPath.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    active
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 truncate">
                                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                                    <span className="truncate">{item.name}</span>
                                </div>
                                {item.badge && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Sidebar Footer / Emergency Stop Button */}
                <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
                    <button
                        onClick={() => setEmergencyModalOpen(true)}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                            auth.workspace?.emergency_stop
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                : 'bg-rose-900/40 text-rose-300 border border-rose-800 hover:bg-rose-800/50'
                        }`}
                    >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{auth.workspace?.emergency_stop ? 'AI Sedang PAUSED' : 'Emergency Stop AI'}</span>
                    </button>

                    <div className="flex items-center justify-between text-slate-400 px-1 pt-1">
                        <div className="truncate">
                            <p className="text-[11px] font-medium text-slate-200 truncate">{auth.user?.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{auth.user?.role}</p>
                        </div>
                        <button
                            onClick={() => router.post('/logout')}
                            title="Keluar"
                            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-rose-400 transition"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                        ATS
                    </div>
                    <span className="font-bold text-xs text-white">ATS AI Sales</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-slate-400 hover:text-white"
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex">
                    <div className="w-72 bg-slate-900 h-full p-4 flex flex-col justify-between border-r border-slate-800">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <span className="font-bold text-sm text-white">Menu Aplikasi</span>
                                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-1 overflow-y-auto max-h-[70vh]">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-4 h-4 text-indigo-400" />
                                            <span>{item.name}</span>
                                        </div>
                                        {item.badge && (
                                            <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => router.post('/logout')}
                            className="flex items-center gap-2 text-rose-400 text-sm font-medium pt-3 border-t border-slate-800"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Keluar Aplikasi</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area (Topbar 64px + Flexible View) */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar (64px) */}
                <header className="h-16 bg-slate-900/60 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-white">
                            {title || 'Workspace Operasional'}
                        </div>
                        {auth.workspace?.emergency_stop && (
                            <span className="bg-rose-950 text-rose-400 border border-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3" />
                                EMERGENCY STOP AKTIF
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Takeover quick alert badge */}
                        {stats?.urgent_handoffs_count > 0 && (
                            <Link
                                href="/app/takeover"
                                className="flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-semibold hover:bg-rose-500/30 transition"
                            >
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                <span>{stats.urgent_handoffs_count} Perlu Takeover</span>
                            </Link>
                        )}

                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-semibold text-slate-200">{auth.workspace?.name}</p>
                            <p className="text-[11px] text-slate-500">{auth.workspace?.timezone} · Role: {auth.user?.role}</p>
                        </div>
                    </div>
                </header>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-emerald-950/80 border-b border-emerald-800/80 text-emerald-300 px-6 py-2.5 text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-rose-950/80 border-b border-rose-800/80 text-rose-300 px-6 py-2.5 text-xs font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
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
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-400">
                            <ShieldAlert className="w-6 h-6 shrink-0" />
                            <h3 className="font-bold text-base text-white">
                                {auth.workspace?.emergency_stop ? 'Batalkan Emergency Stop?' : 'Konfirmasi Emergency Stop AI'}
                            </h3>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                            {auth.workspace?.emergency_stop
                                ? 'AI akan diizinkan kembali membalas percakapan sesuai otoritas yang berlaku pada masing-masing nomor.'
                                : 'PERINGATAN: Tindakan ini akan seketika menghentikan dan membatalkan seluruh balasan AI yang sedang dalam proses (pending turns) pada semua nomor di workspace ini. Percakapan akan dialihkan penuh ke operator manusia.'}
                        </p>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setEmergencyModalOpen(false)}
                                className="px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                Batal
                            </button>
                            <button
                                onClick={toggleEmergencyStop}
                                disabled={isStopping}
                                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/30"
                            >
                                {isStopping ? 'Memproses...' : auth.workspace?.emergency_stop ? 'Ya, Aktifkan Kembali AI' : 'Ya, Hentikan Seluruh AI'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
