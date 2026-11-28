// Evlilik İlanları - Pinterest Benzer Pin (Related Pins) Tarayıcı Servisi
//
// Pinterest'in pin detay sayfasının altında gösterilen "benzer videolar" akışı
// (v3RelatedPinsForPinSeoQuery / GatedCloseupRelatedPinsFeedQuery) yalnızca
// gerçek bir tarayıcı oturumunda çalışıyor. Sunucu tarafı fetch istekleri
// Pinterest tarafından HTML sayfasına veya 403'e düşürülüyor.
//
// Bu servis, sunucuda kurulu Chrome/Chromium'u (puppeteer-core) kullanarak pin
// sayfasını açar ve sayfa içinden (tarayıcının kendi çerezleri + CSRF token'ı ile)
// GraphQL isteğini atıp benzer videoları toplar.

import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser, type CookieParam, type Page } from 'puppeteer-core';
import { PinterestAgeFilter, PinterestCategory, SimilarPinItem } from '@/types';
import { normalizeVideoKey } from '@/lib/utils/pinDeduplication';

/** Pinterest'in pin detay sayfasında kullandığı benzer pin sorgusunun güncel hash'i */
const RELATED_QUERY_HASH = '22d4b5f01f07c1be71875fc3555a98a630cb701ea7090b818d4dc456325515e6';

/** Pinterest tek istekte en fazla 250 öneri döndürüyor (400+ => BookmarkPageSizeExceedsMaximum) */
const DEFAULT_PAGE_SIZES = [250, 100, 25];

const FALLBACK_MAX_VIDEOS = 60;
const FALLBACK_MAX_CONCURRENT_PAGES = 2;
const BROWSER_IDLE_CLOSE_MS = 5 * 60 * 1000;
const PAGE_LOAD_TIMEOUT_MS = 45_000;

export interface RelatedPinsOptions {
  /** Ana pinin başlığı (benzer videolara anlamlı isim üretmek için) */
  seedTitle?: string;
  category?: PinterestCategory;
  ageFilter?: PinterestAgeFilter;
  /** En fazla kaç video döndürüleceği (varsayılan 60) */
  maxVideos?: number;
  /** Pinterest'ten istenecek öneri sayısı (varsayılan 250) */
  pageSize?: number;
  /** Kesinlikle dışarıda bırakılacak video URL'leri (ör. ana pin videosu) */
  excludeVideoUrls?: string[];
}

interface RawVideoVariant {
  url?: string | null;
  thumbnail?: string | null;
  width?: number | null;
  height?: number | null;
}

interface RawRelatedPinNode {
  id?: string;
  entityId?: string;
  title?: string;
  grid_title?: string;
  images_236x?: { url?: string } | null;
  images_474x?: { url?: string } | null;
  images_736x?: { url?: string } | null;
  images_orig?: { url?: string } | null;
  videos?: {
    duration?: number | null;
    entityId?: string | null;
    videoList?: Record<string, RawVideoVariant | null> | null;
  } | null;
  pinner?: { username?: string } | null;
}

interface RawRelatedPinsResponse {
  data?: {
    v3RelatedPinsForPinSeoQuery?: {
      data?: {
        connection?: { edges?: Array<{ node?: RawRelatedPinNode | null } | null> | null } | null;
        __typename?: string;
      } | null;
    } | null;
  };
  errors?: Array<{ message?: string }>;
}

export class PinterestBrowserService {
  private static browser: Browser | null = null;
  private static launchPromise: Promise<Browser> | null = null;
  private static idleTimer: ReturnType<typeof setTimeout> | null = null;

  private static activePages = 0;
  private static waiters: Array<() => void> = [];

  /** Ortamda çalıştırılabilir bir Chrome/Chromium var mı? */
  static isAvailable(): boolean {
    return this.resolveExecutablePath() !== null;
  }

