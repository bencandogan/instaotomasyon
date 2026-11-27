'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Film,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Video,
  Clock,
  RefreshCw,
  Hash,
  Subtitles,
  FileText
} from 'lucide-react';
import { ContentCategory, ContentIdea, VideoCategoryType } from '@/types';

interface AIGeneratorProps {
  categories: ContentCategory[];
  ideas: ContentIdea[];
  onGenerateSingle: (categoryKey: VideoCategoryType, topic?: string) => Promise<ContentIdea | void>;
  onGenerateBatch: () => Promise<void>;
  onRenderVideo: (idea: ContentIdea, productionType: 'ai_video' | 'ffmpeg_motion') => Promise<void>;
  isLoading: boolean;
}

export function AIGeneratorView({
  categories,
  ideas,
  onGenerateSingle,
  onGenerateBatch,
  onRenderVideo,
  isLoading,
}: AIGeneratorProps) {
  const [selectedCategory, setSelectedCategory] = useState<VideoCategoryType>('romantic_cinematic');
  const [customTopic, setCustomTopic] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(ideas[0] || null);
  const [producingType, setProducingType] = useState<'ai_video' | 'ffmpeg_motion'>('ai_video');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newIdea = await onGenerateSingle(selectedCategory, customTopic || undefined);
    if (newIdea) {
      setSelectedIdea(newIdea);
      setCustomTopic('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-rose-500" />
            AI İçerik Üretim Motoru
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            OpenAI & prompt mühendisliği ile Evlilik İlanları için senaryo, zaman kodlu altyazı, hashtag ve 9:16 video promptu oluşturun.
          </p>
        </div>

        <button
          onClick={onGenerateBatch}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium shadow-lg shadow-rose-950/40 transition disabled:opacity-50 cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          <span>Günün 5 İçeriğini Toplu Üret</span>
        </button>
      </div>

      {/* Generator Form */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white mb-3">Özel veya Kategori Bazlı İçerik Hazırla</h2>
        <form onSubmit={handleSingleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">İçerik Kategorisi</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as VideoCategoryType)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Özel Konu / Tema (İsteğe Bağlı)</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Örn: Evlilikte güven inşası, ilk görüşme tavsiyeleri, nasip inancı..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="flex-1 bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 placeholder-zinc-500 transition"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium border border-zinc-700 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-rose-400" />}
                  <span>İçeriği Üret</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Main Split: Ideas List on Left, Detailed Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Idea Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">Üretilen İçerik Senaryoları ({ideas.length})</h3>
            <span className="text-xs text-zinc-500">Tekrar denetimli</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {ideas.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl">
                <p className="text-xs text-zinc-400">Henüz senaryo üretilmedi.</p>
              </div>
            ) : (
              ideas.map((idea) => {
                const isSelected = selectedIdea?.id === idea.id;
                return (
                  <div
                    key={idea.id}
                    onClick={() => setSelectedIdea(idea)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-rose-950/20 border-rose-500/50 shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                        {idea.categoryKey}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(idea.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-white mt-1.5 line-clamp-2">{idea.title}</h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{idea.scenario}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Idea Details & Action Panel (7 cols) */}
        <div className="lg:col-span-7">
          {selectedIdea ? (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {selectedIdea.categoryKey}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{selectedIdea.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(selectedIdea.caption, `cap-${selectedIdea.id}`)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition"
                    title="Açıklamayı Kopyala"
                  >
                    {copiedId === `cap-${selectedIdea.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Kopyala</span>
                  </button>
                </div>
              </div>

              {/* Scenario & Visual Prompt */}
              <div className="space-y-3">
                <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-800/80">
                  <p className="text-xs font-semibold text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-indigo-400" /> Senaryo & Sahne Anlatımı
                  </p>
                  <p className="text-sm text-zinc-200 leading-relaxed">{selectedIdea.scenario}</p>
                  <p className="text-xs text-zinc-400 mt-2 italic">{selectedIdea.sceneDescription}</p>
                </div>

                <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-800/80">
                  <p className="text-xs font-semibold text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> fal.ai Video Üretim Promptu (9:16)
                  </p>
                  <p className="text-xs font-mono text-zinc-300 bg-zinc-900 p-2 rounded-lg border border-zinc-800 break-words">
                    {selectedIdea.generationPrompt}
                  </p>
                </div>

                {/* Subtitles */}
                {selectedIdea.turkishSubtitles && selectedIdea.turkishSubtitles.length > 0 && (
                  <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-800/80">
                    <p className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
                      <Subtitles className="w-3.5 h-3.5 text-emerald-400" /> Zaman Kodlu Türkçe Altyazılar
                    </p>
                    <div className="space-y-1.5">
                      {selectedIdea.turkishSubtitles.map((sub, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                            {sub.start.toFixed(1)}s - {sub.end.toFixed(1)}s
                          </span>
                          <span className="text-zinc-200">"{sub.text}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instagram Caption & Hashtags */}
                <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-800/80">
                  <p className="text-xs font-semibold text-zinc-400 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-pink-400" /> Instagram Gönderi Açıklaması
                  </p>
                  <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">{selectedIdea.caption}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {selectedIdea.hashtags.map((tag, idx) => (
                      <span key={idx} className="text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Render Video */}
              <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-zinc-400">Üretim Motoru:</label>
                  <div className="flex rounded-lg bg-zinc-800 p-0.5 border border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setProducingType('ai_video')}
                      className={`text-xs px-2.5 py-1 rounded-md transition ${
                        producingType === 'ai_video' ? 'bg-rose-600 text-white font-medium' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      fal.ai Video (AI)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProducingType('ffmpeg_motion')}
                      className={`text-xs px-2.5 py-1 rounded-md transition ${
                        producingType === 'ffmpeg_motion' ? 'bg-rose-600 text-white font-medium' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      FFmpeg Motion (Ekonomik)
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => onRenderVideo(selectedIdea, producingType)}
                  disabled={isLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-950/40 transition cursor-pointer disabled:opacity-50"
                >
                  <Video className="w-4 h-4" />
                  <span>Bu Senaryodan Video Üret</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
              Detayları görmek için soldaki senaryolardan birini seçin veya yeni içerik üretin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
