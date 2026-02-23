'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/MainLayout';
import LoginModal from '@/components/auth/LoginModal';
import AvatarStudioCard from '@/components/settings/AvatarStudioCard';
import NotificationSettingsCard from '@/components/settings/NotificationSettingsCard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useUpdateProfile } from '@/hooks/useUser';

type ItemStatus = 'ready' | 'partial' | 'planned' | 'danger';

interface SettingItem {
  id: string;
  label: string;
  description: string;
  value?: string;
  status: ItemStatus;
  actionLabel: string;
  disabled?: boolean;
}

interface SettingSection {
  id: string;
  title: string;
  description: string;
  items: SettingItem[];
}

function StatusBadge({ status, label }: { status: ItemStatus; label: string }) {
  const styles: Record<ItemStatus, string> = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    planned: 'bg-slate-100 text-slate-600 border-slate-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {label}
    </span>
  );
}

function SettingsSectionCard({ section, t }: { section: SettingSection; t: ReturnType<typeof useTranslations> }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{section.description}</p>
      </div>

      <div className="space-y-3">
        {section.items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-4 ${item.status === 'danger' ? 'border-red-100 bg-red-50/40' : 'border-gray-200 bg-gray-50/60'}`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <StatusBadge status={item.status} label={t(`status.${item.status}`)} />
                </div>
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                {item.value && (
                  <p className="mt-2 text-sm text-gray-700">
                    <span className="text-gray-400">{t('currentValue')}: </span>
                    <span className="font-medium">{item.value}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={item.disabled ?? true}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.status === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-200 disabled:text-red-50'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400'
                }`}
              >
                {item.actionLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const updateProfile = useUpdateProfile();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    firstName: '',
    lastName: '',
  });

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const profileName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.nickname
    : '-';

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      nickname: user.nickname || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    });
  }, [user]);

  const normalizedProfileForm = useMemo(() => ({
    nickname: profileForm.nickname.trim(),
    firstName: profileForm.firstName.trim(),
    lastName: profileForm.lastName.trim(),
  }), [profileForm]);

  const initialProfileForm = useMemo(() => ({
    nickname: user?.nickname || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  }), [user?.nickname, user?.firstName, user?.lastName]);

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

  const sections = useMemo<SettingSection[]>(() => [
    {
      id: 'account',
      title: t('sections.account.title'),
      description: t('sections.account.description'),
      items: [
        {
          id: 'profile',
          label: t('items.profile.label'),
          description: t('items.profile.description'),
          value: profileName,
          status: 'partial',
          actionLabel: t('actions.edit'),
        },
        {
          id: 'email',
          label: t('items.email.label'),
          description: t('items.email.description'),
          value: user?.email || '-',
          status: 'ready',
          actionLabel: t('actions.view'),
        },
        {
          id: 'avatar',
          label: t('items.avatar.label'),
          description: t('items.avatar.description'),
          value: user?.avatar ? t('values.avatarUploaded') : t('values.avatarDefault'),
          status: 'planned',
          actionLabel: t('actions.upload'),
        },
      ],
    },
    {
      id: 'preferences',
      title: t('sections.preferences.title'),
      description: t('sections.preferences.description'),
      items: [
        {
          id: 'language',
          label: t('items.language.label'),
          description: t('items.language.description'),
          value: locale === 'ko' ? t('values.korean') : t('values.english'),
          status: 'ready',
          actionLabel: t('actions.change'),
        },
        {
          id: 'timezone',
          label: t('items.timezone.label'),
          description: t('items.timezone.description'),
          value: timezone,
          status: 'planned',
          actionLabel: t('actions.configure'),
        },
        {
          id: 'home',
          label: t('items.startPage.label'),
          description: t('items.startPage.description'),
          value: t('values.dashboardHome'),
          status: 'planned',
          actionLabel: t('actions.configure'),
        },
        {
          id: 'boardDensity',
          label: t('items.boardDensity.label'),
          description: t('items.boardDensity.description'),
          value: t('values.comfortable'),
          status: 'planned',
          actionLabel: t('actions.configure'),
        },
      ],
    },
    {
      id: 'notifications',
      title: t('sections.notifications.title'),
      description: t('sections.notifications.description'),
      items: [
        {
          id: 'mentions',
          label: t('items.mentions.label'),
          description: t('items.mentions.description'),
          status: 'planned',
          actionLabel: t('actions.manage'),
        },
        {
          id: 'boardActivity',
          label: t('items.boardActivity.label'),
          description: t('items.boardActivity.description'),
          status: 'planned',
          actionLabel: t('actions.manage'),
        },
        {
          id: 'reminders',
          label: t('items.reminders.label'),
          description: t('items.reminders.description'),
          status: 'planned',
          actionLabel: t('actions.manage'),
        },
      ],
    },
    {
      id: 'security',
      title: t('sections.security.title'),
      description: t('sections.security.description'),
      items: [
        {
          id: 'password',
          label: t('items.password.label'),
          description: t('items.password.description'),
          status: 'planned',
          actionLabel: t('actions.change'),
        },
        {
          id: 'sessions',
          label: t('items.sessions.label'),
          description: t('items.sessions.description'),
          status: 'partial',
          actionLabel: t('actions.review'),
        },
        {
          id: 'twoFactor',
          label: t('items.twoFactor.label'),
          description: t('items.twoFactor.description'),
          value: t('values.notEnabled'),
          status: 'planned',
          actionLabel: t('actions.enable'),
        },
      ],
    },
    {
      id: 'data',
      title: t('sections.data.title'),
      description: t('sections.data.description'),
      items: [
        {
          id: 'export',
          label: t('items.export.label'),
          description: t('items.export.description'),
          status: 'planned',
          actionLabel: t('actions.export'),
        },
        {
          id: 'integrations',
          label: t('items.integrations.label'),
          description: t('items.integrations.description'),
          status: 'planned',
          actionLabel: t('actions.connect'),
        },
        {
          id: 'apiTokens',
          label: t('items.apiTokens.label'),
          description: t('items.apiTokens.description'),
          status: 'planned',
          actionLabel: t('actions.manage'),
        },
      ],
    },
    {
      id: 'danger',
      title: t('sections.danger.title'),
      description: t('sections.danger.description'),
      items: [
        {
          id: 'logoutAll',
          label: t('items.logoutAll.label'),
          description: t('items.logoutAll.description'),
          status: 'danger',
          actionLabel: t('actions.logoutAll'),
        },
        {
          id: 'deleteAccount',
          label: t('items.deleteAccount.label'),
          description: t('items.deleteAccount.description'),
          status: 'danger',
          actionLabel: t('actions.deleteAccount'),
        },
      ],
    },
  ], [t, profileName, user?.email, user?.avatar, locale, timezone]);

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

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </MainLayout>
    );
  }

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
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {t('accountSnapshot')}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{user?.nickname}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('profileEditor.title')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('profileEditor.description')}</p>
          </div>
          <StatusBadge status="ready" label={t('status.ready')} />
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
            {nicknameError && (
              <span className="mt-1 block text-xs text-red-600">{nicknameError}</span>
            )}
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

      <AvatarStudioCard
        avatar={user?.avatar}
        nickname={user?.nickname || 'U'}
        isSaving={updateProfile.isPending}
        onSaveAvatar={handleSaveAvatar}
        onClearAvatar={handleClearAvatar}
      />

      <NotificationSettingsCard />

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">{t('planTitle')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('planDescription')}</p>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-[28%] rounded-full bg-blue-600" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">{t('status.ready')}</p>
              <p className="mt-1 text-sm font-semibold text-emerald-900">2</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">{t('status.partial')}</p>
              <p className="mt-1 text-sm font-semibold text-amber-900">2</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">{t('status.planned')}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">14</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{t('implementationNotes.title')}</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>• {t('implementationNotes.profile')}</li>
            <li>• {t('implementationNotes.notifications')}</li>
            <li>• {t('implementationNotes.security')}</li>
            <li>• {t('implementationNotes.data')}</li>
          </ul>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        {sections.map((section) => (
          <SettingsSectionCard key={section.id} section={section} t={t} />
        ))}
      </div>
    </MainLayout>
  );
}
