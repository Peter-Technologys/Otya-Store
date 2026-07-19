export const SITE_CONFIG = {
  name: 'PeterSmart Link',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://petersmartlink.com',
  description: "Mbirizi's leading tech hub for mobile money, phone financing, smartphones, and quality electronics.",
  phone: '+256775912582',
  whatsapp: 'https://wa.me/256775912582',
  email: 'hello@petersmartlink.com',
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
