'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/MainLayout';
import LoginModal from '@/components/auth/LoginModal';
import AvatarStudioCard from '@/components/settings/AvatarStudioCard';
import NotificationSettingsCard from '@/components/settings/NotificationSettingsCard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useUpdateProfile } from '@/hooks/useUser';

type ActiveSettingsPanel = 'profile' | 'avatar' | 'notifications';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const updateProfile = useUpdateProfile();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ActiveSettingsPanel>('profile');
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      nickname: user.nickname || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    });
  }, [user]);

  const normalizedProfileForm = useMemo(
    () => ({
      nickname: profileForm.nickname.trim(),
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
    }),
    [profileForm],
  );

  const initialProfileForm = useMemo(
    () => ({
      nickname: user?.nickname || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    }),
    [user?.nickname, user?.firstName, user?.lastName],
  );

  const isProfileDirty =
    normalizedProfileForm.nickname !== (initialProfileForm.nickname || '').trim() ||
    normalizedProfileForm.firstName !== (initialProfileForm.firstName || '').trim() ||
    normalizedProfileForm.lastName !== (initialProfileForm.lastName || '').trim();

  const nicknameError =
    normalizedProfileForm.nickname.length === 0
      ? t('profileEditor.validation.nicknameRequired')
      : normalizedProfileForm.nickname.length < 2 || normalizedProfileForm.nickname.length > 20
        ? t('profileEditor.validation.nicknameLength')
        : null;

  const canSaveProfile = !!user && isProfileDirty && !nicknameError && !updateProfile.isPending;

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user || nicknameError || !isProfileDirty) return;

    try {
      await updateProfile.mutateAsync(normalizedProfileForm);
      showToast(t('profileEditor.toast.saved'), 'success');
    } catch (error: any) {
      showToast(error?.message || t('profileEditor.toast.failed'), 'error');
    }
  };

  const resetProfileForm = () => {
    setProfileForm({
      nickname: user?.nickname || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  };

  const handleSaveAvatar = async (avatarValue: string) => {
    try {
      await updateProfile.mutateAsync({ avatar: avatarValue });
      showToast('아바타가 업데이트되었습니다.', 'success');
    } catch (error: any) {
      showToast(error?.message || '아바타 업데이트에 실패했습니다.', 'error');
    }
  };

  const handleClearAvatar = async () => {
    try {
      await updateProfile.mutateAsync({ avatar: '' });
      showToast('아바타가 제거되었습니다.', 'success');
    } catch (error: any) {
      showToast(error?.message || '아바타 제거에 실패했습니다.', 'error');
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8 shadow-sm">
          <p className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            {t('badge')}
          </p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('authRequiredTitle')}</h1>
          <p className="mt-2 text-gray-600">{t('authRequiredDescription')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {t('loginCta')}
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-400"
            >
              {t('previewCta')}
            </button>
          </div>
        </div>

        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </MainLayout>
    );
  }

  const tabs: Array<{ id: ActiveSettingsPanel; label: string; description: string }> = [
    {
      id: 'profile',
      label: t('profileEditor.title'),
      description: t('profileEditor.description'),
    },
    {
      id: 'avatar',
      label: t('items.avatar.label'),
      description: t('items.avatar.description'),
    },
    {
      id: 'notifications',
      label: t('sections.notifications.title'),
      description: t('sections.notifications.description'),
    },
  ];

  const activeTab = tabs.find((tab) => tab.id === activePanel) ?? tabs[0];

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            {t('badge')}
          </p>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-gray-500">{t('subtitle')}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t('accountSnapshot')}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{user?.nickname}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">{t('title')}</p>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              {t('status.ready')}
            </span>
          </div>

          <nav className="space-y-1" aria-label="Settings sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePanel(tab.id)}
                className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                  activePanel === tab.id
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <p className="text-sm font-semibold">{tab.label}</p>
                <p
                  className={`mt-1 text-xs ${
                    activePanel === tab.id ? 'text-blue-600/80' : 'text-gray-500'
                  }`}
                >
                  {tab.description}
                </p>
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:hidden">
            <p className="text-sm font-semibold text-gray-900">{activeTab.label}</p>
            <p className="mt-1 text-sm text-gray-500">{activeTab.description}</p>
          </section>

          {activePanel === 'profile' && (
            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('profileEditor.title')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('profileEditor.description')}</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">{t('profileEditor.fields.nickname')}</span>
              <input
                type="text"
                value={profileForm.nickname}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, nickname: e.target.value }))}
                maxLength={20}
                disabled={updateProfile.isPending}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
                  nicknameError
                    ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {nicknameError && <span className="mt-1 block text-xs text-red-600">{nicknameError}</span>}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">{t('profileEditor.fields.email')}</span>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">{t('profileEditor.fields.firstName')}</span>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                disabled={updateProfile.isPending}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">{t('profileEditor.fields.lastName')}</span>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                disabled={updateProfile.isPending}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="lg:col-span-2 flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">{t('profileEditor.help')}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetProfileForm}
                  disabled={!isProfileDirty || updateProfile.isPending}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {t('profileEditor.actions.reset')}
                </button>
                <button
                  type="submit"
                  disabled={!canSaveProfile}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {updateProfile.isPending ? t('profileEditor.actions.saving') : t('profileEditor.actions.save')}
                </button>
              </div>
            </div>
          </form>
            </section>
          )}

          {activePanel === 'avatar' && (
            <AvatarStudioCard
              avatar={user?.avatar}
              nickname={user?.nickname || 'U'}
              isSaving={updateProfile.isPending}
              onSaveAvatar={handleSaveAvatar}
              onClearAvatar={handleClearAvatar}
            />
          )}

          {activePanel === 'notifications' && <NotificationSettingsCard />}
        </div>
      </div>

      <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-900">{t('planTitle')}</p>
        <p className="mt-1 text-sm text-gray-500">{t('planDescription')}</p>
      </section>
    </MainLayout>
  );
}
