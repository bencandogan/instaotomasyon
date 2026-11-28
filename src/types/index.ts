// Evlilik İlanları - AI Instagram Reels Otomasyon Platformu
// TypeScript Veri Tipleri & Firestore Koleksiyon Şemaları

export type VideoCategoryType =
  | 'romantic_cinematic'
  | 'realistic_selfie'
  | 'relationship_advice'
  | 'app_promo'
  | 'viral_story';

export interface ContentCategory {
  id: string;
  name: string;
  key: VideoCategoryType;
  description: string;
  targetDailyCount: number;
  isActive: boolean;
  promptGuideline: string;
  musicMood: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentIdea {
  id: string;
  categoryId: string;
  categoryKey: VideoCategoryType;
  title: string;
  scenario: string;
  sceneDescription: string;
  generationPrompt: string;
  turkishSubtitles: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  caption: string;
  hashtags: string[];
  coverPrompt: string;
  status: 'draft' | 'approved' | 'producing' | 'completed' | 'rejected';
  repetitionCheckHash: string;
  createdAt: string;
  updatedAt: string;
}

export type VideoProductionType = 'ai_video' | 'ffmpeg_motion'; // günde 2 ai video, 3 ffmpeg motion
export type VideoStatus = 'queued' | 'rendering' | 'ready' | 'published' | 'failed';

export interface GeneratedVideo {
  id: string;
  ideaId?: string;
  title: string;
  categoryKey: VideoCategoryType;
  productionType: VideoProductionType;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  format: 'mp4';
  aspectRatio: '9:16';
  caption: string;
  hashtags: string[];
  turkishSubtitles?: Array<{ start: number; end: number; text: string }>;
  subtitlesApplied: boolean;
  logoApplied: boolean;
  costUsd: number;
  modelUsed?: string;
  status: VideoStatus;
  errorMessage?: string;
  retryCount: number;
  accountId?: string;
  accountUsername?: string;
  instagramMediaId?: string;
  instagramPermalink?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishSlot {
  time: string; // e.g. "09:00", "12:00", "15:00", "18:00", "21:00"
  label: string;
  categoryPreference?: VideoCategoryType;
}

export interface PublishQueueItem {
  id: string;
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  scheduledTime: string; // ISO 8601 string in Europe/Istanbul
  slotLabel: string;
  status: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  instagramContainerId?: string;
  instagramMediaId?: string;
  instagramPermalink?: string;
  errorMessage?: string;
  accountId?: string;
  accountUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishHistoryItem {
  id: string;
  videoId: string;
  queueItemId: string;
  instagramMediaId: string;
  permalink: string;
  publishedAt: string;
  caption: string;
  likes: number;
  comments: number;
  views: number;
  reach: number;
  lastStatsSyncAt?: string;
}

export interface InstagramSettings {
  isConnected: boolean;
  accountType: 'BUSINESS' | 'CREATOR' | 'PERSONAL';
  instagramAccountId: string;
  instagramUsername: string;
  facebookPageId: string;
  facebookPageName: string;
  tokenExpiresAt: string;
  tokenDaysRemaining: number;
  lastTokenRefresh: string;
  hasReelsPermission: boolean;
  hasInsightsPermission: boolean;
  appIdMasked: string;
  appSecretMasked: string;
  userAccessTokenMasked: string;
  isTestMode: boolean;
  activeAccountId?: string;
  updatedAt: string;
}

export interface InstagramAccount {
  id: string;
  name: string;
  instagramUsername: string;
  instagramAccountId: string;
  facebookPageId: string;
  facebookPageName: string;
  accountType: 'BUSINESS' | 'CREATOR' | 'PERSONAL';
  isConnected: boolean;
  isTestMode: boolean;
  tokenExpiresAt: string;
  tokenDaysRemaining: number;
  lastTokenRefresh: string;
  hasReelsPermission: boolean;
  hasInsightsPermission: boolean;
  appIdMasked?: string;
  appSecretMasked?: string;
  userAccessTokenMasked?: string;
  isDefault: boolean;
  dailyTargetReels: number;
  categoryFocus?: string;
  notes?: string;
  brandSettings?: BrandOutroSettings;
  browserProfileId?: string;
  browserFingerprint?: string;
  autoPublishEnabled?: boolean;
  autoStoryEnabled?: boolean;
  oauthConnected?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FalModelConfig {
  id: string;
  name: string;
  modelId: string;
  costPerSecondUsd: number;
  maxResolution: string;
  aspectRatio: string;
  isActive: boolean;
  isDefault: boolean;
  description: string;
}

export interface AISettings {
  openaiModel: string;
  falModels: FalModelConfig[];
  selectedFalModelId: string;
  openaiApiKeyMasked: string;
  falApiKeyMasked: string;
  systemPromptBase: string;
  temperature: number;
  testMode: boolean;
  updatedAt: string;
}

export interface CostAndUsageLimits {
  dailySpendingLimitUsd: number;
  monthlySpendingLimitUsd: number;
  maxCostPerVideoUsd: number;
  maxDailyAiVideos: number; // default 2
  maxDailyFfmpegVideos: number; // default 3
  maxDailyTotalVideos: number; // default 5
  maxRetriesPerVideo: number;
  circuitBreakerActive: boolean; // Stop AI videos if limits exceeded
  todaySpentUsd: number;
  monthSpentUsd: number;
  todayAiVideosProduced: number;
  todayFfmpegVideosProduced: number;
  updatedAt: string;
}

export interface DailyStatistics {
  id: string; // date YYYY-MM-DD
  date: string;
  producedCount: number;
  publishedCount: number;
  failedCount: number;
  pendingCount: number;
  totalCostUsd: number;
  instagramViews: number;
  instagramLikes: number;
  instagramComments: number;
  targetDailyCount: number;
  completionRatePercent: number;
  updatedAt: string;
}

export interface ApiUsageRecord {
  id: string;
  provider: 'openai' | 'fal_ai' | 'meta_instagram';
  endpoint: string;
  unitsUsed: number; // tokens or seconds
  unitType: 'tokens' | 'seconds' | 'call';
  costUsd: number;
  durationMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
  relatedVideoId?: string;
  timestamp: string;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface SystemLogRecord {
  id: string;
  level: LogLevel;
  module: 'AUTH' | 'AI_CONTENT' | 'FAL_AI' | 'FFMPEG' | 'INSTAGRAM' | 'SCHEDULER' | 'COST_GUARD' | 'SYSTEM';
  action: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface GeneralSettings {
  brandName: string;
  brandTagline: string;
  brandLogoUrl: string;
  watermarkEnabled: boolean;
  timezone: string; // Europe/Istanbul
  defaultPublishSlots: PublishSlot[];
  autoPublishEnabled: boolean;
  autoGenerateDailyEnabled: boolean;
  autopilotEnabled?: boolean;
  autopilotLastRun?: string;
  notificationEmail?: string;
  updatedAt: string;
}

// ==========================================
// MARKA REKLAM SONU (BRAND OUTRO) AYARLARI
// ==========================================

export type OutroAnimationType = 'fade' | 'zoom' | 'slide_up' | 'glow';
export type OutroBackgroundType = 'dark_gradient' | 'romantic_pink' | 'sleek_black' | 'custom_image';
export type AdPlacementStrategy = 'hybrid_mix' | 'in_video_badge' | 'story_hook' | 'outro_only' | 'none';

export interface BrandOutroSettings {
  isEnabled: boolean;
  brandName: string;
  slogan: string;
  callToAction: string;
  profileLinkPrompt: string;
  logoUrl: string;
  googlePlayUrl: string;
  appStoreUrl?: string;
  durationSeconds: number; // 3, 4 veya 5 saniye
  backgroundType: OutroBackgroundType;
  customBackgroundUrl?: string;
  animationType: OutroAnimationType;
  showBadge: boolean;
  soundEffectEnabled: boolean;
  // İzlenme oranını koruyan yerleşim stratejileri
  adPlacementStrategy: AdPlacementStrategy;
  inVideoBadgeText: string;
  showInVideoLogo: boolean;
  storyHookTexts: string[];
  selectedAccountId?: string;
  updatedAt: string;
}

// ==========================================
// PINTEREST VIDEO BULUCU & İÇERİK KOLEKSİYONU
// ==========================================

export type PinterestCategory =
  | 'Sahil ve deniz'
  | 'Tatil ve gezi'
  | 'Günlük yaşam'
  | 'Moda ve kombin'
  | 'Başörtülü kadınlar'
  | 'Başörtüsüz kadınlar'
  | 'Park ve doğa'
  | 'Şehir yürüyüşleri'
  | 'Romantik görüntüler'
  | 'Kadın ve erkek çiftler';

export type PinterestAgeFilter =
  | '25–30 yaş görünümü'
  | '30–35 yaş görünümü'
  | '35–45 yaş görünümü';

export type UsagePermissionStatus =
  | 'İzin bekleniyor'
  | 'Kullanım izni doğrulandı'
  | 'Ticari kullanım uygun'
  | 'Kullanım izni yok'
  | 'Manuel kontrol gerekli';

export interface SimilarPinItem {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  video_url?: string;
  category: PinterestCategory;
  age_filter?: PinterestAgeFilter;
  author?: string;
  duration?: string; // Örn: '0:14', '0:25', '0:26' (Pinterest video süresi)
  /** Pinterest video kaynak kimliği (yeni benzer pin akışından gelir) */
  video_id?: string;
  /** Pinterest global pin kimliği (base64, ör. UGluOmUxX0F...) */
  pin_global_id?: string;
  /** Bu videonun önerildiği ana pin URL'si */
  source_pin_url?: string;
}

export interface PinterestItem {
  id: string;
  pin_url: string;
  pin_title: string;
  pin_description: string;
  category: PinterestCategory;
  age_filter?: PinterestAgeFilter;
  thumbnail_url: string;
  video_url?: string;
  embed_html?: string;
  added_at: string;
  notes: string;
  favorite: boolean;
  usage_permission_status: UsagePermissionStatus;
  original_creator: string;
  source_license: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  archive_status: boolean;
  similar_pins?: SimilarPinItem[];
  converted_video_id?: string;
  duration?: string; // Örn: '0:14', '0:25', '0:26'
  created_at: string;
  updated_at: string;
}

// ==========================================
// OTOMATİK HİKAYE (STORY) PAYLAŞIM AYARLARI
// ==========================================

export interface StoryAutomationSettings {
  isEnabled: boolean;
  dailyPublishTime: string; // Örn: '14:00' (24 saatte bir)
  storyImageUrl: string;
  storyLink: string;
  linkText: string; // Örn: 'Uygulamayı İndir 📲'
  showLinkSticker: boolean;
  selectedAccountId?: string;
  lastPublishedAt?: string;
  nextScheduledAt?: string;
  updatedAt: string;
}

export interface StoryPublishItem {
  id: string;
  imageUrl: string;
  storyLink: string;
  linkText: string;
  accountId: string;
  accountUsername: string;
  publishedAt: string;
  status: 'published' | 'failed' | 'scheduled';
  instagramStoryId?: string;
  errorMessage?: string;
}

