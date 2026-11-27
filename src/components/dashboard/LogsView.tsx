'use client';

import React, { useState } from 'react';
import {
  ScrollText,
  RefreshCw,
  AlertTriangle,
  Info,
  XCircle,
  Filter,
  Trash2
} from 'lucide-react';
import { LogLevel, SystemLogRecord } from '@/types';

interface LogsViewProps {
  logs: SystemLogRecord[];
  onRefreshLogs: () => Promise<void>;
  isLoading: boolean;
}

export function LogsView({ logs, onRefreshLogs, isLoading }: LogsViewProps) {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
    if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-zinc-400" />
            Sistem ve Güvenlik Denetim Logları
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Yapay zekâ motoru, Meta Instagram Graph API, FFmpeg montaj ve bütçe devre kesici işlem kayıtları.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="ALL">Tüm Seviyeler</option>
            <option value="INFO">INFO (Bilgi)</option>
            <option value="WARN">WARN (Uyarı)</option>
            <option value="ERROR">ERROR (Hata)</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="ALL">Tüm Modüller</option>
            <option value="AI_CONTENT">AI Content</option>
            <option value="FAL_AI">fal.ai</option>
            <option value="FFMPEG">FFmpeg</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="SCHEDULER">Scheduler</option>
            <option value="COST_GUARD">Cost Guard</option>
            <option value="SYSTEM">System</option>
          </select>

          <button
            onClick={onRefreshLogs}
            disabled={isLoading}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            title="Logları Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            Filtreye uygun log kaydı bulunamadı.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800 font-mono text-xs">
            {filteredLogs.map((log) => {
              const isError = log.level === 'ERROR';
              const isWarn = log.level === 'WARN';

              return (
                <div
                  key={log.id}
                  className={`p-3.5 flex flex-col md:flex-row md:items-start justify-between gap-3 hover:bg-zinc-800/40 transition ${
                    isError ? 'bg-rose-950/15' : isWarn ? 'bg-amber-950/15' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 mt-0.5 ${
                        isError
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isWarn
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {isError ? <XCircle className="w-3 h-3" /> : isWarn ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                      {log.level}
                    </span>

                    <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 font-sans">
                      {log.module}
                    </span>

                    <div>
                      <p className="text-zinc-200 font-sans text-xs font-medium">
                        [{log.action}] {log.message}
                      </p>
                      {log.details && (
                        <pre className="text-[10px] text-zinc-500 mt-1 bg-zinc-950/50 p-2 rounded border border-zinc-800/80 overflow-x-auto max-w-2xl">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-500 whitespace-nowrap self-end md:self-start">
                    {new Date(log.timestamp).toLocaleString('tr-TR')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
