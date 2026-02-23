'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AVATAR_ACCESSORY_STYLES,
  AVATAR_BG_STYLES,
  AVATAR_BROW_STYLES,
  AVATAR_EYE_STYLES,
  AVATAR_HAIR_STYLES,
  AVATAR_HAT_STYLES,
  AVATAR_NOSE_STYLES,
  AVATAR_MOUTH_STYLES,
  AVATAR_PALETTE,
  AVATAR_SHIRT_STYLES,
  AVATAR_SKIN_TONES,
  CUSTOM_AVATAR_PREFIX,
  DEFAULT_CUSTOM_AVATAR,
  CustomAvatarSpec,
  customAvatarToDataUri,
  decodeCustomAvatar,
  encodeCustomAvatar,
  normalizeCustomAvatarSpec,
  randomCustomAvatarSpec,
} from '@/lib/avatar';

type Mode = 'custom' | 'url';

interface AvatarStudioCardProps {
  avatar?: string;
  nickname: string;
  isSaving?: boolean;
  onSaveAvatar: (avatar: string) => Promise<void>;
  onClearAvatar: () => Promise<void>;
}

interface OptionSelectProps {
  label: string;
  value: number;
  options: readonly string[];
  onChange: (value: number) => void;
}

function OptionSelect({ label, value, options, onChange }: OptionSelectProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option, index) => (
          <option key={`${label}-${option}-${index}`} value={index}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PalettePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="grid grid-cols-6 gap-2">
        {AVATAR_PALETTE.map((color, index) => (
          <button
            key={`${label}-${color}`}
            type="button"
            onClick={() => onChange(index)}
            className={`h-8 w-full rounded-md border transition ${value === index ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-200'}`}
            style={{ backgroundColor: color }}
            aria-label={`${label} color ${index + 1}`}
            title={`${label} ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function SkinTonePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Skin tone</p>
      <div className="grid grid-cols-7 gap-2">
        {AVATAR_SKIN_TONES.map((color, index) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(index)}
            className={`h-8 rounded-md border ${value === index ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-200'}`}
            style={{ backgroundColor: color }}
            aria-label={`skin tone ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function AvatarStudioCard({
  avatar,
  nickname,
  isSaving,
  onSaveAvatar,
  onClearAvatar,
}: AvatarStudioCardProps) {
  const isCustomAvatar = !!avatar?.startsWith(CUSTOM_AVATAR_PREFIX);
  const initialSpec = useMemo(
    () => decodeCustomAvatar(avatar) || DEFAULT_CUSTOM_AVATAR,
    [avatar]
  );

  const [mode, setMode] = useState<Mode>(isCustomAvatar ? 'custom' : 'url');
  const [spec, setSpec] = useState<CustomAvatarSpec>(initialSpec);
  const [urlInput, setUrlInput] = useState(!isCustomAvatar ? avatar || '' : '');

  useEffect(() => {
    const parsed = decodeCustomAvatar(avatar);
    if (parsed) {
      setMode('custom');
      setSpec(parsed);
      setUrlInput('');
      return;
    }

    setMode('url');
    setUrlInput(avatar || '');
    setSpec(DEFAULT_CUSTOM_AVATAR);
  }, [avatar]);

  const previewSrc = useMemo(() => {
    if (mode === 'custom') {
      return customAvatarToDataUri(spec, `${nickname} custom avatar`);
    }
    return urlInput.trim() || null;
  }, [mode, spec, urlInput, nickname]);

  const customToken = useMemo(() => encodeCustomAvatar(spec), [spec]);

  const isUrlValid = useMemo(() => {
    const value = urlInput.trim();
    if (!value) return false;
    return /^https?:\/\//i.test(value) || /^data:image\//i.test(value);
  }, [urlInput]);

  const hasChanges = useMemo(() => {
    if (mode === 'custom') {
      const currentToken = avatar?.startsWith(CUSTOM_AVATAR_PREFIX) ? avatar : '';
      return customToken !== currentToken;
    }
    return (avatar || '') !== urlInput.trim();
  }, [mode, avatar, customToken, urlInput]);

  const applyCustom = async () => {
    await onSaveAvatar(customToken);
  };

  const applyUrl = async () => {
    await onSaveAvatar(urlInput.trim());
  };

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Avatar Studio</h2>
          <p className="mt-1 text-sm text-gray-500">
            사진 URL로 설정하거나, 게임처럼 눈/코/입/모자/악세사리를 직접 조합해서 커스텀 아바타를 만들 수 있어요.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
          Experimental
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4">
          <div className="mx-auto h-48 w-48 overflow-hidden rounded-full border-4 border-white bg-white shadow">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt={`${nickname} avatar preview`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl font-semibold text-white">
                {(nickname?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('custom');
                setSpec(randomCustomAvatarSpec());
              }}
              disabled={isSaving}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              랜덤 생성
            </button>
            <button
              type="button"
              onClick={() => setSpec(DEFAULT_CUSTOM_AVATAR)}
              disabled={isSaving}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              기본값
            </button>
            <button
              type="button"
              onClick={onClearAvatar}
              disabled={isSaving || !avatar}
              className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              아바타 제거
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">저장 방식</p>
            <p className="mt-1 text-xs text-gray-600 break-all">
              {mode === 'custom' ? customToken : (urlInput.trim() || '(empty)')}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-4 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              커스텀 제작
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              사진 URL
            </button>
          </div>

          {mode === 'custom' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <OptionSelect label="Background" value={spec.bg} options={AVATAR_BG_STYLES.map((_, i) => `Style ${i + 1}`)} onChange={(v) => setSpec((p) => ({ ...p, bg: v }))} />
                <OptionSelect label="Hair Style" value={spec.hairStyle} options={AVATAR_HAIR_STYLES} onChange={(v) => setSpec((p) => ({ ...p, hairStyle: v }))} />
                <OptionSelect label="Eyes" value={spec.eyeStyle} options={AVATAR_EYE_STYLES} onChange={(v) => setSpec((p) => ({ ...p, eyeStyle: v }))} />
                <OptionSelect label="Brows" value={spec.browStyle} options={AVATAR_BROW_STYLES} onChange={(v) => setSpec((p) => ({ ...p, browStyle: v }))} />
                <OptionSelect label="Nose" value={spec.noseStyle} options={AVATAR_NOSE_STYLES} onChange={(v) => setSpec((p) => ({ ...p, noseStyle: v }))} />
                <OptionSelect label="Mouth" value={spec.mouthStyle} options={AVATAR_MOUTH_STYLES} onChange={(v) => setSpec((p) => ({ ...p, mouthStyle: v }))} />
                <OptionSelect label="Hat" value={spec.hatStyle} options={AVATAR_HAT_STYLES} onChange={(v) => setSpec((p) => ({ ...p, hatStyle: v }))} />
                <OptionSelect label="Accessory" value={spec.accessoryStyle} options={AVATAR_ACCESSORY_STYLES} onChange={(v) => setSpec((p) => ({ ...p, accessoryStyle: v }))} />
                <OptionSelect label="Top" value={spec.shirtStyle} options={AVATAR_SHIRT_STYLES} onChange={(v) => setSpec((p) => ({ ...p, shirtStyle: v }))} />
              </div>

              <SkinTonePicker value={spec.skin} onChange={(v) => setSpec((p) => ({ ...p, skin: v }))} />
              <PalettePicker label="Hair Color" value={spec.hairColor} onChange={(v) => setSpec((p) => ({ ...p, hairColor: v }))} />
              <PalettePicker label="Hat Color" value={spec.hatColor} onChange={(v) => setSpec((p) => ({ ...p, hatColor: v }))} />
              <PalettePicker label="Accessory Color" value={spec.accessoryColor} onChange={(v) => setSpec((p) => ({ ...p, accessoryColor: v }))} />
              <PalettePicker label="Top Color" value={spec.shirtColor} onChange={(v) => setSpec((p) => ({ ...p, shirtColor: v }))} />

              <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={applyCustom}
                  disabled={isSaving || !hasChanges}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSaving ? '저장 중...' : '커스텀 아바타 적용'}
                </button>
                <button
                  type="button"
                  onClick={() => setSpec(normalizeCustomAvatarSpec(decodeCustomAvatar(avatar) || DEFAULT_CUSTOM_AVATAR))}
                  disabled={isSaving}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  저장된 아바타로 되돌리기
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">사진 URL</span>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  disabled={isSaving}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  `http/https` URL 또는 `data:image/...` 형식 지원
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={applyUrl}
                  disabled={isSaving || !isUrlValid || !hasChanges}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSaving ? '저장 중...' : '사진 아바타 적용'}
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInput(avatar && !avatar.startsWith(CUSTOM_AVATAR_PREFIX) ? avatar : '')}
                  disabled={isSaving}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  되돌리기
                </button>
                {!isUrlValid && urlInput.trim() && (
                  <p className="text-sm text-red-600">유효한 이미지 URL 형식이 아닙니다.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
