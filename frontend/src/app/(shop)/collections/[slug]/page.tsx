'use client';

import { useEffect, useState, use } from 'react';
import { collectionsService } from '@/lib/services/collectionsService';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { formatINR } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: Array<{ image_url: string; alt_text: string }>;
  is_featured: boolean;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  banner_url: string;
  color_primary: string;
  color_secondary: string;
  hero?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    image?: string;
    ctaText?: string;
    ctaLink?: string;
  };
  products: Product[];
}

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: parentSlug } = use(params);
  const [selectedSubSlug, setSelectedSubSlug] = useState<string>(parentSlug);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [subCollections, setSubCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  // Sync selectedSubSlug when parentSlug route parameter changes
  useEffect(() => {
    const fetchAndSync = async () => {
      try {
        const collections = await collectionsService.getCollections();
        const womenSlugs = ['lotus', 'women', 'womens'];
        const menSlugs = ['lion', 'men', 'mens'];
        
        let targetSlug = parentSlug;
        let matched = collections.find((c: any) => c.slug === parentSlug.toLowerCase());
        if (!matched) {
          if (womenSlugs.includes(parentSlug.toLowerCase())) {
            matched = collections.find((c: any) => womenSlugs.includes(c.slug?.toLowerCase()));
          } else if (menSlugs.includes(parentSlug.toLowerCase())) {
            matched = collections.find((c: any) => menSlugs.includes(c.slug?.toLowerCase()));
          }
        }
        if (matched) {
          targetSlug = matched.slug;
        }
        setSelectedSubSlug(targetSlug);
      } catch (error) {
        setSelectedSubSlug(parentSlug);
      }
    };
    fetchAndSync();
  }, [parentSlug]);

  // Fetch all collections to build sub-collections list for the parent gender
  useEffect(() => {
    const fetchSubCollections = async () => {
      try {
        const collections = await collectionsService.getCollections();
        const womenSlugs = ['lotus', 'women', 'womens'];
        const menSlugs = ['lion', 'men', 'mens'];
        
        // Find the parent collection details
        let parentColl = collections.find((c: any) => c.slug === parentSlug.toLowerCase());
        if (!parentColl) {
          if (womenSlugs.includes(parentSlug.toLowerCase())) {
            parentColl = collections.find((c: any) => womenSlugs.includes(c.slug?.toLowerCase()));
          } else if (menSlugs.includes(parentSlug.toLowerCase())) {
            parentColl = collections.find((c: any) => menSlugs.includes(c.slug?.toLowerCase()));
          }
        }

        if (parentColl) {
          const parentGender = parentColl.hero?.gender || 
            (womenSlugs.includes(parentColl.slug?.toLowerCase()) ? 'women' : 
             menSlugs.includes(parentColl.slug?.toLowerCase()) ? 'men' : null);
          
          if (parentGender) {
            // Filter collections belonging to the same gender
            const filtered = collections.filter((c: any) => {
              const g = c.hero?.gender || 
                (womenSlugs.includes(c.slug?.toLowerCase()) ? 'women' : 
                 menSlugs.includes(c.slug?.toLowerCase()) ? 'men' : null);
              return g === parentGender;
            });
            // Ensure parentColl is first, then the rest
            const sorted = filtered.sort((a: any, b: any) => {
              if (a.slug === parentColl.slug) return -1;
              if (b.slug === parentColl.slug) return 1;
              return 0;
            });
            setSubCollections(sorted);
          } else {
            setSubCollections([parentColl]);
          }
        }
      } catch (error) {
        console.error('Error fetching sub-collections:', error);
      }
    };
    fetchSubCollections();
  }, [parentSlug]);

  // Fetch the selected sub-collection details and products
  useEffect(() => {
    const fetchCollection = async () => {
      if (collection) {
        setSwitching(true);
      } else {
        setLoading(true);
      }
      try {
        const data = await collectionsService.getCollectionWithProducts(selectedSubSlug);
        setCollection(data);
      } catch (error) {
        console.error('Error fetching collection:', error);
      } finally {
        setLoading(false);
        setSwitching(false);
      }
    };

    fetchCollection();
  }, [selectedSubSlug]);

  if (loading && !collection) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FEFFEF]">
        <div className="text-xl text-[#573B2D]">Loading...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FEFFEF]">
        <div className="text-xl text-[#573B2D]">Collection not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFFEF] text-[#573B2D]">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative flex h-[50vh] md:h-[60vh] lg:h-[65vh] overflow-hidden items-center justify-center"
        style={{
          backgroundColor: collection.slug === 'lotus' ? '#f5c5cc' : '#030712'
        }}
      >
        {/* Background Image */}
        {(collection.hero?.image || collection.banner_url) && (
          <Image
            src={collection.hero?.image || collection.banner_url}
            alt={collection.name}
            fill
            className={collection.slug === 'lotus' ? 'object-contain' : 'object-cover object-top'}
            priority
          />
        )}
        
        {/* Overlay for text readability (only for non-Lotus collections) */}
        {collection.slug !== 'lotus' && (
          <div className="absolute inset-0 bg-black/35" />
        )}
        
        {/* Content (only for non-Lotus collections to prevent clashing with flyer text) */}
        {collection.slug !== 'lotus' && (
          <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center md:py-24">
            {collection.hero?.eyebrow && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xs md:text-sm uppercase tracking-widest text-white/90 mb-3 md:mb-4"
              >
                {collection.hero.eyebrow}
              </motion.p>
            )}
            
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6"
            >
              {collection.hero?.title || collection.name}
            </motion.h1>
            
            {collection.hero?.subtitle && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm md:text-lg text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto"
              >
                {collection.hero.subtitle}
              </motion.p>
            )}
            
            {collection.hero?.ctaText && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  href={collection.hero.ctaLink || `#products`}
                  className="inline-block bg-[#FEFFEF] text-[#573B2D] px-6 py-2.5 md:px-8 md:py-3 rounded-lg text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-[#FEFFEF]/90 transition-colors"
                >
                  {collection.hero.ctaText}
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Description */}
      <div className="max-w-7xl mx-auto px-5 py-12 md:px-6 md:py-16">
        {collection.description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 hidden max-w-3xl text-lg text-[#573B2D]/80 md:block"
          >
            {collection.description}
          </motion.p>
        )}

        {/* Sub-Collections Tabs */}
        {subCollections.length > 1 && (
          <div className="mb-12 flex justify-center gap-6 border-b border-[#573B2D]/20 pb-4">
            {subCollections.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubSlug(sub.slug)}
                className={`relative pb-3 text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${
                  selectedSubSlug === sub.slug ? 'text-[#573B2D]' : 'text-[#573B2D]/50 hover:text-[#573B2D]'
                }`}
              >
                {sub.name}
                {selectedSubSlug === sub.slug && (
                  <motion.div
                    layoutId="activeSubTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#573B2D]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        <div id="products" className={`scroll-mt-16 transition-opacity duration-300 ${switching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <h2 className="mb-6 text-2xl font-bold text-[#573B2D] md:mb-10 md:text-4xl">{collection.name}</h2>
          <div className="grid grid-cols-2 gap-x-10 gap-y-14 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {collection.products?.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group"
              >
                <Link href={`/product/${product.slug}`}>
                  <div className="relative mb-4 overflow-hidden bg-[#FEFFEF] md:mb-6" style={{ aspectRatio: '9/16' }}>
                    {product.images?.[0]?.image_url && (
                      <Image
                        src={product.images[0].image_url}
                        alt={product.name}
                        fill
                        className="object-contain object-top w-full h-full transition-transform duration-300 md:group-hover:scale-[1.02]"
                        onError={(e) => {
                          e.currentTarget.srcset = '';
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=1000';
                        }}
                      />
                    )}
                    {product.is_featured && (
                      <div className="absolute right-2 top-2 bg-[#573B2D] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#FEFFEF] md:right-3 md:top-3 md:px-4 md:py-2 md:text-sm">
                        Featured
                      </div>
                    )}
                  </div>
                  <h3 className="mb-2 text-[17px] font-normal leading-snug text-[#573B2D] transition-colors group-hover:opacity-75 md:text-lg md:font-bold">{product.name}</h3>
                  <p className="text-[15px] text-[#573B2D]/80 md:text-xl md:font-bold md:text-[#573B2D]">{formatINR(product.price)}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
