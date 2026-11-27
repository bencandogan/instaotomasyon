'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Send,
  Clock,
  AlertOctagon,
  Sparkles,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Coins,
  CheckCircle2,
  RefreshCw,
  Play,
  Bot,
  Zap
} from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { GeneratedVideo, PublishQueueItem } from '@/types';

interface OverviewProps {
  stats: any;
  videos: GeneratedVideo[];
  queue: PublishQueueItem[];
  onNavigate: (tab: any) => void;
  onQuickGenerate: () => void;
  isLoading: boolean;
}

export function OverviewView({ stats, videos, queue, onNavigate, onQuickGenerate, isLoading }: OverviewProps) {
  const [autopilotStatus, setAutopilotStatus] = useState<any>(null);
  const [isTicking, setIsTicking] = useState(false);
  const [tickMessage, setTickMessage] = useState<string | null>(null);

  const loadAutopilotStatus = async () => {
    try {
      const res = await fetch('/api/autopilot');
      if (res.ok) {
        const data = await res.json();
        if (data.status) setAutopilotStatus(data.status);
      }
    } catch {}
  };

  useEffect(() => {
    loadAutopilotStatus();
    const interval = setInterval(loadAutopilotStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerAutopilot = async () => {
    setIsTicking(true);
    setTickMessage(null);
    try {
      const res = await fetch('/api/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tick' }),
      });
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setTickMessage(data.messages[data.messages.length - 1]);
      } else {
        setTickMessage('Kontrol tamamlandı. Kuyruk ve zamanlama güncel.');
      }
      await loadAutopilotStatus();
    } catch {
      setTickMessage('Otonom kontrol tetiklenirken hata oluştu.');
    } finally {
      setIsTicking(false);
      setTimeout(() => setTickMessage(null), 5000);
    }
  };

  const handleToggleAutopilot = async () => {
    const nextState = !(autopilotStatus?.autopilotEnabled !== false);
    try {
      const res = await fetch('/api/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', enabled: nextState }),
      });
      if (res.ok) {
        await loadAutopilotStatus();
      }
    } catch {}
  };

  const statCards = [
    {
      title: 'Bugün Üretilen Video',
      value: `${stats?.todayProduced || 0} / ${stats?.dailyTarget || 5}`,
      subtitle: `${stats?.dailyTarget ? Math.min(100, Math.round(((stats.todayProduced || 0) / stats.dailyTarget) * 100)) : 0}% Hedef Tamamlandı`,
      icon: Video,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Yayınlanan Videolar',
      value: `${stats?.todayPublished || 0}`,
      subtitle: 'Bugün Instagram Reels',
      icon: Send,
      color: 'from-emerald-600 to-teal-600',
    },
    {
      title: 'Yayın Bekleyenler',
      value: `${stats?.pendingInQueue || 0}`,
      subtitle: 'Zamanlanmış slotlar',
      icon: Clock,
      color: 'from-amber-600 to-orange-600',
    },
    {
      title: 'Başarısız Yayınlar',
      value: `${stats?.failedCount || 0}`,
      subtitle: stats?.failedCount > 0 ? 'Kontrol gerektiriyor' : 'Sistem temiz',
      icon: AlertOctagon,
      color: stats?.failedCount > 0 ? 'from-rose-600 to-red-600' : 'from-zinc-700 to-zinc-800',
    },
    {
      title: 'Toplam Video Üretimi',
      value: `${stats?.totalProduced || 0}`,
      subtitle: 'Arşivdeki toplam içerik',
      icon: Sparkles,
      color: 'from-purple-600 to-pink-600',
    },
    {
      title: 'Aylık API Harcaması',
      value: `$${(stats?.monthSpentUsd || 0).toFixed(2)}`,
      subtitle: `Bugün: $${(stats?.todaySpentUsd || 0).toFixed(2)}`,
      icon: Coins,
      color: 'from-cyan-600 to-blue-600',
    },
    {
      title: 'Instagram Görüntülenme',
      value: `${(stats?.totalViews || 0).toLocaleString('tr-TR')}`,
      subtitle: 'Organik Reels gösterimi',
      icon: Eye,
      color: 'from-violet-600 to-purple-600',
    },
    {
      title: 'Beğeni ve Yorum',
      value: `${stats?.totalLikes || 0} / ${stats?.totalComments || 0}`,
      subtitle: 'Toplam etkileşim',
      icon: Heart,
      color: 'from-pink-600 to-rose-600',
    },
  ];

  const recentVideos = videos.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Trigger */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/60 via-zinc-900 to-indigo-950/60 p-6 border border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Evlilik İlanları
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-zinc-400 text-xs">AI Reels Otomasyonu v2.0</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
              Günün Reels Üretim Paneli
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Her gün otomatik 5 özgün 9:16 Reels videosu üretilir, Türkçe altyazı ve müzikle montajlanır, Meta Instagram API ile zamanında yayınlanır.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onQuickGenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium shadow-lg shadow-rose-950/50 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Günlük 5 İçeriği Üret</span>
            </button>
          </div>
        </div>
      </div>

      {/* Autopilot Master Card (Kur ve Unut) */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Tam Otonom Autopilot Motoru
                  <span className="text-[11px] font-normal text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">Kur & Unut</span>
                </h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  autopilotStatus?.autopilotEnabled !== false
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {autopilotStatus?.autopilotEnabled !== false ? '● OTONOM ÇALIŞIYOR' : '○ DEVRE DIŞI'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Sistem arka planda her 60 saniyede bir saati gelen Reels videolarını (09:00, 12:00, 15:00, 18:00, 21:00) ve 24 saatte bir Story&apos;yi otomatik yayınlar. Kuyruk azaldıkça kayıtlı Pinterest havuzundan yeni videoları kendisi çeker.
              </p>
              {tickMessage && (
                <div className="mt-2 text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{tickMessage}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleTriggerAutopilot}
              disabled={isTicking}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-950 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTicking ? 'animate-spin' : ''}`} />
              <span>{isTicking ? 'Kontrol Ediliyor...' : 'Şimdi Otonom Kontrol Yap'}</span>
            </button>
            <button
              onClick={handleToggleAutopilot}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                autopilotStatus?.autopilotEnabled !== false
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
              }`}
            >
              {autopilotStatus?.autopilotEnabled !== false ? 'Durdur' : 'Autopilot Başlat'}
            </button>
          </div>
        </div>

        {/* 3 mini status indicators inside Autopilot Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-800/80">
          <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800">
            <p className="text-[11px] text-zinc-400">Sıradaki Otomatik Reels</p>
            <p className="text-xs font-semibold text-white mt-0.5 truncate">
              {autopilotStatus?.nextReels
                ? `${new Date(autopilotStatus.nextReels.scheduledTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - ${autopilotStatus.nextReels.videoTitle}`
                : 'Kuyrukta bekleyen video yok'}
            </p>
          </div>

          <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800">
            <p className="text-[11px] text-zinc-400">24 Saatlik Otomatik Story</p>
            <p className="text-xs font-semibold text-white mt-0.5">
              {autopilotStatus?.storySettings?.isEnabled
                ? `Aktif (${autopilotStatus.storySettings.dailyPublishTime})`
                : 'Devre Dışı'}
            </p>
          </div>

          <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800">
            <p className="text-[11px] text-zinc-400">Kayıtlı Pinterest Link Havuzu</p>
            <p className="text-xs font-semibold text-white mt-0.5">
              {autopilotStatus?.savedUrlsCount || 0} Link Kayıtlı (Kuyruk azaldıkça çeker)
            </p>
          </div>
        </div>
      </div>

      {/* Connection & Target Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <InstagramIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Instagram Bağlantısı</p>
              <p className="text-sm font-semibold text-white">
                {stats?.instagramConnected ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bağlı ({stats.instagramAccount})
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    Test / Doğrulama Modu
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('instagram-account')}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition"
          >
            Yönet
          </button>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Günlük Paylaşım Hedefi</p>
              <p className="text-sm font-semibold text-white">
                5 / 5 Slot (09:00 - 21:00)
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('schedule')}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition"
          >
            Takvim
          </button>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Bütçe Güvenlik Koruması</p>
              <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Devre Kesici Hazır
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('cost-management')}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition"
          >
            Limitler
          </button>
        </div>
      </div>

      {/* 8 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/80 transition-all rounded-xl p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
                <div className="text-xs text-zinc-500 mt-1">{card.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Videos & Active Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Videos Preview */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Son Üretilen Reels Videoları</h2>
              <p className="text-xs text-zinc-400">En son hazırlanan dikey 9:16 içerikler</p>
            </div>
            <button
              onClick={() => onNavigate('video-library')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Tümünü Gör ({videos.length}) →
            </button>
          </div>

          {recentVideos.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
              <Video className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Henüz üretilmiş bir video yok.</p>
              <button
                onClick={onQuickGenerate}
                className="mt-3 text-xs bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 px-3 py-1.5 rounded-lg border border-rose-500/30 transition"
              >
                Hemen İlk 5 Videoyu Üret
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-3.5 p-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800 transition"
                >
                  <div className="relative w-12 h-16 rounded-md overflow-hidden bg-zinc-950 flex-shrink-0 border border-zinc-700/50">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white/80" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">{video.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                      <span className="capitalize">{video.productionType === 'ai_video' ? 'AI Video' : 'FFmpeg Motion'}</span>
                      <span>•</span>
                      <span>{video.durationSeconds} sn</span>
                      <span>•</span>
                      <span>${video.costUsd.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        video.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : video.status === 'ready'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-zinc-500/10 text-zinc-400'
                      }`}
                    >
                      {video.status === 'published' ? 'Yayında' : video.status === 'ready' ? 'Hazır' : video.status}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(video.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Publishing Schedule Queue */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Bugünkü Yayın Takvimi</h2>
              <p className="text-xs text-zinc-400">Europe/Istanbul (09:00 - 21:00 slotları)</p>
            </div>
            <button
              onClick={() => onNavigate('schedule')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Takvimi Düzenle →
            </button>
          </div>

          <div className="space-y-2.5">
            {queue.slice(0, 5).map((slot, index) => {
              const isPast = new Date(slot.scheduledTime).getTime() < Date.now();
              return (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{slot.slotLabel}</p>
                      <p className="text-xs text-zinc-400">{slot.videoTitle || 'Henüz video atanmadı'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full ${
                        slot.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : slot.status === 'processing'
                          ? 'bg-amber-500/10 text-amber-400 animate-pulse'
                          : isPast
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}
                    >
                      {slot.status === 'published' ? 'Paylaşıldı' : slot.status === 'processing' ? 'Paylaşılıyor' : 'Beklemede'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
