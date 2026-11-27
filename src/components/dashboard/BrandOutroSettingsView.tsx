'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Save,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Image as ImageIcon,
  Smartphone,
  ExternalLink,
  Sliders,
  Eye,
  Film,
  DownloadCloud,
  Check,
  Shuffle,
  Tag,
  MessageSquareQuote,
  ChevronDown,
  Info
} from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import {
  BrandOutroSettings,
  OutroAnimationType,
  OutroBackgroundType,
  AdPlacementStrategy,
  InstagramAccount
} from '@/types';

interface BrandOutroSettingsProps {
  settings: BrandOutroSettings;
  accounts: InstagramAccount[];
  activeAccount: InstagramAccount | null;
  onSaveSettings: (settings: Partial<BrandOutroSettings>, accountId?: string) => Promise<void>;
  isLoading: boolean;
}

export function BrandOutroSettingsView({
  settings,
  accounts,
  activeAccount,
  onSaveSettings,
  isLoading,
}: BrandOutroSettingsProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    activeAccount?.id || accounts[0]?.id || ''
  );
  const [formData, setFormData] = useState<BrandOutroSettings>({ ...settings });
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewStage, setPreviewStage] = useState<'content' | 'outro'>('outro');
  const [storyHooksInput, setStoryHooksInput] = useState<string>(
    (settings.storyHookTexts || []).join('\n')
  );

  // When selected account changes, load that account's specific brand config
  useEffect(() => {
    const acc = accounts.find((a) => a.id === selectedAccountId);
    if (acc && acc.brandSettings) {
      setFormData({ ...acc.brandSettings, selectedAccountId: acc.id });
      setStoryHooksInput((acc.brandSettings.storyHookTexts || []).join('\n'));
    } else if (acc) {
      setFormData({
        ...settings,
        selectedAccountId: acc.id,
        brandName: acc.name,
      });
      setStoryHooksInput((settings.storyHookTexts || []).join('\n'));
    }
  }, [selectedAccountId, accounts]);

  const handleTogglePreview = () => {
    setIsPlayingPreview(true);
    setPreviewStage('content');

    // Simulate Part 1 (Content) with In-Video Badge / Story Hook
    setTimeout(() => {
      if (formData.adPlacementStrategy === 'in_video_badge' || formData.adPlacementStrategy === 'story_hook') {
        setIsPlayingPreview(false);
      } else {
        setPreviewStage('outro');
        setTimeout(() => {
          setIsPlayingPreview(false);
        }, formData.durationSeconds * 1000);
      }
    }, 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hooksArray = storyHooksInput
      .split('\n')
      .map((h) => h.trim())
      .filter((h) => h.length > 3);

    const payload: Partial<BrandOutroSettings> = {
      ...formData,
      storyHookTexts: hooksArray,
      selectedAccountId,
    };

    await onSaveSettings(payload, selectedAccountId);
  };

  // Background styling mapping
  const getBackgroundStyle = () => {
    switch (formData.backgroundType) {
      case 'romantic_pink':
        return 'bg-gradient-to-b from-rose-950 via-pink-900 to-black';
      case 'sleek_black':
        return 'bg-gradient-to-b from-zinc-900 via-black to-zinc-950';
      case 'custom_image':
        return formData.customBackgroundUrl
          ? `bg-cover bg-center`
          : 'bg-gradient-to-b from-purple-950 via-slate-900 to-black';
      case 'dark_gradient':
      default:
        return 'bg-gradient-to-b from-slate-950 via-purple-950/70 to-black';
    }
  };

  // Animation CSS mapping
  const getAnimationClass = () => {
    if (!isPlayingPreview && previewStage !== 'outro') return '';
    switch (formData.animationType) {
      case 'zoom':
        return 'animate-in zoom-in-90 duration-700 ease-out';
      case 'slide_up':
        return 'animate-in slide-in-from-bottom-12 duration-600 ease-out';
      case 'glow':
        return 'animate-in fade-in duration-500 shadow-2xl shadow-rose-500/40';
      case 'fade':
      default:
        return 'animate-in fade-in duration-700 ease-in-out';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-rose-500" />
              Marka Reklam Sonu & Akıllı Yerleşim Ayarları
            </h1>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                formData.isEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {formData.isEnabled ? 'Aktif' : 'Devre Dışı'}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            İzlenme oranını düşürmeyen akıllı yerleşimler: Video içi organik hikaye kancaları, zarif alt logo rozeti ve yumuşak reklam kapanış sahnesi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Ayarları Kaydet</span>
          </button>
        </div>
      </div>

      {/* Account Selector Bar: Per-Account Customization */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0">
            <InstagramIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Yapılandırılan Instagram Hesabı</span>
            <p className="text-[11px] text-zinc-400">
              Her hesabınız için farklı marka ismi, farklı logo veya farklı reklam stratejisi tanımlayabilirsiniz.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full sm:w-64 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-pink-500"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.instagramUsername})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Strategic Insight Alert: Why Not Just End Screens? */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-amber-300 font-semibold block mb-0.5">
            Algoritma & İzlenme İpucu: Neden Hep Sona Reklam Koymuyoruz?
          </strong>
          Her videonun sonuna 4 saniye sabit reklam ekranı koymak, izleyicinin videoyu sonuna kadar izlemeden kaydırmasına (swipe-away) neden olabilir.
          Aşağıdaki <strong>"Akıllı Karma Dağıtım (Hibrit)"</strong> modu sayesinde sistem bazı videolarda <em>"Evlilik İlanları uygulamasından biriyle tanıştım o bana hayat verdi"</em> gibi doğal hikaye metinleri, bazılarında video içi zarif logo rozeti, bazılarında ise reklam sonu ekleyerek izlenme oranını maksimize eder.
        </div>
      </div>

      {/* Main Configuration Grid: Settings on Left, Live 9:16 Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Settings (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {/* Placement Strategy Selector (Cards) */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Sparkles className="w-4 h-4 text-rose-400" />
              1. Reklam & Marka Yerleşim Stratejisi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Hybrid Mix */}
              <div
                onClick={() => setFormData({ ...formData, adPlacementStrategy: 'hybrid_mix' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  formData.adPlacementStrategy === 'hybrid_mix'
                    ? 'bg-rose-950/30 border-rose-500 ring-1 ring-rose-500/40 text-white'
                    : 'bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600 text-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-rose-400">
                      <Shuffle className="w-4 h-4" /> Akıllı Karma (Hibrit)
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                      Önerilen
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Videolar arasında dönüşümlü dağıtır: Kimi videoda doğal hikaye kancası, kiminde alt rozet, kiminde reklam sonu.
                  </p>
                </div>
              </div>

              {/* Option 2: In-Video Badge */}
              <div
                onClick={() => setFormData({ ...formData, adPlacementStrategy: 'in_video_badge' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  formData.adPlacementStrategy === 'in_video_badge'
                    ? 'bg-rose-950/30 border-rose-500 ring-1 ring-rose-500/40 text-white'
                    : 'bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600 text-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-pink-400">
                      <Tag className="w-4 h-4" /> Video İçi Alt Rozet
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Videonun alt ortasında hafif yarı-saydam zarif logo ve marka rozeti. Video akışını ve izlenme süresini bölmez.
                  </p>
                </div>
              </div>

              {/* Option 3: Story Hook */}
              <div
                onClick={() => setFormData({ ...formData, adPlacementStrategy: 'story_hook' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  formData.adPlacementStrategy === 'story_hook'
                    ? 'bg-rose-950/30 border-rose-500 ring-1 ring-rose-500/40 text-white'
                    : 'bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600 text-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-amber-400">
                      <MessageSquareQuote className="w-4 h-4" /> Doğal Hikaye Kancası
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Doğal deneyim metni ("Evlilik İlanları'ndan biriyle tanıştım..."). İzleyici reklam olduğunu hissetmeden merak eder.
                  </p>
                </div>
              </div>

              {/* Option 4: Outro Only */}
              <div
                onClick={() => setFormData({ ...formData, adPlacementStrategy: 'outro_only' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  formData.adPlacementStrategy === 'outro_only'
                    ? 'bg-rose-950/30 border-rose-500 ring-1 ring-rose-500/40 text-white'
                    : 'bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600 text-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-purple-400">
                      <Film className="w-4 h-4" /> Standart Reklam Sonu
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Ana videonun ardından 3–5 saniye ayrı kurumsal logo ve indirme sahnesi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Video İçi Alt Rozet Ayarları */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Tag className="w-4 h-4 text-pink-400" />
              2. Video İçi Logo ve Alt Rozet Metni
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Alt Rozet Metni</label>
                <input
                  type="text"
                  value={formData.inVideoBadgeText || '💍 Evlilik İlanları Uygulaması'}
                  onChange={(e) => setFormData({ ...formData, inVideoBadgeText: e.target.value })}
                  placeholder="💍 Evlilik İlanları Uygulaması"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="showInVideoLogo"
                  checked={formData.showInVideoLogo ?? true}
                  onChange={(e) => setFormData({ ...formData, showInVideoLogo: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 bg-zinc-800 border-zinc-700"
                />
                <label htmlFor="showInVideoLogo" className="text-xs text-zinc-300 cursor-pointer">
                  Rozette uygulama logosunu da göster
                </label>
              </div>
            </div>
          </div>

          {/* Doğal Hikaye Metinleri (Viral Hooks) */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <MessageSquareQuote className="w-4 h-4 text-amber-400" />
              3. Doğal Hikaye ve Deneyim Kancaları (Her satıra bir metin)
            </h3>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Video Üzerine Gelecek Merak Uyandırıcı Cümleler
              </label>
              <textarea
                rows={4}
                value={storyHooksInput}
                onChange={(e) => setStoryHooksInput(e.target.value)}
                placeholder="Evlilik İlanları uygulamasından biriyle tanıştım o bana hayat verdi..."
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Sistem video üretirken bu kancaları sırayla veya karışık olarak kullanarak organik merak uyandırır.
              </span>
            </div>
          </div>

          {/* Reklam Sonu Sahnesi ve Tipografi */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Sliders className="w-4 h-4 text-rose-400" />
              4. Reklam Sonu Kapanış Sahnesi (Logo, Slogan & Bağlantılar)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Marka İsmi</label>
                <input
                  type="text"
                  required
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="Evlilik İlanları Türkiye"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Slogan</label>
                <input
                  type="text"
                  required
                  value={formData.slogan}
                  onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                  placeholder="Yeni başlangıçlara ilk adımını at."
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Eylem Çağrısı (CTA Buton)</label>
                <input
                  type="text"
                  required
                  value={formData.callToAction}
                  onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
                  placeholder="Şimdi keşfet."
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold text-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Profil Yönlendirme Çağrısı</label>
                <input
                  type="text"
                  value={formData.profileLinkPrompt}
                  onChange={(e) => setFormData({ ...formData, profileLinkPrompt: e.target.value })}
                  placeholder="Profildeki linkten hemen indir 📲"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Google Play Bağlantısı</label>
                <input
                  type="url"
                  value={formData.googlePlayUrl}
                  onChange={(e) => setFormData({ ...formData, googlePlayUrl: e.target.value })}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Reklam Süresi</label>
                <select
                  value={formData.durationSeconds}
                  onChange={(e) => setFormData({ ...formData, durationSeconds: parseInt(e.target.value) || 4 })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value={3}>3 Saniye (Hızlı Kapanış)</option>
                  <option value={4}>4 Saniye (Önerilen)</option>
                  <option value={5}>5 Saniye (Vurgulu)</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Right Preview: Live 9:16 Interactive Device Mockup (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center sticky top-6">
          <div className="w-full max-w-[340px] space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-rose-400" />
                Canlı Reels 9:16 Görünümü
              </span>
              <button
                type="button"
                onClick={handleTogglePreview}
                disabled={isPlayingPreview}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>{isPlayingPreview ? 'Oynatılıyor...' : 'Simülasyonu İzle'}</span>
              </button>
            </div>

            {/* 9:16 Phone Frame */}
            <div className="relative aspect-[9/16] w-full rounded-[36px] bg-black border-4 border-zinc-800 shadow-2xl overflow-hidden flex flex-col justify-between select-none">
              {/* Phone Speaker Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-900 rounded-full z-30" />

              {/* Stage: Content with In-Video Elements OR Outro */}
              {previewStage === 'content' || formData.adPlacementStrategy === 'in_video_badge' || formData.adPlacementStrategy === 'story_hook' ? (
                // Part 1: Video Content with In-Video Badge & Story Hook
                <div className="relative w-full h-full bg-zinc-950 flex flex-col justify-between p-5 animate-in fade-in duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80"
                    alt="Content"
                    className="absolute inset-0 w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                  {/* Top Badge */}
                  <div className="relative z-10 pt-4 flex justify-between items-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md">
                      REELS İÇERİĞİ
                    </span>
                    <span className="text-[10px] font-mono text-zinc-300 bg-black/50 px-1.5 py-0.5 rounded">
                      0:08
                    </span>
                  </div>

                  {/* Organic Story Hook Overlay (If enabled) */}
                  {(formData.adPlacementStrategy === 'story_hook' ||
                    formData.adPlacementStrategy === 'hybrid_mix') && (
                    <div className="relative z-20 mx-auto max-w-[260px] text-center my-auto animate-in fade-in zoom-in-95 duration-500">
                      <div className="p-3 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 shadow-xl">
                        <p className="text-white text-xs font-bold leading-snug drop-shadow-md">
                          "{formData.storyHookTexts?.[0] || 'Evlilik İlanları uygulamasından biriyle tanıştım o bana hayat verdi...'}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* In-Video Bottom Badge (If enabled) */}
                  <div className="relative z-20 pb-4 space-y-2">
                    {(formData.adPlacementStrategy === 'in_video_badge' ||
                      formData.adPlacementStrategy === 'hybrid_mix') && (
                      <div className="flex justify-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold shadow-lg">
                          {formData.showInVideoLogo && (
                            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center text-[8px] font-black">
                              E
                            </div>
                          )}
                          <span>{formData.inVideoBadgeText || '💍 Evlilik İlanları Uygulaması'}</span>
                        </div>
                      </div>
                    )}

                    <div className="text-center text-[10px] text-zinc-400">
                      <span>{activeAccount?.name || 'Seçili Hesap'}</span> • <span>Takip Et</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Part 2: Brand Outro Screen
                <div
                  className={`relative w-full h-full ${getBackgroundStyle()} ${getAnimationClass()} flex flex-col justify-between p-6 text-center`}
                  style={
                    formData.backgroundType === 'custom_image' && formData.customBackgroundUrl
                      ? { backgroundImage: `url(${formData.customBackgroundUrl})` }
                      : {}
                  }
                >
                  {/* Outro Stage Badge */}
                  <div className="pt-4 flex justify-center">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-rose-400" /> MARKA KAPANIŞI ({formData.durationSeconds} sn)
                    </span>
                  </div>

                  {/* Main Brand Hero */}
                  <div className="flex flex-col items-center justify-center space-y-3 my-auto">
                    {/* App Logo */}
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-pink-600 p-0.5 shadow-2xl shadow-rose-950/60 flex items-center justify-center">
                      <img
                        src={formData.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover rounded-[22px]"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=300&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    {/* Brand Name */}
                    <h2 className="text-lg font-black text-white tracking-tight drop-shadow-md">
                      {formData.brandName}
                    </h2>

                    {/* Slogan */}
                    <p className="text-xs text-rose-200/90 font-medium px-4 leading-relaxed">
                      {formData.slogan}
                    </p>

                    {/* CTA Button */}
                    <div className="pt-2">
                      <div className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-xl shadow-rose-950/80 ring-2 ring-white/30 transform hover:scale-105 transition">
                        {formData.callToAction}
                      </div>
                    </div>
                  </div>

                  {/* Footer & Store Prompts */}
                  <div className="pb-4 space-y-2">
                    <div className="bg-black/40 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                      <p className="text-[11px] font-semibold text-white">
                        {formData.profileLinkPrompt}
                      </p>
                    </div>

                    {formData.showBadge && (
                      <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">Google Play</span>
                        <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">App Store</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 text-center">
              Seçilen yerleşim stratejisine göre FFmpeg montajında otomatik olarak uygulanır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