  /**
   * Chrome/Chromium yürütülebilir dosyasını bulur.
   * Öncelik: PUPPETEER_EXECUTABLE_PATH / CHROME_PATH ortam değişkenleri,
   * ardından işletim sistemine göre bilinen kurulum yolları.
   */
  static resolveExecutablePath(): string | null {
    const candidates: string[] = [];

    const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || process.env.CHROMIUM_PATH;
    if (fromEnv) candidates.push(fromEnv);

    if (process.platform === 'win32') {
      const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
      const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
      const localAppData = process.env['LOCALAPPDATA'] || '';
      candidates.push(
        `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
        `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
        `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
        `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`
      );
      if (localAppData) {
        candidates.push(`${localAppData}\\Google\\Chrome\\Application\\chrome.exe`);
      }
    } else {
      candidates.push(
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
        '/usr/local/bin/chromium'
      );
      // Playwright önbelleğindeki Chromium (varsa snap'tan daha güvenilirdir)
      candidates.push(...this.findPlaywrightChromium());
    }

    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        if (fs.existsSync(candidate)) return candidate;
      } catch {
        // Erişim hatası olan adayı yoksay
      }
    }

    return null;
  }

  /** Playwright tarayıcı önbelleğindeki Chromium/headless-shell yollarını bulur (snap'tan daha güvenilir) */
  private static findPlaywrightChromium(): string[] {
    const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, path.join(process.env.HOME || '/root', '.cache', 'ms-playwright')].filter(
      (root): root is string => Boolean(root)
    );

    const found: string[] = [];
    for (const root of roots) {
      try {
        if (!fs.existsSync(root)) continue;
        for (const entry of fs.readdirSync(root)) {
          if (entry.startsWith('chromium_headless_shell-')) {
            found.push(path.join(root, entry, 'chrome-headless-shell-linux64', 'chrome-headless-shell'));
          } else if (entry.startsWith('chromium-')) {
            found.push(path.join(root, entry, 'chrome-linux', 'chrome'));
          }
        }
      } catch {
        // Dizin okunamıyorsa devam et
      }
    }

    return found;
  }

  /** Paylaşılan tarayıcı örneğini döndürür (gerekirse başlatır) */
  static async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) return this.browser;

    if (!this.launchPromise) {
      this.launchPromise = this.launchBrowser().finally(() => {
        this.launchPromise = null;
      });
    }

    return this.launchPromise;
  }

  private static async launchBrowser(): Promise<Browser> {
    const executablePath = this.resolveExecutablePath();
    if (!executablePath) {
      throw new Error(
        'Chrome/Chromium bulunamadı. Sunucuya Chromium kurun (apt install -y chromium) veya PUPPETEER_EXECUTABLE_PATH ortam değişkenini tanımlayın.'
      );
    }

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-gpu',
      '--lang=tr-TR',
    ];

    // Datacenter IP'leri Pinterest tarafından kısıtlanabildiği için opsiyonel proxy desteği
    const proxyServer = (process.env.PINTEREST_PROXY_SERVER || '').trim();
    if (proxyServer) args.push(`--proxy-server=${proxyServer}`);

    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      protocolTimeout: 180_000,
      args,
    });

    this.browser = browser;
    browser.on('disconnected', () => {
      if (this.browser === browser) this.browser = null;
    });

    return browser;
  }

  /** Tarayıcıyı kapatır (idle zamanlayıcı veya süreç kapanışı için) */
  static async closeBrowser(): Promise<void> {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    const browser = this.browser;
    this.browser = null;
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Tarayıcı zaten kapanmış olabilir
      }
    }
  }

  private static scheduleIdleClose(): void {
    if (this.activePages > 0) return;
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      if (this.activePages === 0) {
        void this.closeBrowser();
      }
    }, BROWSER_IDLE_CLOSE_MS);
    // Node sürecinin bu zamanlayıcı yüzünden açık kalmasını engelle
    if (typeof this.idleTimer.unref === 'function') this.idleTimer.unref();
  }

  private static maxConcurrentPages(): number {
    const parsed = Number(process.env.PINTEREST_BROWSER_CONCURRENCY || FALLBACK_MAX_CONCURRENT_PAGES);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : FALLBACK_MAX_CONCURRENT_PAGES;
  }

  private static async acquireSlot(): Promise<void> {
    if (this.activePages < this.maxConcurrentPages()) {
      this.activePages += 1;
      return;
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.activePages += 1;
  }

  private static releaseSlot(): void {
    this.activePages = Math.max(0, this.activePages - 1);
    const next = this.waiters.shift();
    if (next) next();
  }

  /**
   * Bir Pinterest pininin altında önerilen benzer VİDEOLARI çeker.
   * Tarayıcı/Chrome yoksa veya Pinterest akışı alınamazsa hata fırlatır;
   * çağıran taraf (scanPinterestUrl) bunu yakalayıp ana pini yine de kaydeder.
   */
  static async fetchRelatedVideos(pinId: string, options?: RelatedPinsOptions): Promise<SimilarPinItem[]> {
    const cleanPinId = (pinId || '').trim();
    if (!/^\d{6,25}$/.test(cleanPinId)) {
      return [];
    }

    const maxVideos = options?.maxVideos && options.maxVideos > 0 ? options.maxVideos : FALLBACK_MAX_VIDEOS;
    const pageSizes = options?.pageSize
      ? [options.pageSize, ...DEFAULT_PAGE_SIZES.filter((size) => size < options.pageSize!)]
      : DEFAULT_PAGE_SIZES;

    const excludeKeys = new Set<string>();
    for (const url of options?.excludeVideoUrls || []) {
      const key = normalizeVideoKey(url);
      if (key) excludeKeys.add(key);
    }

    await this.acquireSlot();
    let page: Page | null = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      page.setDefaultTimeout(PAGE_LOAD_TIMEOUT_MS);

      try {
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
        );
        await page.setViewport({ width: 1280, height: 1600 });

        // Proxy kimlik doğrulaması (opsiyonel)
        const proxyUser = process.env.PINTEREST_PROXY_USERNAME;
        const proxyPass = process.env.PINTEREST_PROXY_PASSWORD;
        if (proxyUser && proxyPass) {
          await page.authenticate({ username: proxyUser, password: proxyPass });
        }

        // Daha önce alınmış Pinterest oturum çerezleri (opsiyonel)
        const injectedCookies = this.buildCookiesFromEnv();
        if (injectedCookies.length > 0) {
          await page.setCookie(...injectedCookies);
        }

        // Proxy kullanılıyorsa bant genişliği tasarrufu için görsel/font/medya istekleri engellenir
        if (this.shouldBlockMedia()) {
          await page.setRequestInterception(true);
          page.on('request', (req) => {
            const type = req.resourceType();
            if (type === 'image' || type === 'font' || type === 'media') {
              void req.abort().catch(() => {});
              return;
            }
            void req.continue().catch(() => {});
          });
        }
      } catch {
        // Bu optimizasyonlar başarısız olursa normal şekilde devam et
      }

      await page.goto(`https://tr.pinterest.com/pin/${cleanPinId}/`, {
        waitUntil: 'domcontentloaded',
        timeout: PAGE_LOAD_TIMEOUT_MS,
      });

      // Çerezlerin (csrftoken) sayfa yanıtıyla oturmasını bekle
      await new Promise((resolve) => setTimeout(resolve, 1200));

      let edges: RawRelatedPinNode[] = [];
      let lastErrorNote = '';

      for (const size of pageSizes) {
        const body = await this.requestRelatedPins(page, cleanPinId, size);
        if (!body) {
          lastErrorNote = 'Pinterest boş yanıt döndürdü';
          continue;
        }

        let parsed: RawRelatedPinsResponse;
        try {
          parsed = JSON.parse(body) as RawRelatedPinsResponse;
        } catch {
          lastErrorNote = 'Pinterest yanıtı JSON değil (tarayıcı oturumu reddedildi)';
          continue;
        }

        const connection = parsed.data?.v3RelatedPinsForPinSeoQuery?.data?.connection;
        const typename = parsed.data?.v3RelatedPinsForPinSeoQuery?.data?.__typename || '';

        if (!connection?.edges || connection.edges.length === 0) {
          lastErrorNote = typename || parsed.errors?.[0]?.message || 'Benzer pin akışı boş';
          continue;
        }

        edges = connection.edges
          .map((edge) => (edge && edge.node ? edge.node : null))
          .filter((node): node is RawRelatedPinNode => Boolean(node));

        if (edges.length > 0) break;
      }

      if (edges.length === 0) {
        const hint =
          'Pinterest bu sunucu IP adresine benzer video akışı döndürmedi (giriş duvarı / bot koruması). ' +
          'PINTEREST_PROXY_SERVER (residential proxy) veya PINTEREST_COOKIES tanımlayın.';
        throw new Error(lastErrorNote ? `${hint} [${lastErrorNote}]` : hint);
      }

      return this.mapEdgesToVideos(edges, cleanPinId, options, excludeKeys, maxVideos);
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {
          // Sayfa zaten kapanmış olabilir
        }
      }
      this.releaseSlot();
      this.scheduleIdleClose();
    }
  }

  /** Birden fazla pin için benzer videoları tek tarayıcı üzerinden sırayla çeker */
  static async fetchRelatedForMany(
    pinIds: string[],
    options?: RelatedPinsOptions
  ): Promise<Record<string, SimilarPinItem[]>> {
    const uniqueIds = Array.from(new Set((pinIds || []).map((id) => (id || '').trim()).filter(Boolean)));
    const result: Record<string, SimilarPinItem[]> = {};

    for (const pinId of uniqueIds) {
      try {
        result[pinId] = await this.fetchRelatedVideos(pinId, options);
      } catch (err) {
        console.warn(`Pinterest benzer video çekme hatası (${pinId}):`, err);
        result[pinId] = [];
      }
    }

    return result;
  }

  /** PINTEREST_COOKIES ortam değişkeninden çerez listesi üretir (JSON dizi veya "a=b; c=d" biçimi) */
  private static buildCookiesFromEnv(): CookieParam[] {
    const raw = (process.env.PINTEREST_COOKIES || '').trim();
    if (!raw) return [];

    const result: CookieParam[] = [];

    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
        for (const cookie of parsed) {
          const name = typeof cookie.name === 'string' ? cookie.name : '';
          const value = typeof cookie.value === 'string' ? cookie.value : '';
          if (!name) continue;
          result.push({
            name,
            value,
            domain: typeof cookie.domain === 'string' ? cookie.domain : '.pinterest.com',
            path: typeof cookie.path === 'string' ? cookie.path : '/',
            httpOnly: Boolean(cookie.httpOnly),
            secure: cookie.secure === undefined ? true : Boolean(cookie.secure),
          });
        }
      } catch {
        return [];
      }
      return result;
    }

    for (const part of raw.split(';')) {
      const idx = part.indexOf('=');
      if (idx <= 0) continue;
      const name = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (!name) continue;
      result.push({ name, value, domain: '.pinterest.com', path: '/' });
    }

    return result;
  }

  /** Proxy kullanılıyorsa bant genişliği için medya istekleri varsayılan olarak engellenir */
  private static shouldBlockMedia(): boolean {
    const raw = (process.env.PINTEREST_BLOCK_MEDIA || '').trim().toLowerCase();
    if (raw === '1' || raw === 'true') return true;
    if (raw === '0' || raw === 'false') return false;
    return Boolean((process.env.PINTEREST_PROXY_SERVER || '').trim());
  }

  /** Sayfa içinden (tarayıcı çerezleri + CSRF token'ı ile) GraphQL isteğini atar */
  private static async requestRelatedPins(page: Page, pinId: string, count: number): Promise<string | null> {
    try {
      return await page.evaluate(
        async (pid: string, hash: string, cnt: number) => {
          const csrf = (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '';

          return await new Promise<string>((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/_/graphql/', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-CSRFToken', csrf);
            xhr.setRequestHeader('X-Pinterest-AppState', 'active');
            xhr.setRequestHeader('X-Pinterest-GraphQL-Name', 'V3RelatedPinsForPinSeoQuery');
            xhr.setRequestHeader('X-Pinterest-Source-Url', `/pin/${pid}/`);
            xhr.timeout = 45000;
            xhr.onload = () => resolve(xhr.responseText || '');
            xhr.onerror = () => resolve('');
            xhr.ontimeout = () => resolve('');
            xhr.send(JSON.stringify({ queryHash: hash, variables: { pinId: pid, count: cnt } }));
          });
        },
        pinId,
        RELATED_QUERY_HASH,
        count
      );
    } catch (err) {
      console.warn('Pinterest GraphQL (tarayıcı içi) isteği başarısız:', err);
      return null;
    }
  }

  /** GraphQL düğümlerini uygulamanın SimilarPinItem modeline dönüştürür */
  private static mapEdgesToVideos(
    edges: RawRelatedPinNode[],
    seedPinId: string,
    options: RelatedPinsOptions | undefined,
    excludeKeys: Set<string>,
    maxVideos: number
  ): SimilarPinItem[] {
    const seen = new Set<string>(excludeKeys);
    const results: SimilarPinItem[] = [];
    const seedTitle = (options?.seedTitle || 'Pinterest videosu').trim();
    const category = options?.category || 'Romantik görüntüler';
    const ageFilter = options?.ageFilter || '25–30 yaş görünümü';

    for (const node of edges) {
      if (results.length >= maxVideos) break;

      const videoList = node.videos?.videoList;
      if (!videoList) continue;

      const videoUrl = this.pickVideoUrl(videoList);
      if (!videoUrl) continue;

      const videoKey = normalizeVideoKey(videoUrl);
      if (videoKey && seen.has(videoKey)) continue;

      const thumbnailUrl =
        node.images_736x?.url ||
        node.images_474x?.url ||
        node.images_orig?.url ||
        node.images_236x?.url ||
        this.pickThumbnail(videoList) ||
        '';
      const durationMs = typeof node.videos?.duration === 'number' ? node.videos.duration : 0;

      if (videoKey) seen.add(videoKey);

      const videoEntityId = node.videos?.entityId || '';
      const globalId = node.id || node.entityId || '';

      results.push({
        // Video kimliği deterministik: aynı pin tekrar tarandığında aynı kayıt üretilir
        id: `pin-vid-${videoEntityId || videoKey.replace(/[^a-z0-9]/gi, '_').slice(-28) || Date.now()}`,
        title: node.title || node.grid_title || `${seedTitle} — Benzer Video #${results.length + 1}`,
        // Benzer pinlerde numeric pin ID bulunmadığı için açılabilir Pinterest linki üretilemiyor
        url: '',
        thumbnail_url: thumbnailUrl,
        video_url: videoUrl,
        category,
        age_filter: ageFilter,
        author: node.pinner?.username ? `@${node.pinner.username}` : '',
        duration: this.formatDuration(durationMs),
        video_id: videoEntityId || undefined,
        pin_global_id: globalId || undefined,
        source_pin_url: `https://tr.pinterest.com/pin/${seedPinId}/`,
      });
    }

    return results;
  }

  /** MP4 varyantlarını HLS'e tercih ederek en iyi video URL'sini seçer */
  private static pickVideoUrl(videoList: Record<string, RawVideoVariant | null>): string | null {
    const order = ['vEXP7', 'vEXP6', 'vEXP5', 'vEXP4', 'vEXP3', 'v720P', 'vHLSV4', 'vHLSV3WEB', 'vHLSV3MOBILE'];
    for (const key of order) {
      const url = videoList[key]?.url;
      if (url) return url;
    }
    for (const variant of Object.values(videoList)) {
      if (variant?.url) return variant.url;
    }
    return null;
  }

  private static pickThumbnail(videoList: Record<string, RawVideoVariant | null>): string | null {
    for (const key of ['v720P', 'vEXP7', 'vHLSV4', 'vHLSV3MOBILE']) {
      const thumb = videoList[key]?.thumbnail;
      if (thumb) return thumb;
    }
    for (const variant of Object.values(videoList)) {
      if (variant?.thumbnail) return variant.thumbnail;
    }
    return null;
  }

  /** Milisaniyeyi "m:ss" biçimine çevirir */
  private static formatDuration(durationMs: number): string {
    const totalSeconds = durationMs > 0 ? Math.round(durationMs / 1000) : 15;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  }
}

export const fetchRelatedPinterestVideos = PinterestBrowserService.fetchRelatedVideos.bind(PinterestBrowserService);
