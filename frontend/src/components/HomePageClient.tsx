'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Crown, Flower2, Headphones, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';
import HeroSlider from '@/components/HeroSlider';
import ProductCard from '@/components/ProductCard';

const fallbackCollections = [
  {
    title: 'Lotus Collections',
    subtitle: 'Women',
    icon: Flower2,
    body: 'Fluid dresses, co-ords, and occasion-ready pieces shaped around hand-drawn lines, soft contrast, and gallery-day comfort.',
    href: '/collections/lotus',
  },
  {
    title: 'Lion Collections',
    subtitle: 'Men',
    icon: Crown,
    body: 'Crisp shirts, relaxed tailoring, and structured layers for men who like clean proportions and quiet detail.',
    href: '/collections/lion',
  },
  {
    title: 'Artist Outfits',
    subtitle: 'Atelier Looks',
    icon: ShieldCheck,
    body: 'Outfits composed like a canvas: tonal panels, drawn seams, and expressive silhouettes for studio, stage, and celebration.',
    href: '/products?category=Artist Outfits',
  },
];

const collectionUrlByKey: Record<string, string> = {
  lotus: '/collections/lotus',
  lion: '/collections/lion',
  artist: '/products?category=Artist%20Outfits',
};

type HomeCollection = {
  slug?: string;
  name?: string;
  title?: string;
  href?: string;
  description?: string;
  body?: string;
  banner_url?: string;
  hero?: {
    image?: string;
    title?: string;
    subtitle?: string;
  };
};

type HomeProduct = {
  _id: string;
  id?: string;
  name: string;
  slug?: string;
  price: number;
  discountPrice?: number;
  image: string;
  brand: string;
  category: string;
  collectionType?: 'lotus' | 'lion' | 'artist';
  countInStock: number;
  images?: (string | { image_url: string })[];
};

type HomeCms = {
  home?: {
    slides?: unknown[];
    collections?: Record<string, { image?: string; showIcon?: boolean }>;
  };
  lotusProducts?: HomeProduct[];
  lionProducts?: HomeProduct[];
  collections?: HomeCollection[];
  sections?: any[];
};

