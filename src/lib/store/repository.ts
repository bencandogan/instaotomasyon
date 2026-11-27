// Evlilik İlanları - Veritabanı Deposu (Firestore + Canlı Veri Yönetimi)
import {
  ContentCategory,
  ContentIdea,
  GeneratedVideo,
  PublishQueueItem,
  PublishHistoryItem,
  InstagramSettings,
  AISettings,
  CostAndUsageLimits,
  DailyStatistics,
  ApiUsageRecord,
  SystemLogRecord,
  GeneralSettings,
  PinterestItem,
  UsagePermissionStatus,
  InstagramAccount,
  BrandOutroSettings,
  StoryAutomationSettings,
  StoryPublishItem,
} from '@/types';
import { getAdminDb } from '@/lib/firebase/admin';

// Varsayılan İçerik Kategorileri
export const DEFAULT_CATEGORIES: ContentCategory[] = [
  {
    id: 'cat-1',
    name: 'Romantik Sinematik Videolar',
    key: 'romantic_cinematic',
    description: 'Duygusal, sinematik ışıklandırmalı, mutlu çift sahneleri ve derin aşk sözleri.',
    targetDailyCount: 1,
    isActive: true,
    promptGuideline: 'Cinematic 4k vertical 9:16, romantic warm golden hour lighting, happy authentic Turkish couple holding hands walking in Istanbul Bosphorus, slow motion, cinematic depth of field, hyperrealistic, emotional warmth',
    musicMood: 'Akustik piyano, romantik yaylılar, dingin atmosfer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Gerçekçi Telefon Kamerası Tarzı',
    key: 'realistic_selfie',
    description: 'Doğal, POV veya ön kamera tarzı, samimi gerçek hayat evlilik anları.',
    targetDailyCount: 1,
    isActive: true,
    promptGuideline: 'POV smartphone vertical camera 9:16 footage, natural daylight, authentic Turkish young woman smiling and speaking candidly about true love and finding life partner, casual room background, raw documentary aesthetic',
    musicMood: 'Lo-Fi acoustic, sıcak ritim, hafif gitar',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-3',
    name: 'İlişki ve Evlilik Tavsiyeleri',
    key: 'relationship_advice',
    description: 'Mutlu evliliğin sırları, güven inşası ve doğru eş seçimi üzerine düşündürücü öneriler.',
    targetDailyCount: 1,
    isActive: true,
    promptGuideline: 'Modern minimalist aesthetic vertical 9:16, animated elegant typography, relationship wisdom quotes, couple resolving conflict with kindness, comforting pastel tones',
    musicMood: 'İlham verici piyano, ambient sakinleştirici tonlar',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-4',
    name: 'Evlilik İlanları Uygulama Reklamları',
    key: 'app_promo',
    description: 'Ciddi düşünen bekarlar için platformun güvenilirlik, gizlilik ve eşleşme avantajları.',
    targetDailyCount: 1,
    isActive: true,
    promptGuideline: 'High energy vertical promo 9:16, sleek smartphone mockup showing Evlilik İlanları interface, verified badge animation, real Turkish success story portrait, vibrant romantic gradients',
    musicMood: 'Modern ritmik pop beat, heyecan verici ve pozitif',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-5',
    name: 'Viral Soru ve Hikâye Videoları',
    key: 'viral_story',
    description: 'Yorumlarda tartışma başlatacak sorular, ilk buluşma hikâyeleri ve eğlenceli anketler.',
    targetDailyCount: 1,
    isActive: true,
    promptGuideline: 'High retention hook vertical 9:16, bold animated Turkish question caption, expressive reaction cuts, street interview dynamic style, relatable Turkish relationship dilemma',
    musicMood: 'Merak uyandırıcı bas ritmi, dinamik ve dikkat çekici ses efektleri',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Varsayılan fal.ai Modelleri
export const DEFAULT_FAL_MODELS = [
  {
    id: 'fal-kling-v1-5',
    name: 'Kling Video v1.5 (Ekonomik & Kaliteli)',
    modelId: 'fal-ai/kling-video/v1.5/pro/text-to-video',
    costPerSecondUsd: 0.05,
    maxResolution: '1080x1920',
    aspectRatio: '9:16',
    isActive: true,
    isDefault: true,
    description: 'Dikey 9:16 desteği mükemmel, doğal hareketler ve insan yüzleri için en iyi maliyet/performans dengesi.',
  },
  {
    id: 'fal-minimax-video',
    name: 'Minimax Video-01',
    modelId: 'fal-ai/minimax-video',
    costPerSecondUsd: 0.07,
    maxResolution: '1080x1920',
    aspectRatio: '9:16',
    isActive: true,
    isDefault: false,
    description: 'Hızlı üretim ve sinematik ışıklandırma için ideal.',
  },
  {
    id: 'fal-luma-dream',
    name: 'Luma Dream Machine',
    modelId: 'fal-ai/luma-dream-machine',
    costPerSecondUsd: 0.09,
    maxResolution: '1080x1920',
    aspectRatio: '9:16',
    isActive: false,
    isDefault: false,
    description: 'Dramatik kamera hareketleri ve yüksek çözünürlüklü estetik sahneler.',
  },
  {
    id: 'fal-fast-animate',
    name: 'Fast Motion / Image-to-Video',
    modelId: 'fal-ai/fast-svd-lcm',
    costPerSecondUsd: 0.02,
    maxResolution: '720x1280',
    aspectRatio: '9:16',
    isActive: true,
    isDefault: false,
    description: 'Ekonomik animasyon ve statik AI görsellerini hareketlendirme motoru.',
  },
];

// Varsayılan Bütçe ve Maliyet Sınırları
export const DEFAULT_COST_LIMITS: CostAndUsageLimits = {
  dailySpendingLimitUsd: 10.0,
  monthlySpendingLimitUsd: 250.0,
  maxCostPerVideoUsd: 1.5,
  maxDailyAiVideos: 2,
  maxDailyFfmpegVideos: 3,
  maxDailyTotalVideos: 5,
  maxRetriesPerVideo: 2,
  circuitBreakerActive: false,
  todaySpentUsd: 0.0,
  monthSpentUsd: 0.0,
  todayAiVideosProduced: 0,
  todayFfmpegVideosProduced: 0,
  updatedAt: new Date().toISOString(),
};

// Varsayılan Instagram Ayarları
export const DEFAULT_INSTAGRAM_SETTINGS: InstagramSettings = {
  isConnected: true,
  accountType: 'BUSINESS',
  instagramAccountId: '17841471565707771',
  instagramUsername: '@havvakabakli56',
  facebookPageId: '17841471565707771',
  facebookPageName: 'havva kabaklı',
  tokenExpiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
  tokenDaysRemaining: 60,
  lastTokenRefresh: new Date().toISOString(),
  hasReelsPermission: true,
  hasInsightsPermission: true,
  appIdMasked: '••••••••••••••••',
  appSecretMasked: '••••••••••••••••',
  userAccessTokenMasked: '••••••••••••••••',
  isTestMode: false,
  activeAccountId: 'acc-main',
  updatedAt: new Date().toISOString(),
};

// Varsayılan Instagram Hesapları (10 Hesaba Kadar Çoklu Yönetim)
export const DEFAULT_INSTAGRAM_ACCOUNTS: InstagramAccount[] = [
  {
    id: 'acc-main',
    name: 'havva kabaklı',
    instagramUsername: '@havvakabakli56',
    instagramAccountId: '17841471565707771',
    facebookPageId: '17841471565707771',
    facebookPageName: 'havva kabaklı',
    accountType: 'BUSINESS',
    isConnected: true,
    isTestMode: false,
    tokenExpiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    tokenDaysRemaining: 60,
    lastTokenRefresh: new Date().toISOString(),
    hasReelsPermission: true,
    hasInsightsPermission: true,
    appIdMasked: '••••••••••••••••',
    appSecretMasked: '••••••••••••••••',
    userAccessTokenMasked: '••••••••••••••••',
    isDefault: true,
    dailyTargetReels: 5,
    categoryFocus: 'Genel (Tüm Kategoriler)',
    notes: 'Birincil resmi marka hesabı',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Varsayılan Genel Ayarlar
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  brandName: 'Evlilik İlanları',
  brandTagline: 'Ciddi ve Güvenilir Yuva Kurma Platformu',
  brandLogoUrl: '/images/logo.png',
  watermarkEnabled: true,
  timezone: 'Europe/Istanbul',
  defaultPublishSlots: [
    { time: '09:00', label: 'Sabah İlhamı', categoryPreference: 'romantic_cinematic' },
    { time: '12:00', label: 'Öğle Tavsiyesi', categoryPreference: 'relationship_advice' },
    { time: '15:00', label: 'Günün Sorusu', categoryPreference: 'viral_story' },
    { time: '18:00', label: 'Akşam Hikâyesi', categoryPreference: 'realistic_selfie' },
    { time: '21:00', label: 'Gece Keşfi', categoryPreference: 'app_promo' },
  ],
  autoPublishEnabled: true,
  autoGenerateDailyEnabled: true,
  autopilotEnabled: true,
  notificationEmail: 'admin@evlilikilanlari.com',
  updatedAt: new Date().toISOString(),
};

// Varsayılan Marka Reklam Sonu Ayarları
export const DEFAULT_BRAND_OUTRO_SETTINGS: BrandOutroSettings = {
  isEnabled: true,
  brandName: 'Evlilik İlanları Türkiye',
  slogan: 'Yeni başlangıçlara ilk adımını at.',
  callToAction: 'Şimdi keşfet.',
  profileLinkPrompt: 'Profildeki linkten hemen ücretsiz indir 📲',
  logoUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=300&auto=format&fit=crop&q=80',
  googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.evlilikilanlari.app',
  appStoreUrl: 'https://apps.apple.com/app/evlilik-ilanlari/id123456789',
  durationSeconds: 4,
  backgroundType: 'dark_gradient',
  animationType: 'fade',
  showBadge: true,
  soundEffectEnabled: true,
  adPlacementStrategy: 'hybrid_mix',
  inVideoBadgeText: '💍 Evlilik İlanları Uygulaması',
  showInVideoLogo: true,
  storyHookTexts: [
    'Evlilik İlanları uygulamasından biriyle tanıştım, o bana hayat verdi...',
    'Doğru insanı doğru yerde arayınca her şey ne kadar kolaymış...',
    'Nasip bazen tek bir bildirimle başlar... ✨',
    'Profildeki uygulamadan tanışıp evlenen çiftlerin ortak özelliği...',
    'Ciddi bir yuva kurmak isteyenler için güvenilir bir kapı...'
  ],
  updatedAt: new Date().toISOString(),
};

// Varsayılan AI Ayarları
export const DEFAULT_AI_SETTINGS: AISettings = {
  openaiModel: 'gpt-4o-mini',
  falModels: DEFAULT_FAL_MODELS,
  selectedFalModelId: 'fal-kling-v1-5',
  openaiApiKeyMasked: '••••••••••••••••',
  falApiKeyMasked: '••••••••••••••••',
  systemPromptBase: `Sen "Evlilik İlanları" markasının profesyonel Instagram Reels içerik üreticisisin.
Türkçe dilinde, samimi, saygılı, Türk aile yapısına ve güvene önem veren, samimi evlilik niyetini öne çıkaran içerikler üretirsin.
Her video 9:16 formatında, 8-15 saniye aralığında, kancası (hook) güçlü, izletme süresi yüksek ve viral potansiyeli olan bir yapıda olmalıdır.`,
  temperature: 0.7,
  testMode: true,
  updatedAt: new Date().toISOString(),
};

// Varsayılan Otomatik Story (Hikaye) Ayarları
export const DEFAULT_STORY_SETTINGS: StoryAutomationSettings = {
  isEnabled: true,
  dailyPublishTime: '14:00', // 24 saatte bir her gün saat 14:00
  storyImageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1080&h=1920&fit=crop&q=80',
  storyLink: 'https://play.google.com/store/apps/details?id=com.evlilikilanlari.app',
  linkText: 'Uygulamayı İndir 📲',
  showLinkSticker: true,
  updatedAt: new Date().toISOString(),
};

// In-Memory Fallback State (Firestore credentials olmadan da test ve kullanım sağlar)
class MemoryDataStore {
  categories: ContentCategory[] = [...DEFAULT_CATEGORIES];
  ideas: ContentIdea[] = [];
  videos: GeneratedVideo[] = [];
  queue: PublishQueueItem[] = [];
  history: PublishHistoryItem[] = [];
  instagramSettings: InstagramSettings = { ...DEFAULT_INSTAGRAM_SETTINGS };
  aiSettings: AISettings = { ...DEFAULT_AI_SETTINGS };
  costLimits: CostAndUsageLimits = { ...DEFAULT_COST_LIMITS };
  generalSettings: GeneralSettings = { ...DEFAULT_GENERAL_SETTINGS };
  dailyStats: DailyStatistics[] = [];
  apiLogs: ApiUsageRecord[] = [];
  systemLogs: SystemLogRecord[] = [];
  pinterestItems: PinterestItem[] = [];
  instagramAccounts: InstagramAccount[] = [...DEFAULT_INSTAGRAM_ACCOUNTS];
  brandOutroSettings: BrandOutroSettings = { ...DEFAULT_BRAND_OUTRO_SETTINGS };
  storySettings: StoryAutomationSettings = { ...DEFAULT_STORY_SETTINGS };
  storyHistory: StoryPublishItem[] = [];
  savedPinterestUrls: string[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Seed initial daily stat
    this.dailyStats.push({
      id: todayStr,
      date: todayStr,
      producedCount: 0,
      publishedCount: 0,
      failedCount: 0,
      pendingCount: 0,
      totalCostUsd: 0,
      instagramViews: 0,
      instagramLikes: 0,
      instagramComments: 0,
      targetDailyCount: 5,
      completionRatePercent: 0,
      updatedAt: now.toISOString(),
    });

    // Seed a startup log
    this.systemLogs.push({
      id: 'log-init-1',
      level: 'INFO',
      module: 'SYSTEM',
      action: 'PLATFORM_STARTED',
      message: 'Evlilik İlanları AI Instagram Reels Otomasyon Platformu başlatıldı.',
      details: { environment: process.env.NODE_ENV, timezone: 'Europe/Istanbul' },
      timestamp: now.toISOString(),
    });

    // Seed sample Pinterest items
    this.pinterestItems.push(
      {
        id: 'pin-sample-1',
        pin_url: 'https://tr.pinterest.com/pin/1085086091484439001/',
        pin_title: 'Bodrum Sahilinde Gün Batımı Yürüyüşü',
        pin_description: 'Deniz kenarında el ele yürüyen mutlu çift, altın saat ışığı ve doğal sahil rüzgarı.',
        category: 'Sahil ve deniz',
        age_filter: '25–30 yaş görünümü',
        thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
        added_at: now.toISOString(),
        notes: 'Görsel ışığı çok samimi, 9:16 reels altyazısıyla mükemmel uyumlu.',
        favorite: true,
        usage_permission_status: 'Ticari kullanım uygun',
        original_creator: '@ege_hikayeleri',
        source_license: 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
        approval_status: 'approved',
        archive_status: false,
        similar_pins: [
          {
            id: 'sim-1',
            title: 'Çeşme Kumsalında Romantik Anlar',
            url: 'https://tr.pinterest.com/pin/1085086091484439002/',
            thumbnail_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&auto=format&fit=crop&q=80',
            video_url: 'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-4353-large.mp4',
            category: 'Sahil ve deniz',
            age_filter: '25–30 yaş görünümü',
          },
          {
            id: 'sim-2',
            title: 'Akdeniz Kıyısında Kahve Sohbeti',
            url: 'https://tr.pinterest.com/pin/1085086091484439003/',
            thumbnail_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
            video_url: 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4',
            category: 'Tatil ve gezi',
            age_filter: '30–35 yaş görünümü',
          },
        ],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: 'pin-sample-2',
        pin_url: 'https://tr.pinterest.com/pin/1085086091484439004/',
        pin_title: 'İstanbul Sokaklarında Doğal Şehir Yürüyüşü',
        pin_description: 'Karaköy ve Galata sokaklarında sıcak bir sonbahar günü, zarif kıyafet kombini ve samimi gülümseme.',
        category: 'Şehir yürüyüşleri',
        age_filter: '30–35 yaş görünümü',
        thumbnail_url: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&auto=format&fit=crop&q=80',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-walking-through-the-city-43285-large.mp4',
        added_at: now.toISOString(),
        notes: 'Doğal telefon kamerası havasında, samimi tavsiyeler için kullanılabilir.',
        favorite: false,
        usage_permission_status: 'Ticari kullanım uygun',
        original_creator: '@istanbul_kareleri',
        source_license: 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
        approval_status: 'approved',
        archive_status: false,
        similar_pins: [
          {
            id: 'sim-3',
            title: 'Balat Sokaklarında Renkli Çekim',
            url: 'https://tr.pinterest.com/pin/1085086091484439005/',
            thumbnail_url: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=600&auto=format&fit=crop&q=80',
            category: 'Şehir yürüyüşleri',
            age_filter: '30–35 yaş görünümü',
          },
        ],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }
    );
    this.generalSettings.defaultPublishSlots.forEach((slot, idx) => {
      this.queue.push({
        id: `queue-slot-${idx + 1}`,
        videoId: '',
        videoTitle: `[Planlanan Slot] ${slot.label} (${slot.time})`,
        thumbnailUrl: '',
        scheduledTime: `${todayStr}T${slot.time}:00+03:00`,
        slotLabel: `${slot.label} - ${slot.time}`,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    });
  }
}

// Global singleton instance for hot-reloads
const globalForStore = globalThis as unknown as { __instaMemoryStore?: MemoryDataStore };
export const memoryStore = globalForStore.__instaMemoryStore ?? new MemoryDataStore();
if (process.env.NODE_ENV !== 'production') globalForStore.__instaMemoryStore = memoryStore;

// Repository Facade: Canlı Firestore ve Bellek Katmanı
export class PlatformRepository {
  // --- SYSTEM LOGS ---
  static async log(
    level: 'INFO' | 'WARN' | 'ERROR',
    module: SystemLogRecord['module'],
    action: string,
    message: string,
    details?: Record<string, unknown>
  ): Promise<SystemLogRecord> {
    const record: SystemLogRecord = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      level,
      module,
      action,
      message,
      details,
      timestamp: new Date().toISOString(),
    };

    memoryStore.systemLogs.unshift(record);
    if (memoryStore.systemLogs.length > 500) memoryStore.systemLogs.pop();

    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('system_logs').doc(record.id).set(record);
      }
    } catch {
      // Offline fallback silent
    }

    return record;
  }

  static async getSystemLogs(limit = 100): Promise<SystemLogRecord[]> {
    try {
      const db = getAdminDb();
      if (db) {
        const snap = await db.collection('system_logs').orderBy('timestamp', 'desc').limit(limit).get();
        if (!snap.empty) {
          return snap.docs.map((doc: any) => doc.data() as SystemLogRecord);
        }
      }
    } catch {
      // Fallback to memory
    }
    return memoryStore.systemLogs.slice(0, limit);
  }

  // --- CATEGORIES ---
  static async getCategories(): Promise<ContentCategory[]> {
    try {
      const db = getAdminDb();
      if (db) {
        const snap = await db.collection('content_categories').get();
        if (!snap.empty) {
          return snap.docs.map((d: any) => d.data() as ContentCategory);
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.categories;
  }

  static async saveCategory(cat: ContentCategory): Promise<void> {
    const idx = memoryStore.categories.findIndex((c) => c.id === cat.id);
    cat.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      memoryStore.categories[idx] = cat;
    } else {
      memoryStore.categories.push(cat);
    }

    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('content_categories').doc(cat.id).set(cat, { merge: true });
      }
    } catch {
      // fallback
    }
  }

  // --- CONTENT IDEAS ---
  static async getIdeas(): Promise<ContentIdea[]> {
    try {
      const db = getAdminDb();
      if (db) {
        const snap = await db.collection('content_ideas').orderBy('createdAt', 'desc').limit(50).get();
        if (!snap.empty) {
          return snap.docs.map((d: any) => d.data() as ContentIdea);
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.ideas;
  }

  static async saveIdea(idea: ContentIdea): Promise<void> {
    const idx = memoryStore.ideas.findIndex((i) => i.id === idea.id);
    idea.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      memoryStore.ideas[idx] = idea;
    } else {
      memoryStore.ideas.unshift(idea);
    }

    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('content_ideas').doc(idea.id).set(idea, { merge: true });
      }
    } catch {
      // fallback
    }
  }

  // --- VIDEOS ---
  static async getVideos(limit = 1000): Promise<GeneratedVideo[]> {
    try {
      const db = getAdminDb();
      if (db) {
        const snap = await db.collection('generated_videos').orderBy('createdAt', 'desc').limit(limit).get();
        if (!snap.empty) {
          return snap.docs.map((d: any) => d.data() as GeneratedVideo);
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.videos;
  }

  static async getVideoById(id: string): Promise<GeneratedVideo | null> {
    try {
      const db = getAdminDb();
      if (db) {
        const doc = await db.collection('generated_videos').doc(id).get();
        if (doc.exists) {
          return doc.data() as GeneratedVideo;
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.videos.find((v) => v.id === id) || null;
  }

  static async saveVideo(video: GeneratedVideo): Promise<void> {
    const idx = memoryStore.videos.findIndex((v) => v.id === video.id);
    video.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      memoryStore.videos[idx] = video;
    } else {
      memoryStore.videos.unshift(video);
    }

    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('generated_videos').doc(video.id).set(video, { merge: true });
      }
    } catch {
      // fallback
    }
  }

  static async deleteVideo(id: string): Promise<void> {
    memoryStore.videos = memoryStore.videos.filter((v) => v.id !== id);
    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('generated_videos').doc(id).delete();
      }
    } catch {
      // fallback
    }
  }

  // --- PUBLISH QUEUE ---
  static async getQueue(): Promise<PublishQueueItem[]> {
    try {
      const db = getAdminDb();
      if (db) {
        const snap = await db.collection('publish_queue').orderBy('scheduledTime', 'asc').get();
        if (!snap.empty) {
          return snap.docs.map((d: any) => d.data() as PublishQueueItem);
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.queue;
  }

  static async saveQueueItem(item: PublishQueueItem): Promise<void> {
    const idx = memoryStore.queue.findIndex((q) => q.id === item.id);
    item.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      memoryStore.queue[idx] = item;
    } else {
      memoryStore.queue.push(item);
    }

    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('publish_queue').doc(item.id).set(item, { merge: true });
      }
    } catch {
      // fallback
    }
  }

  static async deleteQueueItem(id: string): Promise<void> {
    memoryStore.queue = memoryStore.queue.filter((q) => q.id !== id);
    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('publish_queue').doc(id).delete();
      }
    } catch {
      // fallback
    }
  }

  // --- SETTINGS (INSTAGRAM, AI, COST, GENERAL) ---
  static async getInstagramSettings(): Promise<InstagramSettings> {
    try {
      const db = getAdminDb();
      if (db) {
        const doc = await db.collection('instagram_settings').doc('config').get();
        if (doc.exists) {
          return doc.data() as InstagramSettings;
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.instagramSettings;
  }

  static async saveInstagramSettings(settings: Partial<InstagramSettings>): Promise<InstagramSettings> {
    memoryStore.instagramSettings = {
      ...memoryStore.instagramSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('instagram_settings').doc('config').set(memoryStore.instagramSettings, { merge: true });
      }
    } catch {
      // fallback
    }
    return memoryStore.instagramSettings;
  }

  // --- MULTI-ACCOUNT INSTAGRAM YÖNETİMİ ---
  static async getInstagramAccounts(): Promise<InstagramAccount[]> {
    try {
      const db = getAdminDb();
      if (db) {
        const snap = await db.collection('instagram_accounts').orderBy('createdAt', 'asc').get();
        if (!snap.empty) {
          return snap.docs.map((doc) => doc.data() as InstagramAccount);
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.instagramAccounts;
  }

  static async getInstagramAccountById(id: string): Promise<InstagramAccount | null> {
    try {
      const db = getAdminDb();
      if (db) {
        const doc = await db.collection('instagram_accounts').doc(id).get();
        if (doc.exists) {
          return doc.data() as InstagramAccount;
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.instagramAccounts.find((a) => a.id === id) || null;
  }

  static async saveInstagramAccount(account: InstagramAccount): Promise<InstagramAccount> {
    account.updatedAt = new Date().toISOString();
    const idx = memoryStore.instagramAccounts.findIndex((a) => a.id === account.id);
    if (idx >= 0) {
      memoryStore.instagramAccounts[idx] = account;
    } else {
      memoryStore.instagramAccounts.push(account);
    }

    // Eğer bu hesap default yapıldıysa diğerlerini default'tan çıkar
    if (account.isDefault) {
      memoryStore.instagramAccounts.forEach((a) => {
        if (a.id !== account.id) a.isDefault = false;
      });
      // instagram_settings/config ile de senkronize et
      await this.saveInstagramSettings({
        activeAccountId: account.id,
        instagramUsername: account.instagramUsername,
        instagramAccountId: account.instagramAccountId,
        facebookPageId: account.facebookPageId,
        facebookPageName: account.facebookPageName,
        accountType: account.accountType,
        isConnected: account.isConnected,
        isTestMode: account.isTestMode,
        hasReelsPermission: account.hasReelsPermission,
        hasInsightsPermission: account.hasInsightsPermission,
        tokenExpiresAt: account.tokenExpiresAt,
        tokenDaysRemaining: account.tokenDaysRemaining,
        lastTokenRefresh: account.lastTokenRefresh,
      });
    }

    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('instagram_accounts').doc(account.id).set(account, { merge: true });
        if (account.isDefault) {
          const batch = db.batch();
          const snap = await db.collection('instagram_accounts').where('isDefault', '==', true).get();
          snap.docs.forEach((doc) => {
            if (doc.id !== account.id) {
              batch.update(doc.ref, { isDefault: false });
            }
          });
          await batch.commit();
        }
      }
    } catch {
      // fallback
    }

    return account;
  }

  static async deleteInstagramAccount(id: string): Promise<void> {
    memoryStore.instagramAccounts = memoryStore.instagramAccounts.filter((a) => a.id !== id);
    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('instagram_accounts').doc(id).delete();
      }
    } catch {
      // fallback
    }
  }

  static async setActiveInstagramAccount(id: string): Promise<InstagramAccount | null> {
    const target = await this.getInstagramAccountById(id);
    if (!target) return null;

    target.isDefault = true;
    return await this.saveInstagramAccount(target);
  }

  static async getActiveInstagramAccount(): Promise<InstagramAccount> {
    const accounts = await this.getInstagramAccounts();
    const active = accounts.find((a) => a.isDefault) || accounts[0] || DEFAULT_INSTAGRAM_ACCOUNTS[0];
    return active;
  }

  static async getAISettings(): Promise<AISettings> {
    let settings = memoryStore.aiSettings;
    try {
      const db = getAdminDb();
      if (db) {
        const doc = await db.collection('ai_settings').doc('config').get();
        if (doc.exists) {
          settings = doc.data() as AISettings;
        }
      }
    } catch {
      // fallback
    }
    // GPT-4o yerine 16 kat daha ekonomik olan GPT-4o-mini'yi varsayılan yap
    if (settings.openaiModel === 'gpt-4o') {
      settings.openaiModel = 'gpt-4o-mini';
    }
    return settings;
  }

  static async saveAISettings(settings: Partial<AISettings>): Promise<AISettings> {
    memoryStore.aiSettings = {
      ...memoryStore.aiSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('ai_settings').doc('config').set(memoryStore.aiSettings, { merge: true });
      }
    } catch {
      // fallback
    }
    return memoryStore.aiSettings;
  }

  static async getCostLimits(): Promise<CostAndUsageLimits> {
    try {
      const db = getAdminDb();
      if (db) {
        const doc = await db.collection('cost_limits').doc('config').get();
        if (doc.exists) {
          return doc.data() as CostAndUsageLimits;
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.costLimits;
  }

  static async saveCostLimits(limits: Partial<CostAndUsageLimits>): Promise<CostAndUsageLimits> {
    memoryStore.costLimits = {
      ...memoryStore.costLimits,
      ...limits,
      updatedAt: new Date().toISOString(),
    };
    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('cost_limits').doc('config').set(memoryStore.costLimits, { merge: true });
      }
    } catch {
      // fallback
    }
    return memoryStore.costLimits;
  }

  static async getGeneralSettings(): Promise<GeneralSettings> {
    try {
      const db = getAdminDb();
      if (db) {
        const doc = await db.collection('general_settings').doc('config').get();
        if (doc.exists) {
          return doc.data() as GeneralSettings;
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.generalSettings;
  }

  static async saveGeneralSettings(settings: Partial<GeneralSettings>): Promise<GeneralSettings> {
    memoryStore.generalSettings = {
      ...memoryStore.generalSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('general_settings').doc('config').set(memoryStore.generalSettings, { merge: true });
      }
    } catch {
      // fallback
    }
    return memoryStore.generalSettings;
  }

  // --- MARKA REKLAM SONU & AKILLI YERLEŞİM (BRAND OUTRO) AYARLARI ---
  static async getBrandOutroSettings(accountId?: string): Promise<BrandOutroSettings> {
    // 1. Hesap bazlı arama
    if (accountId) {
      const acc = await this.getInstagramAccountById(accountId);
      if (acc && acc.brandSettings) {
        return {
          ...DEFAULT_BRAND_OUTRO_SETTINGS,
          ...acc.brandSettings,
          selectedAccountId: acc.id,
        };
      }
    }

    // 2. Aktif varsayılan hesap kontrolü
    const activeAcc = await this.getActiveInstagramAccount();
    if (activeAcc && activeAcc.brandSettings) {
      return {
        ...DEFAULT_BRAND_OUTRO_SETTINGS,
        ...activeAcc.brandSettings,
        selectedAccountId: activeAcc.id,
      };
    }

    // 3. Genel yapılandırma kontrolü
    try {
      const db = getAdminDb();
      if (db) {
        const doc = await db.collection('brand_outro_settings').doc('config').get();
        if (doc.exists) {
          return {
            ...DEFAULT_BRAND_OUTRO_SETTINGS,
            ...(doc.data() as BrandOutroSettings),
            selectedAccountId: activeAcc?.id,
          };
        }
      }
    } catch {
      // fallback
    }
    return {
      ...memoryStore.brandOutroSettings,
      selectedAccountId: activeAcc?.id,
    };
  }

  static async saveBrandOutroSettings(settings: Partial<BrandOutroSettings>, accountId?: string): Promise<BrandOutroSettings> {
    const targetAccountId = accountId || settings.selectedAccountId;

    // Hesap bazlı kayıt
    if (targetAccountId) {
      const acc = await this.getInstagramAccountById(targetAccountId);
      if (acc) {
        const updatedBrand: BrandOutroSettings = {
          ...DEFAULT_BRAND_OUTRO_SETTINGS,
          ...(acc.brandSettings || {}),
          ...settings,
          selectedAccountId: targetAccountId,
          updatedAt: new Date().toISOString(),
        };
        acc.brandSettings = updatedBrand;
        await this.saveInstagramAccount(acc);
        return updatedBrand;
      }
    }

    // Genel fallback kayıt
    memoryStore.brandOutroSettings = {
      ...memoryStore.brandOutroSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('brand_outro_settings').doc('config').set(memoryStore.brandOutroSettings, { merge: true });
      }
    } catch {
      // fallback
    }
    return memoryStore.brandOutroSettings;
  }

  // --- STATS & API USAGE ---
  static async getDailyStats(): Promise<DailyStatistics[]> {
    return memoryStore.dailyStats;
  }

  static async getApiUsage(): Promise<ApiUsageRecord[]> {
    return memoryStore.apiLogs;
  }

  static async recordApiUsage(record: Omit<ApiUsageRecord, 'id' | 'timestamp'>): Promise<void> {
    const fullRecord: ApiUsageRecord = {
      id: `api-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...record,
    };
    memoryStore.apiLogs.unshift(fullRecord);
    if (memoryStore.apiLogs.length > 500) memoryStore.apiLogs.pop();

    // Update today's spending in cost limits
    memoryStore.costLimits.todaySpentUsd += record.costUsd;
    memoryStore.costLimits.monthSpentUsd += record.costUsd;

    // Check circuit breaker
    if (
      memoryStore.costLimits.todaySpentUsd >= memoryStore.costLimits.dailySpendingLimitUsd ||
      memoryStore.costLimits.monthSpentUsd >= memoryStore.costLimits.monthlySpendingLimitUsd
    ) {
      memoryStore.costLimits.circuitBreakerActive = true;
      await this.log(
        'WARN',
        'COST_GUARD',
        'CIRCUIT_BREAKER_TRIGGERED',
        `Bütçe aşımı! Günlük ($${memoryStore.costLimits.todaySpentUsd.toFixed(2)}) veya aylık limit aşıldı. AI video üretimi durduruldu.`
      );
    }
  }

  // --- PINTEREST COLLECTION ---
  static async getPinterestItems(filter?: {
    category?: string;
    ageFilter?: string;
    favorite?: boolean;
    archiveStatus?: boolean;
    search?: string;
    limit?: number;
  }): Promise<PinterestItem[]> {
    let items: PinterestItem[] = [];
    const maxItems = filter?.limit || 1000;

    try {
      const db = getAdminDb();
      if (db) {
        const snap = await db.collection('pinterest_collection').orderBy('added_at', 'desc').limit(maxItems).get();
        if (!snap.empty) {
          items = snap.docs.map((d: any) => d.data() as PinterestItem);
        }
      }
    } catch {
      // fallback to memory
    }

    if (items.length === 0) {
      items = [...memoryStore.pinterestItems];
    }

    // Apply Filters
    if (filter) {
      if (filter.category && filter.category !== 'all') {
        items = items.filter((i) => i.category === filter.category);
      }
      if (filter.ageFilter && filter.ageFilter !== 'all') {
        items = items.filter((i) => i.age_filter === filter.ageFilter);
      }
      if (filter.favorite !== undefined) {
        items = items.filter((i) => i.favorite === filter.favorite);
      }
      if (filter.archiveStatus !== undefined) {
        items = items.filter((i) => (i.archive_status ?? false) === filter.archiveStatus);
      }
      if (filter.search && filter.search.trim() !== '') {
        const q = filter.search.toLowerCase();
        items = items.filter(
          (i) =>
            i.pin_title.toLowerCase().includes(q) ||
            i.pin_description.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q)
        );
      }
    }

    return items;
  }

  static async getPinterestItemById(id: string): Promise<PinterestItem | null> {
    try {
      const db = getAdminDb();
      if (db) {
        const doc = await db.collection('pinterest_collection').doc(id).get();
        if (doc.exists) {
          return doc.data() as PinterestItem;
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.pinterestItems.find((p) => p.id === id) || null;
  }

  static async savePinterestItem(item: PinterestItem): Promise<PinterestItem> {
    item.updated_at = new Date().toISOString();
    const idx = memoryStore.pinterestItems.findIndex((p) => p.id === item.id);
    if (idx >= 0) {
      memoryStore.pinterestItems[idx] = item;
    } else {
      memoryStore.pinterestItems.unshift(item);
    }

    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('pinterest_collection').doc(item.id).set(item, { merge: true });
      }
    } catch {
      // fallback
    }

    return item;
  }

  static async deletePinterestItem(id: string): Promise<void> {
    memoryStore.pinterestItems = memoryStore.pinterestItems.filter((p) => p.id !== id);
    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('pinterest_collection').doc(id).delete();
      }
    } catch {
      // fallback
    }
  }

  static async bulkUpdatePinterestItemsPermission(
    permissionStatus: UsagePermissionStatus = 'Ticari kullanım uygun',
    approvalStatus: 'approved' | 'pending' | 'rejected' = 'approved'
  ): Promise<number> {
    let updatedCount = 0;
    const now = new Date().toISOString();

    for (const item of memoryStore.pinterestItems) {
      item.usage_permission_status = permissionStatus;
      item.approval_status = approvalStatus;
      item.source_license = 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)';
      item.updated_at = now;
      updatedCount++;
    }

    try {
      const db = getAdminDb();
      if (db) {
        const snap = await db.collection('pinterest_collection').get();
        if (!snap.empty) {
          const batch = db.batch();
          snap.forEach((doc: any) => {
            batch.update(doc.ref, {
              usage_permission_status: permissionStatus,
              approval_status: approvalStatus,
              source_license: 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
              updated_at: now,
            });
          });
          await batch.commit();
          updatedCount = snap.size;
        }
      }
    } catch {
      // fallback
    }

    return updatedCount;
  }

  // --- KAYITLI PINTEREST KAYNAK BAĞLANTILARI (KALICI LİSTE) ---
  static async getSavedPinterestUrls(): Promise<string[]> {
    try {
      const db = getAdminDb();
      if (db) {
        const doc = await db.collection('pinterest_saved_urls').doc('config').get();
        if (doc.exists) {
          const data = doc.data();
          if (data && Array.isArray(data.urls)) {
            memoryStore.savedPinterestUrls = data.urls;
            return data.urls;
          }
        }
      }
    } catch {
      // fallback
    }
    return memoryStore.savedPinterestUrls || [];
  }

  static async saveSavedPinterestUrls(urls: string[]): Promise<string[]> {
    const cleanUrls = Array.from(new Set(urls.map((u) => u.trim()).filter((u) => u.length > 5)));
    memoryStore.savedPinterestUrls = cleanUrls;
    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('pinterest_saved_urls').doc('config').set(
          { urls: cleanUrls, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
    } catch {
      // fallback
    }
    return cleanUrls;
  }

  // --- OTOMATİK STORY (HİKAYE) YAYINLAMA ---
  static async getStorySettings(accountId?: string): Promise<StoryAutomationSettings> {
    if (!memoryStore.storySettings) memoryStore.storySettings = { ...DEFAULT_STORY_SETTINGS };
    const acc = accountId ? await this.getInstagramAccountById(accountId) : await this.getActiveInstagramAccount();
    const docId = acc ? `config_${acc.id}` : 'config';

    try {
      const db = getAdminDb();
      if (db) {
        const doc = await db.collection('story_settings').doc(docId).get();
        if (doc.exists) {
          return {
            ...DEFAULT_STORY_SETTINGS,
            ...(doc.data() as StoryAutomationSettings),
            selectedAccountId: acc?.id,
          };
        }
      }
    } catch {
      // fallback
    }

    return {
      ...memoryStore.storySettings,
      selectedAccountId: acc?.id,
    };
  }

  static async saveStorySettings(
    settings: Partial<StoryAutomationSettings>,
    accountId?: string
  ): Promise<StoryAutomationSettings> {
    if (!memoryStore.storySettings) memoryStore.storySettings = { ...DEFAULT_STORY_SETTINGS };
    const acc = accountId ? await this.getInstagramAccountById(accountId) : await this.getActiveInstagramAccount();
    const docId = acc ? `config_${acc.id}` : 'config';

    memoryStore.storySettings = {
      ...memoryStore.storySettings,
      ...settings,
      selectedAccountId: acc?.id,
      updatedAt: new Date().toISOString(),
    };

    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('story_settings').doc(docId).set(memoryStore.storySettings, { merge: true });
      }
    } catch {
      // fallback
    }

    return memoryStore.storySettings;
  }

  static async getStoryHistory(accountId?: string): Promise<StoryPublishItem[]> {
    if (!memoryStore.storyHistory) memoryStore.storyHistory = [];
    let list: StoryPublishItem[] = [];
    try {
      const db = getAdminDb();
      if (db) {
        const snap = await db.collection('story_history').orderBy('publishedAt', 'desc').limit(50).get();
        if (!snap.empty) {
          list = snap.docs.map((d: any) => d.data() as StoryPublishItem);
        }
      }
    } catch {
      // fallback
    }

    if (list.length === 0) {
      list = [...memoryStore.storyHistory];
    }

    if (accountId) {
      list = list.filter((item) => item.accountId === accountId);
    }

    return list;
  }

  static async saveStoryHistoryItem(item: StoryPublishItem): Promise<StoryPublishItem> {
    if (!memoryStore.storyHistory) memoryStore.storyHistory = [];
    memoryStore.storyHistory.unshift(item);
    if (memoryStore.storyHistory.length > 50) memoryStore.storyHistory.pop();

    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('story_history').doc(item.id).set(item, { merge: true });
      }
    } catch {
      // fallback
    }

    return item;
  }
}

export const repository = PlatformRepository;

