'use client';

import React, { useState } from 'react';
import {
  Coins,
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  TrendingDown,
  Lock,
  Layers
} from 'lucide-react';
import { ApiUsageRecord, CostAndUsageLimits } from '@/types';

interface CostManagementProps {
  limits: CostAndUsageLimits;
  apiUsage: ApiUsageRecord[];
  onSaveLimits: (limits: Partial<CostAndUsageLimits>) => Promise<void>;
  isLoading: boolean;
}

export function CostManagementView({ limits, apiUsage, onSaveLimits, isLoading }: CostManagementProps) {
  const [dailyLimit, setDailyLimit] = useState(limits.dailySpendingLimitUsd);
  const [monthlyLimit, setMonthlyLimit] = useState(limits.monthlySpendingLimitUsd);
  const [maxPerVideo, setMaxPerVideo] = useState(limits.maxCostPerVideoUsd);
  const [maxAiDaily, setMaxAiDaily] = useState(limits.maxDailyAiVideos);
  const [maxFfmpegDaily, setMaxFfmpegDaily] = useState(limits.maxDailyFfmpegVideos);
  const [circuitBreaker, setCircuitBreaker] = useState(limits.circuitBreakerActive);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveLimits({
      dailySpendingLimitUsd: Number(dailyLimit),
      monthlySpendingLimitUsd: Number(monthlyLimit),
      maxCostPerVideoUsd: Number(maxPerVideo),
      maxDailyAiVideos: Number(maxAiDaily),
      maxDailyFfmpegVideos: Number(maxFfmpegDaily),
      maxDailyTotalVideos: Number(maxAiDaily) + Number(maxFfmpegDaily),
      circuitBreakerActive: circuitBreaker,
    });
  };

  const dailyProgress = Math.min(100, (limits.todaySpentUsd / (limits.dailySpendingLimitUsd || 1)) * 100);
  const monthlyProgress = Math.min(100, (limits.monthSpentUsd / (limits.monthlySpendingLimitUsd || 1)) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-400" />
            Maliyet, Harcama ve Bütçe Kontrolü
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            API tüketimini denetleyen otomatik devre kesici, günlük/aylık harcama tavanları ve harcama dökümü.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${
              circuitBreaker
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {circuitBreaker ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {circuitBreaker ? 'Devre Kesici Aktif (AI Durduruldu)' : 'Bütçe Sistemi Güvenli'}
          </span>
        </div>
      </div>

      {/* Progress Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Bugünkü Bütçe Kullanımı</span>
            <span className="text-xs font-mono font-bold text-white">
              ${limits.todaySpentUsd.toFixed(2)} / ${limits.dailySpendingLimitUsd.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                dailyProgress > 85 ? 'bg-rose-500' : dailyProgress > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-500">
            Günlük bütçe %{dailyProgress.toFixed(0)} oranında tüketildi. Aşılırsa AI video otomatik askıya alınır.
          </p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Aylık Bütçe Kullanımı</span>
            <span className="text-xs font-mono font-bold text-white">
              ${limits.monthSpentUsd.toFixed(2)} / ${limits.monthlySpendingLimitUsd.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                monthlyProgress > 85 ? 'bg-rose-500' : monthlyProgress > 60 ? 'bg-amber-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${monthlyProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-500">
            Aylık bütçe %{monthlyProgress.toFixed(0)} oranında tüketildi.
          </p>
        </div>
      </div>

      {/* Rules & Limits Form */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Sert Harcama Sınırları ve Kota Kuralları</h2>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Günlük Maksimum Harcama ($ USD)</label>
              <input
                type="number"
                step="0.5"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Aylık Maksimum Harcama ($ USD)</label>
              <input
                type="number"
                step="5"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Video Başına Tavan Maliyet ($ USD)</label>
              <input
                type="number"
                step="0.1"
                value={maxPerVideo}
                onChange={(e) => setMaxPerVideo(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Günlük AI Video Limiti (fal.ai)</label>
              <input
                type="number"
                value={maxAiDaily}
                onChange={(e) => setMaxAiDaily(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Tavsiye edilen: 2 adet</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Günlük Motion/Montaj Limiti (FFmpeg)</label>
              <input
                type="number"
                value={maxFfmpegDaily}
                onChange={(e) => setMaxFfmpegDaily(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Tavsiye edilen: 3 adet</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Devre Kesici (Circuit Breaker)</label>
              <button
                type="button"
                onClick={() => setCircuitBreaker(!circuitBreaker)}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                  circuitBreaker
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                {circuitBreaker ? 'Devre Kesiciyi Kapat (İzin Ver)' : 'Devre Kesiciyi Manuel Aç (Koru)'}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-zinc-800">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Bütçe Limitlerini Kaydet</span>
            </button>
          </div>
        </form>
      </div>

      {/* API Usage Audit Table */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">Son API Harcama ve Çağrı Geçmişi</h2>
        {apiUsage.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            Henüz API kullanım kaydı bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-800/50 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Tarih</th>
                  <th className="py-2.5 px-3 font-semibold">Sağlayıcı</th>
                  <th className="py-2.5 px-3 font-semibold">Endpoint</th>
                  <th className="py-2.5 px-3 font-semibold">Kullanılan Birim</th>
                  <th className="py-2.5 px-3 font-semibold">Maliyet ($)</th>
                  <th className="py-2.5 px-3 font-semibold">Süre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {apiUsage.slice(0, 10).map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-800/30">
                    <td className="py-2 px-3 text-zinc-400">
                      {new Date(record.timestamp).toLocaleTimeString('tr-TR')}
                    </td>
                    <td className="py-2 px-3 font-sans capitalize">{record.provider.replace('_', '.')}</td>
                    <td className="py-2 px-3 text-zinc-400 truncate max-w-xs">{record.endpoint}</td>
                    <td className="py-2 px-3">
                      {record.unitsUsed} {record.unitType}
                    </td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">${record.costUsd.toFixed(4)}</td>
                    <td className="py-2 px-3 text-zinc-400">{record.durationMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
