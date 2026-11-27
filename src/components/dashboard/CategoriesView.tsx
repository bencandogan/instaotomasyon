'use client';

import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Save,
  CheckCircle2,
  XCircle,
  Music,
  FileText,
  Sliders
} from 'lucide-react';
import { ContentCategory, VideoCategoryType } from '@/types';

interface CategoriesViewProps {
  categories: ContentCategory[];
  onSaveCategory: (category: ContentCategory) => Promise<void>;
  isLoading: boolean;
}

export function CategoriesView({ categories, onSaveCategory, isLoading }: CategoriesViewProps) {
  const [editingCategory, setEditingCategory] = useState<ContentCategory | null>(null);

  const handleToggleActive = async (cat: ContentCategory) => {
    await onSaveCategory({ ...cat, isActive: !cat.isActive });
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    await onSaveCategory(editingCategory);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-purple-400" />
            İçerik Kategorileri ve Kılavuzlar
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Günde 5 farklı kategoriden üretilen Reels içeriklerinin prompt standartları, müzik ruh hali ve hedefleri.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`bg-zinc-900/80 border rounded-2xl p-5 flex flex-col justify-between transition ${
              cat.isActive ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-800/40 opacity-60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {cat.key}
                </span>
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition cursor-pointer ${
                    cat.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {cat.isActive ? 'Aktif' : 'Pasif'}
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{cat.name}</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{cat.description}</p>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex items-start gap-1.5 text-xs text-zinc-400">
                  <FileText className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2 italic">{cat.promptGuideline}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Music className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                  <span className="truncate">{cat.musicMood}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-medium">Günlük Hedef: {cat.targetDailyCount} video</span>
              <button
                onClick={() => setEditingCategory(cat)}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition"
              >
                <Sliders className="w-3 h-3" />
                <span>Düzenle</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Kategori Kılavuzunu Düzenle</h3>
            <form onSubmit={handleSaveModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Kategori Adı</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">fal.ai Prompt Kılavuzu (İngilizce)</label>
                <textarea
                  rows={3}
                  value={editingCategory.promptGuideline}
                  onChange={(e) => setEditingCategory({ ...editingCategory, promptGuideline: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Telif-Uyumlu Müzik Mood</label>
                <input
                  type="text"
                  value={editingCategory.musicMood}
                  onChange={(e) => setEditingCategory({ ...editingCategory, musicMood: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs text-white font-medium flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Değişiklikleri Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
