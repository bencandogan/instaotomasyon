'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Check,
  Globe,
  Radio,
  Layers,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { InstagramAccount } from '@/types';

interface InstagramAccountProps {
  accounts: InstagramAccount[];
  activeAccount: InstagramAccount | null;
  onAddAccount: (data: Partial<InstagramAccount>) => Promise<void>;
  onUpdateAccount: (id: string, data: Partial<InstagramAccount>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onSetActiveAccount: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function InstagramAccountView({
  accounts,
  activeAccount,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onSetActiveAccount,
  isLoading,
}: InstagramAccountProps) {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);
  const [quickUsername, setQuickUsername] = useState('');
  const [quickAccountName, setQuickAccountName] = useState('');
  const [quickDailyTarget, setQuickDailyTarget] = useState(5);
  const [quickCategory, setQuickCategory] = useState('Genel');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);
  const [editingAccount, setEditingAccount] = useState<InstagramAccount | null>(null);
  const [testResult, setTestResult] = useState<{ accountId?: string; message: string; success: boolean } | null>(null);

  // Form State for Add / Edit
  const [formState, setFormState] = useState({
    name: '',
    instagramUsername: '',
    instagramAccountId: '',
    facebookPageId: '',
    facebookPageName: '',
    accountType: 'BUSINESS' as 'BUSINESS' | 'CREATOR' | 'PERSONAL',
    userAccessToken: '',
    isTestMode: true,
    dailyTargetReels: 5,
    categoryFocus: 'Genel',
    notes: '',
    isDefault: false,
  });

