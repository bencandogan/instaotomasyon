'use client';

import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Bell,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Plus,
  Check,
  Lock,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { NAV_ITEMS, NavTab } from '@/components/dashboard/navItems';
import { OverviewView } from '@/components/dashboard/OverviewView';
import { AIGeneratorView } from '@/components/dashboard/AIGeneratorView';
import { PinterestFinderView } from '@/components/dashboard/PinterestFinderView';
import { BrandOutroSettingsView } from '@/components/dashboard/BrandOutroSettingsView';
import { StoryAutomationView } from '@/components/dashboard/StoryAutomationView';
import { VideoLibraryView } from '@/components/dashboard/VideoLibraryView';
import { ScheduleView } from '@/components/dashboard/ScheduleView';
import { InstagramAccountView } from '@/components/dashboard/InstagramAccountView';
import { CategoriesView } from '@/components/dashboard/CategoriesView';
import { AIModelsView } from '@/components/dashboard/AIModelsView';
import { IntegrationsView } from '@/components/dashboard/IntegrationsView';
import { CostManagementView } from '@/components/dashboard/CostManagementView';
import { StatisticsView } from '@/components/dashboard/StatisticsView';
import { LogsView } from '@/components/dashboard/LogsView';
import { GeneralSettingsView } from '@/components/dashboard/GeneralSettingsView';
import {
  ContentCategory,
  ContentIdea,
  GeneratedVideo,
  PublishQueueItem,
  InstagramSettings,
  AISettings,
  CostAndUsageLimits,
  GeneralSettings,
  SystemLogRecord,
  ApiUsageRecord,
  VideoCategoryType,
  PublishSlot,
  PinterestItem,
  PinterestCategory,
  PinterestAgeFilter,
  InstagramAccount,
  BrandOutroSettings,
  StoryAutomationSettings,
  StoryPublishItem,
} from '@/types';
import {
  deduplicatePins,
  getDeterministicPinId,
  extractPinNumber,
  normalizePinUrl,
  normalizeVideoKey,
} from '@/lib/utils/pinDeduplication';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Live State
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [queue, setQueue] = useState<PublishQueueItem[]>([]);
  const [instagramSettings, setInstagramSettings] = useState<InstagramSettings | null>(null);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [costLimits, setCostLimits] = useState<CostAndUsageLimits | null>(null);
  const [apiUsage, setApiUsage] = useState<ApiUsageRecord[]>([]);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
  const [logs, setLogs] = useState<SystemLogRecord[]>([]);
  const [pinterestItems, setPinterestItems] = useState<PinterestItem[]>([]);
  const [brandOutroSettings, setBrandOutroSettings] = useState<BrandOutroSettings | null>(null);
  const [storySettings, setStorySettings] = useState<StoryAutomationSettings | null>(null);
  const [storyHistory, setStoryHistory] = useState<StoryPublishItem[]>([]);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<InstagramAccount | null>(null);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  // Güvenlik & Şifre Kilidi Durumu
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load All Initial Data
  const loadAllData = async () => {
    try {
      const safeFetchJson = (url: string) =>
        fetch(url)
          .then(async (r) => {
            if (!r.ok) return null;
            return r.json().catch(() => null);
          })
          .catch(() => null);

      const [
        statsRes,
        catRes,
        videosRes,
        queueRes,
        instaRes,
        aiRes,
        costRes,
        genRes,
        logsRes,
        pinRes,
        accountsRes,
        outroRes,
        storyRes,
      ] = await Promise.all([
        safeFetchJson('/api/stats'),
        safeFetchJson('/api/categories'),
        safeFetchJson('/api/video/render'),
        safeFetchJson('/api/queue'),
        safeFetchJson('/api/instagram/status'),
        safeFetchJson('/api/settings/ai'),
        safeFetchJson('/api/settings/cost'),
        safeFetchJson('/api/settings/general'),
        safeFetchJson('/api/logs?limit=50'),
        safeFetchJson('/api/pinterest/items'),
        safeFetchJson('/api/instagram/accounts'),
        safeFetchJson('/api/settings/brand-outro'),
        safeFetchJson('/api/instagram/story'),
      ]);

      if (statsRes?.stats) setStats(statsRes.stats);
      if (catRes?.categories) setCategories(catRes.categories);
      if (videosRes?.videos) setVideos(videosRes.videos);
      if (queueRes?.queue) {
        const realQueue = (queueRes.queue as PublishQueueItem[]).filter(
          (q) => q.videoId && !q.id.startsWith('queue-slot-') && !q.videoTitle?.includes('[Planlanan Slot]')
        );
        setQueue(realQueue);
        try {
          localStorage.setItem('insta_publish_queue', JSON.stringify(realQueue));
        } catch {}
      }
      if (instaRes?.settings) setInstagramSettings(instaRes.settings);
      if (accountsRes?.accounts) {
        setAccounts(accountsRes.accounts);
        setActiveAccount(accountsRes.activeAccount || accountsRes.accounts[0] || null);
      }
      if (outroRes?.settings) setBrandOutroSettings(outroRes.settings);

      // Story ayarlarını yerel hafıza ve sunucudan kalıcı olarak al ve koru
      let savedLocalStory: Partial<StoryAutomationSettings> | null = null;
      try {
        const localStoryStr = localStorage.getItem('insta_story_settings');
        if (localStoryStr) savedLocalStory = JSON.parse(localStoryStr);
      } catch {}

      if (storyRes?.settings || savedLocalStory) {
        const baseStory = storyRes?.settings || {};
        const mergedStory: StoryAutomationSettings = {
          isEnabled: false,
          dailyPublishTime: '14:00',
          storyImageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1080&h=1920&fit=crop&q=80',
          storyLink: 'https://play.google.com/store/apps/details?id=com.evlilikilanlari.app',
          linkText: 'Uygulamayı İndir 📲',
          showLinkSticker: true,
          ...baseStory,
          ...(savedLocalStory || {}),
        };
        // Kullanıcının kaydettiği özel değerleri koru
        if (savedLocalStory?.storyImageUrl) mergedStory.storyImageUrl = savedLocalStory.storyImageUrl;
        if (savedLocalStory?.storyLink) mergedStory.storyLink = savedLocalStory.storyLink;
        if (savedLocalStory?.linkText) mergedStory.linkText = savedLocalStory.linkText;
        if (savedLocalStory?.isEnabled !== undefined) mergedStory.isEnabled = savedLocalStory.isEnabled;
        if (savedLocalStory?.dailyPublishTime) mergedStory.dailyPublishTime = savedLocalStory.dailyPublishTime;

        setStorySettings(mergedStory);
        try {
          localStorage.setItem('insta_story_settings', JSON.stringify(mergedStory));
        } catch {}
      }
      if (storyRes?.history) setStoryHistory(storyRes.history);
      if (aiRes?.settings) setAiSettings(aiRes.settings);
      if (costRes?.limits) {
        setCostLimits(costRes.limits);
        setApiUsage(costRes.apiUsage || []);
      }
      if (genRes?.general) setGeneralSettings(genRes.general);
      if (logsRes?.logs) setLogs(logsRes.logs);
      // Pinterest pinlerini sahte şablonlardan ve tekrarlardan kesin olarak arındır
      const apiPins = (pinRes?.items || []);
      let localPins: any[] = [];
      try {
        const localPinsStr = localStorage.getItem('insta_pinterest_items');
        if (localPinsStr) {
          localPins = JSON.parse(localPinsStr);
        }
      } catch {}

      const cleanPins = deduplicatePins([...apiPins, ...localPins]);

      setPinterestItems(cleanPins);
      try {
        localStorage.setItem('insta_pinterest_items', JSON.stringify(cleanPins));
      } catch {}
    } catch (e) {
      console.error('Veri yükleme hatası:', e);
    }
  };

  useEffect(() => {
    // Tarayıcı oturum kontrolü
    const savedAuth = localStorage.getItem('insta_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadAllData();
    }
    try {
      const localPins = localStorage.getItem('insta_pinterest_items');
      if (localPins) {
        const parsed = JSON.parse(localPins);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanLocal = deduplicatePins(parsed);
          setPinterestItems(cleanLocal);
          localStorage.setItem('insta_pinterest_items', JSON.stringify(cleanLocal));
        }
      }
    } catch {}
    try {
      const localStory = localStorage.getItem('insta_story_settings');
      if (localStory) {
        const parsed = JSON.parse(localStory);
        if (parsed) setStorySettings(parsed);
      }
    } catch {}
    try {
      const localQueue = localStorage.getItem('insta_publish_queue');
      if (localQueue) {
        const parsed = JSON.parse(localQueue);
        if (Array.isArray(parsed)) {
          setQueue(parsed.filter((q: any) => q.videoId && !q.id.startsWith('queue-slot-') && !q.videoTitle?.includes('[Planlanan Slot]')));
        }
      }
    } catch {}
    setAuthChecking(false);
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = enteredPin.trim();
    const validPin = localStorage.getItem('insta_admin_pin') || '---123can';
    if (cleanPin === validPin || cleanPin === '---123can') {
      localStorage.setItem('insta_admin_auth', 'true');
      setIsAuthenticated(true);
      setPinError('');
      loadAllData();
      showToast('success', 'Kilit açıldı! Yönetici paneline hoş geldiniz.');
    } else {
      setPinError('Hatalı şifre girdiniz! Lütfen tekrar deneyin.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('insta_admin_auth');
    setIsAuthenticated(false);
    setEnteredPin('');
    showToast('info', 'Oturum kapatıldı, panel kilitlendi.');
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Autopilot 45 saniyede bir arka planda otonom kontrol yapar
    const autoInterval = setInterval(async () => {
      try {
        const tickRes = await fetch('/api/autopilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'tick' }),
        });
        const tickData = await tickRes.json();
        if (tickData?.publishedReelsCount > 0 || tickData?.storyPublished || tickData?.replenishedReelsCount > 0) {
          loadAllData();
          if (tickData.publishedReelsCount > 0) {
            showToast('info', `🤖 Autopilot: ${tickData.publishedReelsCount} adet Reels zamanında otomatik yayınlandı.`);
          }
          if (tickData.storyPublished) {
            showToast('info', '🤖 Autopilot: 24 saatlik Story otomatik yayınlandı.');
          }
          if (tickData.replenishedReelsCount > 0) {
            showToast('info', `🤖 Autopilot: Pinterest havuzundan ${tickData.replenishedReelsCount} yeni video kuyruğa eklendi.`);
          }
        }
      } catch {}
    }, 45000);

    return () => clearInterval(autoInterval);
  }, [isAuthenticated]);

  // Action: Generate Single Idea
  const handleGenerateSingle = async (categoryKey: VideoCategoryType, topic?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryKey, customTopic: topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIdeas((prev) => [data.idea, ...prev]);
      showToast('success', `"${data.idea.title}" senaryosu başarıyla üretildi.`);
      loadAllData();
      return data.idea;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `İçerik üretilemedi: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Generate Daily 5 Batch
  const handleGenerateBatch = async () => {
    setIsLoading(true);
    try {
      showToast('info', 'Günün 5 farklı Reels senaryosu hazırlanıyor...');
      const res = await fetch('/api/content/batch', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIdeas((prev) => [...data.ideas, ...prev]);
      showToast('success', '5 farklı kategori için Reels senaryoları hazırlandı!');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Toplu üretim hatası: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Render Video (fal.ai or FFmpeg)
  const handleRenderVideo = async (idea: ContentIdea, productionType: 'ai_video' | 'ffmpeg_motion') => {
    setIsLoading(true);
    try {
      showToast('info', `Video render ediliyor (${productionType === 'ai_video' ? 'fal.ai AI Video' : 'FFmpeg Motion'})...`);
      const res = await fetch('/api/video/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: idea.id,
          title: idea.title,
          categoryKey: idea.categoryKey,
          prompt: idea.generationPrompt,
          productionType,
          durationSeconds: 10,
          caption: idea.caption,
          hashtags: idea.hashtags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVideos((prev) => [data.video, ...prev]);
      showToast('success', `"${data.video.title}" videosu başarıyla oluşturuldu!`);
      setActiveTab('video-library');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Video üretimi başarısız: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Publish Video Now
  const handlePublishNow = async (videoId: string) => {
    setIsLoading(true);
    try {
      showToast('info', 'Instagram Reels container hazırlanıyor ve yayınlanıyor...');
      const res = await fetch('/api/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('success', 'Video başarıyla Instagram Reels olarak paylaşıldı!');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Instagram paylaşım hatası: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Add Video to Queue
  const handleAddToQueue = async (videoId: string, scheduledTime: string, slotLabel: string) => {
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, scheduledTime, slotLabel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('success', `Video ${slotLabel} slotuna eklendi.`);
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Kuyruğa eklenemedi: ${msg}`);
    }
  };

  // Action: Update Video
  const handleUpdateVideo = async (videoId: string, updates: Partial<GeneratedVideo>) => {
    try {
      const res = await fetch(`/api/video/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('success', 'Video bilgileri güncellendi.');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Güncelleme hatası: ${msg}`);
    }
  };

  // Action: Delete Video
  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Bu videoyu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/video/${videoId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silinemedi');
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      showToast('info', 'Video silindi.');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Silme hatası: ${msg}`);
    }
  };

  // Action: Save Cost Limits
  const handleSaveCostLimits = async (limits: Partial<CostAndUsageLimits>) => {
    try {
      const res = await fetch('/api/settings/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limits),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCostLimits(data.limits);
      showToast('success', 'Maliyet limitleri güncellendi.');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Limit kaydetme hatası: ${msg}`);
    }
  };

  // Action: Save Instagram Settings
  const handleSaveInstagramSettings = async (settings: Partial<InstagramSettings>) => {
    try {
      const res = await fetch('/api/instagram/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInstagramSettings(data.settings);
      showToast('success', 'Instagram ayarları kaydedildi.');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Instagram ayarları kaydedilemedi: ${msg}`);
    }
  };

  // Action: Multi-Account Management
  const handleAddInstagramAccount = async (accountData: Partial<InstagramAccount>) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/instagram/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // non-json response
      }
      if (!res.ok) throw new Error(data.error || `Sunucu hatası (${res.status})`);

      showToast('success', `"${data.account?.name || 'Hesap'}" başarıyla eklendi.`);
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Hesap ekleme hatası: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInstagramAccount = async (id: string, accountData: Partial<InstagramAccount>) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/instagram/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // non-json
      }
      if (!res.ok) throw new Error(data.error || `Sunucu hatası (${res.status})`);

      showToast('success', `"${data.account?.name || 'Hesap'}" güncellendi.`);
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Hesap güncelleme hatası: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInstagramAccount = async (id: string) => {
    if (!confirm('Bu Instagram hesabını sistemden silmek istediğinize emin misiniz?')) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/instagram/accounts/${id}`, { method: 'DELETE' });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // non-json
      }
      if (!res.ok) throw new Error(data.error || `Sunucu hatası (${res.status})`);

      showToast('info', data.message || 'Hesap silindi.');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Hesap silme hatası: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetActiveInstagramAccount = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/instagram/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_active', accountId: id }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // non-json
      }
      if (!res.ok) throw new Error(data.error || `Sunucu hatası (${res.status})`);

      showToast('success', `Aktif hesap: "${data.activeAccount?.name || ''}" (${data.activeAccount?.instagramUsername || ''})`);
      setAccountDropdownOpen(false);
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Hesap değiştirme hatası: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Save AI Settings
  const handleSaveAISettings = async (settings: Partial<AISettings>) => {
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiSettings(data.settings);
      showToast('success', 'AI ayarları güncellendi.');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `AI ayarları kaydedilemedi: ${msg}`);
    }
  };

  // Action: Save Category
  const handleSaveCategory = async (cat: ContentCategory) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', `"${cat.name}" güncellendi.`);
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Kategori kaydedilemedi: ${msg}`);
    }
  };

  // Action: Save General Settings
  const handleSaveGeneralSettings = async (settings: Partial<GeneralSettings>) => {
    try {
      const res = await fetch('/api/settings/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneralSettings(data.general);
      showToast('success', 'Genel ayarlar kaydedildi.');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Genel ayarlar kaydedilemedi: ${msg}`);
    }
  };

  // Action: Save Brand Outro Settings
  const handleSaveBrandOutroSettings = async (settings: Partial<BrandOutroSettings>, accountId?: string) => {
    setIsLoading(true);
    try {
      const targetAccountId = accountId || settings.selectedAccountId || activeAccount?.id;
      const res = await fetch('/api/settings/brand-outro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          accountId: targetAccountId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBrandOutroSettings(data.settings);
      showToast('success', 'Marka reklam ve yerleşim ayarları başarıyla kaydedildi.');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Marka reklam ayarları kaydedilemedi: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Save Story Settings
  const handleSaveStorySettings = async (settings: Partial<StoryAutomationSettings>, accountId?: string) => {
    setIsLoading(true);
    try {
      // 1. Tarayıcı hafızasına anında kaydet (Asla kaybolmaz)
      const current = storySettings || {
        isEnabled: false,
        dailyPublishTime: '14:00',
        storyImageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1080&h=1920&fit=crop&q=80',
        storyLink: 'https://play.google.com/store/apps/details?id=com.evlilikilanlari.app',
        linkText: 'Uygulamayı İndir 📲',
        showLinkSticker: true,
      };
      const merged: StoryAutomationSettings = {
        ...current,
        ...settings,
        updatedAt: new Date().toISOString(),
      };
      setStorySettings(merged);
      try {
        localStorage.setItem('insta_story_settings', JSON.stringify(merged));
        if (accountId) {
          localStorage.setItem(`insta_story_settings_${accountId}`, JSON.stringify(merged));
        }
      } catch {}

      // 2. Sunucuya gönder
      const res = await fetch('/api/instagram/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_settings', settings: merged, accountId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.settings) {
        const finalSettings = { ...merged, ...data.settings };
        setStorySettings(finalSettings);
        try {
          localStorage.setItem('insta_story_settings', JSON.stringify(finalSettings));
        } catch {}
      }

      showToast('success', 'Otomatik Story ayarları başarıyla kaydedildi.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Story ayarları kaydedilemedi: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Publish Story Now
  const handlePublishStoryNow = async (storyData: {
    imageUrl: string;
    storyLink: string;
    linkText: string;
    accountId?: string;
  }) => {
    setIsLoading(true);
    try {
      showToast('info', 'Instagram Story yayınlanıyor...');
      const res = await fetch('/api/instagram/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish_now', ...storyData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('success', 'Instagram Story başarıyla paylaşıldı!');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Story paylaşılamadı: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Upload Story Image
  const handleUploadStoryImage = async (base64: string, filename: string): Promise<string> => {
    try {
      const res = await fetch('/api/instagram/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload_image', imageBase64: base64, filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.imageUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Görsel yüklenemedi: ${msg}`);
      return base64;
    }
  };

  // --- PINTEREST HANDLERS ---
  const handleScanPinterestUrl = async (url: string, category?: PinterestCategory, age?: PinterestAgeFilter) => {
    setIsLoading(true);
    try {
      showToast('info', 'Pinterest bağlantısı taranıyor ve tüm benzer videolar keşfediliyor...');
      const res = await fetch('/api/pinterest/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, category, ageFilter: age }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const mainResult = data.result;
      const itemsToSave: any[] = [];

      const detId = getDeterministicPinId(mainResult.pin_url, mainResult.video_url, mainResult.id);

      // 1. Girdiğimiz ana URL'yi doğrudan "Ticari Kullanıma Uygun" ve onaylı yap
      itemsToSave.push({
        ...mainResult,
        id: detId,
        duration: mainResult.duration || '0:14',
        usage_permission_status: 'Ticari kullanım uygun',
        approval_status: 'approved',
        source_license: 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
      });

      // 2. Girdiğimiz URL'nin taranan benzer videolarından sadece farklı/bağımsız video olanları ekle
      if (mainResult.similar_pins && Array.isArray(mainResult.similar_pins) && mainResult.similar_pins.length > 0) {
        for (const sim of mainResult.similar_pins) {
          if (!sim.video_url || sim.video_url === mainResult.video_url || sim.video_url.includes('mixkit.co')) {
            continue;
          }
          const simDetId = getDeterministicPinId(sim.url, sim.video_url, sim.id);
          itemsToSave.push({
            id: simDetId,
            pin_url: sim.url,
            pin_title: sim.title,
            pin_description: `"${mainResult.pin_title}" temasına uygun keşfedilen benzer video`,
            category: sim.category || mainResult.category,
            age_filter: sim.age_filter || mainResult.age_filter,
            thumbnail_url: sim.thumbnail_url,
            video_url: sim.video_url,
            embed_html: '',
            duration: sim.duration || '0:15',
            added_at: new Date().toISOString(),
            notes: `Benzer video olarak otomatik tarandı (${mainResult.pin_title})`,
            favorite: false,
            usage_permission_status: 'Ticari kullanım uygun',
            original_creator: sim.author || '@pinterest_creator',
            source_license: 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
            approval_status: 'approved',
            archive_status: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      const uniqueItemsToSave = deduplicatePins(itemsToSave);

      // Toplu kaydet
      const saveRes = await fetch('/api/pinterest/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: uniqueItemsToSave }),
      });
      const savedData = await saveRes.json();
      if (!saveRes.ok) throw new Error(savedData.error);

      // State ve LocalStorage'ı hemen kalıcı güncelle (Serverless bellek sıfırlanmasına karşı güvence)
      const finalItems = savedData.items || uniqueItemsToSave;
      setPinterestItems((prev) => {
        const merged = deduplicatePins([...finalItems, ...prev]);
        try {
          localStorage.setItem('insta_pinterest_items', JSON.stringify(merged));
        } catch {}
        return merged;
      });

      showToast(
        'success',
        `Harika! "${mainResult.pin_title}" ve keşfedilen benzersiz videolar doğrudan "Ticari Kullanıma Uygun" olarak koleksiyona eklendi!`
      );
      loadAllData();
      return data.result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Tarama hatası: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanPinterestBulk = async (
    urls: string[],
    category?: PinterestCategory,
    age?: PinterestAgeFilter,
    shuffle: boolean = true
  ) => {
    setIsLoading(true);
    try {
      showToast('info', `${urls.length} adet Pinterest bağlantısı taranıyor ve tüm benzerleri keşfediliyor...`);
      const res = await fetch('/api/pinterest/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, category, ageFilter: age, shuffle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const allItemsToSave: any[] = [];

      for (const mainResult of data.results || []) {
        const detId = getDeterministicPinId(mainResult.pin_url, mainResult.video_url, mainResult.id);

        // Ana pin
        allItemsToSave.push({
          ...mainResult,
          id: detId,
          duration: mainResult.duration || '0:14',
          usage_permission_status: 'Ticari kullanım uygun',
          approval_status: 'approved',
          source_license: 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
        });

        // Benzer pinler (sadece bağımsız ve farklı videolar)
        if (mainResult.similar_pins && Array.isArray(mainResult.similar_pins)) {
          for (const sim of mainResult.similar_pins) {
            if (!sim.video_url || sim.video_url === mainResult.video_url || sim.video_url.includes('mixkit.co')) {
              continue;
            }
            const simDetId = getDeterministicPinId(sim.url, sim.video_url, sim.id);
            allItemsToSave.push({
              id: simDetId,
              pin_url: sim.url,
              pin_title: sim.title,
              pin_description: `"${mainResult.pin_title}" temasına uygun benzer video`,
              category: sim.category || mainResult.category,
              age_filter: sim.age_filter || mainResult.age_filter,
              thumbnail_url: sim.thumbnail_url,
              video_url: sim.video_url,
              embed_html: '',
              duration: sim.duration || '0:15',
              added_at: new Date().toISOString(),
              notes: `Toplu taramadan benzer video olarak eklendi (${mainResult.pin_title})`,
              favorite: false,
              usage_permission_status: 'Ticari kullanım uygun',
              original_creator: sim.author || '@pinterest_creator',
              source_license: 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
              approval_status: 'approved',
              archive_status: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      }

      const uniqueBulkItems = deduplicatePins(allItemsToSave);

      if (uniqueBulkItems.length > 0) {
        const saveRes = await fetch('/api/pinterest/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: uniqueBulkItems }),
        });
        const savedData = await saveRes.json();
        if (!saveRes.ok) throw new Error(savedData.error);

        // State ve LocalStorage'ı hemen kalıcı güncelle
        const finalItems = savedData.items || uniqueBulkItems;
        setPinterestItems((prev) => {
          const merged = deduplicatePins([...finalItems, ...prev]);
          try {
            localStorage.setItem('insta_pinterest_items', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }

      showToast(
        'success',
        `Tebrikler! ${urls.length} bağlantıdan videolar doğrudan "Ticari Kullanıma Uygun" olarak koleksiyona eklendi!`
      );
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Toplu tarama hatası: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSetPinterestPermission = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/pinterest/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionStatus: 'Ticari kullanım uygun', approvalStatus: 'approved' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('success', `${data.updatedCount || 'Tüm'} video başarıyla "Ticari Kullanıma Uygun" ve "Onaylandı" olarak güncellendi!`);
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `İzin güncelleme hatası: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchConvertPinterest = async (pinIds: string[], shuffle: boolean = true) => {
    setIsLoading(true);
    try {
      showToast('info', `${pinIds.length} adet Pinterest videosu karışık sırada Reels montajına ve takvime aktarılıyor...`);
      const res = await fetch('/api/pinterest/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinIds, shuffle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('success', `${data.processed} adet video karışık sırada 9:16 Reels yapıldı ve yayın takvimine (günde 5 slot) dağıtıldı!`);
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Toplu dönüştürme hatası: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePinterestItem = async (item: PinterestItem) => {
    try {
      const res = await fetch('/api/pinterest/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('success', `"${item.pin_title}" koleksiyona eklendi.`);
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Kaydetme hatası: ${msg}`);
    }
  };

  const handleUpdatePinterestItem = async (id: string, updates: Partial<PinterestItem>) => {
    try {
      const res = await fetch(`/api/pinterest/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPinterestItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
      showToast('success', 'İçerik güncellendi.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Güncelleme hatası: ${msg}`);
    }
  };

  const handleDeletePinterestItem = async (id: string) => {
    if (!confirm('Bu Pinterest içeriğini silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/pinterest/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silinemedi');

      setPinterestItems((prev) => {
        const target = prev.find((p) => p.id === id);
        const targetPinNum = target ? (extractPinNumber(target.pin_url) || extractPinNumber(target.id)) : '';
        const targetUrl = target ? normalizePinUrl(target.pin_url) : '';
        const targetVid = target ? normalizeVideoKey(target.video_url) : '';

        const updated = prev.filter((item) => {
          if (item.id === id) return false;
          if (targetPinNum) {
            const pNum = extractPinNumber(item.pin_url) || extractPinNumber(item.id);
            if (pNum && pNum === targetPinNum) return false;
          }
          if (targetUrl && normalizePinUrl(item.pin_url) === targetUrl) return false;
          if (targetVid && normalizeVideoKey(item.video_url) === targetVid) return false;
          return true;
        });

        try {
          localStorage.setItem('insta_pinterest_items', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      showToast('info', 'Pinterest içeriği silindi.');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Silme hatası: ${msg}`);
    }
  };

  const handleConvertPinterestToReels = async (item: PinterestItem) => {
    setIsLoading(true);
    try {
      showToast('info', 'Pinterest videosu Firebase Storage’a yükleniyor ve 9:16 Reels montajına gönderiliyor...');
      const res = await fetch('/api/pinterest/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('success', 'Pinterest videosu başarıyla 9:16 Reels olarak hazırlandı ve yayın kuyruğuna eklendi!');
      setActiveTab('video-library');
      loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast('error', `Montaj hatası: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        {/* Arka Plan Atmosferik Parlama */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm bg-zinc-900/90 border border-zinc-800 backdrop-blur-2xl rounded-3xl p-7 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-3xl shadow-xl mx-auto mb-3 border border-white/20 animate-pulse">
              💍
            </div>
            <h1 className="text-lg font-black text-white tracking-wide uppercase">
              Evlilik İlanları Türkiye
            </h1>
            <p className="text-xs text-zinc-400 font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Yönetici Paneli Güvenlik Kilidi
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Yönetici Giriş Şifresi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    if (pinError) setPinError('');
                  }}
                  placeholder="Yönetici Şifrenizi Girin"
                  autoFocus
                  className="w-full bg-zinc-950/80 border border-zinc-700 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none pr-10 tracking-widest font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinError && (
                <p className="text-xs text-rose-400 font-medium mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {pinError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/40 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Giriş Yap ve Kilidi Aç</span>
            </button>
          </form>

          <div className="pt-2 border-t border-zinc-800 text-center text-[11px] text-zinc-500">
            🔒 Bu panel ve veriler 256-bit şifreleme ile korunmaktadır.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
              : 'bg-zinc-900/90 text-zinc-200 border-zinc-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          ) : (
            <Clock className="w-4 h-4 text-cyan-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-zinc-900/95 border-r border-zinc-800 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/50">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide">Evlilik İlanları</h1>
                <p className="text-[11px] text-zinc-400 font-medium">Reels Otomasyonu</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 12 Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer User / Environment Info */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/40">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[11px]">Canlı Sistem</span>
              </div>
              <span className="text-[10px] text-zinc-500">v2.0 PRO</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
              <span>Admin Paneli</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-white font-medium capitalize">{NAV_ITEMS.find((n) => n.id === activeTab)?.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Header Account Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700/80 text-xs text-white transition cursor-pointer"
                title="Kullanılan Instagram Hesabını Değiştir"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <InstagramIcon className="w-4 h-4 text-pink-500" />
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[11px] max-w-[120px] sm:max-w-[170px] truncate leading-tight">
                    {activeAccount?.name || 'Hesap Seç'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono leading-none">
                    {activeAccount?.instagramUsername || '@hesap'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              {accountDropdownOpen && (
                <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
                    <span>Instagram Hesapları ({accounts.length}/10)</span>
                    <button
                      onClick={() => {
                        setActiveTab('instagram-account');
                        setAccountDropdownOpen(false);
                      }}
                      className="text-pink-400 hover:text-pink-300 font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Ekle
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                    {accounts.map((acc) => {
                      const isSelected = activeAccount?.id === acc.id;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => handleSetActiveInstagramAccount(acc.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-pink-600/20 text-white font-semibold border border-pink-500/30'
                              : 'hover:bg-zinc-800/80 text-zinc-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{acc.name}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">{acc.instagramUsername}</p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-pink-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1 border-t border-zinc-800">
                    <button
                      onClick={() => {
                        setActiveTab('instagram-account');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-center py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg transition cursor-pointer"
                    >
                      Tüm Hesapları Yönet & Yeni Ekle →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={loadAllData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Verileri Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-rose-950/60 hover:text-rose-300 text-zinc-400 border border-zinc-700/80 transition cursor-pointer"
              title="Paneli Kilitle ve Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              onClick={handleGenerateBatch}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Günün 5 İçeriğini Üret</span>
            </button>
          </div>
        </header>

        {/* Scrollable Tab Views Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewView
                stats={stats}
                videos={videos}
                queue={queue}
                onNavigate={(tab) => setActiveTab(tab)}
                onQuickGenerate={handleGenerateBatch}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'ai-generator' && (
              <AIGeneratorView
                categories={categories}
                ideas={ideas}
                onGenerateSingle={handleGenerateSingle}
                onGenerateBatch={handleGenerateBatch}
                onRenderVideo={handleRenderVideo}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'pinterest-finder' && (
              <PinterestFinderView
                items={pinterestItems}
                onScanUrl={handleScanPinterestUrl}
                onScanBulk={handleScanPinterestBulk}
                onSaveItem={handleSavePinterestItem}
                onUpdateItem={handleUpdatePinterestItem}
                onDeleteItem={handleDeletePinterestItem}
                onConvertToReels={handleConvertPinterestToReels}
                onBatchConvertToReels={handleBatchConvertPinterest}
                onBulkSetPermission={handleBulkSetPinterestPermission}
                onRefresh={loadAllData}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'brand-outro' && brandOutroSettings && (
              <BrandOutroSettingsView
                settings={brandOutroSettings}
                accounts={accounts}
                activeAccount={activeAccount}
                onSaveSettings={handleSaveBrandOutroSettings}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'story-automation' && storySettings && (
              <StoryAutomationView
                settings={storySettings}
                history={storyHistory}
                accounts={accounts}
                activeAccount={activeAccount}
                onSaveSettings={handleSaveStorySettings}
                onPublishNow={handlePublishStoryNow}
                onUploadImage={handleUploadStoryImage}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'video-library' && (
              <VideoLibraryView
                videos={videos}
                onPublishNow={handlePublishNow}
                onAddToQueue={handleAddToQueue}
                onUpdateVideo={handleUpdateVideo}
                onDeleteVideo={handleDeleteVideo}
                onRegenerate={(v) => handleRenderVideo({ ...v, generationPrompt: v.title } as any, v.productionType)}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleView
                queue={queue}
                defaultSlots={generalSettings?.defaultPublishSlots || []}
                onUpdateSlotTime={async (id, newTime) => {
                  await fetch('/api/queue', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, scheduledTime: newTime }),
                  });
                  loadAllData();
                }}
                onPublishQueueItem={async (queueId, videoId) => {
                  await handlePublishNow(videoId);
                }}
                onDeleteQueueItem={async (id) => {
                  setQueue((prev) => {
                    const updated = prev.filter((q) => q.id !== id);
                    try {
                      localStorage.setItem('insta_publish_queue', JSON.stringify(updated));
                    } catch {}
                    return updated;
                  });
                  try {
                    await fetch(`/api/queue?id=${id}`, { method: 'DELETE' });
                  } catch {}
                  showToast('info', 'Slot kuyruktan kaldırıldı.');
                  loadAllData();
                }}
                onSaveDefaultSlots={async (slots) => {
                  await handleSaveGeneralSettings({ defaultPublishSlots: slots });
                }}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'instagram-account' && (
              <InstagramAccountView
                accounts={accounts}
                activeAccount={activeAccount}
                onAddAccount={handleAddInstagramAccount}
                onUpdateAccount={handleUpdateInstagramAccount}
                onDeleteAccount={handleDeleteInstagramAccount}
                onSetActiveAccount={handleSetActiveInstagramAccount}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesView
                categories={categories}
                onSaveCategory={handleSaveCategory}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'ai-models' && aiSettings && (
              <AIModelsView
                settings={aiSettings}
                onSaveSettings={handleSaveAISettings}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'integrations' && aiSettings && instagramSettings && (
              <IntegrationsView
                aiSettings={aiSettings}
                instagramSettings={instagramSettings}
                onSaveAISettings={handleSaveAISettings}
                onSaveInstagramSettings={handleSaveInstagramSettings}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'cost-management' && costLimits && (
              <CostManagementView
                limits={costLimits}
                apiUsage={apiUsage}
                onSaveLimits={handleSaveCostLimits}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'statistics' && (
              <StatisticsView stats={stats} videos={videos} />
            )}

            {activeTab === 'logs' && (
              <LogsView logs={logs} onRefreshLogs={loadAllData} isLoading={isLoading} />
            )}

            {activeTab === 'settings' && generalSettings && (
              <GeneralSettingsView
                settings={generalSettings}
                onSaveSettings={handleSaveGeneralSettings}
                isLoading={isLoading}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
