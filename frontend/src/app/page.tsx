import HomePageClient from '@/components/HomePageClient';

function getServerApiUrl() {
  const internal = process.env.INTERNAL_API_URL || '';
  if (internal.startsWith('http')) return internal;

  const pub = process.env.NEXT_PUBLIC_API_URL || '';
  if (pub.startsWith('http')) return pub;

  return 'http://127.0.0.1:5000/api';
}

export default async function Home() {
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
