import { PinterestItem } from '@/types';

/**
 * Normalizes Pinterest URL by stripping query parameters, anchor tags, and trailing slashes.
 */
export function normalizePinUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    return `${u.origin}${u.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch {
    return trimmed.split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
  }
}

/**
 * Extracts the numerical Pinterest Pin ID from a URL or item ID string.
 */
export function extractPinNumber(urlOrId?: string): string {
  if (!urlOrId) return '';
  const match = urlOrId.match(/\/pin\/(\d+)/) || urlOrId.match(/^pin-(?:sim-|rec-)?(\d+)/);
  return match ? match[1] : '';
}

/**
 * Normalizes video stream URL path (ignoring domain variations or CDN query tokens).
 */
export function normalizeVideoKey(videoUrl?: string): string {
  if (!videoUrl || videoUrl.includes('mixkit.co')) return '';
  try {
    const u = new URL(videoUrl);
    return u.pathname.toLowerCase();
  } catch {
    return videoUrl.split('?')[0].trim().toLowerCase();
  }
}

/**
 * Generates a deterministic ID for a Pinterest item so re-scanning the same URL
 * or same video always produces the exact same ID, preventing duplicate items.
 */
export function getDeterministicPinId(pinUrl?: string, videoUrl?: string, fallbackId?: string): string {
  const pinNum = extractPinNumber(pinUrl) || extractPinNumber(fallbackId);
  if (pinNum) return `pin-${pinNum}`;

  const vidKey = normalizeVideoKey(videoUrl);
  if (vidKey) {
    const cleanVid = vidKey.replace(/[^a-z0-9]/gi, '_').slice(-24);
    return `pin-vid-${cleanVid}`;
  }

  const urlKey = normalizePinUrl(pinUrl);
  if (urlKey) {
    const cleanUrl = urlKey.replace(/[^a-z0-9]/gi, '_').slice(-24);
    return `pin-url-${cleanUrl}`;
  }

  return fallbackId || `pin-${Date.now()}`;
}

/**
 * Filters out dummy placeholder pins and strictly deduplicates Pinterest items
 * by Pin Number, Normalized URL, Video Stream Path, and ID.
 */
export function deduplicatePins<T extends {
  id?: string;
  pin_url?: string;
  video_url?: string;
  approval_status?: string;
}>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];

  const seenPinNumbers = new Set<string>();
  const seenUrls = new Set<string>();
  const seenVideos = new Set<string>();
  const seenIds = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    if (!item) continue;
    // Discard hardcoded dummy samples
    if (item.id === 'pin-sample-1' || item.id === 'pin-sample-2') continue;

    const pinNum = extractPinNumber(item.pin_url) || extractPinNumber(item.id);
    if (pinNum && seenPinNumbers.has(pinNum)) continue;

    const cleanUrl = normalizePinUrl(item.pin_url);
    if (cleanUrl && seenUrls.has(cleanUrl)) continue;

    const vidKey = normalizeVideoKey(item.video_url);
    if (vidKey && seenVideos.has(vidKey)) continue;

    if (item.id && seenIds.has(item.id)) continue;

    if (pinNum) seenPinNumbers.add(pinNum);
    if (cleanUrl) seenUrls.add(cleanUrl);
    if (vidKey) seenVideos.add(vidKey);
    if (item.id) seenIds.add(item.id);

    result.push(item);
  }

  return result;
}
