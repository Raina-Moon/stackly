export const CUSTOM_AVATAR_PREFIX = 'stkav1:';

export const AVATAR_PALETTE = [
  '#0EA5E9',
  '#2563EB',
  '#7C3AED',
  '#EC4899',
  '#F97316',
  '#EAB308',
  '#16A34A',
  '#14B8A6',
  '#64748B',
  '#111827',
  '#DC2626',
  '#A16207',
] as const;

export const AVATAR_SKIN_TONES = [
  '#FDE7D3',
  '#F7D5B5',
  '#EEBF95',
  '#D79A6D',
  '#BA7A50',
  '#8D5838',
  '#6D4330',
] as const;

export const AVATAR_BG_STYLES = [
  { kind: 'solid', a: '#DBEAFE', b: '#BFDBFE' },
  { kind: 'solid', a: '#EDE9FE', b: '#DDD6FE' },
  { kind: 'solid', a: '#FCE7F3', b: '#FBCFE8' },
  { kind: 'solid', a: '#DCFCE7', b: '#BBF7D0' },
  { kind: 'solid', a: '#FEF3C7', b: '#FDE68A' },
  { kind: 'solid', a: '#E2E8F0', b: '#CBD5E1' },
  { kind: 'split', a: '#E0F2FE', b: '#ECFEFF' },
  { kind: 'split', a: '#FDF2F8', b: '#FFF7ED' },
] as const;

export const AVATAR_HAIR_STYLES = [
  'short',
  'side',
  'curly',
  'fringe',
  'bob',
  'buzz',
  'long',
  'puff',
] as const;

export const AVATAR_EYE_STYLES = [
  'dot',
  'round',
  'smile',
  'sleepy',
  'sharp',
  'wink',
  'spark',
  'wide',
] as const;

export const AVATAR_BROW_STYLES = ['flat', 'soft', 'arched', 'serious', 'none'] as const;
export const AVATAR_NOSE_STYLES = ['dot', 'line', 'button', 'triangle', 'none'] as const;
export const AVATAR_MOUTH_STYLES = ['smile', 'grin', 'flat', 'open', 'smirk', 'tongue', 'o', 'none'] as const;
export const AVATAR_HAT_STYLES = ['none', 'beanie', 'cap', 'crown', 'bucket', 'headband'] as const;
export const AVATAR_ACCESSORY_STYLES = ['none', 'glasses', 'roundGlasses', 'earring', 'starClip', 'mask'] as const;
export const AVATAR_SHIRT_STYLES = ['crew', 'vneck', 'hoodie', 'collar', 'stripe', 'overall'] as const;

export interface CustomAvatarSpec {
  bg: number;
  skin: number;
  hairStyle: number;
  hairColor: number;
  eyeStyle: number;
  browStyle: number;
  noseStyle: number;
  mouthStyle: number;
  hatStyle: number;
  hatColor: number;
  accessoryStyle: number;
  accessoryColor: number;
  shirtStyle: number;
  shirtColor: number;
}

export const DEFAULT_CUSTOM_AVATAR: CustomAvatarSpec = {
  bg: 0,
  skin: 1,
  hairStyle: 0,
  hairColor: 9,
  eyeStyle: 1,
  browStyle: 1,
  noseStyle: 1,
  mouthStyle: 0,
  hatStyle: 0,
  hatColor: 1,
  accessoryStyle: 0,
  accessoryColor: 8,
  shirtStyle: 0,
  shirtColor: 0,
};

function clampIndex(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value >= max) return max - 1;
  return value;
}

