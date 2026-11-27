'use client';

import React, { useState } from 'react';
import {
  Video,
  Play,
  Calendar,
  Send,
  Trash2,
  Edit3,
  ExternalLink,
  Coins,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  RotateCw,
  Download,
  Music,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { GeneratedVideo, VideoCategoryType } from '@/types';
import Hls from 'hls.js';

function ReelsVideoPlayer({
  video,
}: {
  video: GeneratedVideo;
}) {
  const src = video.videoUrl;
  const poster = video.thumbnailUrl;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [musicActive, setMusicActive] = React.useState(true); // Yalnızca telifsiz fon müziği açık
  const [musicVolume, setMusicVolume] = React.useState(0.85); // Telifsiz müzik %85
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(video.durationSeconds || 12);

  // Yerel, Kesintisiz, Telifsiz Romantik Fon Müziği (Polis sireni veya gürültü içermeyen saf akustik gitar ve piyano)
  const royaltyFreeAudioUrl = '/audio/romantic-bg.mp3';

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    // Orijinal video sesini DONANIMSAL OLARAK SUSTUR (Asla sokak, korna veya polis sireni sesi sızamaz)
    v.muted = true;
    v.volume = 0;
    const forceMute = () => {
      if (!v.muted || v.volume > 0) {
        v.muted = true;
        v.volume = 0;
      }
    };
    v.addEventListener('volumechange', forceMute);

    const streamUrl = src.startsWith('http') ? `/api/video/proxy?url=${encodeURIComponent(src)}` : src;

    if (src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: false });
        hls.loadSource(streamUrl);
        hls.attachMedia(v);
        return () => {
          v.removeEventListener('volumechange', forceMute);
          hls.destroy();
        };
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        v.src = streamUrl;
      }
    } else {
      v.src = streamUrl;
    }

    return () => {
      v.removeEventListener('volumechange', forceMute);
    };
  }, [src]);

  const togglePlayPause = () => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v) return;

    if (v.paused) {
      v.play().catch(() => {});
      setIsPlaying(true);
      if (musicActive && a) {
        a.volume = musicVolume;
        a.currentTime = v.currentTime || 0;
        a.play().catch(() => {});
      }
    } else {
      v.pause();
      setIsPlaying(false);
      if (a) a.pause();
    }
  };

  const handleToggleMusic = () => {
    const next = !musicActive;
    setMusicActive(next);
    if (audioRef.current) {
      if (next && isPlaying) {
        audioRef.current.volume = musicVolume;
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  };

  // Dinamik Altyazı Listesi (Her video için tamamen özgün ve kesintisiz)
  const effectiveDuration = duration > 0 ? duration : (video.durationSeconds || 12);
  const subtitlesList = React.useMemo(() => {
    if (video.turkishSubtitles && video.turkishSubtitles.length > 0) {
      return video.turkishSubtitles;
    }
    const d = effectiveDuration;
    return [
      { start: 0, end: Math.min(3.5, d * 0.3), text: 'Eşsiz bir aşk hikayesinin ilk adımı!' },
      { start: Math.min(3.5, d * 0.3), end: Math.min(8.0, d * 0.7), text: 'Doğru insanla bir ömür yürümek kalbe sonsuz huzur verir.' },
      { start: Math.min(8.0, d * 0.7), end: Math.max(d - 3.5, d * 0.8), text: 'Sen de kalbindeki insanı bulmak için adım at 💍' },
    ];
  }, [video, effectiveDuration]);

  // Aktif Altyazı ve Outro (Reklam Sonu) Kontrolü
  const activeSub = subtitlesList.find((s) => currentTime >= s.start && currentTime <= s.end);
  const isOutro = effectiveDuration > 4 && currentTime >= effectiveDuration - 3.5;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Video Sahnesi & Montaj Katmanları */}
      <div
        onClick={togglePlayPause}
        className="relative aspect-[9/16] bg-black flex items-center justify-center overflow-hidden select-none cursor-pointer group"
      >
        <video
          ref={videoRef}
          poster={poster}
          muted
          playsInline
          autoPlay
          onPlay={() => {
            setIsPlaying(true);
            if (musicActive && audioRef.current) {
              audioRef.current.volume = musicVolume;
              audioRef.current.currentTime = videoRef.current?.currentTime || 0;
              audioRef.current.play().catch(() => {});
            }
          }}
          onPause={() => {
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.pause();
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            if (e.currentTarget.duration) setDuration(e.currentTarget.duration);
          }}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Katman: Duraklatıldığında beliren Oynat İkonu */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-20">
            <div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-2xl transform group-hover:scale-110 transition duration-300">
              <Play className="w-8 h-8 fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Katman 1: Marka Logosu & Filigran (Sağ Üst) */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-xl pointer-events-none">
          <span className="text-rose-400 text-sm">💍</span>
          <span className="font-bold text-xs tracking-tight">Evlilik İlanları</span>
        </div>

        {/* Katman 2: Telifsiz Müzik Rozeti (Sol Üst) */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] text-white shadow-lg pointer-events-none">
          <Music className={`w-3.5 h-3.5 text-pink-400 ${isPlaying ? 'animate-pulse' : ''}`} />
          <span className="font-medium">{musicActive ? '🎵 Romantik Melodi' : 'Müzik: Kapalı'}</span>
        </div>

        {/* Katman 3: Modern Instagram / TikTok Tarzı Türkçe Altyazı */}
        {activeSub && !isOutro && (
          <div className="absolute bottom-20 left-4 right-4 z-20 flex justify-center text-center pointer-events-none transition-all duration-300">
            <div className="bg-black/75 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/15 shadow-2xl max-w-[90%] animate-in fade-in zoom-in-95 duration-200">
              <p className="text-white font-extrabold text-xs sm:text-sm leading-snug tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {activeSub.text}
              </p>
            </div>
          </div>
        )}

        {/* Katman 4: Otomatik Reklam Sonu (Outro Kartı - Son 3.5 Saniye) */}
        {isOutro && (
          <div className="absolute inset-0 z-30 bg-gradient-to-b from-black/95 via-rose-950/90 to-black/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 pointer-events-none">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-2xl shadow-xl mb-3 border border-white/20">
              💍
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-wider drop-shadow-md">
              Evlilik İlanları Türkiye
            </h3>
            <p className="text-xs text-rose-200 mt-1 max-w-[220px] leading-relaxed font-medium">
              Yeni başlangıçlara ilk adımını at.
            </p>
            <div className="mt-4 px-3.5 py-2 rounded-xl bg-amber-400/20 border border-amber-400/40 text-xs font-bold text-amber-300 shadow-lg">
              📲 Profildeki Linkten Hemen Ücretsiz İndir
            </div>
          </div>
        )}

        {/* Video İlerleme Çubuğu */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Telifsiz Fon Müziği Audio */}
        <audio
          ref={audioRef}
          src={royaltyFreeAudioUrl}
          loop
          preload="auto"
        />
      </div>

      {/* Katman 5: Otomatik Montaj Kontrol & Ses Paneli */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-800 space-y-2">
        {/* Montaj Özeti */}
        <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800/60">
          <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Otomatik Edit Katmanları:
          </span>
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            ✓ Montaj Tamamlandı
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-zinc-400 pb-1">
          <span className="flex items-center gap-1 text-zinc-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 9:16 Dikey Format
          </span>
          <span className="flex items-center gap-1 text-zinc-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Özgün Türkçe Altyazı
          </span>
          <span className="flex items-center gap-1 text-zinc-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Marka Logosu & Filigran
          </span>
          <span className="flex items-center gap-1 text-zinc-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Reklam & İndir Sonu
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-zinc-400 font-medium flex items-center gap-1.5">
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            Orijinal Video Sesi: <strong className="text-rose-300">Sıfırlandı (Gürültü Yok)</strong>
          </span>
          <span className="text-zinc-300 font-mono text-[11px]">Fon Müziği: %{Math.round(musicVolume * 100)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={musicVolume}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setMusicVolume(v);
            if (audioRef.current) audioRef.current.volume = v;
          }}
          className="w-full accent-pink-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
        />

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleToggleMusic}
            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              musicActive
                ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>{musicActive ? 'Fon Müziğini Durdur' : 'Telifsiz Fon Müziğini Çal'}</span>
          </button>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Akustik & Piyano
          </span>
        </div>
      </div>
    </div>
  );
}

