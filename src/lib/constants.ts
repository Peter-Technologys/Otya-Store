export const OTYA = {
  name: 'OTYA',
  player: 'OTYA Player',
  ai: 'OTYA AI',
  auth: 'OTYA Auth',
  console: 'OTYA Console',
  backend: 'OTYA Backend',
  website: 'https://petersmartlink.com',
  supportEmail: 'support@petersmartlink.com',
  noReplyEmail: 'noreply@petersmartlink.com',
  telegramChannel: 'https://t.me/otyaplayer',
  telegramSupport: 'https://t.me/OtyaPlayerBot',
  description:
    'OTYA connects OTYA Player, OTYA AI, one shared account, support, downloads and future OTYA apps.',
} as const;

// PeterSmart Link remains the legal/business owner identity where required for
// business contact, address, billing and legal disclosures. Product-facing
// umbrella identity is OTYA. Public support avoids personal phone exposure.
export const SITE_CONFIG = {
  name: OTYA.name,
  ownerName: 'PeterSmart Link',
  url: OTYA.website,
  description: OTYA.description,
  email: OTYA.supportEmail,
  telegram: OTYA.telegramSupport,
  telegramChannel: OTYA.telegramChannel,
  address: 'Mbirizi Town Council, Lwengo District, Uganda',
  social: {
    facebook: 'https://www.facebook.com/PeterSmartLink',
    twitter: 'https://www.twitter.com/PeterSmartLink',
    instagram: 'https://www.instagram.com/PeterSmartLink',
    tiktok: 'https://www.tiktok.com/@PeterSmartLink',
  },
  hours: {
    weekdays: '8:00 AM - 8:00 PM',
    saturday: '8:00 AM - 9:00 PM',
    sunday: '10:00 AM - 6:00 PM',
  },
} as const;
