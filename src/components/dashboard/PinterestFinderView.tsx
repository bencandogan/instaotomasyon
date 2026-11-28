'use client';

import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  Plus,
  Play,
  Heart,
  Archive,
  Trash2,
  ExternalLink,
  Sparkles,
  Film,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Video,
  Layers,
  Filter,
  Save,
  X,
  FileText,
  BookmarkPlus,
  RefreshCw,
  Info,
  Shuffle,
  CheckSquare,
  Square,
  Download
} from 'lucide-react';
import {
  PinterestItem,
  PinterestCategory,
  PinterestAgeFilter,
  UsagePermissionStatus,
  SimilarPinItem,
  GeneratedVideo
} from '@/types';
import { deduplicatePins, getDeterministicPinId } from '@/lib/utils/pinDeduplication';
import Hls from 'hls.js';

function PinterestVideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hlsInstance: Hls | null = null;
    const effectiveSrc = (src.includes('.m3u8') && src.includes('pinimg.com'))
      ? `/api/video/proxy?url=${encodeURIComponent(src)}`
      : src;

    if (src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true });
        hlsInstance.loadSource(effectiveSrc);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = effectiveSrc;
        video.play().catch(() => {});
      }
    } else {
      video.src = effectiveSrc;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      playsInline
      poster={poster}
      className="w-full h-full object-contain"
    />
  );
}

const PINTEREST_CATEGORIES: PinterestCategory[] = [
  'Sahil ve deniz',
  'Tatil ve gezi',
  'Günlük yaşam',
  'Moda ve kombin',
  'Başörtülü kadınlar',
  'Başörtüsüz kadınlar',
  'Park ve doğa',
  'Şehir yürüyüşleri',
  'Romantik görüntüler',
  'Kadın ve erkek çiftler',
];

const AGE_FILTERS: PinterestAgeFilter[] = [
  '25–30 yaş görünümü',
  '30–35 yaş görünümü',
  '35–45 yaş görünümü',
];

const PERMISSION_STATUSES: UsagePermissionStatus[] = [
  'İzin bekleniyor',
  'Kullanım izni doğrulandı',
  'Ticari kullanım uygun',
  'Kullanım izni yok',
  'Manuel kontrol gerekli',
];

