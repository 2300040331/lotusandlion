'use client';

import { useEffect, useRef, useState, use } from 'react';
import type { TouchEvent } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import { formatINR } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Truck, ShieldCheck, RefreshCw, X } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
  countInStock: number;
  category: string;
  collectionType?: 'lotus' | 'lion' | 'artist';
  description: string;
  images?: string[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const addToCart = useStore((state) => state.addToCart);

  const images = product?.images && product.images.length > 0 ? product.images : (product?.image ? [product.image] : []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      product: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      countInStock: product.countInStock,
      qty,
    });
    toast.success('Added to bag');
  };

  const handleImageTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleImageTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (images.length < 2 || touchStartX.current === null) return;

    const deltaX = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < 40) return;

    setActiveImageIdx((prev) => {
      if (deltaX < 0) return prev === images.length - 1 ? 0 : prev + 1;
      return prev === 0 ? images.length - 1 : prev - 1;
    });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FEFFEF] text-[#573B2D]">
      <div className="w-12 h-12 border-2 border-[#573B2D] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="uppercase tracking-[0.3em] text-[10px] font-bold text-[#573B2D]/70">Preparing the piece</p>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FEFFEF] text-[#573B2D] px-6 text-center">
      <h2 className="brand-heading text-2xl uppercase mb-4 text-[#573B2D]">Piece Not Found</h2>
      <p className="uppercase tracking-[0.2em] text-[10px] text-[#573B2D]/70 mb-8">The requested item could not be retrieved from the collection.</p>
      <Link href="/products" className="border-b border-[#573B2D] pb-1 text-[10px] uppercase font-bold tracking-widest text-[#573B2D]">Return to Collection</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FEFFEF] py-12 text-[#573B2D] md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#573B2D]/70 mb-12">
          <Link href="/" className="hover:text-[#573B2D]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-[#573B2D]">Collection</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#573B2D]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Image Gallery */}
          <div className="space-y-6">
             <div
               className="relative aspect-[9/16] overflow-hidden bg-[#FEFFEF] group cursor-pointer"
               onClick={() => setIsImageModalOpen(true)}
               onTouchStart={handleImageTouchStart}
               onTouchEnd={handleImageTouchEnd}
             >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageIdx}
                    src={images[activeImageIdx]}
                    alt={product.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full object-contain hover:brightness-95 transition-all"
                  />
                </AnimatePresence>
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#573B2D]/20">
                  <div className="text-[#FEFFEF] text-center">
                    <p className="text-sm font-bold uppercase tracking-widest">Click to expand</p>
                  </div>
                </div>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-[#FEFFEF]/80 hover:bg-[#FEFFEF] text-[#573B2D] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-[#FEFFEF]/80 hover:bg-[#FEFFEF] text-[#573B2D] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {!images[activeImageIdx] && (
                  <div className="atelier-visual h-full w-full">
                    <div className="absolute inset-x-10 bottom-10 z-10 border border-[#573B2D] bg-[#FEFFEF]/90 p-5 text-center">
                      <p className="brand-heading text-xl uppercase text-[#573B2D]">{product.name}</p>
                    </div>
                  </div>
                )}
             </div>

             {/* Thumbnails */}
             {images.length > 1 && (
               <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                 {images.map((img, idx) => (
                   <button
                     key={idx}
                     onClick={() => setActiveImageIdx(idx)}
                     className={`relative flex-shrink-0 w-20 aspect-[9/16] border-2 transition-all ${
                       activeImageIdx === idx ? 'border-[#573B2D]' : 'border-transparent hover:border-[#573B2D]/30'
                     }`}
                   >
                     <img src={img} alt="" className="w-full h-full object-contain" />
                   </button>
                 ))}
               </div>
             )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#573B2D] uppercase tracking-[0.3em] mb-4">{product.category}</span>
            <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight mb-6 text-[#573B2D]">{product.name}</h1>
            <p className="text-2xl font-medium tracking-widest text-[#573B2D] mb-8">{formatINR(product.price)}</p>
            
            <div 
              className="mb-12 max-w-lg text-sm leading-relaxed text-[#573B2D]/80 italic prose prose-sm"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />

            {/* Quantity Selector */}
            {product.countInStock > 0 && (
              <div className="mb-8">
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-4 text-[#573B2D]">Quantity</label>
                <div className="flex items-center border border-[#573B2D]/30 w-fit">
                  <button 
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-4 py-2 hover:bg-[#573B2D]/10 transition-colors border-r border-[#573B2D]/30 text-[#573B2D]"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 text-sm font-medium text-[#573B2D]">{qty}</span>
                  <button 
                    onClick={() => setQty(Math.min(product.countInStock, qty + 1))}
                    className="px-4 py-2 hover:bg-[#573B2D]/10 transition-colors border-l border-[#573B2D]/30 text-[#573B2D]"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 mb-12">
              <button
                onClick={handleAddToCart}
                disabled={product.countInStock === 0}
                className="flex w-full items-center justify-center gap-3 bg-[#573B2D] py-5 text-xs font-bold uppercase tracking-[0.2em] text-[#FEFFEF] transition-all hover:bg-[#3d291f] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                {product.countInStock > 0 ? 'Add to Bag' : 'Sold Out'}
              </button>
            </div>

            {/* Product Meta */}
            <div className="border-t border-[#573B2D]/15 pt-8 grid grid-cols-1 gap-6">
              <div className="flex items-center gap-4">
                <Truck className="w-5 h-5 text-[#573B2D]" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#573B2D]">Complimentary Shipping</h4>
                  <p className="text-[10px] text-[#573B2D]/70 uppercase tracking-widest">On all orders above {formatINR(500)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-5 h-5 text-[#573B2D]" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#573B2D]">Authenticity Guaranteed</h4>
                  <p className="text-[10px] text-[#573B2D]/70 uppercase tracking-widest">Certificate included with every piece</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <RefreshCw className="w-5 h-5 text-[#573B2D]" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#573B2D]">Returns</h4>
                  <p className="text-[10px] text-[#573B2D]/70 uppercase tracking-widest">14-day boutique returns policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {isImageModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImageModalOpen(false)}
              className="fixed inset-0 z-40 bg-[#573B2D]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="relative max-w-4xl max-h-screen w-full h-full flex items-center justify-center">
                <button
                  onClick={() => setIsImageModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-[#FEFFEF]/90 hover:bg-[#FEFFEF] transition-colors z-10 text-[#573B2D]"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={images[activeImageIdx]}
                    alt={product.name}
                    className="max-w-full max-h-[90vh] object-contain"
                  />

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-[#FEFFEF]/90 hover:bg-[#FEFFEF] text-[#573B2D] rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-[#FEFFEF]/90 hover:bg-[#FEFFEF] text-[#573B2D] rounded-full transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-[#573B2D]/70 rounded-full px-4 py-2">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIdx(idx)}
                            className={`h-2 rounded-full transition-all ${
                              activeImageIdx === idx ? 'w-6 bg-[#FEFFEF]' : 'w-2 bg-[#FEFFEF]/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
