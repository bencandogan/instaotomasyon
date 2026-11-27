'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  Building,
  Clock,
  Send,
  Sparkles,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { GeneralSettings } from '@/types';

interface GeneralSettingsProps {
  settings: GeneralSettings;
  onSaveSettings: (settings: Partial<GeneralSettings>) => Promise<void>;
  isLoading: boolean;
}

export function GeneralSettingsView({ settings, onSaveSettings, isLoading }: GeneralSettingsProps) {
  const [formData, setFormData] = useState<GeneralSettings>(settings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-400" />
            Genel Marka ve Otomasyon Ayarları
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Evlilik İlanları marka kimliği, otomatik üretim tetikleyicileri ve bildirim kanalları.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-zinc-800 pb-5">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              Marka ve Filigran Yapılandırması
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Marka Adı</label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Slogan / Alt Başlık</label>
                <input
                  type="text"
                  value={formData.brandTagline}
                  onChange={(e) => setFormData({ ...formData, brandTagline: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Marka Logo URL (Watermark PNG)</label>
                <input
                  type="text"
                  value={formData.brandLogoUrl}
                  onChange={(e) => setFormData({ ...formData, brandLogoUrl: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Sistem Saat Dilimi</label>
                <input
                  type="text"
                  disabled
                  value={formData.timezone}
                  className="w-full bg-zinc-800/40 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-400 cursor-not-allowed font-mono"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-zinc-800 pb-5">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" />
              Otomasyon ve Tetikleyici Davranışları
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-950/40 to-zinc-900 rounded-xl border border-indigo-500/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Tam Otonom Autopilot Modu (Kur & Unut)</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">Önerilen</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Aktif olduğunda; saati gelen Reels'leri (günde 5 adet) ve 24 saatte 1 Story'yi arka planda kendi kendine yayınlar. Kuyruk azaldıkça kayıtlı Pinterest havuzundan yeni videolar çeker.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, autopilotEnabled: formData.autopilotEnabled === false ? true : false, autoPublishEnabled: true })}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold border transition cursor-pointer ${
                    formData.autopilotEnabled !== false
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-950'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {formData.autopilotEnabled !== false ? '🟢 Autopilot Aktif' : '⚪ Kapalı'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-zinc-800/40 rounded-xl border border-zinc-700/60">
                <div>
                  <p className="text-sm font-medium text-white">Otomatik Reels Yayınlama (Auto-Publish)</p>
                  <p className="text-xs text-zinc-400">
                    Açıkken, takvimdeki zamanı gelen videolar yönetici onayı beklemeden doğrudan Meta API ile yayınlanır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, autoPublishEnabled: !formData.autoPublishEnabled })}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold border transition ${
                    formData.autoPublishEnabled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {formData.autoPublishEnabled ? 'Aktif' : 'Manuel Onay'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-zinc-800/40 rounded-xl border border-zinc-700/60">
                <div>
                  <p className="text-sm font-medium text-white">Her Gece 5 İçerik Otomatik Hazırlansın</p>
                  <p className="text-xs text-zinc-400">
                    Cloud Scheduler her gece 03:00'te ertesi günün 5 içeriğini otomatik olarak taslaklar ve kuyruğa ekler.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, autoGenerateDailyEnabled: !formData.autoGenerateDailyEnabled })}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold border transition ${
                    formData.autoGenerateDailyEnabled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {formData.autoGenerateDailyEnabled ? 'Aktif' : 'Pasif'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              Bildirim ve Hata Raporlama
            </h2>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Yönetici Bildirim E-postası</label>
              <input
                type="email"
                value={formData.notificationEmail || ''}
                onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Yayın hataları veya bütçe devre kesici devreye girdiğinde anlık e-posta uyarısı iletilir.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-950/40 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Ayarları Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
