'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  image: string;
  brand: string;
  category: string;
  collectionType: 'lotus' | 'lion' | 'artist';
  countInStock: number;
  images?: (string | { image_url: string })[];
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();
        const category = searchParams.get('category');
        const collectionType = searchParams.get('collectionType');
        if (category) params.set('category', category);
        if (collectionType) params.set('collectionType', collectionType);
        const { data } = await api.get(`/products${params.toString() ? `?${params.toString()}` : ''}`);
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#FEFFEF] py-10 text-[#573B2D]">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="mb-10 hidden text-center md:block">
          <h1 className="text-3xl uppercase tracking-[0.18em] text-[#573B2D]">All Collections</h1>
          <p className="mt-3 text-sm text-[#573B2D]/70">Refined essentials, dresses, sets, and occasion wear.</p>
        </div>

        <div className="mb-8 hidden flex-col justify-between gap-4 border-y border-[#573B2D]/20 py-4 md:flex md:flex-row md:items-center">
          <button className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-[#573B2D] hover:opacity-75 transition-opacity">
            <SlidersHorizontal size={16} />
            Filter
          </button>
          <div className="flex items-center gap-6">
            <span className="text-[12px] uppercase tracking-[0.18em] text-[#573B2D]/70">{products.length} products</span>
            <button className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-[#573B2D] hover:opacity-75 transition-opacity">
              Sort by
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-x-10 gap-y-14 md:grid-cols-4 md:gap-x-6 md:gap-y-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-[#573B2D]/10" />
                <div className="mx-auto mt-4 h-4 w-2/3 bg-[#573B2D]/10" />
                <div className="mx-auto mt-2 h-4 w-1/3 bg-[#573B2D]/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-10 gap-y-14 md:grid-cols-4 md:gap-x-6 md:gap-y-10">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="py-24 text-center">
            <p className="uppercase tracking-[0.18em] text-[#573B2D]/70">No products found in this collection.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FEFFEF] py-24 text-center uppercase tracking-[0.18em] text-[#573B2D]/70">Loading collection...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
