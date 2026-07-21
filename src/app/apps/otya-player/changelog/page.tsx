import { redirect } from 'next/navigation'
// Changelog is now part of the download page — redirect there
export default function OtyaChangelogPage() { redirect('/download/otya-player') }