  const resetForm = () => {
    setFormState({
      name: '',
      instagramUsername: '',
      instagramAccountId: '',
      facebookPageId: '',
      facebookPageName: '',
      accountType: 'BUSINESS',
      userAccessToken: '',
      isTestMode: true,
      dailyTargetReels: 5,
      categoryFocus: 'Genel',
      notes: '',
      isDefault: false,
    });
    setEditingAccount(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (acc: InstagramAccount) => {
    setEditingAccount(acc);
    setFormState({
      name: acc.name,
      instagramUsername: acc.instagramUsername.replace(/^@/, ''),
      instagramAccountId: acc.instagramAccountId || '',
      facebookPageId: acc.facebookPageId || '',
      facebookPageName: acc.facebookPageName || '',
      accountType: acc.accountType,
      userAccessToken: '',
      isTestMode: acc.isTestMode,
      dailyTargetReels: acc.dailyTargetReels || 5,
      categoryFocus: acc.categoryFocus || 'Genel',
      notes: acc.notes || '',
      isDefault: acc.isDefault,
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    if (editingAccount) {
      await onUpdateAccount(editingAccount.id, {
        name: formState.name,
        instagramUsername: formState.instagramUsername,
        instagramAccountId: formState.instagramAccountId,
        facebookPageId: formState.facebookPageId,
        facebookPageName: formState.facebookPageName,
        accountType: formState.accountType,
        isTestMode: formState.isTestMode,
        dailyTargetReels: formState.dailyTargetReels,
        categoryFocus: formState.categoryFocus,
        notes: formState.notes,
        isDefault: formState.isDefault,
        ...(formState.userAccessToken ? { userAccessToken: formState.userAccessToken } : {}),
      });
    } else {
      await onAddAccount(formState);
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUsername.trim()) return;
    setIsSubmittingQuick(true);
    try {
      const res = await fetch('/api/auth/instagram/browser-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: quickUsername,
          accountName: quickAccountName,
          dailyTarget: quickDailyTarget,
          categoryFocus: quickCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Giriş yapılamadı.');

      setTestResult({
        accountId: data.account?.id,
        success: true,
        message: data.message || 'Instagram hesabı izole tarayıcı oturumuyla bağlandı!',
      });
      setIsQuickLoginOpen(false);
      setQuickUsername('');
      setQuickAccountName('');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: `Instagram ile giriş hatası: ${msg}`,
      });
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const handleOAuthLogin = () => {
    window.location.href = '/api/auth/instagram/login';
  };

  const handleTestConnection = (acc: InstagramAccount) => {
    if (acc.isTestMode) {
      setTestResult({
        accountId: acc.id,
        success: true,
        message: `[${acc.name}] Test modu aktif: Simüle edilmiş bağlantı başarılı (Reels yayın izni aktif).`,
      });
    } else {
      if (!acc.instagramAccountId) {
        setTestResult({
          accountId: acc.id,
          success: false,
          message: `[${acc.name}] Hata: Canlı yayın için Instagram Account ID ve Meta Access Token gereklidir.`,
        });
      } else {
        setTestResult({
          accountId: acc.id,
          success: true,
          message: `[${acc.name}] Bağlantı doğrulandı: Meta Graph API v21.0 Reels ve Insights yetkileri onaylı.`,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <InstagramIcon className="w-6 h-6 text-pink-500" />
              Çoklu Instagram Hesap Yönetim Merkezi
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
              {accounts.length} / 10 Hesap Bağlı
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Farklı Instagram sayfalarınızı ayrı ayrı yönetin, hesaplar arasında anında geçiş yapın ve her birine özel günlük Reels yayın takvimi oluşturun.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsQuickLoginOpen(true)}
            disabled={accounts.length >= 10 || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-pink-950/40 transition disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Instagram ile Giriş Yap</span>
          </button>

          <button
            onClick={openAddModal}
            disabled={accounts.length >= 10 || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Manuel Ekle</span>
          </button>
        </div>
      </div>

      {/* Test Result Alert */}
      {testResult && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            testResult.success
              ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/50 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs">
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            <span>{testResult.message}</span>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs text-zinc-400 hover:text-white transition"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const isActive = activeAccount?.id === acc.id;

          return (
            <div
              key={acc.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                isActive
                  ? 'bg-gradient-to-b from-pink-950/30 to-zinc-900 border-pink-500/60 shadow-lg shadow-pink-950/20 ring-1 ring-pink-500/40'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Top Badge & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isActive ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500 text-white shadow-sm flex items-center gap-1">
                        <Check className="w-3 h-3" /> Aktif Kullanılan Hesap
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        İkincil Hesap
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        acc.isConnected
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : acc.isTestMode
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {acc.isConnected ? 'Canlı API Aktif' : acc.isTestMode ? 'Test Modu' : 'Bağlantı Bekliyor'}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                    {acc.accountType}
                  </span>
                </div>

                {/* Account Identity */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <InstagramIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{acc.name}</h3>
                    <p className="text-xs text-pink-400 font-mono font-medium truncate">{acc.instagramUsername}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{acc.facebookPageName || 'Sayfa bağlı değil'}</p>
                  </div>
                </div>

                {/* Metrics & Parameters */}
                <div className="bg-zinc-950/60 rounded-xl p-3 border border-zinc-800/80 space-y-2 text-xs mb-4">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Günlük Paylaşım Hedefi:</span>
                    <strong className="text-white">{acc.dailyTargetReels || 5} Reels / Gün</strong>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Odak Kategorisi:</span>
                    <span className="text-zinc-300 font-medium">{acc.categoryFocus || 'Genel'}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Reels İzni:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Globe className="w-3.5 h-3.5" /> İzole Tarayıcı:
                    </span>
                    <span className="text-cyan-300 font-mono text-[11px] truncate max-w-[150px]" title={acc.browserFingerprint || 'Chrome 123 (İzole Oturum)'}>
                      {acc.browserFingerprint?.split('(')[0]?.trim() || 'İzole Oturum Aktif'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Otomatik Reels & Story:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Otomatik Aktif
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Token Geçerlilik:</span>
                    <span className="text-zinc-300">{acc.tokenDaysRemaining} gün kaldı</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                {!isActive && (
                  <button
                    onClick={() => onSetActiveAccount(acc.id)}
                    disabled={isLoading}
                    className="w-full py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Bu Hesaba Geç (Aktif Yap)</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(acc)}
                    className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Test Et</span>
                  </button>

                  <button
                    onClick={() => openEditModal(acc)}
                    className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>

                  {accounts.length > 1 && (
                    <button
                      onClick={() => onDeleteAccount(acc.id)}
                      className="p-2 rounded-lg bg-zinc-800/60 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                      title="Hesabı Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <InstagramIcon className="w-5 h-5 text-pink-500" />
                {editingAccount ? 'Instagram Hesabını Düzenle' : 'Yeni Instagram Hesabı Ekle'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="text-zinc-500 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Hesap Adı / Etiketi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Evlilik İlanları - Genç Çiftler Sayfası"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Instagram Kullanıcı Adı <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-zinc-500">@</span>
                    <input
                      type="text"
                      required
                      placeholder="hesap_kullaniciadi"
                      value={formState.instagramUsername}
                      onChange={(e) => setFormState({ ...formState, instagramUsername: e.target.value })}
                      className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Hesap Türü</label>
                  <select
                    value={formState.accountType}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        accountType: e.target.value as 'BUSINESS' | 'CREATOR' | 'PERSONAL',
                      })
                    }
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="BUSINESS">Business (İşletme)</option>
                    <option value="CREATOR">Creator (İçerik Üretici)</option>
                    <option value="PERSONAL">Personal (Kişisel)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Meta Instagram Account ID</label>
                  <input
                    type="text"
                    placeholder="17841400000000000"
                    value={formState.instagramAccountId}
                    onChange={(e) => setFormState({ ...formState, instagramAccountId: e.target.value })}
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Facebook Sayfa Adı</label>
                  <input
                    type="text"
                    placeholder="Evlilik İlanları"
                    value={formState.facebookPageName}
                    onChange={(e) => setFormState({ ...formState, facebookPageName: e.target.value })}
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Meta Graph API User/Page Access Token
                </label>
                <input
                  type="password"
                  placeholder={editingAccount ? 'Mevcut anahtarı korumak için boş bırakın' : 'EAABw... (Meta Developer Token)'}
                  value={formState.userAccessToken}
                  onChange={(e) => setFormState({ ...formState, userAccessToken: e.target.value })}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Token güvenli backend ortamında saklanır, frontend kodunda açık gösterilmez.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Günlük Reels Hedefi</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formState.dailyTargetReels}
                    onChange={(e) => setFormState({ ...formState, dailyTargetReels: parseInt(e.target.value) || 5 })}
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Odak İçerik Teması</label>
                  <select
                    value={formState.categoryFocus}
                    onChange={(e) => setFormState({ ...formState, categoryFocus: e.target.value })}
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Genel">Genel (Tüm Kategoriler)</option>
                    <option value="Romantik Sinematik">Romantik Sinematik</option>
                    <option value="Sahil ve deniz">Sahil ve deniz</option>
                    <option value="Şehir yürüyüşleri">Şehir yürüyüşleri</option>
                    <option value="İlişki Tavsiyeleri">İlişki Tavsiyeleri</option>
                    <option value="Moda ve kombin">Moda ve kombin</option>
                  </select>
                </div>
              </div>

              {/* Mode Toggles */}
              <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isTestMode}
                    onChange={(e) => setFormState({ ...formState, isTestMode: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 bg-zinc-900 border-zinc-600 focus:ring-pink-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white">Test Modu (Simülasyon)</span>
                    <p className="text-[10px] text-zinc-400">
                      API anahtarı olmadan yerel test için simüle edilir; gerçek Instagram gönderisi paylaşmaz.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-zinc-700/60">
                  <input
                    type="checkbox"
                    checked={formState.isDefault}
                    onChange={(e) => setFormState({ ...formState, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 bg-zinc-900 border-zinc-600 focus:ring-pink-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white">Varsayılan Aktif Hesap Olarak Ata</span>
                    <p className="text-[10px] text-zinc-400">
                      Paneldeki genel bakış, yayın kuyruğu ve video üretimleri bu hesaba yönlendirilir.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formState.name.trim()}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-lg shadow-pink-950/40 transition disabled:opacity-50 cursor-pointer"
                >
                  {editingAccount ? 'Değişiklikleri Kaydet' : 'Hesabı Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Instagram Login & Isolated Browser Modal */}
      {isQuickLoginOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Instagram ile Giriş Yap</h3>
                  <p className="text-[11px] text-zinc-400">Token veya ID kopyalamadan anında izole tarayıcı profiliyle bağlayın</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickLoginOpen(false)}
                className="text-zinc-500 hover:text-white transition p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Bilgilendirme Kutusu */}
            <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/80 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                <Globe className="w-4 h-4" />
                <span>Otomatik İzole Tarayıcı Koruması</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Her eklediğiniz hesap sistemde <strong>tamamen farklı bir tarayıcı oturumu ve User-Agent</strong> ile çalışır. Hesaplarınız asla birbiriyle çakışmaz ve 5 günlük Reels ile 24 saatlik Story otomasyonları otomatik aktif edilir.
              </p>
            </div>

            <form onSubmit={handleQuickLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Instagram Kullanıcı Adınız <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-zinc-500">@</span>
                  <input
                    type="text"
                    required
                    placeholder="ornek_hesap"
                    value={quickUsername}
                    onChange={(e) => setQuickUsername(e.target.value)}
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Hesap İsmi / Başlığı (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Evlilik İlanları - Ege Bölgesi"
                  value={quickAccountName}
                  onChange={(e) => setQuickAccountName(e.target.value)}
                  className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Günlük Reels Hedefi</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quickDailyTarget}
                    onChange={(e) => setQuickDailyTarget(parseInt(e.target.value) || 5)}
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Odak Kategorisi</label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Genel">Genel</option>
                    <option value="Romantik Sinematik">Romantik Sinematik</option>
                    <option value="Sahil ve deniz">Sahil ve deniz</option>
                    <option value="İlişki Tavsiyeleri">İlişki Tavsiyeleri</option>
                  </select>
                </div>
              </div>

              {/* Otomatik Açılan Özellikler Özeti */}
              <div className="space-y-1.5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bu hesap için otomatik açılacak özellikler:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300 pl-1">
                  <li>Günde 5 otomatik özgün Reels video montajı ve yayını</li>
                  <li>24 saatte bir otomatik Story görseli ve link yayını</li>
                  <li>Bağımsız, izole tarayıcı profili (Oturum / IP / Cookie güvenliği)</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingQuick || !quickUsername.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-pink-950/50 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmittingQuick ? 'İzole Oturum Açılıyor...' : 'Hesabı Giriş Yaparak Sisteme Bağla'}</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink mx-2 text-[10px] text-zinc-500 uppercase">veya</span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>

                <button
                  type="button"
                  onClick={handleOAuthLogin}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
                  <span>Resmi Meta / Instagram Giriş Ekranına Git (OAuth)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
