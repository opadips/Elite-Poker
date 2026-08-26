import React from 'react';

const base = (size, strokeWidth = 2) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

const makeIcon = (children, displayName, defaultSize = 16, strokeWidth = 2) => {
  const Icon = ({ size = defaultSize, ...props }) => (
    <svg {...base(size, strokeWidth)} aria-hidden="true" {...props}>
      {children}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
};

/* ---------- Playing card suits (filled) ---------- */

export const SuitSpade = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2C9.6 5.1 4.5 8.7 4.5 13a4.6 4.6 0 0 0 6.3 4.3c-.5 1.6-1.4 2.9-2.8 3.7h8c-1.4-.8-2.3-2.1-2.8-3.7a4.6 4.6 0 0 0 6.3-4.3c0-4.3-5.1-7.9-7.5-11z" />
  </svg>
);

export const SuitHeart = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 21s-8.2-5.1-10-10.2C.8 7.2 3 4 6.2 4c2.2 0 4.1 1.2 5.8 3.4C13.7 5.2 15.6 4 17.8 4 21 4 23.2 7.2 22 10.8 20.2 15.9 12 21 12 21z" />
  </svg>
);

export const SuitDiamond = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2l7 10-7 10-7-10 7-10z" />
  </svg>
);

export const SuitClub = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2a4.3 4.3 0 0 0-3.4 6.9A4.3 4.3 0 1 0 10 16.6c-.4 1.7-1.3 3.3-2.7 4.4h9.4c-1.4-1.1-2.3-2.7-2.7-4.4a4.3 4.3 0 1 0 1.4-7.7A4.3 4.3 0 0 0 12 2z" />
  </svg>
);

export const suitIcons = {
  '♠': SuitSpade,
  '♥': SuitHeart,
  '♦': SuitDiamond,
  '♣': SuitClub,
};

export function getSuitIcon(suit) {
  return suitIcons[suit] || null;
}

/* ---------- UI icons ---------- */

export const IconCrown = makeIcon(
  <>
    <path d="M3 8l4 4 5-6 5 6 4-4v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8z" />
    <path d="M5 20h14" />
  </>,
  'IconCrown', 14
);

export const IconX = makeIcon(
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>,
  'IconX', 12, 2.5
);

export const IconChat = makeIcon(
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  'IconChat', 20
);

export const IconGear = makeIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>,
  'IconGear', 20
);

export const IconPalette = makeIcon(
  <>
    <circle cx="13.5" cy="6.5" r="1.6" />
    <circle cx="17.5" cy="10.5" r="1.6" />
    <circle cx="8.5" cy="7.5" r="1.6" />
    <circle cx="6.5" cy="12.5" r="1.6" />
    <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c.93 0 1.85-.07 2.78-.27a1.6 1.6 0 0 0 .85-2.62 1.7 1.7 0 0 1 1.28-2.81H19a3 3 0 0 0 3-3c0-5.51-4.49-9.3-10-9.3z" />
  </>,
  'IconPalette'
);

export const IconCards = makeIcon(
  <>
    <rect x="3" y="6" width="13" height="16" rx="2" transform="rotate(-8 9.5 14)" />
    <rect x="8" y="3" width="13" height="16" rx="2" transform="rotate(6 14.5 11)" />
  </>,
  'IconCards'
);

export const IconMonitor = makeIcon(
  <>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </>,
  'IconMonitor'
);

export const IconVolume = makeIcon(
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </>,
  'IconVolume'
);

export const IconVolumeOff = makeIcon(
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </>,
  'IconVolumeOff'
);

export const IconZap = makeIcon(
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  'IconZap'
);

export const IconFeather = makeIcon(
  <>
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
    <line x1="16" y1="8" x2="2" y2="22" />
    <line x1="17.5" y1="15" x2="9" y2="15" />
  </>,
  'IconFeather'
);

export const IconGraduation = makeIcon(
  <>
    <path d="M22 10L12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
  </>,
  'IconGraduation'
);

export const IconPlay = makeIcon(
  <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />,
  'IconPlay'
);

export const IconPause = makeIcon(
  <>
    <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
  </>,
  'IconPause'
);

export const IconReset = makeIcon(
  <>
    <path d="M1 4v6h6" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </>,
  'IconReset'
);

export const IconHistory = makeIcon(
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <polyline points="12 7 12 12 15 15" />
  </>,
  'IconHistory'
);

export const IconLogout = makeIcon(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>,
  'IconLogout'
);

export const IconDices = makeIcon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
  </>,
  'IconDices'
);

export const IconTrophy = makeIcon(
  <>
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
    <path d="M17 5h3a1 1 0 0 1 1 1 4 4 0 0 1-4 4" />
    <path d="M7 5H4a1 1 0 0 0-1 1 4 4 0 0 0 4 4" />
  </>,
  'IconTrophy'
);

export const IconMedal = makeIcon(
  <>
    <circle cx="12" cy="15" r="5" />
    <path d="M12 12.5l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 14.6l2-.3.9-1.8z" fill="currentColor" stroke="none" />
    <path d="M8 3l2.5 6" />
    <path d="M16 3l-2.5 6" />
  </>,
  'IconMedal'
);

export const IconCoins = makeIcon(
  <>
    <ellipse cx="12" cy="6" rx="8" ry="3.5" />
    <path d="M4 6v6c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5V6" />
    <path d="M4 12v6c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5v-6" />
  </>,
  'IconCoins'
);

export const IconUsers = makeIcon(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3 3.4-5 6.5-5s5.7 2 6.5 5" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M16.5 15.2c2.5.3 4.4 1.9 5 4.3" />
  </>,
  'IconUsers'
);

export const IconLock = makeIcon(
  <>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <circle cx="12" cy="16" r="1.3" fill="currentColor" stroke="none" />
  </>,
  'IconLock'
);

export const IconChevronDown = makeIcon(<polyline points="6 9 12 15 18 9" />, 'IconChevronDown');
export const IconChevronUp = makeIcon(<polyline points="6 15 12 9 18 15" />, 'IconChevronUp');

export const IconSparkles = makeIcon(
  <>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 15l.9 2.4 2.4.9-2.4.9L19 21.6l-.9-2.4-2.4-.9 2.4-.9L19 15z" />
  </>,
  'IconSparkles'
);

export const IconTrendingUp = makeIcon(
  <>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </>,
  'IconTrendingUp'
);

export const IconTimer = makeIcon(
  <>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5" />
    <path d="M9 2h6" />
  </>,
  'IconTimer'
);

export const IconSend = makeIcon(
  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  'IconSend'
);

export const IconPlus = makeIcon(
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>,
  'IconPlus'
);

export const IconEye = makeIcon(
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </>,
  'IconEye'
);

export const IconTarget = makeIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </>,
  'IconTarget'
);

export const IconAlert = makeIcon(
  <>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
  </>,
  'IconAlert'
);

export const IconFlame = makeIcon(
  <path d="M12 2s-6 5.5-6 11a6 6 0 0 0 12 0c0-2-1-4.5-2.5-6.5C14.6 8 13 9 13 9s.5-4-1-7z" />,
  'IconFlame'
);

export const IconHand = makeIcon(
  <>
    <path d="M18 11V6a2 2 0 0 0-4 0v5" />
    <path d="M14 10V4a2 2 0 0 0-4 0v6" />
    <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
    <path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </>,
  'IconHand'
);

export const IconCheck = makeIcon(
  <polyline points="20 6 9 17 4 12" />,
  'IconCheck', 14, 2.5
);

export const IconArrowUp = makeIcon(
  <>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </>,
  'IconArrowUp'
);
