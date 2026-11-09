import type { AspectRatio, DurationSeconds, ModelOption, Resolution } from './types';

export const AVAILABLE_MODELS: readonly ModelOption[] = [
  {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Fast',
    description: 'Optimized for speed and quick previews.',
  },
  {
    id: 'veo-3.1-generate-preview',
    name: 'Veo 3.1 High Quality',
    description: 'Highest fidelity and cinematic detail.',
  },
];

export const LOADING_STEPS: readonly string[] = [
  'Submitting request',
  'Analyzing inputs & vectors',
  'Synthesizing motion',
  'Rendering video frames',
  'Applying cinematic lighting',
  'Downloading result',
];

export const SUPPORTED_ASPECT_RATIOS: readonly AspectRatio[] = ['16:9', '9:16', '1:1'];
export const SUPPORTED_RESOLUTIONS: readonly Resolution[] = ['720p', '1080p'];
export const SUPPORTED_DURATIONS: readonly DurationSeconds[] = [4, 6, 8];

/** Credit cost per generated video, by output resolution. */
export const CREDIT_COST: Readonly<Record<Resolution, number>> = {
  '720p': 100,
  '1080p': 150,
};

export const PLANS = [
  {
    name: 'Starter Plan',
    subheading: 'Great for Hobbyists, students, casual creators.',
    description: 'Perfect entry point for experimenting.',
    price: { monthly: 5, yearly: 45 },
    features: ['Standard HD output', 'AES-256 data encryption', 'Community support'],
  },
  {
    name: 'Pro Plan',
    subheading: 'Great for Freelancers, small studios, content creators.',
    description: 'The sweet spot for independent creators.',
    price: { monthly: 25, yearly: 225 },
    features: [
      'Priority rendering queue',
      'Access to advanced editing tools',
      'Standard Security SLA',
      'SOC2 readiness report access',
    ],
  },
  {
    name: 'Enterprise Plan',
    subheading: 'Great for Agencies, businesses, developers.',
    description: 'Power your platform with scalable AI video generation.',
    price: { monthly: 99, yearly: 891 },
    features: [
      '99.99% Uptime Security SLA',
      'Dedicated support (1h Security Response)',
      'SOC2 Type II & GDPR Compliance',
      'SSO / SAML & SCIM provisioning',
      'Custom Data Residency controls',
    ],
  },
] as const;

export const CREDIT_PACKS = [
  { credits: 600, price: 5, label: 'Starter Pack' },
  { credits: 1500, price: 12, label: 'Creator Pack' },
  { credits: 3000, price: 25, label: 'Pro Pack' },
  { credits: 10000, price: 75, label: 'Studio Pack' },
  { credits: 30000, price: 99, label: 'Enterprise Pack' },
] as const;

/** How many history entries we keep before pruning the oldest ones. */
export const MAX_HISTORY_ITEMS = 20;

/** Hard limit for a single generation, so a stuck operation cannot poll forever. */
export const GENERATION_TIMEOUT_MS = 15 * 60 * 1000;

/** How often we ask the API for operation status. */
export const POLL_INTERVAL_MS = 5_000;
