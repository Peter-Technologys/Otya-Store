export const OTYA_SYSTEM = {
  name: 'OTYA System',
  product: 'OTYA Player',
  auth: 'OTYA Auth',
  backend: 'OTYA Backend',
  website: 'https://petersmartlink.com',
  supportEmail: 'support@petersmartlink.com',
  noReplyEmail: 'noreply@petersmartlink.com',
  description:
    'OTYA System is the platform behind OTYA Player and its connected services.',
} as const;

// PeterSmart remains the legal/business owner identity where required for
// business contact, address, billing, and legal disclosures. Product-facing
// platform identity belongs to OTYA System.
export const SITE_CONFIG = {
  name: OTYA_SYSTEM.name,
  ownerName: 'PeterSmart Link',
  url: OTYA_SYSTEM.website,
  description: OTYA_SYSTEM.description,
  phone: '+256775912582',
  whatsapp: 'https://wa.me/256775912582',
  email: OTYA_SYSTEM.supportEmail,
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