function ProductRail({ title, href, products }: { title: string; href: string; products: HomeProduct[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollRail = (direction: 'previous' | 'next') => {
    const rail = railRef.current;
    if (!rail) return;
    const amount = Math.min(rail.clientWidth * 0.9, 900);
    rail.scrollBy({ left: direction === 'next' ? amount : -amount, behavior: 'smooth' });
  };

  if (!products.length) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto mb-8 flex max-w-[1440px] items-center justify-between px-4 sm:px-8">
        <button
          type="button"
          onClick={() => scrollRail('previous')}
          className="grid h-12 w-12 place-items-center rounded-full border border-[#573B2D]/20 bg-[#FEFFEF] text-[#573B2D] transition hover:bg-[#573B2D]/10"
          aria-label={`Previous ${title} products`}
        >
          <ChevronLeft size={19} />
        </button>
        <Link href={href} className="brand-heading text-center text-2xl uppercase hover:underline sm:text-4xl text-[#573B2D]">
          {title}
        </Link>
        <button
          type="button"
          onClick={() => scrollRail('next')}
          className="grid h-12 w-12 place-items-center rounded-full border border-[#573B2D]/20 bg-[#FEFFEF] text-[#573B2D] transition hover:bg-[#573B2D]/10"
          aria-label={`Next ${title} products`}
        >
          <ChevronRight size={19} />
        </button>
      </div>

      <div
        ref={railRef}
        className="product-rail flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:gap-7 sm:px-8 lg:px-[5vw]"
      >
        {products.map((product: HomeProduct, index: number) => (
          <div
            key={product.id || product._id || index}
            className="w-[82vw] flex-none snap-start sm:w-[54vw] md:w-[38vw] lg:w-[30vw] xl:w-[29vw] 2xl:w-[28vw]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

function getCollectionKey(collection: HomeCollection) {
  const source = `${collection?.slug || ''} ${collection?.name || ''} ${collection?.title || ''}`.toLowerCase();
  if (source.includes('lotus')) return 'lotus';
  if (source.includes('lion')) return 'lion';
  if (source.includes('artist')) return 'artist';
  return collection?.slug || '';
}

function getCollectionHref(collection: HomeCollection) {
  const key = getCollectionKey(collection);
  if (collectionUrlByKey[key]) return collectionUrlByKey[key];
  if (collection?.slug) return `/collections/${collection.slug}`;
  return collection?.href || '/products';
}

function ArtPanel({ index = 0, label }: { index?: number; label: string }) {
  return (
    <div className="atelier-visual aspect-[3/4]">
      <div className="absolute inset-x-8 bottom-8 z-10 border border-[#573B2D] bg-[#FEFFEF]/90 px-4 py-3 text-center">
        <p className="brand-heading text-sm uppercase text-[#573B2D]">{label}</p>
      </div>
      <div
        className="absolute z-10 h-24 w-24 rounded-full border border-[#573B2D]"
        style={{
          left: `${18 + index * 11}%`,
          top: `${16 + index * 8}%`,
        }}
      />
    </div>
  );
}

function getDefaultCollectionImage(key: string) {
  if (key === 'lotus') return 'https://mxwmpivtusrpktzptmqt.supabase.co/storage/v1/object/public/lotus-lion/products/1781967877380-media__1781967736031.jpg';
  if (key === 'lion') return 'https://images.unsplash.com/photo-1507679722338-958cf635959e?auto=format&fit=crop&w=800&q=80';
  if (key === 'artist') return 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80';
  return '';
}

export default function HomePageClient({ initialData }: { initialData: HomeCms | null }) {
  const [siteCms, setSiteCms] = useState<HomeCms>(initialData || {});

  useEffect(() => {
    if (siteCms?.lotusProducts?.length || siteCms?.lionProducts?.length) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    fetch(`${apiUrl}/cms/site`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setSiteCms(data); })
      .catch(() => {});
  }, []);

  const defaultSlides = [
    {
      title: 'Lotus & Lion',
      showTitle: false,
      subtitle: 'Original artist-led outfits for everyday and occasion wear.',
      eyebrow: 'ONLINE EXCLUSIVE',
      ctaText: 'Shop Now',
      ctaLink: '/collections/lotus',
    },
    {
      title: 'The Lion Tailoring',
      subtitle: 'Structured layers and quiet detail for the modern man.',
      eyebrow: 'NEW SEASON',
      ctaText: 'Explore Collection',
      ctaLink: '/collections/lion',
    }
  ];

  const sliderSource = (siteCms?.home?.slides?.length)
    ? siteCms.home.slides
    : (siteCms?.sections?.find((s: any) => s.section_key === 'hero-slider')?.content?.slides || defaultSlides);

  const filteredSlides = (sliderSource || []).filter((slide: any) => {
    const hasImage = typeof slide?.image === 'string' && slide.image.trim().length > 0;
    const hasTitle = typeof slide?.title === 'string' && slide.title.trim().length > 0;
    const hasMobileImage = typeof slide?.mobileImage === 'string' && slide.mobileImage.trim().length > 0;
    return hasImage || hasTitle || hasMobileImage;
  });

  const finalSlidesSource = filteredSlides.length > 0 ? filteredSlides : defaultSlides;

  const processedSlides = finalSlidesSource.map((slide: any, index: number) => {
    const defaultSlide = defaultSlides[index] || defaultSlides[0];
    const title = slide.title?.trim() ? slide.title : defaultSlide.title;
    const isBrandTitle = title.trim() === 'Lotus & Lion';
    return {
      ...slide,
      title,
      subtitle: slide.subtitle?.trim() ? slide.subtitle : defaultSlide.subtitle,
      eyebrow: slide.eyebrow?.trim() ? slide.eyebrow : defaultSlide.eyebrow,
      ctaText: slide.ctaText?.trim() ? slide.ctaText : defaultSlide.ctaText,
      ctaLink: slide.ctaLink?.trim() ? slide.ctaLink : defaultSlide.ctaLink,
      showTitle: isBrandTitle
        ? slide.brandTitleVisibilityOverridden === true && slide.showTitle === true
        : slide.showTitle !== false,
    };
  });

  const homeContent = {
    slides: processedSlides,
    lotusProducts: siteCms?.lotusProducts || [],
    lionProducts: siteCms?.lionProducts || [],
    collections: siteCms?.collections || []
  };

  const lotusRail = homeContent.lotusProducts || [];
  const lionRail = homeContent.lionProducts || [];

  const collectionsToDisplay: HomeCollection[] = [];
  if (siteCms?.collections?.length) {
    const mainColls = siteCms.collections
      .filter(c => c.slug === 'lotus' || c.slug === 'lion')
      .sort((a, b) => {
        if (a.slug === 'lotus') return -1;
        if (b.slug === 'lotus') return 1;
        return 0;
      });
    collectionsToDisplay.push(...mainColls);
  } else {
    collectionsToDisplay.push(fallbackCollections[0], fallbackCollections[1]);
  }

  return (
    <div className="bg-[#FEFFEF] text-[#573B2D]">
      <HeroSlider slides={homeContent.slides} />

      <ProductRail title="Lotus Collections" href="/collections/lotus" products={lotusRail.slice(0, 8)} />

      <section className="mx-auto max-w-[1440px] space-y-10 px-4 py-8 sm:px-8">
        {collectionsToDisplay.map((collection: HomeCollection, index: number) => {
          const collectionKey = getCollectionKey(collection);
          const collectionHref = getCollectionHref(collection);
          const collectionImage = siteCms.home?.collections?.[collectionKey]?.image || collection.hero?.image || collection.banner_url || getDefaultCollectionImage(collectionKey);
          
          const collectionName = collection.name || collection.title || (collectionKey === 'lotus' ? 'Lotus Collections' : collectionKey === 'lion' ? 'Lion Collections' : 'Artist Outfits');
          const fallbackDesc = collectionKey === 'lotus' ? fallbackCollections[0].body : collectionKey === 'lion' ? fallbackCollections[1].body : fallbackCollections[2].body;
          const collectionDesc = collection.description || collection.body || collection.hero?.subtitle || fallbackDesc;
          
          return (
            <div key={index} className={`grid items-center gap-8 border-y border-[#573B2D]/15 py-10 md:grid-cols-2 ${index % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <Link href={collectionHref} className="block">
                {collectionImage ? (
                  <img 
                    src={collectionImage} 
                    alt="" 
                    onError={(e) => {
                      e.currentTarget.src = getDefaultCollectionImage(collectionKey);
                    }}
                    className="aspect-[3/4] w-full object-cover" 
                  />
                ) : (
                  <ArtPanel index={index} label={collectionName} />
                )}
              </Link>
              <div className="mx-auto max-w-xl text-center md:text-left">
                {siteCms.home?.collections?.[collectionKey]?.showIcon === true && (collectionKey === 'lotus' ? <Flower2 className="mb-5 inline-block text-[#573B2D]" size={28} /> : <Crown className="mb-5 inline-block text-[#573B2D]" size={28} />)}
                <h2 className="brand-heading text-3xl uppercase text-[#573B2D]">{collectionName}</h2>
                <p className="mt-5 text-[15px] leading-8 text-[#573B2D]/80">{collectionDesc}</p>
                <Link href={collectionHref} className="mt-7 inline-block border-b border-[#573B2D] pb-1 text-[12px] uppercase tracking-[0.18em] text-[#573B2D] hover:opacity-75 transition-opacity">
                  View collection
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      <ProductRail title="Lion Collections" href="/collections/lion" products={lionRail.slice(0, 8)} />

      <section className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px border-b border-[#573B2D]/15 bg-[#573B2D]/15 md:grid-cols-4">
        {[
          { icon: ShieldCheck, title: 'Original Design', body: 'Symbols, panels, and copy made for Lotus & Lion' },
          { icon: Truck, title: 'Delivery Ready', body: 'Shipping flows connect through checkout' },
          { icon: RefreshCcw, title: 'Easy Returns', body: 'Return-policy pages are live' },
          { icon: Headphones, title: 'Admin Support', body: 'Products, orders, users, CMS and settings stay wired' },
        ].map((item) => (
          <div key={item.title} className="bg-[#FEFFEF] text-[#573B2D] px-5 py-8 text-center">
            <item.icon className="mx-auto mb-4 text-[#573B2D]" size={26} />
            <h3 className="text-[13px] uppercase tracking-[0.18em] font-bold">{item.title}</h3>
            <p className="mt-2 text-sm text-[#573B2D]/75">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
