#!/usr/bin/env node
/**
 * Pinterest Benzer Video Worker
 * ------------------------------------------------------------------
 * Ana site bu worker'a "şu pinin altındaki benzer videoları getir" der,
 * worker da gerçek Chrome/Chromium ile pin sayfasını açıp Pinterest'in
 * kendi GraphQL akışından (v3RelatedPinsForPinSeoQuery) videoları toplar.
 *
 * Neden ayrı sunucu? Pinterest datacenter IP'lerine "giriş duvarı"
 * gösterip akışı boş döndürüyor. Bu worker, Pinterest'in kısıtlamadığı
 * bir lokasyondaki (ör. Türkiye) küçük bir VPS'te çalıştırılır.
 *
 * Kurulum:
 *   cd /opt/pinterest-worker
 *   npm install                     # puppeteer-core
 *   sudo apt-get install -y chromium
 *   WORKER_SECRET=gizli-anahtar node pinterest-related-worker.cjs
 *
 * İstek:
 *   curl -X POST http://IP:3006/fetch-related \
 *     -H "content-type: application/json" \
 *     -H "x-worker-secret: gizli-anahtar" \
 *     -d '{"pinId":"1083256516653451643","count":250,"maxVideos":60}'
 *
 * Yanıt: { "ok": true, "pins": [ ... ], "elapsedMs": 5123 }
 */

'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const PORT = Number(process.env.PORT || 3006);
const SECRET = (process.env.WORKER_SECRET || '').trim();
const MAX_BODY_BYTES = 1024 * 1024;
const QUERY_HASH = '22d4b5f01f07c1be71875fc3555a98a630cb701ea7090b818d4dc456325515e6';
const PAGE_SIZES = [250, 100, 25];
const BROWSER_IDLE_CLOSE_MS = 5 * 60 * 1000;
const PAGE_TIMEOUT_MS = 45000;
const DEFAULT_MAX_VIDEOS = 60;

let browser = null;
let launchPromise = null;
let idleTimer = null;
let activePages = 0;
const waiters = [];

function resolveChrome() {
  const candidates = [];
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || process.env.CHROMIUM_PATH;
  if (fromEnv) candidates.push(fromEnv);

  if (process.platform === 'win32') {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    candidates.push(
      path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    );
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      '/usr/local/bin/chromium'
    );
    const pwRoot = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(process.env.HOME || '/root', '.cache', 'ms-playwright');
    try {
      if (fs.existsSync(pwRoot)) {
        for (const entry of fs.readdirSync(pwRoot)) {
          if (entry.startsWith('chromium_headless_shell-')) {
            candidates.push(path.join(pwRoot, entry, 'chrome-headless-shell-linux64', 'chrome-headless-shell'));
          } else if (entry.startsWith('chromium-')) {
            candidates.push(path.join(pwRoot, entry, 'chrome-linux', 'chrome'));
          }
        }
      }
    } catch {
      /* yoksay */
    }
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      /* yoksay */
    }
  }
  return null;
}

async function getBrowser() {
  if (browser && browser.connected) return browser;
  if (!launchPromise) {
    launchPromise = (async () => {
      const executablePath = resolveChrome();
      if (!executablePath) {
        throw new Error('Chrome/Chromium bulunamadı. apt-get install -y chromium veya PUPPETEER_EXECUTABLE_PATH tanımlayın.');
      }
      const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-gpu',
        '--lang=tr-TR',
      ];
      const proxy = (process.env.PINTEREST_PROXY_SERVER || '').trim();
      if (proxy) args.push(`--proxy-server=${proxy}`);

      const instance = await puppeteer.launch({ executablePath, headless: true, protocolTimeout: 180000, args });
      browser = instance;
      instance.on('disconnected', () => {
        if (browser === instance) browser = null;
      });
      console.log('[worker] chrome başlatıldı:', executablePath);
      return instance;
    })().finally(() => {
      launchPromise = null;
    });
  }
  return launchPromise;
}

function scheduleIdleClose() {
  if (activePages > 0) return;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    idleTimer = null;
    if (activePages === 0 && browser) {
      browser.close().catch(() => {});
      browser = null;
      console.log('[worker] boşta kalan chrome kapatıldı');
    }
  }, BROWSER_IDLE_CLOSE_MS);
  if (typeof idleTimer.unref === 'function') idleTimer.unref();
}

function maxConcurrentPages() {
  const parsed = Number(process.env.WORKER_CONCURRENCY || 2);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 2;
}

async function acquireSlot() {
  if (activePages < maxConcurrentPages()) {
    activePages += 1;
    return;
  }
  await new Promise((resolve) => waiters.push(resolve));
  activePages += 1;
}

