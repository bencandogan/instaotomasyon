'use client';

import React, { useState, useRef } from 'react';
import {
  ImagePlus,
  Save,
  Send,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  AlertCircle,
  Calendar,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { StoryAutomationSettings, StoryPublishItem, InstagramAccount } from '@/types';

interface StoryAutomationProps {
  settings: StoryAutomationSettings;
  history: StoryPublishItem[];
  accounts: InstagramAccount[];
  activeAccount: InstagramAccount | null;
  onSaveSettings: (settings: Partial<StoryAutomationSettings>, accountId?: string) => Promise<void>;
  onPublishNow: (data: { imageUrl: string; storyLink: string; linkText: string; accountId?: string }) => Promise<void>;
  onUploadImage: (base64: string, filename: string) => Promise<string>;
  isLoading: boolean;
}

export function StoryAutomationView({
  settings,
  history,
  accounts,
  activeAccount,
  onSaveSettings,
  onPublishNow,
  onUploadImage,
  isLoading,
}: StoryAutomationProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    activeAccount?.id || (accounts[0]?.id ?? '')
  );

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || activeAccount;

  // Form State
  const [isEnabled, setIsEnabled] = useState(settings.isEnabled);
  const [dailyPublishTime, setDailyPublishTime] = useState(settings.dailyPublishTime || '14:00');
  const [storyImageUrl, setStoryImageUrl] = useState(
    settings.storyImageUrl || 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1080&h=1920&fit=crop&q=80'
  );
  const [storyLink, setStoryLink] = useState(
    settings.storyLink || 'https://play.google.com/store/apps/details?id=com.evlilikilanlari.app'
  );
  const [linkText, setLinkText] = useState(settings.linkText || 'Uygulamayı İndir 📲');
  const [showLinkSticker, setShowLinkSticker] = useState(settings.showLinkSticker ?? true);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const uploadedUrl = await onUploadImage(base64, file.name);
        setStoryImageUrl(uploadedUrl);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(
      {
        isEnabled,
        dailyPublishTime,
        storyImageUrl,
        storyLink,
        linkText,
        showLinkSticker,
      },
      selectedAccountId
    );
  };

  const handleDirectPublish = async () => {
    if (!storyImageUrl) {
      alert('Lütfen önce bir Story görseli belirleyin veya yükleyin.');
      return;
    }
    if (!confirm(`"${currentAccount?.instagramUsername || '@hesap'}" için Instagram Story anında paylaşılsın mı?`)) return;

    await onPublishNow({
      imageUrl: storyImageUrl,
      storyLink,
      linkText,
      accountId: selectedAccountId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ImagePlus className="w-6 h-6 text-rose-500" />
            Otomatik Instagram Story (Hikaye) Yayınlayıcı
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Kendi yükleyeceğiniz görselle, 24 saatte 1 kez belirlediğiniz saatte otomatik Story yayınlayın; bağlantı ve çıkartma butonunu ekleyin.
          </p>
        </div>

        {/* Account Selector */}
        {accounts.length > 0 && (
          <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl">
            <InstagramIcon className="w-4 h-4 text-pink-400 ml-2" />
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none pr-3 py-1 cursor-pointer"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-zinc-900 text-white">
                  {acc.name} ({acc.instagramUsername})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Grid: Form on Left, Phone Mockup on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Settings & Upload (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">24 Saatte 1 Otomatik Story Paylaşımı</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Aktif olduğunda her 24 saatte bir belirlediğiniz saatte hikayeniz otomatik paylaşılır.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {/* Daily Time & Account info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  Günlük Paylaşım Saati (24 Saatte Bir)
                </label>
                <input
                  type="time"
                  value={dailyPublishTime}
                  onChange={(e) => setDailyPublishTime(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">Örn: Her gün saat 14:00'te otomatik hikaye atar</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                  Hedef Instagram Hesabı
                </label>
                <div className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 flex items-center justify-between">
                  <span>{currentAccount?.instagramUsername || '@evlilik_ilanlari'}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Image Uploader */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-rose-400" />
                  Story Görseli (9:16 Dikey)
                </span>
                <span className="text-[11px] text-zinc-500">1080x1920 önerilir</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  placeholder="Görsel URL adresi veya dosya yükleyin..."
                  value={storyImageUrl}
                  onChange={(e) => setStoryImageUrl(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full sm:w-auto flex-shrink-0 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white border border-zinc-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Yükleniyor...' : 'Görsel Seç & Yükle'}</span>
                </button>
              </div>
            </div>

            {/* Target Link & Sticker */}
            <div className="space-y-4 pt-2 border-t border-zinc-800/80">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                  Hikaye Bağlantısı (Link)
                </label>
                <input
                  type="url"
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  value={storyLink}
                  onChange={(e) => setStoryLink(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Kullanıcıların yönlendirileceği Google Play, web sitesi veya referans linki
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Çıkartma Buton Metni (Link Sticker Text)
                  </label>
                  <input
                    type="text"
                    placeholder="Uygulamayı İndir 📲"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/60 self-end">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-medium text-white block">Görsel Çıkartma Rozeti</span>
                      <span className="text-[10px] text-zinc-400">Görsel üstüne link sticker bas</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showLinkSticker}
                    onChange={(e) => setShowLinkSticker(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 bg-zinc-900 border-zinc-700 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Information Notice */}
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] leading-relaxed">
                <strong>Meta Graph API Hikaye Standardı:</strong> Hikayeniz 24 saatte bir otomatik olarak Instagram hesabınızda yayınlanır. Belirlediğiniz link ve buton rozeti, Instagram'ın resmi çıkartma tasarımında görselin üzerine estetik olarak yerleştirilir ve profildeki indirme linkine yönlendirir.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleDirectPublish}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Şimdi Story Paylaş (Test Et)</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/50 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Otomasyon Ayarlarını Kaydet</span>
              </button>
            </div>
          </form>

          {/* Story History Table */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-400" />
              Hikaye Yayın Geçmişi ({history.length})
            </h3>

            {history.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
                Henüz yayınlanmış bir hikaye bulunmuyor. "Şimdi Story Paylaş" butonuna basarak ilk hikayenizi gönderebilirsiniz.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 text-[11px]">
                      <th className="pb-2 font-medium">Görsel</th>
                      <th className="pb-2 font-medium">Hesap</th>
                      <th className="pb-2 font-medium">Bağlantı & Çıkartma</th>
                      <th className="pb-2 font-medium">Tarih</th>
                      <th className="pb-2 font-medium text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-800/30">
                        <td className="py-2.5">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-9 h-14 object-cover rounded-md border border-zinc-700"
                          />
                        </td>
                        <td className="py-2.5 font-medium text-white">{item.accountUsername}</td>
                        <td className="py-2.5">
                          <div className="max-w-[200px] truncate text-zinc-300 font-mono text-[11px]">
                            {item.storyLink}
                          </div>
                          <span className="text-[10px] text-zinc-500">{item.linkText}</span>
                        </td>
                        <td className="py-2.5 text-zinc-400 text-[11px]">
                          {new Date(item.publishedAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Yayınlandı
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Instagram Story Phone Mockup (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-6 w-full max-w-[320px]">
            <div className="text-center mb-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-rose-500" />
                Canlı Instagram Story Önizleme
              </span>
            </div>

            {/* Phone Bezel */}
            <div className="relative aspect-[9/16] w-full rounded-[38px] border-[6px] border-zinc-800 bg-black overflow-hidden shadow-2xl flex flex-col justify-between">
              {/* Story Background Image */}
              <img
                src={storyImageUrl}
                alt="Story Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Instagram Story Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none" />

              {/* Instagram Story Top Header */}
              <div className="relative z-10 p-3 pt-3.5 flex flex-col gap-1.5">
                {/* Progress bar line */}
                <div className="w-full h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-white rounded-full animate-pulse" />
                </div>

                <div className="flex items-center justify-between text-white text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden flex items-center justify-center text-[10px] font-bold">
                        💍
                      </div>
                    </div>
                    <span className="font-semibold text-[11px] drop-shadow">
                      {(currentAccount?.instagramUsername || '@evlilik_ilanlari').replace('@', '')}
                    </span>
                    <span className="text-[10px] text-white/70 drop-shadow">1s</span>
                  </div>

                  <div className="text-white/80 font-bold text-xs tracking-widest drop-shadow">···</div>
                </div>
              </div>

              {/* Center: Instagram Link Sticker Widget */}
              {showLinkSticker && (
                <div className="relative z-10 flex flex-col items-center justify-center p-4">
                  <div className="px-4 py-2.5 rounded-full bg-white/95 text-black shadow-2xl border border-white/50 backdrop-blur-md flex items-center gap-2 hover:scale-105 transition cursor-pointer transform -rotate-2">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                    <span className="text-xs font-bold tracking-tight">
                      {linkText || 'Uygulamayı İndir 📲'}
                    </span>
                  </div>

                  <span className="text-[9px] text-white/80 mt-1.5 drop-shadow font-mono">
                    {new URL(storyLink.startsWith('http') ? storyLink : 'https://' + storyLink).hostname}
                  </span>
                </div>
              )}

              {/* Instagram Story Bottom Controls Bar */}
              <div className="relative z-10 p-3 flex items-center justify-between gap-3 text-white">
                <div className="flex-1 rounded-full border border-white/40 bg-white/10 backdrop-blur-md px-3.5 py-1.5 text-[11px] text-white/80">
                  Mesaj gönder...
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-lg">🤍</span>
                  <span className="text-base">✈️</span>
                </div>
              </div>
            </div>

            {/* Footer hint */}
            <p className="text-[11px] text-zinc-500 text-center mt-2">
              9:16 oranında tam ekran hikaye önizlemesi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
