import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Oxanium } from 'next/font/google'
import ThemeControl from './ThemeControl'
import './globals.css'

const oxanium = Oxanium({ subsets: ['latin'], display: 'swap', weight: ['300','400','500','600','700','800'], variable: '--font-oxanium' })
const SITE_URL='https://petersmartlink.com'
const APP_VERSION='1.7.0'
const ADSENSE_ID='ca-pub-2517163652161686'

export const metadata: Metadata = {
  metadataBase:new URL(SITE_URL),
  title:{default:'OTYA System — OTYA Player & Platform',template:'%s | OTYA System'},
  description:'OTYA System is the platform behind OTYA Player and its secure account, backend, update, download, AI and support services.',
  keywords:['OTYA System','OTYA Player','OTYA AI','OTYA Backend','OTYA Auth','offline media player Android','free music player Android','free video player Android','download OTYA Player APK','Flash Share','Private Vault Android'],
  authors:[{name:'OTYA System',url:SITE_URL}],creator:'OTYA System',publisher:'OTYA System',applicationName:'OTYA System',category:'technology',
  alternates:{canonical:SITE_URL},robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
  openGraph:{type:'website',locale:'en_UG',url:SITE_URL,siteName:'OTYA System',title:'OTYA System — OTYA Player & Platform',description:'The official home of OTYA System, OTYA Player and OTYA AI.',images:[{url:'/og-image.jpg',width:1200,height:630,alt:'OTYA Player — Your Sound, Your Way',type:'image/jpeg'}]},
  twitter:{card:'summary_large_image',title:'OTYA System — OTYA Player & Platform',description:'The official home of OTYA System, OTYA Player and OTYA AI.',images:['/og-image.jpg']},
  icons:{icon:[{url:'/favicon.ico'},{url:'/favicon-32x32.png',sizes:'32x32',type:'image/png'},{url:'/favicon-16x16.png',sizes:'16x16',type:'image/png'}],apple:[{url:'/apple-touch-icon.png',sizes:'180x180',type:'image/png'}],shortcut:'/favicon.ico'},
  manifest:'/manifest.json',appleWebApp:{capable:true,title:'OTYA System',statusBarStyle:'default'},
}

export const viewport: Viewport = {themeColor:[{media:'(prefers-color-scheme: light)',color:'#F7F7FB'},{media:'(prefers-color-scheme: dark)',color:'#08080B'}],width:'device-width',initialScale:1,maximumScale:5}

const schemaOrg={'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':`${SITE_URL}/#organization`,name:'OTYA System',url:SITE_URL,logo:{'@type':'ImageObject',url:`${SITE_URL}/android-chrome-512x512.png`,width:512,height:512}},{'@type':'MobileApplication','@id':`${SITE_URL}/#otyaplayer`,name:'OTYA Player',alternateName:'com.otyaplayer.app',operatingSystem:'Android 5.0+',applicationCategory:'MultimediaApplication',softwareVersion:APP_VERSION,offers:{'@type':'Offer',price:'0',priceCurrency:'USD',availability:'https://schema.org/InStock'},url:`${SITE_URL}/otya-player`,downloadUrl:`${SITE_URL}/download/otya-player`,author:{'@id':`${SITE_URL}/#organization`},description:'Free offline media player for Android with music and video playback, Flash Share, Private Vault and AI support.',featureList:'Offline playback, Flash Share, Private Vault, Web Mirror, Storage Analyzer, Seasonal Themes, Equalizer, Picture-in-Picture, WhatsApp Trimmer, Audio Extractor',image:`${SITE_URL}/android-chrome-512x512.png`,screenshot:`${SITE_URL}/og-image.jpg`,releaseNotes:`${SITE_URL}/download/otya-player`},{'@type':'WebSite','@id':`${SITE_URL}/#website`,url:SITE_URL,name:'OTYA System',publisher:{'@id':`${SITE_URL}/#organization`},potentialAction:{'@type':'SearchAction',target:`${SITE_URL}/blog/?search={search_term_string}`,'query-input':'required name=search_term_string'}}]}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en" dir="ltr" className={oxanium.variable} suppressHydrationWarning><head><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schemaOrg)}}/><meta name="google-adsense-account" content={ADSENSE_ID}/><script dangerouslySetInnerHTML={{__html:"try{var t=localStorage.getItem('otya_theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t}}catch(e){}"}}/></head><body className={oxanium.className}>{children}<ThemeControl/><Script id="google-adsense" async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`} crossOrigin="anonymous" strategy="afterInteractive"/></body></html>
}