function releaseSlot() {
  activePages = Math.max(0, activePages - 1);
  const next = waiters.shift();
  if (next) next();
}

function normalizeVideoKey(url) {
  if (!url || url.includes('mixkit.co')) return '';
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return String(url).split('?')[0].trim().toLowerCase();
  }
}

function pickVideoUrl(videoList) {
  const order = ['vEXP7', 'vEXP6', 'vEXP5', 'vEXP4', 'vEXP3', 'v720P', 'vHLSV4', 'vHLSV3WEB', 'vHLSV3MOBILE'];
  for (const key of order) {
    if (videoList[key] && videoList[key].url) return videoList[key].url;
  }
  for (const variant of Object.values(videoList)) {
    if (variant && variant.url) return variant.url;
  }
  return null;
}

function pickThumbnail(videoList) {
  for (const key of ['v720P', 'vEXP7', 'vHLSV4', 'vHLSV3MOBILE']) {
    if (videoList[key] && videoList[key].thumbnail) return videoList[key].thumbnail;
  }
  for (const variant of Object.values(videoList)) {
    if (variant && variant.thumbnail) return variant.thumbnail;
  }
  return null;
}

function formatDuration(durationMs) {
  const total = durationMs > 0 ? Math.round(durationMs / 1000) : 15;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

function mapEdgesToPins(edges, seedPinId, options, excludeKeys, maxVideos) {
  const seen = new Set(excludeKeys);
  const pins = [];
  const seedTitle = (options.seedTitle || 'Pinterest videosu').trim();
  const category = options.category || 'Romantik görüntüler';
  const ageFilter = options.ageFilter || '25–30 yaş görünümü';

  for (const node of edges) {
    if (pins.length >= maxVideos) break;
    const videoList = node && node.videos && node.videos.videoList;
    if (!videoList) continue;

    const videoUrl = pickVideoUrl(videoList);
    if (!videoUrl) continue;

    const videoKey = normalizeVideoKey(videoUrl);
    if (videoKey && seen.has(videoKey)) continue;

    const images = node.images_736x || node.images_474x || node.images_orig || node.images_236x;
    const thumbnailUrl = (images && images.url) || pickThumbnail(videoList) || '';
    const durationMs = typeof node.videos.duration === 'number' ? node.videos.duration : 0;
    const videoEntityId = node.videos.entityId || '';

    if (videoKey) seen.add(videoKey);

    pins.push({
      id: `pin-vid-${videoEntityId || videoKey.replace(/[^a-z0-9]/gi, '_').slice(-28) || Date.now()}`,
      title: node.title || node.grid_title || `${seedTitle} — Benzer Video #${pins.length + 1}`,
      url: '',
      thumbnail_url: thumbnailUrl,
      video_url: videoUrl,
      category,
      age_filter: ageFilter,
      author: node.pinner && node.pinner.username ? `@${node.pinner.username}` : '',
      duration: formatDuration(durationMs),
      video_id: videoEntityId || undefined,
      pin_global_id: node.id || node.entityId || undefined,
      source_pin_url: `https://tr.pinterest.com/pin/${seedPinId}/`,
    });
  }

  return pins;
}

function requestRelatedPins(page, pinId, count) {
  return page.evaluate(
    async (pid, hash, cnt) => {
      const csrf = (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '';
      return await new Promise((resolve) => {
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
    QUERY_HASH,
    count
  );
}

async function fetchRelatedVideos(pinId, options) {
  const cleanPinId = String(pinId || '').trim();
  if (!/^\d{6,25}$/.test(cleanPinId)) return [];

  const maxVideos = options.maxVideos > 0 ? options.maxVideos : DEFAULT_MAX_VIDEOS;
  const excludeKeys = new Set();
  for (const url of options.excludeVideoUrls || []) {
    const key = normalizeVideoKey(url);
    if (key) excludeKeys.add(key);
  }

  await acquireSlot();
  let page = null;
  try {
    const instance = await getBrowser();
    page = await instance.newPage();
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);

    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
      );
      await page.setViewport({ width: 1280, height: 1600 });
      const proxyUser = process.env.PINTEREST_PROXY_USERNAME;
      const proxyPass = process.env.PINTEREST_PROXY_PASSWORD;
      if (proxyUser && proxyPass) await page.authenticate({ username: proxyUser, password: proxyPass });
    } catch {
      /* yoksay */
    }

    await page.goto(`https://tr.pinterest.com/pin/${cleanPinId}/`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_TIMEOUT_MS,
    });
    await new Promise((resolve) => setTimeout(resolve, 1200));

    let edges = [];
    let note = '';
    for (const size of PAGE_SIZES) {
      const body = await requestRelatedPins(page, cleanPinId, size);
      if (!body) {
        note = 'boş yanıt';
        continue;
      }
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        note = 'JSON olmayan yanıt';
        continue;
      }
      const q = parsed.data && parsed.data.v3RelatedPinsForPinSeoQuery;
      const connection = q && q.data && q.data.connection;
      if (!connection || !Array.isArray(connection.edges) || connection.edges.length === 0) {
        note = (q && q.data && q.data.__typename) || (parsed.errors && parsed.errors[0] && parsed.errors[0].message) || 'boş akış';
        continue;
      }
      edges = connection.edges.map((e) => (e && e.node ? e.node : null)).filter(Boolean);
      if (edges.length > 0) break;
    }

    if (edges.length === 0) {
      throw new Error(
        'Pinterest bu sunucu IP adresine benzer video akışı döndürmedi (giriş duvarı / bot koruması). ' +
          'Farklı lokasyon/proxy veya PINTEREST_COOKIES gerekir. [' + (note || 'bilinmiyor') + ']'
      );
    }

    return mapEdgesToPins(edges, cleanPinId, options, excludeKeys, maxVideos);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {
        /* yoksay */
      }
    }
    releaseSlot();
    scheduleIdleClose();
  }
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');

    if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
      return sendJson(res, 200, {
        ok: true,
        service: 'pinterest-related-worker',
        chrome: Boolean(resolveChrome()),
        chromePath: resolveChrome(),
        concurrency: maxConcurrentPages(),
        activePages,
        uptimeSec: Math.round(process.uptime()),
      });
    }

    if (url.pathname !== '/fetch-related' || req.method !== 'POST') {
      return sendJson(res, 404, { ok: false, error: 'not_found' });
    }

    if (SECRET) {
      const provided = String(req.headers['x-worker-secret'] || '');
      if (provided !== SECRET) return sendJson(res, 401, { ok: false, error: 'unauthorized' });
    }

    const raw = await readBody(req);
    let payload;
    try {
      payload = JSON.parse(raw || '{}');
    } catch {
      return sendJson(res, 400, { ok: false, error: 'invalid_json' });
    }

    if (!payload.pinId) return sendJson(res, 400, { ok: false, error: 'pinId_required' });

    const started = Date.now();
    const pins = await fetchRelatedVideos(payload.pinId, {
      seedTitle: payload.seedTitle,
      category: payload.category,
      ageFilter: payload.ageFilter,
      maxVideos: Number(payload.maxVideos) || DEFAULT_MAX_VIDEOS,
      excludeVideoUrls: Array.isArray(payload.excludeVideoUrls) ? payload.excludeVideoUrls : [],
    });

    const elapsedMs = Date.now() - started;
    console.log(`[worker] pin=${payload.pinId} pins=${pins.length} sure=${elapsedMs}ms`);
    return sendJson(res, 200, { ok: true, pins, elapsedMs });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[worker] hata:', message);
    return sendJson(res, 500, { ok: false, error: message });
  }
});

