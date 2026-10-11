'use client';

import Link from 'next/link';
import type { MouseEvent, TouchEvent } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import { formatINR } from '@/lib/currency';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Product {
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
}

const ProductCard = ({ product }: { product: Product }) => {
  const addToCart = useStore((state) => state.addToCart);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const images = useMemo(() => {
    const gallery = product.images && product.images.length > 0 ? product.images : [product.image];
    const validImages = gallery
      .map((img) => (typeof img === 'string' ? img : img?.image_url))
      .filter(img => typeof img === 'string' && img.trim().length > 0 && img !== 'null' && img !== 'undefined');
      
    return validImages.length > 0 ? validImages : ['https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=1000'];
  }, [product.image, product.images]);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % images.length);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [images.length]);

  const currentPrice = product.discountPrice ? product.discountPrice : product.price;
  const regularPrice = product.discountPrice ? product.price : null;
  const savings = regularPrice ? Math.round(((regularPrice - currentPrice) / regularPrice) * 100) : 0;
  const productIdentifier = product.slug || product.id || product._id;
  const productHref = productIdentifier ? `/product/${productIdentifier}` : '/products';
  const activeImageIndex = images.length ? currentImageIdx % images.length : 0;

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    addToCart({
      product: productIdentifier,
      name: product.name,
      image: product.image,
      price: currentPrice,
      countInStock: product.countInStock,
      qty: 1,
    });
    toast.success('Added to bag');
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (images.length < 2 || touchStartX.current === null) return;

    const deltaX = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < 35) return;

    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIdx((prev) => {
      if (deltaX < 0) return prev === images.length - 1 ? 0 : prev + 1;
      return prev === 0 ? images.length - 1 : prev - 1;
    });
  };

  return (
    <Link href={productHref} className="group block bg-[#FEFFEF] text-[#573B2D]">
      <div
        className="group/card relative aspect-[9/16] overflow-hidden bg-[#FEFFEF]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeImageIndex}
            src={images[activeImageIndex] || 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=1000'}
            alt={product.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="h-full w-full object-contain object-top transition-transform duration-500 md:group-hover:scale-[1.02]"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=1000';
            }}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <div className="absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-between px-2 opacity-0 transition-opacity md:flex group-hover/card:opacity-100">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
                aria-label="Previous product image"
                className="grid h-10 w-10 place-items-center rounded-full bg-[#FEFFEF]/90 text-[#573B2D] shadow-sm transition hover:bg-[#FEFFEF]"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
                aria-label="Next product image"
                className="grid h-10 w-10 place-items-center rounded-full bg-[#FEFFEF]/90 text-[#573B2D] shadow-sm transition hover:bg-[#FEFFEF]"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-12 hidden justify-center gap-1.5 opacity-0 transition-opacity md:flex group-hover/card:opacity-100">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    activeImageIndex === idx ? 'bg-[#573B2D] w-3' : 'bg-[#573B2D]/30'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        {product.countInStock === 0 ? (
          <span className="absolute left-3 top-3 bg-[#f0ece1] px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-[#573B2D]">
            Out of Stock
          </span>
        ) : product.countInStock <= 5 ? (
          <span className="absolute left-3 top-3 bg-[#573B2D] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#FEFFEF]">
            Only {product.countInStock} Left
          </span>
        ) : savings > 0 ? (
          <span className="absolute left-3 top-3 bg-[#573B2D] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#FEFFEF]">
            Save {savings}%
          </span>
        ) : null}
        <button
          onClick={handleAddToCart}
          disabled={product.countInStock === 0}
          className="absolute inset-x-0 bottom-0 hidden items-center justify-center gap-2 bg-[#573B2D] py-3 text-[12px] uppercase tracking-[0.18em] text-[#FEFFEF] opacity-0 transition-opacity hover:bg-[#3d291f] disabled:bg-[#8c7365] md:flex group-hover/card:opacity-100"
        >
          <ShoppingBag size={14} />
          Choose options
        </button>
      </div>

      <div className="pt-4 text-left md:text-center">
        <p className="text-[17px] leading-snug tracking-normal md:text-[13px] md:leading-5 text-[#573B2D]">{product.name}</p>
        <p className="mt-2 text-[15px] font-bold text-[#573B2D] md:text-[13px]">{formatINR(currentPrice)}</p>
        {regularPrice && <p className="text-[12px] text-[#573B2D]/60 line-through">{formatINR(regularPrice)}</p>}
      </div>
    </Link>
  );
};

export default ProductCard;
