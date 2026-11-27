'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Video,
  Coins,
  CheckCircle2
} from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { GeneratedVideo } from '@/types';

interface StatisticsProps {
  stats: any;
  videos: GeneratedVideo[];
}

export function StatisticsView({ stats, videos }: StatisticsProps) {
  const publishedVideos = videos.filter((v) => v.status === 'published');
  const readyVideos = videos.filter((v) => v.status === 'ready');
  const failedVideos = videos.filter((v) => v.status === 'failed');

  const aiVideosCount = videos.filter((v) => v.productionType === 'ai_video').length;
  const ffmpegVideosCount = videos.filter((v) => v.productionType === 'ffmpeg_motion').length;

  const totalCost = videos.reduce((acc, v) => acc + (v.costUsd || 0), 0);
  const avgCostPerVideo = videos.length > 0 ? totalCost / videos.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-400" />
            Performans ve Üretim İstatistikleri
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Veritabanı kayıtlarından hesaplanan gerçek Reels üretim oranları ve etkileşim metrikleri.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs font-medium text-zinc-400">Toplam Üretim</span>
          <div className="text-2xl font-bold text-white mt-1">{videos.length} Video</div>
          <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
            <span>{aiVideosCount} AI</span>
            <span>•</span>
            <span>{ffmpegVideosCount} FFmpeg</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs font-medium text-zinc-400">Yayın Başarı Oranı</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {videos.length > 0 ? `${Math.round((publishedVideos.length / videos.length) * 100)}%` : '100%'}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {publishedVideos.length} yayında / {failedVideos.length} hata
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs font-medium text-zinc-400">Ortalama Video Maliyeti</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">${avgCostPerVideo.toFixed(2)}</div>
          <div className="text-xs text-zinc-500 mt-1">Hedef: $1.50 altı</div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs font-medium text-zinc-400">Instagram Görüntülenme</span>
          <div className="text-2xl font-bold text-pink-400 mt-1">
            {(stats?.totalViews || 0).toLocaleString('tr-TR')}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Reels algoritma keşfeti</div>
        </div>
      </div>

      {/* Production Breakdown by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Kategori Dağılımı</h2>
          <div className="space-y-3">
            {[
              { label: 'Romantik Sinematik', key: 'romantic_cinematic', color: 'bg-rose-500' },
              { label: 'Gerçekçi Telefon Kamerası', key: 'realistic_selfie', color: 'bg-blue-500' },
              { label: 'İlişki & Evlilik Tavsiyeleri', key: 'relationship_advice', color: 'bg-purple-500' },
              { label: 'Evlilik İlanları Uygulama Reklamı', key: 'app_promo', color: 'bg-emerald-500' },
              { label: 'Viral Soru & Hikâye', key: 'viral_story', color: 'bg-amber-500' },
            ].map((cat) => {
              const count = videos.filter((v) => v.categoryKey === cat.key).length;
              const percent = videos.length > 0 ? (count / videos.length) * 100 : 0;
              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300">{cat.label}</span>
                    <span className="font-mono text-zinc-400">
                      {count} ({percent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className={`h-full ${cat.color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Video Production Pipeline Summary */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Üretim Motoru Payı</h2>
          <div className="flex items-center justify-center p-6 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-6">
                <div>
                  <div className="text-3xl font-extrabold text-rose-500">{aiVideosCount}</div>
                  <div className="text-xs text-zinc-400 font-medium mt-1">fal.ai Gerçekçi AI Video</div>
                  <div className="text-[10px] text-zinc-500">Hedef: Günde 2 adet</div>
                </div>
                <div className="h-12 w-[1px] bg-zinc-800" />
                <div>
                  <div className="text-3xl font-extrabold text-indigo-400">{ffmpegVideosCount}</div>
                  <div className="text-xs text-zinc-400 font-medium mt-1">FFmpeg Motion Compositor</div>
                  <div className="text-[10px] text-zinc-500">Hedef: Günde 3 adet</div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-500 text-center">
            Bu hibrit model sayesinde video başına ortalama maliyet $0.15 seviyesinde tutulur.
          </p>
        </div>
      </div>
    </div>
  );
}
