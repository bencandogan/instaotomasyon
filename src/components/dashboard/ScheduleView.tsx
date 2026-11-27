'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Info
} from 'lucide-react';
import { PublishQueueItem, PublishSlot } from '@/types';

interface ScheduleViewProps {
  queue: PublishQueueItem[];
  defaultSlots: PublishSlot[];
  onUpdateSlotTime: (id: string, newTime: string) => Promise<void>;
  onPublishQueueItem: (queueId: string, videoId: string) => Promise<void>;
  onDeleteQueueItem: (id: string) => Promise<void>;
  onSaveDefaultSlots: (slots: PublishSlot[]) => Promise<void>;
  isLoading: boolean;
}

export function ScheduleView({
  queue,
  defaultSlots,
  onUpdateSlotTime,
  onPublishQueueItem,
  onDeleteQueueItem,
  onSaveDefaultSlots,
  isLoading,
}: ScheduleViewProps) {
  const [slots, setSlots] = useState<PublishSlot[]>(defaultSlots);
  const [isEditingSlots, setIsEditingSlots] = useState(false);

  const handleSlotTimeChange = (index: number, newTime: string) => {
    const updated = [...slots];
    updated[index].time = newTime;
    setSlots(updated);
  };

  const handleSaveSlots = async () => {
    await onSaveDefaultSlots(slots);
    setIsEditingSlots(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-400" />
            Yayın Takvimi ve Zamanlama Kuyruğu
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Europe/Istanbul saat diliminde günlük 5 Reels yayın slotu (09:00, 12:00, 15:00, 18:00, 21:00).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditingSlots(!isEditingSlots)}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700 transition"
          >
            {isEditingSlots ? 'Vazgeç' : 'Varsayılan Saatleri Düzenle'}
          </button>
          {isEditingSlots && (
            <button
              onClick={handleSaveSlots}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition disabled:opacity-50"
            >
              Saatleri Kaydet
            </button>
          )}
        </div>
      </div>

      {/* Default Slot Settings Panel (Editable) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Günlük 5 Yayın Slotu Yapılandırması
            </h2>
            <p className="text-xs text-zinc-400">Algoritmik etkileşimin en yüksek olduğu saat dilimleri</p>
          </div>
          <span className="text-xs font-medium text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
            Saat Dilimi: Europe/Istanbul (GMT+3)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {slots.map((slot, idx) => (
            <div key={idx} className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">{slot.label}</span>
                <span className="text-[10px] font-bold text-zinc-500">Slot #{idx + 1}</span>
              </div>
              {isEditingSlots ? (
                <input
                  type="time"
                  value={slot.time}
                  onChange={(e) => handleSlotTimeChange(idx, e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-2.5 py-1.5 text-sm font-mono text-white text-center focus:outline-none focus:border-rose-500"
                />
              ) : (
                <div className="text-xl font-bold font-mono text-white text-center py-1 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  {slot.time}
                </div>
              )}
              <div className="text-[10px] text-zinc-500 truncate text-center capitalize">
                Hedef: {slot.categoryPreference || 'Karışık'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Publishing Queue Table */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Aktif Yayın Kuyruğu ({queue.length})</h2>
            <p className="text-xs text-zinc-400">Otomatik yayın zamanlayıcısı tarafından işlenen slotlar</p>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
            Kuyrukta bekleyen öge yok. Video Kütüphanesinden videolara yayın saati atayabilirsiniz.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden">
            {queue.map((item) => {
              const date = new Date(item.scheduledTime);
              const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
              const dateStr = date.toLocaleDateString('tr-TR');

              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 hover:bg-zinc-800/30 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center text-xs font-mono font-bold text-white flex-shrink-0">
                      <span>{timeStr}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-300">{item.slotLabel}</span>
                        <span className="text-[10px] text-zinc-500">• {dateStr}</span>
                      </div>
                      <p className="text-sm font-medium text-white mt-0.5 line-clamp-1">
                        {item.videoTitle || 'Boş Slot (Video Bekleniyor)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        item.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : item.status === 'processing'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          : item.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {item.status === 'published'
                        ? 'Yayınlandı'
                        : item.status === 'processing'
                        ? 'İşleniyor'
                        : item.status === 'failed'
                        ? 'Hata'
                        : 'Beklemede'}
                    </span>

                    {item.videoId && item.status !== 'published' && (
                      <button
                        onClick={() => onPublishQueueItem(item.id, item.videoId)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-medium border border-rose-500/30 transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>Şimdi Paylaş</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteQueueItem(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
                      title="Kuyruktan Çıkar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
