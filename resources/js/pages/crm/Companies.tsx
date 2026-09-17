import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Building2, Users, Briefcase, Plus, Search, Globe, Phone, MapPin } from 'lucide-react';

interface Company {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  contacts_count: number;
  deals_count: number;
  created_at: string;
}

interface Props {
  companies: Company[];
}

export default function Companies({ companies }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout title="Perusahaan & Klien">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Direktori Perusahaan & Klien B2B
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kelola entitas bisnis, panel maker, kontraktor, dan relasi akun B2B.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari perusahaan atau industri..."
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-64 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Company Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(company => (
            <div
              key={company.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-100 dark:border-indigo-800/50">
                    {company.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {company.industry || 'B2B Client'}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  {company.name}
                </h3>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-3">
                  {company.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <a href={company.website} target="_blank" rel="noreferrer" className="hover:underline text-indigo-500 truncate">
                        {company.website}
                      </a>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{company.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>{company.contacts_count || 0} Kontak Terhubung</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <Briefcase className="w-4 h-4 text-amber-500" />
                  <span>{company.deals_count || 0} Deals</span>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Tidak ada perusahaan ditemukan</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {searchTerm ? 'Coba ubah kata kunci pencarian.' : 'Belum ada data perusahaan B2B yang didaftarkan.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
