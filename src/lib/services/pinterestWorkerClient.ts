// Evlilik İlanları - Pinterest Benzer Video Worker İstemcisi
//
// Datacenter IP'leri Pinterest tarafından kısıtlandığı için benzer videolar,
// Pinterest'in engellemediği bir lokasyondaki (ör. Türkiye VPS) küçük bir
// worker servisinden çekilebilir. Worker kodu: `worker/pinterest-related-worker.cjs`
//
// .env.local:
//   PINTEREST_WORKER_URL=http://<worker-ip>:3006
//   PINTEREST_WORKER_SECRET=<paylaşılan anahtar>

import { PinterestAgeFilter, PinterestCategory, SimilarPinItem } from '@/types';

export interface WorkerRelatedOptions {
  seedTitle?: string;
  category?: PinterestCategory;
  ageFilter?: PinterestAgeFilter;
  maxVideos?: number;
  excludeVideoUrls?: string[];
}

interface WorkerResponse {
  ok?: boolean;
  pins?: SimilarPinItem[];
  error?: string;
  elapsedMs?: number;
}

export class PinterestWorkerClient {
  /** Worker adresi tanımlı mı? */
  static isConfigured(): boolean {
    return Boolean(this.baseUrl());
  }

  static baseUrl(): string {
    return (process.env.PINTEREST_WORKER_URL || '').trim().replace(/\/+$/, '');
  }

  /** Worker'dan bir pinin benzer videolarını ister */
  static async fetchRelatedVideos(pinId: string, options?: WorkerRelatedOptions): Promise<SimilarPinItem[]> {
    const base = this.baseUrl();
    if (!base) throw new Error('PINTEREST_WORKER_URL tanımlı değil.');

    const timeoutMs = Number(process.env.PINTEREST_WORKER_TIMEOUT_MS || 90_000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 90_000);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = (process.env.PINTEREST_WORKER_SECRET || '').trim();
      if (secret) headers['x-worker-secret'] = secret;

      const res = await fetch(`${base}/fetch-related`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pinId,
          seedTitle: options?.seedTitle,
          category: options?.category,
          ageFilter: options?.ageFilter,
          maxVideos: options?.maxVideos,
          excludeVideoUrls: options?.excludeVideoUrls || [],
        }),
        signal: controller.signal,
      });

      const data = (await res.json().catch(() => ({}))) as WorkerResponse;
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `Worker hatası (HTTP ${res.status})`);
      }

      return Array.isArray(data.pins) ? data.pins : [];
    } finally {
      clearTimeout(timer);
    }
  }

  /** Worker sağlık kontrolü (ana panelde durum göstermek için) */
  static async health(timeoutMs = 4000): Promise<{ ok: boolean; chrome: boolean; error?: string }> {
    const base = this.baseUrl();
    if (!base) return { ok: false, chrome: false, error: 'not_configured' };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${base}/health`, { signal: controller.signal });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; chrome?: boolean };
      return { ok: res.ok && data.ok !== false, chrome: Boolean(data.chrome) };
    } catch (err) {
      return { ok: false, chrome: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      clearTimeout(timer);
    }
  }
}
