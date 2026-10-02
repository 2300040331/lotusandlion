import HomePageClient from '@/components/HomePageClient';
import ComingSoon from '@/components/ComingSoon';
import { SITE_MODE } from '@/config/siteMode';

function getServerApiUrl() {
  // On Vercel, VERCEL_URL is auto-set (e.g. "my-app.vercel.app")
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`;
  }
  // Fallback: use NEXT_PUBLIC_API_URL only if it's absolute
  const pub = process.env.NEXT_PUBLIC_API_URL || '';
  if (pub.startsWith('http')) return pub;
  // Local dev
  return 'http://localhost:5001/api';
}

export default async function Home() {
  // When in COMING_SOON mode, server-render the Coming Soon experience directly
  if (SITE_MODE === 'COMING_SOON') {
    return <ComingSoon />;
  }

  const apiUrl = getServerApiUrl();

  let initialData = null;
  try {
    const res = await fetch(`${apiUrl}/cms/site`, {
      cache: 'no-store',
    });
    if (res.ok) {
      initialData = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch initial home data', err);
  }

  return <HomePageClient initialData={initialData} />;
}
