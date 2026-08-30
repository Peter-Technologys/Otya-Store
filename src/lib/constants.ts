export const OTYA = {
  name: 'Otya',
  player: 'Otya Player',
  ai: 'Ask Otya',
  auth: 'Otya Account',
  console: 'Otya Command Center',
  backend: 'Otya Backend',
  website: 'https://petersmartlink.com',
  supportEmail: 'support@petersmartlink.com',
  noReplyEmail: 'noreply@petersmartlink.com',
  telegramChannel: 'https://t.me/otyaplayer',
  telegramSupport: 'https://t.me/OtyaPlayerBot',
  description: 'Otya brings together music discovery, Otya Player, Ask Otya, one secure account, support and downloads.',
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
