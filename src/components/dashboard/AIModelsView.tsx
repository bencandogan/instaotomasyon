'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Save,
  CheckCircle2,
  DollarSign,
  Plus,
  Sliders,
  Sparkles,
  Layers
} from 'lucide-react';
import { AISettings, FalModelConfig } from '@/types';

interface AIModelsProps {
  settings: AISettings;
  onSaveSettings: (settings: Partial<AISettings>) => Promise<void>;
  isLoading: boolean;
}

export function AIModelsView({ settings, onSaveSettings, isLoading }: AIModelsProps) {
  const [models, setModels] = useState<FalModelConfig[]>(settings.falModels || []);
  const [selectedModelId, setSelectedModelId] = useState(settings.selectedFalModelId);
  const [openaiModel, setOpenaiModel] = useState(
    settings.openaiModel === 'gpt-4o' ? 'gpt-4o-mini' : (settings.openaiModel || 'gpt-4o-mini')
  );
  const [systemPromptBase, setSystemPromptBase] = useState(settings.systemPromptBase || '');
  const [editingModel, setEditingModel] = useState<FalModelConfig | null>(null);

  const handleSelectDefault = async (id: string) => {
    setSelectedModelId(id);
    const updatedModels = models.map((m) => ({ ...m, isDefault: m.id === id }));
    setModels(updatedModels);
    await onSaveSettings({ selectedFalModelId: id, falModels: updatedModels });
  };

  const handleToggleModelActive = async (id: string) => {
    const updated = models.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m));
    setModels(updated);
    await onSaveSettings({ falModels: updated });
  };

  const handleSaveModelModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel) return;
    const updated = models.map((m) => (m.id === editingModel.id ? editingModel : m));
    setModels(updated);
    await onSaveSettings({ falModels: updated });
    setEditingModel(null);
  };

  const handleSaveSystemPrompt = async () => {
    await onSaveSettings({
      openaiModel,
      systemPromptBase,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            AI Video ve Dil Modelleri Ayarları
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            fal.ai video modelleri, saniye başı dinamik tarifeler, çözünürlük limitleri ve OpenAI ana sistem promptu.
          </p>
        </div>
      </div>

      {/* fal.ai Video Models Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          fal.ai Video Üretim Modelleri Havuzu
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((m) => {
            const isDefault = m.id === selectedModelId;
            return (
              <div
                key={m.id}
                className={`bg-zinc-900/80 border rounded-2xl p-5 space-y-4 transition ${
                  isDefault ? 'border-cyan-500/50 bg-cyan-950/10' : 'border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{m.name}</h3>
                      {isDefault && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-zinc-500 mt-0.5">{m.modelId}</p>
                  </div>

                  <button
                    onClick={() => handleToggleModelActive(m.id)}
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium border transition ${
                      m.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {m.isActive ? 'Aktif' : 'Pasif'}
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{m.description}</p>

                <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Fiyat/sn</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ${m.costPerSecondUsd.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Çözünürlük</span>
                    <span className="text-xs font-mono font-bold text-zinc-200">{m.maxResolution}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Format</span>
                    <span className="text-xs font-mono font-bold text-zinc-200">{m.aspectRatio}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => setEditingModel(m)}
                    className="text-xs text-zinc-400 hover:text-white font-medium transition"
                  >
                    Tarife & Bilgileri Düzenle
                  </button>

                  {!isDefault && (
                    <button
                      onClick={() => handleSelectDefault(m.id)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition"
                    >
                      Varsayılan Yap
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OpenAI Dil Modeli & Sistem Promptu */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-500" />
          OpenAI Metin ve Senaryo Motoru Ayarları
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Model Seçimi</label>
            <select
              value={openaiModel}
              onChange={(e) => setOpenaiModel(e.target.value)}
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
            >
              <option value="gpt-4o">GPT-4o (En Yüksek Yaratıcılık & Akıcılık)</option>
              <option value="gpt-4o-mini">GPT-4o-mini (Ultra Hızlı & Ekonomik)</option>
              <option value="o1-mini">o1-mini (Mantık & Derin Senaryo)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Marka Karakteri ve Temel Sistem Promptu</label>
            <textarea
              rows={4}
              value={systemPromptBase}
              onChange={(e) => setSystemPromptBase(e.target.value)}
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveSystemPrompt}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>OpenAI Ayarlarını Kaydet</span>
          </button>
        </div>
      </div>

      {/* Edit Model Modal */}
      {editingModel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white">fal.ai Model Tarifesi Düzenle</h3>
            <form onSubmit={handleSaveModelModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Model Adı</label>
                <input
                  type="text"
                  value={editingModel.name}
                  onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Model ID (fal.ai endpoint)</label>
                <input
                  type="text"
                  value={editingModel.modelId}
                  onChange={(e) => setEditingModel({ ...editingModel, modelId: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Saniye Başı Ücret ($ USD/sn)</label>
                <input
                  type="number"
                  step="0.001"
                  value={editingModel.costPerSecondUsd}
                  onChange={(e) => setEditingModel({ ...editingModel, costPerSecondUsd: parseFloat(e.target.value) || 0.05 })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Maksimum Çözünürlük</label>
                <input
                  type="text"
                  value={editingModel.maxResolution}
                  onChange={(e) => setEditingModel({ ...editingModel, maxResolution: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingModel(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-medium flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