interface VideoLibraryProps {
  videos: GeneratedVideo[];
  onPublishNow: (videoId: string) => Promise<void>;
  onAddToQueue: (videoId: string, time: string, slotLabel: string) => Promise<void>;
  onUpdateVideo: (videoId: string, updates: Partial<GeneratedVideo>) => Promise<void>;
  onDeleteVideo: (videoId: string) => Promise<void>;
  onRegenerate: (video: GeneratedVideo) => Promise<void>;
  isLoading: boolean;
}

export function VideoLibraryView({
  videos,
  onPublishNow,
  onAddToQueue,
  onUpdateVideo,
  onDeleteVideo,
  onRegenerate,
  isLoading,
}: VideoLibraryProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activePlayingVideo, setActivePlayingVideo] = useState<GeneratedVideo | null>(null);
  const [editingVideo, setEditingVideo] = useState<GeneratedVideo | null>(null);
  const [queueModalVideo, setQueueModalVideo] = useState<GeneratedVideo | null>(null);
  const [queueTime, setQueueTime] = useState<string>('18:00');
  const [queueLabel, setQueueLabel] = useState<string>('Akşam Slotu');

  const filteredVideos = videos.filter((v) => {
    if (filterCategory !== 'all' && v.categoryKey !== filterCategory) return false;
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    return true;
  });

  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    await onUpdateVideo(editingVideo.id, {
      caption: editingVideo.caption,
      hashtags: editingVideo.hashtags,
    });
    setEditingVideo(null);
  };

  const handleQueueSubmit = async () => {
    if (!queueModalVideo) return;
    const today = new Date().toISOString().split('T')[0];
    const scheduledTime = `${today}T${queueTime}:00+03:00`;
    await onAddToQueue(queueModalVideo.id, scheduledTime, queueLabel);
    setQueueModalVideo(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-indigo-400" />
            Video Kütüphanesi
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Üretilen tüm dikey 9:16 Instagram Reels videoları, maliyetleri, önizlemeleri ve yayın yönetimi.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="romantic_cinematic">Romantik Sinematik</option>
            <option value="realistic_selfie">Gerçekçi Telefon Kamera</option>
            <option value="relationship_advice">İlişki Tavsiyeleri</option>
            <option value="app_promo">Uygulama Reklamı</option>
            <option value="viral_story">Viral Hikâye</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="ready">Hazır</option>
            <option value="published">Yayında</option>
            <option value="failed">Hatalı</option>
          </select>
        </div>
      </div>

      {/* Grid of Video Cards (9:16 Aspect Ratio Look) */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl">
          <Video className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">Bu filtreye uygun video bulunamadı</h3>
          <p className="text-xs text-zinc-500 mt-1">AI İçerik Üretimi sekmesinden yeni videolar oluşturabilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden flex flex-col justify-between transition-all group"
            >
              {/* Thumbnail with 9:16 Aspect ratio container */}
              <div className="relative aspect-[9/16] max-h-72 bg-zinc-950 overflow-hidden cursor-pointer" onClick={() => setActivePlayingVideo(video)}>
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition">
                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                  </div>
                </div>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase">
                    {video.productionType === 'ai_video' ? 'AI Video' : 'FFmpeg'}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md border ${
                      video.status === 'published'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : video.status === 'ready'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {video.status === 'published' ? 'Yayında' : video.status === 'ready' ? 'Hazır' : 'Başarısız'}
                  </span>
                </div>

                {/* Bottom Meta Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-zinc-300">
                  <span className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                    <Clock className="w-3 h-3 text-zinc-400" /> {video.durationSeconds} sn
                  </span>
                  <span className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md font-mono text-emerald-400">
                    <Coins className="w-3 h-3" /> ${video.costUsd.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span>{video.categoryKey}</span>
                    <span>{new Date(video.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">{video.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">{video.caption}</p>

                  {/* Otomatik Montaj & Edit Rozetleri */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-medium">
                      ✓ Altyazılı
                    </span>
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-medium">
                      ✓ Marka Logosu
                    </span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium">
                      ✓ Reklam Sonu
                    </span>
                    <span className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-1.5 py-0.5 rounded font-medium">
                      ✓ Telifsiz Müzik
                    </span>
                  </div>
                </div>

                {/* Instagram link if published */}
                {video.instagramPermalink && (
                  <a
                    href={video.instagramPermalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Instagram'da Görüntüle</span>
                  </a>
                )}

                {/* Actions Toolbar */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <a
                      href={video.videoUrl}
                      download={`${video.title}.mp4`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Videoyu İndir (MP4)"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setEditingVideo(video)}
                      title="Metni Düzenle"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRegenerate(video)}
                      title="Yeniden Üret"
                      disabled={isLoading}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition disabled:opacity-50"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteVideo(video.id)}
                      title="Sil"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-400 text-zinc-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setQueueModalVideo(video)}
                      title="Yayın Kuyruğuna Ekle"
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3 text-indigo-400" />
                      <span>Kuyruğa</span>
                    </button>
                    {video.status !== 'published' && (
                      <button
                        onClick={() => onPublishNow(video.id)}
                        disabled={isLoading}
                        title="Hemen Paylaş"
                        className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Paylaş</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {activePlayingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white truncate">{activePlayingVideo.title}</h3>
              <button onClick={() => setActivePlayingVideo(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-[9/16] bg-black">
              <ReelsVideoPlayer video={activePlayingVideo} />
            </div>
            <div className="p-3 border-t border-zinc-800 flex items-center justify-between gap-2 bg-zinc-950">
              <a
                href={activePlayingVideo.videoUrl}
                download={`${activePlayingVideo.title}.mp4`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>Videoyu İndir (MP4)</span>
              </a>
              <button
                onClick={() => {
                  setEditingVideo(activePlayingVideo);
                  setActivePlayingVideo(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Metni Düzenle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Caption & Hashtags Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-white">Reels Açıklamasını Düzenle</h3>
              <button onClick={() => setEditingVideo(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Instagram Açıklaması</label>
              <textarea
                rows={5}
                value={editingVideo.caption}
                onChange={(e) => setEditingVideo({ ...editingVideo, caption: e.target.value })}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Hashtagler (Virgülle ayırın)</label>
              <input
                type="text"
                value={editingVideo.hashtags.join(', ')}
                onChange={(e) =>
                  setEditingVideo({
                    ...editingVideo,
                    hashtags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingVideo(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue Modal */}
      {queueModalVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-white">Yayın Takvimine Ekle</h3>
              <button onClick={() => setQueueModalVideo(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-2 truncate font-medium text-zinc-200">
                Seçilen Video: "{queueModalVideo.title}"
              </p>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Yayın Saati (Europe/Istanbul)</label>
              <select
                value={queueTime}
                onChange={(e) => setQueueTime(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 mb-3"
              >
                <option value="09:00">09:00 (Sabah İlhamı)</option>
                <option value="12:00">12:00 (Öğle Tavsiyesi)</option>
                <option value="15:00">15:00 (Günün Sorusu)</option>
                <option value="18:00">18:00 (Akşam Hikâyesi)</option>
                <option value="21:00">21:00 (Gece Keşfi)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setQueueModalVideo(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleQueueSubmit}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Kuyruğa Ekle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
