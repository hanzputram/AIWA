import React from 'react';
import { useForm, Head } from '@inertiajs/react';
import { Lock, User, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: 'owner',
        password: 'password',
        remember: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center px-4 py-8 selection:bg-indigo-500 selection:text-white">
            <Head title="Masuk Aplikasi Internal" />

            <div className="w-full max-w-md space-y-6">
                {/* Logo & Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-slate-800">
                            CRM HQ <span className="text-indigo-600">Admin</span>
                        </span>
                    </div>
                    <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                        ATS Autonomous AI Sales Platform
                    </h1>
                    <p className="text-xs text-slate-500">
                        Sistem WhatsApp AI Sales, Floor Margin Enforcement & Multi-Agent CRM
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-7 shadow-xs space-y-5">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Username Pengguna
                            </label>
                            <div className="relative">
                                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="Masukkan username (contoh: owner)"
                                    required
                                    autoFocus
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                                />
                            </div>
                            {errors.username && (
                                <p className="text-[11px] text-rose-500 mt-1">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-[11px] text-rose-500 mt-1">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>Ingat saya</span>
                            </label>
                            <span className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer">
                                Lupa kata sandi?
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                        >
                            <span>{processing ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </form>

                    {/* Demo Accounts Quick Selection */}
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                        <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Pilih Cepat Akun (Klik untuk isi username otomatis):</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <button
                                type="button"
                                onClick={() => setData('username', 'owner')}
                                className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-left hover:bg-indigo-50 hover:border-indigo-200 transition"
                            >
                                <span className="font-bold text-slate-800 block">Owner ATS</span>
                                <span className="text-indigo-600 font-mono text-[11px] font-semibold">@owner</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('username', 'admin')}
                                className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-left hover:bg-indigo-50 hover:border-indigo-200 transition"
                            >
                                <span className="font-bold text-slate-800 block">Admin Sistem</span>
                                <span className="text-indigo-600 font-mono text-[11px] font-semibold">@admin</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('username', 'sales1')}
                                className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-left hover:bg-indigo-50 hover:border-indigo-200 transition"
                            >
                                <span className="font-bold text-slate-800 block">Sales Senior</span>
                                <span className="text-indigo-600 font-mono text-[11px] font-semibold">@sales1</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('username', 'manager')}
                                className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-left hover:bg-indigo-50 hover:border-indigo-200 transition"
                            >
                                <span className="font-bold text-slate-800 block">Sales Manager</span>
                                <span className="text-indigo-600 font-mono text-[11px] font-semibold">@manager</span>
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[11px] text-slate-400">
                    ATS Autonomous AI Sales Platform · Enterprise Grade Security
                </p>
            </div>
        </div>
    );
}
