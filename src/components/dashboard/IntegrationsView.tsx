'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Lock,
  ExternalLink,
  Flame,
  Sparkles,
  Cpu
} from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { AISettings, InstagramSettings } from '@/types';

interface IntegrationsProps {
  aiSettings: AISettings;
  instagramSettings: InstagramSettings;
  onSaveAISettings: (settings: Partial<AISettings>) => Promise<void>;
  onSaveInstagramSettings: (settings: Partial<InstagramSettings>) => Promise<void>;
  isLoading: boolean;
}

export function IntegrationsView({
  aiSettings,
  instagramSettings,
  onSaveAISettings,
  onSaveInstagramSettings,
  isLoading,
}: IntegrationsProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [falKey, setFalKey] = useState('');
  const [metaToken, setMetaToken] = useState('');
  const [metaAppSecret, setMetaAppSecret] = useState('');
  const [testMode, setTestMode] = useState(aiSettings.testMode);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (openaiKey || falKey) {
        await onSaveAISettings({
          testMode,
          openaiApiKey: openaiKey ? openaiKey.trim() : undefined,
          falApiKey: falKey ? falKey.trim() : undefined,
          openaiApiKeyMasked: openaiKey ? '••••••••' + openaiKey.slice(-4) : aiSettings.openaiApiKeyMasked,
          falApiKeyMasked: falKey ? '••••••••' + falKey.slice(-4) : aiSettings.falApiKeyMasked,
        } as any);
      }

      if (metaToken || metaAppSecret) {
        await onSaveInstagramSettings({
          isTestMode: testMode,
          userAccessToken: metaToken ? metaToken.trim() : undefined,
          userAccessTokenMasked: metaToken ? '••••••••' + metaToken.slice(-4) : instagramSettings.userAccessTokenMasked,
          appSecretMasked: metaAppSecret ? '••••••••' + metaAppSecret.slice(-4) : instagramSettings.appSecretMasked,
        } as any);
      }

      setOpenaiKey('');
      setFalKey('');
      setMetaToken('');
      setMetaAppSecret('');
      setStatusMessage({ type: 'success', text: 'Tüm API anahtarları backend kasasına (Secret Store) güvenle kaydedildi.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: `Kayıt hatası: ${msg}` });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-amber-400" />
            API ve Entegrasyonlar
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Harici yapay zeka ve sosyal medya servis anahtarlarının maskeli ve şifrelenmiş yönetimi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Genel Test/Simülasyon Modu:</span>
          <button
            type="button"
            onClick={() => setTestMode(!testMode)}
            className={`text-xs px-3 py-1 rounded-lg border font-semibold transition ${
              testMode
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {testMode ? 'Test Modu (Anahtarsız Güvenli Mod)' : 'Canlı API Modu'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-zinc-300 space-y-1">
          <p className="font-semibold text-amber-300">Sıfır Sızıntı & Maskeli Anahtar Güvenliği</p>
          <p className="text-zinc-400 leading-relaxed">
            API anahtarları backend tarafında (Google Secret Manager veya güvenli çevre değişkenlerinde) saklanır.
            İstemci tarafına hiçbir zaman açık metin (raw string) olarak döndürülmez.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveKeys} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* OpenAI Integration Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">OpenAI API</h3>
                  <p className="text-[11px] text-zinc-400">Metin, senaryo & altyazı motoru</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Mevcut: {aiSettings.openaiApiKeyMasked}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Yeni OpenAI API Key (sk-...)</label>
              <input
                type="password"
                placeholder="sk-proj-••••••••••••••••••••••••"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* fal.ai Integration Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">fal.ai API</h3>
                  <p className="text-[11px] text-zinc-400">Yüksek hızlı 9:16 video üretim motoru</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Mevcut: {aiSettings.falApiKeyMasked}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Yeni fal.ai API Key (fal_key-...)</label>
              <input
                type="password"
                placeholder="fal-••••••••••••••••••••••••"
                value={falKey}
                onChange={(e) => setFalKey(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Meta Instagram Graph API Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Meta Instagram Graph API</h3>
                  <p className="text-[11px] text-zinc-400">Reels yayınlama ve sayfa erişimi</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Mevcut: {instagramSettings.userAccessTokenMasked}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">User Long-Lived Token (EAAB...)</label>
              <input
                type="password"
                placeholder="EAAB••••••••••••••••••••••••"
                value={metaToken}
                onChange={(e) => setMetaToken(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Firebase Cloud Platform Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Firebase & Google Cloud</h3>
                  <p className="text-[11px] text-zinc-400">Firestore, Auth, Storage & Cloud Run</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                Aktif
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              Proje ID: <span className="font-mono text-zinc-200">evlilik-ilanlari-ai</span>
              <br />
              Google Cloud Run montaj worker hazır ve containerize edildi.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-xs font-semibold text-white shadow-lg shadow-amber-950/40 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Anahtarları ve Entegrasyonları Kaydet</span>
          </button>
        </div>
      </form>
    </div>
  );
}