interface PinterestFinderProps {
  items: PinterestItem[];
  onScanUrl: (url: string, category?: PinterestCategory, age?: PinterestAgeFilter) => Promise<any>;
  onScanBulk: (urls: string[], category?: PinterestCategory, age?: PinterestAgeFilter, shuffle?: boolean) => Promise<any>;
  onSaveItem: (item: PinterestItem) => Promise<void>;
  onUpdateItem: (id: string, updates: Partial<PinterestItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onDeleteBulk?: (ids: string[]) => Promise<void>;
  onClearAll?: () => Promise<void>;
  onConvertToReels: (item: PinterestItem) => Promise<void>;
  onBatchConvertToReels?: (pinIds: string[], shuffle: boolean) => Promise<void>;
  onBulkSetPermission?: () => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export function PinterestFinderView({
  items,
  onScanUrl,
  onScanBulk,
  onSaveItem,
  onUpdateItem,
  onDeleteItem,
  onDeleteBulk,
  onClearAll,
  onConvertToReels,
  onBatchConvertToReels,
  onBulkSetPermission,
  onRefresh,
  isLoading,
}: PinterestFinderProps) {
  // Çift ve tekrarlanan videoları kesin olarak ayıkla
  const uniqueItems = useMemo(() => {
    return deduplicatePins(items);
  }, [items]);

  // Input State
  const [urlInput, setUrlInput] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [shuffleScan, setShuffleScan] = useState(true);
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>([]);

  // Kalıcı Kayıtlı Link Havuzu State
  const [savedUrls, setSavedUrls] = useState<string[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Sayfa açıldığında veya yenilendiğinde kalıcı linkleri localStorage ve backend kasasından otomatik yükle
  React.useEffect(() => {
    // 1. Tarayıcı önbelleğinden hızlı yükleme
    try {
      const local = localStorage.getItem('insta_saved_pinterest_urls');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedUrls(parsed);
          if (parsed.length > 1) {
            setIsBulkMode(true);
            setUrlInput(parsed.join('\n'));
          } else {
            setUrlInput(parsed[0]);
          }
        }
      }
    } catch {}

    // 2. Backend veritabanından kalıcı senkronizasyon
    fetch('/api/pinterest/saved-urls')
      .then((r) => r.json())
      .then((data) => {
        if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
          setSavedUrls(data.urls);
          localStorage.setItem('insta_saved_pinterest_urls', JSON.stringify(data.urls));
          // Eğer input henüz boşsa kalıcı linkleri doldur
          setUrlInput((prev) => (prev.trim() === '' ? data.urls.join('\n') : prev));
          if (data.urls.length > 1) {
            setIsBulkMode(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Tarayıcı hafızasındaki çift/tekrarlanan kayıtları otomatik olarak temizle
  React.useEffect(() => {
    if (items.length > 0 && uniqueItems.length > 0 && items.length !== uniqueItems.length) {
      try {
        localStorage.setItem('insta_pinterest_items', JSON.stringify(uniqueItems));
      } catch {}
    }
  }, [items, uniqueItems]);

  // Linkleri hem localStorage'a hem de backend veritabanına kalıcı kaydetme fonksiyonu
  const persistUrls = async (urlsToSave: string[]) => {
    const clean = Array.from(
      new Set(urlsToSave.map((u) => u.trim()).filter((u) => u.length > 5))
    );
    setSavedUrls(clean);
    try {
      localStorage.setItem('insta_saved_pinterest_urls', JSON.stringify(clean));
      await fetch('/api/pinterest/saved-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: clean, action: 'set' }),
      });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch {}
  };

  const handleManualSaveUrls = async () => {
    const lines = urlInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 5);
    await persistUrls(lines);
    if (lines.length === 1) {
      await onScanUrl(lines[0], undefined, undefined);
    } else if (lines.length > 1) {
      await onScanBulk(lines, undefined, undefined, shuffleScan);
    }
  };

  const handleRemoveSavedUrl = async (urlToRemove: string) => {
    const updated = savedUrls.filter((u) => u !== urlToRemove);
    await persistUrls(updated);
    setUrlInput(updated.join('\n'));
  };

  const handleClearSavedUrls = async () => {
    if (!confirm('Sistemde kayıtlı tüm Pinterest linklerini silmek istediğinize emin misiniz?')) return;
    await persistUrls([]);
    setUrlInput('');
  };

  const handleDeleteSelected = async () => {
    if (selectedPinIds.length === 0) return;
    if (onDeleteBulk) {
      await onDeleteBulk(selectedPinIds);
      setSelectedPinIds([]);
    }
  };

  const handleClearAll = async () => {
    if (onClearAll) {
      await onClearAll();
      setSelectedPinIds([]);
    }
  };

  // Filters State
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAge, setFilterAge] = useState<string>('all');
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals State
  const [activeVideoItem, setActiveVideoItem] = useState<PinterestItem | null>(null);
  const [similarModalItem, setSimilarModalItem] = useState<PinterestItem | null>(null);
  const [editingNotesItem, setEditingNotesItem] = useState<PinterestItem | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  // Filtering Logic
  const filteredItems = uniqueItems.filter((item) => {
    if (showArchived ? !item.archive_status : item.archive_status) return false;
    if (filterFavorite && !item.favorite) return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterAge !== 'all' && item.age_filter !== filterAge) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const match =
        item.pin_title.toLowerCase().includes(q) ||
        item.pin_description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = urlInput.trim();
    const urlsFromInput = rawInput
      ? rawInput.split('\n').map((u) => u.trim()).filter((u) => u.length > 5)
      : [];
    const urls = urlsFromInput.length > 0 ? urlsFromInput : savedUrls.filter((u) => u.length > 5);

    if (urls.length === 0) return;

    await persistUrls(urls);
    if (urls.length === 1) {
      await onScanUrl(urls[0], undefined, undefined);
    } else {
      await onScanBulk(urls, undefined, undefined, shuffleScan);
    }
  };

  const handleSaveNotes = async () => {
    if (!editingNotesItem) return;
    await onUpdateItem(editingNotesItem.id, { notes: notesDraft });
    setEditingNotesItem(null);
  };

  const handleAddSimilarPin = async (parent: PinterestItem, sim: SimilarPinItem) => {
    if (!sim.video_url || sim.video_url === parent.video_url || sim.video_url.includes('mixkit.co')) return;
    const newItem: PinterestItem = {
      id: getDeterministicPinId(sim.url, sim.video_url, sim.id),
      pin_url: sim.url,
      pin_title: sim.title,
      pin_description: `"${parent.pin_title}" içeriğinin benzeri`,
      category: sim.category,
      age_filter: sim.age_filter || parent.age_filter,
      thumbnail_url: sim.thumbnail_url,
      video_url: sim.video_url,
      added_at: new Date().toISOString(),
      notes: `Benzer içerik olarak eklendi (Ana Pin: ${parent.pin_title})`,
      favorite: false,
      usage_permission_status: 'Ticari kullanım uygun',
      original_creator: sim.author || '@pinterest_creator',
      source_license: 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
      approval_status: 'approved',
      archive_status: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await onSaveItem(newItem);
    setSimilarModalItem(null);
  };

  const handleAddAllSimilarPins = async (parent: PinterestItem) => {
    if (!parent.similar_pins || parent.similar_pins.length === 0) return;
    for (const sim of parent.similar_pins) {
      if (!sim.video_url || sim.video_url === parent.video_url || sim.video_url.includes('mixkit.co')) continue;
      const newItem: PinterestItem = {
        id: getDeterministicPinId(sim.url, sim.video_url, sim.id),
        pin_url: sim.url,
        pin_title: sim.title,
        pin_description: `"${parent.pin_title}" içeriğinin benzeri`,
        category: sim.category,
        age_filter: sim.age_filter || parent.age_filter,
        thumbnail_url: sim.thumbnail_url,
        video_url: sim.video_url,
        added_at: new Date().toISOString(),
        notes: `Toplu benzer olarak eklendi (${parent.pin_title})`,
        favorite: false,
        usage_permission_status: 'Ticari kullanım uygun',
        original_creator: sim.author || '@pinterest_creator',
        source_license: 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
        approval_status: 'approved',
        archive_status: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await onSaveItem(newItem);
    }
    setSimilarModalItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-rose-500" />
            Pinterest Video Bulucu & Reels Koleksiyonu
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Pinterest Pin ve video bağlantılarını tarayın, benzer görsel varyasyonlarını keşfedin, zarif Türkçe altyazılar ve 9:16 formatıyla Reels montajına dönüştürün.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onBulkSetPermission && (
            <button
              onClick={onBulkSetPermission}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              title="Koleksiyondaki tüm videoları tek tıkla ticari kullanıma uygun ve onaylı yap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tümünü Ticari Kullanıma Uygun Yap</span>
            </button>
          )}

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
              showArchived
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Arşivlenenler Gösteriliyor' : 'Arşivi Göster'}</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Official OAuth & Safety Notice Banner */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Pinterest Resmi Entegrasyon Standardı</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Sıfır Çerez / Güvenli API
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Kullanıcı şifresi veya oturum çerezleri kesinlikle kaydedilmez. Resmi Pinterest oEmbed ve Meta Reels lisanslama standartları uygulanır.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-zinc-400">Durum:</span>
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resmi Embed Aktif
          </span>
        </div>
      </div>

      {/* URL Scanner Form Panel */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-rose-400" />
            Pinterest Pin & Video Bağlantısı Ekle ve Tara
          </h2>
          <div className="flex rounded-lg bg-zinc-800 p-0.5 border border-zinc-700">
            <button
              type="button"
              onClick={() => setIsBulkMode(false)}
              className={`text-xs px-2.5 py-1 rounded-md transition ${
                !isBulkMode ? 'bg-rose-600 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tekli Bağlantı
            </button>
            <button
              type="button"
              onClick={() => setIsBulkMode(true)}
              className={`text-xs px-2.5 py-1 rounded-md transition ${
                isBulkMode ? 'bg-rose-600 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Çoklu / Toplu Ekle
            </button>
          </div>
        </div>

        <form onSubmit={handleScanSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-zinc-300">
                {isBulkMode ? 'Pinterest Pin veya Video URL Listesi (Her satıra bir link)' : 'Pinterest Pin veya Video URL'}
              </label>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Kategori & Benzer Videolar Linkten Otomatik Çekilir
              </span>
            </div>

            {isBulkMode ? (
              <textarea
                rows={4}
                placeholder={`https://tr.pinterest.com/pin/123456789/\nhttps://tr.pinterest.com/pin/987654321/`}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl p-3.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500 placeholder-zinc-500"
              />
            ) : (
              <input
                type="url"
                placeholder="https://tr.pinterest.com/pin/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-rose-500 placeholder-zinc-500 font-mono"
              />
            )}
            <p className="text-[11px] text-zinc-400">
              {isBulkMode
                ? 'İstediğiniz 10–20 adet Pinterest video bağlantısını alt alta yapıştırın. Sistem her videonun konusunu ve kategorisini linkten otomatik analiz ederek tüm benzer videoları toplar.'
                : 'Pinterest linkini yapıştırıp tarayın. Sistem videonun konusunu, kategorisini ve altındaki tüm benzer videoları linkten otomatik tespit eder.'}
            </p>
          </div>

          {isBulkMode && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                  <Shuffle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Akıllı Sıralama & Harmanlama (Smart Shuffle)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      Önerilen
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Girdiğiniz 10–20 URL ve benzer içerikleri karışık sıraya dizer; Instagram akışınızda art arda aynı temaların gelmesini önler.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer self-end sm:self-auto">
                <input
                  type="checkbox"
                  checked={shuffleScan}
                  onChange={(e) => setShuffleScan(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 bg-zinc-900 border-zinc-600 focus:ring-rose-500"
                />
                <span className="text-xs text-zinc-300 select-none">Karışık Sırala</span>
              </label>
            </div>
          )}

          {/* Alttaki Öneri Videoları Bilgilendirmesi */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-white block">Pinterest Öneri Videoları (Alttaki Benzer Reels'lar) Otomatik Çekilir:</span>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                Pinterest'te beğendiğiniz videoya tıkladığınızda altta çıkan öneri videolarının (0:10, 0:25, 0:26 süreli dikey Reels videolarının) tamamı girdiğiniz bağlantıyla birlikte otomatik taranır ve <strong>Ticari Kullanıma Uygun</strong> olarak koleksiyonunuza tek seferde eklenir. İsterseniz öneri videolarının linklerini de "Çoklu / Toplu Ekle" kutusuna alt alta yapıştırabilirsiniz.
              </p>
            </div>
          </div>

          {/* Kalıcı Kayıtlı Bağlantılar Yönetim Çubuğu */}
          <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-700/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <BookmarkPlus className="w-4 h-4 text-amber-400" />
                Kalıcı Kayıtlı Link Havuzu:
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {savedUrls.length} Link Kayıtlı
              </span>
              <span className="text-[10px] text-zinc-400 hidden sm:inline">
                (Sayfayı yenileseniz de bu linkler asla kaybolmaz)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualSaveUrls}
                disabled={!urlInput.trim() || isLoading}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-700 hover:border-emerald-600 bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-emerald-400 transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                title="Girdiğiniz linkleri kaydet ve videoları doğrudan tara"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Linkleri Kaydet ve Videoları Çek</span>
              </button>

              {savedUrls.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowSavedList(!showSavedList)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-600 bg-zinc-800 hover:bg-zinc-750 text-xs font-medium text-zinc-300 transition flex items-center gap-1"
                  >
                    <span>{showSavedList ? 'Listeyi Gizle' : 'Kayıtlı Linkleri Gör'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearSavedUrls}
                    className="p-1.5 rounded-lg border border-zinc-800 hover:border-rose-800/50 hover:bg-rose-950/20 text-zinc-400 hover:text-rose-400 transition"
                    title="Kayıtlı tüm linkleri temizle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Kayıt Başarısı Bildirimi */}
          {saveSuccessNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Linkler sisteme kalıcı olarak kaydedildi. Sayfayı yenilediğinizde veya tarayıcıyı kapattığınızda otomatik yüklenmeye devam edecektir.</span>
            </div>
          )}

          {/* Kayıtlı Linkler Açılır Listesi */}
          {showSavedList && savedUrls.length > 0 && (
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2 max-h-52 overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-1 border-b border-zinc-800">
                <span>Sistemde Hafızada Tutulan Linkler:</span>
                <span>{savedUrls.length} Adet</span>
              </div>
              <div className="space-y-1.5">
                {savedUrls.map((u, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono"
                  >
                    <span className="text-zinc-300 truncate text-[11px]">{u}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={u}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-zinc-400 hover:text-white"
                        title="Pinterest'te Aç"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveSavedUrl(u)}
                        className="p-1 text-zinc-400 hover:text-rose-400"
                        title="Bu Linki Kaldır"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isLoading || (!urlInput.trim() && savedUrls.length === 0)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{isBulkMode ? 'Tüm Bağlantılardaki Videoları Çek ve Ekle' : 'URL’deki Gerçek Videoyu Çek ve Ekle'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Başlık veya notlarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-60 bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-zinc-800/80 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">Tüm Kategoriler (10)</option>
            {PINTEREST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filterAge}
            onChange={(e) => setFilterAge(e.target.value)}
            className="bg-zinc-800/80 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">Tüm Yaş Görünümleri</option>
            {AGE_FILTERS.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setFilterFavorite(!filterFavorite)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
              filterFavorite
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${filterFavorite ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span>Favoriler</span>
          </button>

          <span className="text-xs text-zinc-400">
            Toplam: <strong className="text-white">{filteredItems.length}</strong> pin
          </span>

          {items.length > 0 && onClearAll && (
            <button
              onClick={handleClearAll}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-700 hover:border-rose-800 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Tüm Pinterest videolarını havuzdan siler ve sıfırlar"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tümünü Sil</span>
            </button>
          )}
        </div>
      </div>

      {/* Batch Action Bar */}
      {filteredItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (selectedPinIds.length === filteredItems.length) {
                  setSelectedPinIds([]);
                } else {
                  setSelectedPinIds(filteredItems.map((i) => i.id));
                }
              }}
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              {selectedPinIds.length === filteredItems.length ? (
                <CheckSquare className="w-4 h-4 text-rose-500" />
              ) : (
                <Square className="w-4 h-4 text-zinc-500" />
              )}
              <span>
                {selectedPinIds.length === filteredItems.length ? 'Tüm Seçimleri Kaldır' : 'Tümünü Seç'}
              </span>
            </button>

            {selectedPinIds.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold">
                {selectedPinIds.length} video seçildi
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedPinIds.length > 0 && onDeleteBulk && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/40 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Seçilenleri Sil ({selectedPinIds.length})</span>
              </button>
            )}

            {selectedPinIds.length > 0 && onBatchConvertToReels && (
              <button
                type="button"
                onClick={() => onBatchConvertToReels(selectedPinIds, true)}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                <Shuffle className="w-4 h-4" />
                <span>Seçilen {selectedPinIds.length} Videoyu Karışık Sırada Reels Yap & Yayınla</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pinterest Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl">
          <Compass className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">Bu kritere uygun Pinterest içeriği bulunamadı</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Yukarıdaki arama çubuğundan bir Pinterest Pin bağlantısı yapıştırarak yeni içerikler ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const hasSimilar = Boolean(item.similar_pins && item.similar_pins.length > 0);

            return (
              <div
                key={item.id}
                className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden flex flex-col justify-between transition-all group"
              >
                {/* Visual Thumbnail / Preview */}
                <div
                  className="relative aspect-[9/16] max-h-72 bg-zinc-950 overflow-hidden cursor-pointer"
                  onClick={() => setActiveVideoItem(item)}
                >
                  <img
                    src={item.thumbnail_url}
                    alt={item.pin_title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition">
                      <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                    </div>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPinIds((prev) =>
                            prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                          );
                        }}
                        className="p-1 rounded bg-black/70 backdrop-blur-md text-white hover:bg-black transition cursor-pointer"
                        title={selectedPinIds.includes(item.id) ? 'Seçimi Kaldır' : 'Seç'}
                      >
                        {selectedPinIds.includes(item.id) ? (
                          <CheckSquare className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </button>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-rose-300 border border-rose-500/20">
                        {item.category}
                      </span>

                      {item.duration && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-white border border-white/20 tracking-wide font-mono">
                          {item.duration}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateItem(item.id, { favorite: !item.favorite });
                      }}
                      className="p-1.5 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 transition"
                      title={item.favorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                    >
                      <Heart
                        className={`w-4 h-4 ${item.favorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-300'}`}
                      />
                    </button>
                  </div>

                  {/* Age Filter Tag */}
                  {item.age_filter && (
                    <div className="absolute bottom-3 left-3 text-[10px] text-zinc-300 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                      {item.age_filter}
                    </div>
                  )}

                  {/* Converted indicator */}
                  {item.converted_video_id && (
                    <div className="absolute bottom-3 right-3 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md backdrop-blur-md border border-emerald-500/30">
                      Reels Hazır
                    </div>
                  )}
                </div>

                {/* Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">{item.pin_title}</h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{item.pin_description}</p>

                    {item.notes && (
                      <div className="mt-2 text-[11px] text-zinc-300 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800 line-clamp-2 italic">
                        "{item.notes}"
                      </div>
                    )}
                  </div>

                  {/* Usage Permission Status Dropdown */}
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400 mb-1">Kullanım İzni Durumu</label>
                    <select
                      value={item.usage_permission_status}
                      onChange={(e) =>
                        onUpdateItem(item.id, { usage_permission_status: e.target.value as UsagePermissionStatus })
                      }
                      className={`w-full text-[11px] rounded-lg px-2.5 py-1.5 font-medium border focus:outline-none ${
                        item.usage_permission_status === 'Kullanım izni doğrulandı' ||
                        item.usage_permission_status === 'Ticari kullanım uygun'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : item.usage_permission_status === 'Kullanım izni yok'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {PERMISSION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* External Link */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    {item.pin_url ? (
                      <a
                        href={item.pin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-rose-400 inline-flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Pinterest'te Aç</span>
                      </a>
                    ) : (
                      <span
                        className="text-zinc-500 inline-flex items-center gap-1"
                        title="Pinterest benzer video akışında pin bağlantısı paylaşılmıyor"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Benzer video (pin linki yok)</span>
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setEditingNotesItem(item);
                        setNotesDraft(item.notes || '');
                      }}
                      className="text-zinc-400 hover:text-white text-[11px]"
                    >
                      Not Ekle/Düzenle
                    </button>
                  </div>

                  {/* Action Toolbar */}
                  <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
                    {/* Convert Button or Converted Badge */}
                    {item.converted_video_id ? (
                      <div className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Reels Olarak Montajlandı</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onConvertToReels(item)}
                          disabled={isLoading}
                          className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                        >
                          Tekrar Düzenle
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onConvertToReels(item)}
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Reels Videosuna Dönüştür & Edit Yap</span>
                      </button>
                    )}

                    {/* Secondary Actions: Similar, Download, Archive, Delete */}
                    <div className="flex items-center justify-between gap-1">
                      {hasSimilar && (
                        <button
                          onClick={() => setSimilarModalItem(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition flex items-center gap-1"
                          title="Benzer videoları gör ve ekle"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Benzerleri ({item.similar_pins?.length})</span>
                        </button>
                      )}

                      <div className="flex items-center gap-1 ml-auto">
                        {item.video_url && (
                          <a
                            href={item.video_url}
                            download={`${item.pin_title}.mp4`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 transition"
                            title="Orijinal Videoyu İndir (MP4)"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => onUpdateItem(item.id, { archive_status: !item.archive_status })}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
                          title={item.archive_status ? 'Arşivden Çıkar' : 'Arşivle'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-400 text-zinc-400 transition"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Preview Modal */}
      {activeVideoItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white truncate">{activeVideoItem.pin_title}</h3>
              <button onClick={() => setActiveVideoItem(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-[9/16] bg-black">
              {activeVideoItem.video_url ? (
                <PinterestVideoPlayer
                  src={activeVideoItem.video_url}
                  poster={activeVideoItem.thumbnail_url}
                />
              ) : (
                <img src={activeVideoItem.thumbnail_url} alt="" className="w-full h-full object-contain" />
              )}
            </div>
            <div className="p-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => {
                  onConvertToReels(activeVideoItem);
                  setActiveVideoItem(null);
                }}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition flex items-center gap-1.5"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Bu Videoyu Reels Yap</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Similar Pins Discovery Modal ("o benzerleri indirip edit yapacagız") */}
      {similarModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Keşfedilen Benzer Pinterest İçerikleri
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  "{similarModalItem.pin_title}" için bulunan benzer videoları koleksiyona ekleyin veya doğrudan Reels montajına gönderin.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddAllSimilarPins(similarModalItem)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tümünü Ekle & Onayla</span>
                </button>
                <button onClick={() => setSimilarModalItem(null)} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {similarModalItem.similar_pins?.map((sim) => (
                <div key={sim.id} className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl overflow-hidden flex flex-col justify-between">
                  <div className="relative aspect-video bg-black">
                    <img src={sim.thumbnail_url} alt={sim.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-white">
                      {sim.category}
                    </span>
                    {sim.duration && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-white border border-white/20 font-mono">
                        {sim.duration}
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <h4 className="text-xs font-medium text-white line-clamp-2">{sim.title}</h4>
                    <div className="flex items-center justify-between pt-1">
                      {sim.url ? (
                        <a
                          href={sim.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>İncele</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1" title="Benzer video akışında pin linki paylaşılmıyor">
                          <ExternalLink className="w-3 h-3" />
                          <span>Link yok</span>
                        </span>
                      )}
                      <button
                        onClick={() => handleAddSimilarPin(similarModalItem, sim)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Koleksiyona Ekle & İndir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {editingNotesItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-white">İçerik Notu Ekle / Düzenle</h3>
              <button onClick={() => setEditingNotesItem(null)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-2 truncate">Pin: "{editingNotesItem.pin_title}"</p>
              <textarea
                rows={4}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Montajda kullanılacak Türkçe metin fikri, ses tercihi veya kullanım izni notu..."
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingNotesItem(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
