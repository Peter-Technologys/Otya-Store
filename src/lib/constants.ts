export const OTYA = {
  name: 'OTYA',
  player: 'OTYA',
  ai: 'Next',
  auth: 'OTYA Account',
  console: 'OTYA Command Center',
  backend: 'OTYA Backend',
  website: 'https://petersmartlink.com',
  supportEmail: 'support@petersmartlink.com',
  noReplyEmail: 'noreply@petersmartlink.com',
  telegramChannel: 'https://t.me/otyaplayer',
  telegramSupport: 'https://t.me/OtyaPlayerBot',
  description: 'OTYA brings together local video and music, nearby transfer, private media, practical tools, one secure account and Next when connected help is useful.',
} as const;

export const SITE_CONFIG = {
  name: OTYA.name,
  ownerName: OTYA.name,
  url: OTYA.website,
  description: OTYA.description,
  email: OTYA.supportEmail,
  telegram: OTYA.telegramSupport,
  telegramChannel: OTYA.telegramChannel,
  address: 'Uganda',
  social: {},
} as const;
