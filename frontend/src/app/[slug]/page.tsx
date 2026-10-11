'use client';

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

const FALLBACK_PAGES: Record<string, { title: string; eyebrow: string; body: string }> = {
  about: {
    eyebrow: 'Our Heritage',
    title: 'An Original Atelier Story',
    body: 'Lotus & Lion is built around two symbols: Lotus for expressive womenswear and Lion for composed menswear. The store uses original visual panels, custom copy, and a clean buying experience.',
  },
  heritage: {
    eyebrow: 'Our Heritage',
    title: 'A House Of Symbols',
    body: 'The Lotus mark speaks to softness and movement. The Lion mark speaks to structure and confidence. Together, they shape the product language of the brand.',
  },
  sustainability: {
    eyebrow: 'Responsibility',
    title: 'Responsible By Design',
    body: 'We prioritize durable garments, clear product information, and original content so the store can grow without relying on copied catalogues.',
  },
  contact: {
    eyebrow: 'Client Care',
    title: 'Contact Us',
    body: 'For product questions, order support, or private styling requests, reach the Lotus & Lion team at care@lotusandlion.com.',
  },
  shipping: {
    eyebrow: 'Service',
    title: 'Shipping And Returns',
    body: 'Orders are prepared with care and shipped with tracking. Unworn items can be returned within 14 days of delivery in original condition.',
  },
};

export default function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const { slug } = unwrappedParams;
  const [page, setPage] = useState<any>(null);
  const fallback = useMemo(() => FALLBACK_PAGES[slug], [slug]);

  useEffect(() => {
    let isMounted = true;

    const fetchPage = async () => {
      try {
        const { data } = await api.get('/admin/content/pages');
        const match = data.find((item: any) => item.slug === slug && item.isPublished !== false);
        if (isMounted) setPage(match || null);
      } catch {
        if (isMounted) setPage(null);
      }
    };

    fetchPage();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const content = page || fallback;

  if (!content) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center bg-[#FEFFEF] text-[#573B2D]">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#573B2D] mb-4">Not Found</p>
        <h1 className="brand-heading text-4xl md:text-6xl uppercase text-[#573B2D] mb-6">Page Unavailable</h1>
        <Link href="/products" className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#573B2D] hover:opacity-75">
          Return To Collection
        </Link>
      </div>
    );
  }

  return (
    <section className="min-h-[70vh] bg-[#FEFFEF] px-6 py-24 text-[#573B2D]">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#573B2D] mb-6">
          {content.eyebrow || content.metaTitle || 'Lotus & Lion'}
        </p>
        <h1 className="brand-heading text-4xl md:text-6xl uppercase text-[#573B2D] mb-8">
          {content.title}
        </h1>
        {content.body?.startsWith('<') ? (
          <div
            className="prose prose-sm max-w-none text-[#573B2D]/80"
            dangerouslySetInnerHTML={{ __html: content.body }}
          />
        ) : (
          <p className="text-lg leading-8 text-[#573B2D]/80">{content.body}</p>
        )}
      </div>
    </section>
  );
}
