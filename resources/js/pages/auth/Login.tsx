import React from 'react';
import { useForm, Head } from '@inertiajs/react';
import { Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: 'sales1@ats.co.id',
        password: 'password',
        remember: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 selection:bg-indigo-500 selection:text-white">
            <Head title="Masuk Aplikasi Internal" />

            <div className="w-full max-w-md space-y-6">
                {/* Logo & Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 items-center justify-center shadow-xl shadow-indigo-600/30 text-white font-bold text-xl mb-1">
                        ATS
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        ATS AI Sales Workspace
                    </h1>
                    <p className="text-xs text-slate-400">
                        Sistem Internal WhatsApp AI Sales & Human Takeover (Revisi 2)
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Alamat Email Perusahaan
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@ats.co.id"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-[11px] text-rose-400 mt-1">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                                />
                                <span>Ingat saya</span>
                            </label>
                            <span className="text-[11px] text-indigo-400 hover:underline cursor-pointer">
                                Lupa kata sandi?
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-2"
                        >
                            <span>{processing ? 'Memverifikasi...' : 'Masuk Workspace'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </form>

                    {/* Demo Accounts Quick Selection */}
                    <div className="pt-4 border-t border-slate-800/80 space-y-2">
                        <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Pilih Akun Demo Pengujian:</span>
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                            <button
                                type="button"
                                onClick={() => setData('email', 'sales1@ats.co.id')}
                                className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg text-left hover:border-indigo-500/50 transition"
                            >
                                <span className="font-bold text-white block">Sales Senior (Utama)</span>
                                <span className="text-slate-500">sales1@ats.co.id</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('email', 'owner@ats.co.id')}
                                className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg text-left hover:border-indigo-500/50 transition"
                            >
                                <span className="font-bold text-white block">Owner / Full Akses</span>
                                <span className="text-slate-500">owner@ats.co.id</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('email', 'manager@ats.co.id')}
                                className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg text-left hover:border-indigo-500/50 transition"
                            >
                                <span className="font-bold text-white block">Sales Manager</span>
                                <span className="text-slate-500">manager@ats.co.id</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('email', 'pricing@ats.co.id')}
                                className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg text-left hover:border-indigo-500/50 transition"
                            >
                                <span className="font-bold text-white block">Pricing Approver</span>
                                <span className="text-slate-500">pricing@ats.co.id</span>
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[11px] text-slate-500">
                    Aplikasi internal untuk tim operasional ATS · Hak akses dilindungi
                </p>
            </div>
        </div>
    );
}