async function selfTest(pinId) {
  const started = Date.now();
  console.log(`[worker] self-test pin=${pinId}`);
  const pins = await fetchRelatedVideos(pinId, { maxVideos: DEFAULT_MAX_VIDEOS });
  console.log(`[worker] self-test sonuc: ${pins.length} video, ${Date.now() - started}ms`);
  for (const pin of pins.slice(0, 5)) {
    console.log(`  - ${pin.id} | ${pin.duration} | ${pin.video_url}`);
  }
  if (browser) await browser.close().catch(() => {});
}

const selfTestPin = process.argv[2] === '--self-test' ? process.argv[3] : null;

if (selfTestPin) {
  selfTest(selfTestPin)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[worker] self-test hatası:', err instanceof Error ? err.message : err);
      process.exit(1);
    });
} else {
  if (!SECRET) console.warn('[worker] UYARI: WORKER_SECRET tanımlı değil, endpoint kimlik doğrulaması yapmıyor.');
  server.listen(PORT, process.env.BIND_HOST || '0.0.0.0', () => {
    console.log(`[worker] dinleniyor: http://${process.env.BIND_HOST || '0.0.0.0'}:${PORT}`);
    console.log(`[worker] chrome: ${resolveChrome() || 'BULUNAMADI'}`);
    console.log(`[worker] eşzamanlı sayfa: ${maxConcurrentPages()}`);
  });

  const shutdown = async () => {
    console.log('[worker] kapatılıyor...');
    server.close();
    if (browser) await browser.close().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