function esc(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function normalizeCustomAvatarSpec(spec: Partial<CustomAvatarSpec>): CustomAvatarSpec {
  return {
    bg: clampIndex(spec.bg ?? DEFAULT_CUSTOM_AVATAR.bg, AVATAR_BG_STYLES.length),
    skin: clampIndex(spec.skin ?? DEFAULT_CUSTOM_AVATAR.skin, AVATAR_SKIN_TONES.length),
    hairStyle: clampIndex(spec.hairStyle ?? DEFAULT_CUSTOM_AVATAR.hairStyle, AVATAR_HAIR_STYLES.length),
    hairColor: clampIndex(spec.hairColor ?? DEFAULT_CUSTOM_AVATAR.hairColor, AVATAR_PALETTE.length),
    eyeStyle: clampIndex(spec.eyeStyle ?? DEFAULT_CUSTOM_AVATAR.eyeStyle, AVATAR_EYE_STYLES.length),
    browStyle: clampIndex(spec.browStyle ?? DEFAULT_CUSTOM_AVATAR.browStyle, AVATAR_BROW_STYLES.length),
    noseStyle: clampIndex(spec.noseStyle ?? DEFAULT_CUSTOM_AVATAR.noseStyle, AVATAR_NOSE_STYLES.length),
    mouthStyle: clampIndex(spec.mouthStyle ?? DEFAULT_CUSTOM_AVATAR.mouthStyle, AVATAR_MOUTH_STYLES.length),
    hatStyle: clampIndex(spec.hatStyle ?? DEFAULT_CUSTOM_AVATAR.hatStyle, AVATAR_HAT_STYLES.length),
    hatColor: clampIndex(spec.hatColor ?? DEFAULT_CUSTOM_AVATAR.hatColor, AVATAR_PALETTE.length),
    accessoryStyle: clampIndex(spec.accessoryStyle ?? DEFAULT_CUSTOM_AVATAR.accessoryStyle, AVATAR_ACCESSORY_STYLES.length),
    accessoryColor: clampIndex(spec.accessoryColor ?? DEFAULT_CUSTOM_AVATAR.accessoryColor, AVATAR_PALETTE.length),
    shirtStyle: clampIndex(spec.shirtStyle ?? DEFAULT_CUSTOM_AVATAR.shirtStyle, AVATAR_SHIRT_STYLES.length),
    shirtColor: clampIndex(spec.shirtColor ?? DEFAULT_CUSTOM_AVATAR.shirtColor, AVATAR_PALETTE.length),
  };
}

export function encodeCustomAvatar(spec: CustomAvatarSpec): string {
  const s = normalizeCustomAvatarSpec(spec);
  const values = [
    s.bg, s.skin, s.hairStyle, s.hairColor, s.eyeStyle, s.browStyle, s.noseStyle,
    s.mouthStyle, s.hatStyle, s.hatColor, s.accessoryStyle, s.accessoryColor, s.shirtStyle, s.shirtColor,
  ];
  return `${CUSTOM_AVATAR_PREFIX}${values.map((v) => v.toString(36)).join('.')}`;
}

export function decodeCustomAvatar(avatar?: string | null): CustomAvatarSpec | null {
  if (!avatar || !avatar.startsWith(CUSTOM_AVATAR_PREFIX)) return null;
  const body = avatar.slice(CUSTOM_AVATAR_PREFIX.length);
  const parts = body.split('.');
  if (parts.length !== 14) return null;
  const values = parts.map((p) => Number.parseInt(p, 36));
  if (values.some((n) => Number.isNaN(n))) return null;
  return normalizeCustomAvatarSpec({
    bg: values[0],
    skin: values[1],
    hairStyle: values[2],
    hairColor: values[3],
    eyeStyle: values[4],
    browStyle: values[5],
    noseStyle: values[6],
    mouthStyle: values[7],
    hatStyle: values[8],
    hatColor: values[9],
    accessoryStyle: values[10],
    accessoryColor: values[11],
    shirtStyle: values[12],
    shirtColor: values[13],
  });
}

function renderBackground(bgIndex: number): string {
  const bg = AVATAR_BG_STYLES[bgIndex];
  if (bg.kind === 'split') {
    return `
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg.a}" />
          <stop offset="100%" stop-color="${bg.b}" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#g)" />
      <circle cx="88" cy="30" r="12" fill="#ffffff55" />
    `;
  }
  return `
    <circle cx="60" cy="60" r="58" fill="${bg.a}" />
    <path d="M8 85 Q60 62 112 82 L112 120 L8 120 Z" fill="${bg.b}" opacity="0.9" />
  `;
}

function renderHair(style: string, color: string): string {
  switch (style) {
    case 'side':
      return `<path d="M32 50c0-18 12-28 28-28 18 0 28 11 28 28v10c-2-7-7-13-14-16-8 8-20 12-38 12-2 0-4 0-6-.2V50z" fill="${color}"/><path d="M80 29c8 1 15 8 16 18 1 9-2 15-2 15s-4-9-12-12L80 29z" fill="${color}" opacity=".9"/>`;
    case 'curly':
      return `<g fill="${color}"><circle cx="42" cy="38" r="12"/><circle cx="57" cy="31" r="13"/><circle cx="74" cy="33" r="12"/><circle cx="87" cy="40" r="10"/><path d="M32 48c0-6 3-12 9-15 8-4 40-6 53 7 4 4 6 10 6 15v8H32v-15z"/></g>`;
    case 'fringe':
      return `<path d="M30 50c0-19 15-30 30-30s30 11 30 30v9c-5-5-12-10-18-11-3 8-10 11-18 12-7 1-12-.6-16-4-2 2-5 3-8 4v-10z" fill="${color}"/>`;
    case 'bob':
      return `<path d="M29 52c0-19 14-30 31-30 17 0 31 11 31 30v18c-6 8-16 13-31 13-14 0-24-4-31-12V52z" fill="${color}"/><path d="M31 69c-4-2-6-6-6-11V48" stroke="${color}" stroke-width="6" stroke-linecap="round"/><path d="M89 69c4-2 6-6 6-11V48" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`;
    case 'buzz':
      return `<path d="M36 49c2-17 12-25 24-25s23 8 25 25c-8-5-15-7-25-7s-18 2-24 7z" fill="${color}"/>`;
    case 'long':
      return `<path d="M30 52c0-19 13-31 30-31 18 0 30 12 30 31v32c-7 7-18 11-30 11-13 0-24-4-30-11V52z" fill="${color}"/><path d="M28 60c0 20 0 28 0 28" stroke="${color}" stroke-width="7" stroke-linecap="round"/><path d="M92 60c0 20 0 28 0 28" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`;
    case 'puff':
      return `<g fill="${color}"><circle cx="60" cy="26" r="12"/><path d="M32 52c0-18 13-29 28-29 15 0 28 11 28 29v9H32v-9z"/></g>`;
    case 'short':
    default:
      return `<path d="M31 52c0-18 13-29 29-29 17 0 29 11 29 29v8c-5-3-10-4-16-4-6-7-12-10-22-10-9 0-15 4-20 11V52z" fill="${color}"/>`;
  }
}

function renderBrows(style: string): string {
  switch (style) {
    case 'none':
      return '';
    case 'flat':
      return `<path d="M45 53h10M65 53h10" stroke="#2b2b2b" stroke-width="2" stroke-linecap="round"/>`;
    case 'arched':
      return `<path d="M44 54c3-3 7-4 11-2M64 52c4-2 8-1 11 2" stroke="#2b2b2b" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    case 'serious':
      return `<path d="M44 53l11-3M65 50l11 3" stroke="#2b2b2b" stroke-width="2" stroke-linecap="round"/>`;
    case 'soft':
    default:
      return `<path d="M44 54c3-2 7-2 11 0M65 54c4-2 8-2 11 0" stroke="#2b2b2b" stroke-width="2" stroke-linecap="round" fill="none"/>`;
  }
}

function renderEyes(style: string): string {
  switch (style) {
    case 'dot':
      return `<circle cx="50" cy="60" r="2.2" fill="#1f2937"/><circle cx="70" cy="60" r="2.2" fill="#1f2937"/>`;
    case 'smile':
      return `<path d="M46 61c1.5 2 3.5 2 5 0M66 61c1.5 2 3.5 2 5 0" stroke="#1f2937" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    case 'sleepy':
      return `<path d="M46 60h7M66 60h7" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/><path d="M46 63h5M66 63h5" stroke="#9ca3af" stroke-width="1.3" stroke-linecap="round"/>`;
    case 'sharp':
      return `<path d="M46 60l7-2M66 58l7 2" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/><circle cx="52" cy="61" r="1.2" fill="#1f2937"/><circle cx="68" cy="61" r="1.2" fill="#1f2937"/>`;
    case 'wink':
      return `<path d="M46 60h7" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/><circle cx="70" cy="60" r="2.4" fill="#1f2937"/>`;
    case 'spark':
      return `<circle cx="50" cy="60" r="3" fill="#1f2937"/><circle cx="70" cy="60" r="3" fill="#1f2937"/><circle cx="49" cy="59" r="0.9" fill="#fff"/><circle cx="69" cy="59" r="0.9" fill="#fff"/>`;
    case 'wide':
      return `<ellipse cx="50" cy="60" rx="3.6" ry="3" fill="#fff" stroke="#1f2937" stroke-width="1.5"/><ellipse cx="70" cy="60" rx="3.6" ry="3" fill="#fff" stroke="#1f2937" stroke-width="1.5"/><circle cx="50" cy="60.5" r="1.3" fill="#1f2937"/><circle cx="70" cy="60.5" r="1.3" fill="#1f2937"/>`;
    case 'round':
    default:
      return `<ellipse cx="50" cy="60" rx="3.2" ry="2.6" fill="#1f2937"/><ellipse cx="70" cy="60" rx="3.2" ry="2.6" fill="#1f2937"/>`;
  }
}

function renderNose(style: string): string {
  switch (style) {
    case 'none':
      return '';
    case 'dot':
      return `<circle cx="60" cy="68" r="1.4" fill="#9a6f4f" opacity="0.8"/>`;
    case 'button':
      return `<path d="M58 66c0 2 0 4 2 4s2-2 2-4" stroke="#9a6f4f" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    case 'triangle':
      return `<path d="M60 64l-2 6h4l-2-6z" fill="#c58d66" opacity="0.7"/>`;
    case 'line':
    default:
      return `<path d="M60 64v6" stroke="#9a6f4f" stroke-width="1.4" stroke-linecap="round"/><path d="M58.5 70.5c1 .8 2 .8 3 0" stroke="#9a6f4f" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  }
}

function renderMouth(style: string, color: string): string {
  switch (style) {
    case 'none':
      return '';
    case 'flat':
      return `<path d="M52 78h16" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    case 'open':
      return `<ellipse cx="60" cy="78" rx="6" ry="4.2" fill="${color}" opacity="0.9"/><path d="M55 77h10" stroke="#fff" stroke-width="1" opacity="0.7"/>`;
    case 'smirk':
      return `<path d="M53 78c5 2 10 2 14-1" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    case 'tongue':
      return `<path d="M52 76c2 5 14 5 16 0" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M56 80c1 2 7 2 8 0" fill="#fb7185"/>`;
    case 'o':
      return `<circle cx="60" cy="78" r="3.3" fill="none" stroke="${color}" stroke-width="2"/>`;
    case 'grin':
      return `<path d="M51 76c2 6 16 6 18 0v3c-2 4-16 4-18 0z" fill="#fff" stroke="${color}" stroke-width="1.3"/>`;
    case 'smile':
    default:
      return `<path d="M51 76c3 5 15 5 18 0" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none"/>`;
  }
}

function renderHat(style: string, color: string): string {
  switch (style) {
    case 'none':
      return '';
    case 'beanie':
      return `<path d="M34 46c3-14 14-22 26-22s23 8 26 22H34z" fill="${color}"/><rect x="33" y="44" width="54" height="9" rx="4.5" fill="${color}" opacity=".88"/><circle cx="60" cy="24" r="4" fill="${color}" opacity=".95"/>`;
    case 'cap':
      return `<path d="M36 45c3-11 14-18 24-18 13 0 22 8 25 18H36z" fill="${color}"/><path d="M76 46c10-1 17 2 19 5-5 1-12 1-20-1" fill="${color}" opacity=".85"/><rect x="37" y="43" width="46" height="6" rx="3" fill="${color}" opacity=".95"/>`;
    case 'crown':
      return `<path d="M35 47l7-12 10 8 8-12 8 12 10-8 7 12v7H35v-7z" fill="${color}"/><circle cx="42" cy="36" r="2" fill="#fff"/><circle cx="60" cy="32" r="2" fill="#fff"/><circle cx="78" cy="36" r="2" fill="#fff"/>`;
    case 'bucket':
      return `<path d="M38 39h44l-4 17H42l-4-17z" fill="${color}"/><path d="M33 44c8-4 46-4 54 0" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
    case 'headband':
      return `<rect x="32" y="45" width="56" height="8" rx="4" fill="${color}"/><path d="M72 49l10-6" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
    default:
      return '';
  }
}

function renderAccessory(style: string, color: string): string {
  switch (style) {
    case 'none':
      return '';
    case 'glasses':
      return `<g stroke="${color}" stroke-width="2" fill="none"><rect x="43" y="56" width="12" height="8" rx="3"/><rect x="65" y="56" width="12" height="8" rx="3"/><path d="M55 60h10"/></g>`;
    case 'roundGlasses':
      return `<g stroke="${color}" stroke-width="2" fill="none"><circle cx="49" cy="60" r="5"/><circle cx="71" cy="60" r="5"/><path d="M54 60h12"/></g>`;
    case 'earring':
      return `<circle cx="38" cy="73" r="2.4" fill="none" stroke="${color}" stroke-width="1.8"/><circle cx="82" cy="73" r="2.4" fill="none" stroke="${color}" stroke-width="1.8"/>`;
    case 'starClip':
      return `<path d="M81 44l1.6 3.2 3.6.5-2.6 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.6-2.5 3.6-.5z" fill="${color}"/>`;
    case 'mask':
      return `<path d="M46 69c5-4 23-4 28 0-2 6-6 10-14 10s-12-4-14-10z" fill="${color}" opacity=".9"/><path d="M46 69c-4-1-7-3-9-5M74 69c4-1 7-3 9-5" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    default:
      return '';
  }
}

function renderShirt(style: string, color: string): string {
  switch (style) {
    case 'vneck':
      return `<path d="M22 118c1-20 16-31 38-31s37 11 38 31H22z" fill="${color}"/><path d="M49 88l11 13 11-13" fill="#fff" opacity=".4"/>`;
    case 'hoodie':
      return `<path d="M20 118c2-22 18-34 40-34s38 12 40 34H20z" fill="${color}"/><path d="M46 90c3-5 7-7 14-7s11 2 14 7c-4 3-9 4-14 4s-10-1-14-4z" fill="#fff" opacity=".22"/>`;
    case 'collar':
      return `<path d="M22 118c1-20 16-31 38-31s37 11 38 31H22z" fill="${color}"/><path d="M47 90l8 10-8 5M73 90l-8 10 8 5" fill="#fff" opacity=".45"/>`;
    case 'stripe':
      return `<path d="M22 118c1-20 16-31 38-31s37 11 38 31H22z" fill="${color}"/><path d="M34 91v27M47 88v30M60 87v31M73 88v30M86 91v27" stroke="#fff" opacity=".18" stroke-width="3"/>`;
    case 'overall':
      return `<path d="M22 118c1-20 16-31 38-31s37 11 38 31H22z" fill="${color}"/><path d="M46 90h28v28H46z" fill="#fff" opacity=".18"/><path d="M46 95l-7 23M74 95l7 23" stroke="#fff" opacity=".25" stroke-width="3"/>`;
    case 'crew':
    default:
      return `<path d="M22 118c1-20 16-31 38-31s37 11 38 31H22z" fill="${color}"/><ellipse cx="60" cy="91" rx="10" ry="4" fill="#fff" opacity=".22"/>`;
  }
}

export function renderCustomAvatarSvg(specInput: Partial<CustomAvatarSpec>, label = 'Stackly Avatar'): string {
  const spec = normalizeCustomAvatarSpec(specInput);
  const skin = AVATAR_SKIN_TONES[spec.skin];
  const hairColor = AVATAR_PALETTE[spec.hairColor];
  const hatColor = AVATAR_PALETTE[spec.hatColor];
  const accessoryColor = AVATAR_PALETTE[spec.accessoryColor];
  const shirtColor = AVATAR_PALETTE[spec.shirtColor];
  const mouthColor = '#7f1d1d';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="${esc(label)}">
      ${renderBackground(spec.bg)}
      <clipPath id="clipCircle"><circle cx="60" cy="60" r="58"/></clipPath>
      <g clip-path="url(#clipCircle)">
        ${renderShirt(AVATAR_SHIRT_STYLES[spec.shirtStyle], shirtColor)}
        <ellipse cx="60" cy="63" rx="27" ry="31" fill="${skin}" />
        <ellipse cx="50" cy="70" rx="3" ry="1.3" fill="#e88b8b22" />
        <ellipse cx="70" cy="70" rx="3" ry="1.3" fill="#e88b8b22" />
        ${renderHair(AVATAR_HAIR_STYLES[spec.hairStyle], hairColor)}
        ${renderHat(AVATAR_HAT_STYLES[spec.hatStyle], hatColor)}
        ${renderBrows(AVATAR_BROW_STYLES[spec.browStyle])}
        ${renderEyes(AVATAR_EYE_STYLES[spec.eyeStyle])}
        ${renderNose(AVATAR_NOSE_STYLES[spec.noseStyle])}
        ${renderMouth(AVATAR_MOUTH_STYLES[spec.mouthStyle], mouthColor)}
        ${renderAccessory(AVATAR_ACCESSORY_STYLES[spec.accessoryStyle], accessoryColor)}
      </g>
      <circle cx="60" cy="60" r="58" fill="none" stroke="#ffffffaa" stroke-width="2"/>
    </svg>
  `.trim();
}

export function customAvatarToDataUri(spec: Partial<CustomAvatarSpec>, label?: string): string {
  const svg = renderCustomAvatarSvg(spec, label);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getAvatarImageSrc(avatar?: string | null, label?: string): string | null {
  if (!avatar) return null;
  const parsed = decodeCustomAvatar(avatar);
  if (parsed) return customAvatarToDataUri(parsed, label);
  return avatar;
}

export function randomCustomAvatarSpec(): CustomAvatarSpec {
  const rand = (max: number) => Math.floor(Math.random() * max);
  return normalizeCustomAvatarSpec({
    bg: rand(AVATAR_BG_STYLES.length),
    skin: rand(AVATAR_SKIN_TONES.length),
    hairStyle: rand(AVATAR_HAIR_STYLES.length),
    hairColor: rand(AVATAR_PALETTE.length),
    eyeStyle: rand(AVATAR_EYE_STYLES.length),
    browStyle: rand(AVATAR_BROW_STYLES.length),
    noseStyle: rand(AVATAR_NOSE_STYLES.length),
    mouthStyle: rand(AVATAR_MOUTH_STYLES.length),
    hatStyle: rand(AVATAR_HAT_STYLES.length),
    hatColor: rand(AVATAR_PALETTE.length),
    accessoryStyle: rand(AVATAR_ACCESSORY_STYLES.length),
    accessoryColor: rand(AVATAR_PALETTE.length),
    shirtStyle: rand(AVATAR_SHIRT_STYLES.length),
    shirtColor: rand(AVATAR_PALETTE.length),
  });
}
