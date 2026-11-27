'use client';

import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Video,
  CalendarDays,
  FolderTree,
  Cpu,
  KeyRound,
  Coins,
  BarChart3,
  ScrollText,
  Sliders,
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  PlusCircle,
  Play,
  RotateCw,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  Send,
  Save,
  Check,
  AlertCircle,
  Compass,
  Megaphone,
  ImagePlus
} from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';

export type NavTab =
  | 'overview'
  | 'ai-generator'
  | 'pinterest-finder'
  | 'brand-outro'
  | 'story-automation'
  | 'video-library'
  | 'schedule'
  | 'instagram-account'
  | 'categories'
  | 'ai-models'
  | 'integrations'
  | 'cost-management'
  | 'statistics'
  | 'logs'
  | 'settings';

export interface NavItem {
  id: NavTab;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', title: 'Genel Bakış', icon: LayoutDashboard },
  { id: 'ai-generator', title: 'AI İçerik Üretimi', icon: Sparkles, badge: '5/gün' },
  { id: 'pinterest-finder', title: 'Pinterest Video Bulucu', icon: Compass, badge: 'Yeni' },
  { id: 'brand-outro', title: 'Marka Reklam Sonu', icon: Megaphone, badge: '3-5 sn' },
  { id: 'story-automation', title: 'Otomatik Story (Hikaye)', icon: ImagePlus, badge: '24s' },
  { id: 'video-library', title: 'Video Kütüphanesi', icon: Video },
  { id: 'schedule', title: 'Yayın Takvimi', icon: CalendarDays },
  { id: 'instagram-account', title: 'Instagram Hesabı', icon: InstagramIcon },
  { id: 'categories', title: 'İçerik Kategorileri', icon: FolderTree },
  { id: 'ai-models', title: 'AI Model Ayarları', icon: Cpu },
  { id: 'integrations', title: 'API ve Entegrasyonlar', icon: KeyRound },
  { id: 'cost-management', title: 'Maliyet ve Kullanım', icon: Coins },
  { id: 'statistics', title: 'İstatistikler', icon: BarChart3 },
  { id: 'logs', title: 'Sistem Logları', icon: ScrollText },
  { id: 'settings', title: 'Genel Ayarlar', icon: Sliders },
];
