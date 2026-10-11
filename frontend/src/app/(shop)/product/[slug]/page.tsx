'use client';

import { useEffect, useRef, useState, use } from 'react';
import type { TouchEvent } from 'react';
import { productsService } from '@/lib/services/productsService';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  rich_description: string;
  price: number;
  discount_price: number;
  stock_quantity: number;
  collection: { id: string; name: string; slug: string };
  images: Array<{ id: string; image_url: string; alt_text: string }>;
  variants: Array<{ id: string; size: string; color: string; quantity: number }>;
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const touchStartX = useRef<number | null>(null);
  const addToCart = useStore((state) => state.addToCart);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productsService.getProductBySlug(slug);
        setProduct(data);
        if (data && data.stock_quantity === 0) {
          setQuantity(0);
        }
        // Fetch similar products
        const allProducts = await productsService.getProducts();
        const filtered = (allProducts || []).filter((p: any) => p.slug !== slug);
        setSimilarProducts(filtered);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FEFFEF] text-[#573B2D]">
        <div className="text-xl text-[#573B2D]/70 font-medium">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FEFFEF] text-[#573B2D]">
        <div className="text-xl text-[#573B2D]/70 font-medium">Product not found</div>
      </div>
    );
  }

  const sizes = [...new Set(product.variants?.map((v) => v.size) || [])];
  const colors = [...new Set(product.variants?.map((v) => v.color) || [])];

  const getSizeStock = (size: string) => {
    if (!product || !product.variants) return 0;
    if (selectedColor) {
      const variant = product.variants.find(
        (v) => v.size === size && v.color === selectedColor
      );
      return variant ? variant.quantity : 0;
    }
    return product.variants
      .filter((v) => v.size === size)
      .reduce((sum, v) => sum + (v.quantity || 0), 0);
  };

  const getColorStock = (color: string) => {
    if (!product || !product.variants) return 0;
    if (selectedSize) {
      const variant = product.variants.find(
        (v) => v.color === color && v.size === selectedSize
      );
      return variant ? variant.quantity : 0;
    }
    return product.variants
      .filter((v) => v.color === color)
      .reduce((sum, v) => sum + (v.quantity || 0), 0);
  };

  const getSelectedVariantStock = () => {
    if (!product) return 0;
    const hasColors = colors.length > 0 && !(colors.length === 1 && colors[0] === 'Default');
    const hasSizes = sizes.length > 0;

    if (hasSizes && hasColors) {
      if (selectedSize && selectedColor) {
        const variant = product.variants?.find(
          (v) => v.size === selectedSize && v.color === selectedColor
        );
        return variant ? variant.quantity : 0;
      }
      return product.stock_quantity;
    } else if (hasSizes) {
      if (selectedSize) {
        const variant = product.variants?.find(
          (v) => v.size === selectedSize && (v.color === 'Default' || !v.color)
        );
        return variant ? variant.quantity : 0;
      }
      return product.stock_quantity;
    } else if (hasColors) {
      if (selectedColor) {
        const variant = product.variants?.find(
          (v) => v.color === selectedColor && (v.size === 'Default' || !v.size)
        );
        return variant ? variant.quantity : 0;
      }
      return product.stock_quantity;
    }
    return product.stock_quantity;
  };

  const hasColors = colors.length > 0 && !(colors.length === 1 && colors[0] === 'Default');
  const hasSizes = sizes.length > 0;
  const selectedVariantStock = getSelectedVariantStock();
  const isOutOfStock = selectedVariantStock <= 0;
  const isSelectionMissing = (hasSizes && !selectedSize) || (hasColors && !selectedColor);

  let buttonText = 'Add to Cart';
  if (hasSizes && !selectedSize) {
    buttonText = 'Select Size';
  } else if (hasColors && !selectedColor) {
    buttonText = 'Select Color';
  } else if (isOutOfStock) {
    buttonText = 'Out of Stock';
  }

  const handleAddToCart = () => {
    if (!product) return;

    if (hasSizes && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (hasColors && !selectedColor) {
      toast.error('Please select a color');
      return;
    }

    const maxStock = getSelectedVariantStock();
    if (maxStock <= 0) {
      toast.error('This combination is out of stock');
      return;
    }

    addToCart({
      product: product.id,
      name: product.name,
      image: product.images?.[0]?.image_url || '',
      price: product.discount_price || product.price,
      countInStock: maxStock,
      qty: quantity,
      size: hasSizes ? selectedSize : undefined,
      color: hasColors ? selectedColor : undefined,
    });

    toast.success('Added to cart!');
  };

  const handleImageTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleImageTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!product?.images || product.images.length < 2 || touchStartX.current === null) return;

    const deltaX = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < 40) return;

    setSelectedImage((prev) => {
      if (deltaX < 0) return prev === product.images.length - 1 ? 0 : prev + 1;
      return prev === 0 ? product.images.length - 1 : prev - 1;
    });
  };

  return (
    <div className="bg-[#FEFFEF] text-[#573B2D]">
      <div className="mx-auto px-0 py-0">
        <div className="grid grid-cols-1 lg:grid-cols-[75%_25%] gap-0 lg:min-h-screen">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col bg-[#FEFFEF] lg:sticky lg:top-0"
          >
            <div
              className="relative w-full bg-[#FEFFEF] flex items-center justify-center py-8 lg:py-10 px-4 lg:flex-1 lg:min-h-screen"
              onTouchStart={handleImageTouchStart}
              onTouchEnd={handleImageTouchEnd}
            >
              {product.images && product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                    className="absolute left-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-[#573B2D]/20 bg-[#FEFFEF]/80 hover:bg-[#FEFFEF] text-[#573B2D] shadow-sm transition-all focus:outline-none hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-[#573B2D]/20 bg-[#FEFFEF]/80 hover:bg-[#FEFFEF] text-[#573B2D] shadow-sm transition-all focus:outline-none hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
              {product.images?.[selectedImage] ? (
                <div className="relative h-[min(78vh,980px)] min-h-[620px] w-full max-w-[560px]">
                  <Image
                    src={product.images[selectedImage].image_url}
                    alt={product.name}
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 70vw"
                  />
                </div>
              ) : (
                <div className="relative h-[min(78vh,980px)] min-h-[620px] w-full max-w-[560px]">
                  <Image
                    src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=1000"
                    alt="Placeholder"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            <div className="flex gap-3 bg-[#FEFFEF] border-t border-[#573B2D]/15 py-4 px-4 lg:px-6 overflow-x-auto">
              {product.images?.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative h-28 w-20 flex-shrink-0 overflow-hidden border-2 bg-[#FEFFEF] transition-all md:h-32 md:w-24 ${ idx === selectedImage ? 'border-[#573B2D] shadow-md' : 'border-[#573B2D]/20 hover:border-[#573B2D]/40'}`}
                >
                  <Image
                    src={img.image_url}
                    alt={`${product.name} ${idx}`}
                    fill
                    className="object-contain w-full h-full"
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="overflow-y-auto px-6 md:px-8 py-8 md:py-12 bg-[#FEFFEF] border-l border-[#573B2D]/15"
          >
            <div className="space-y-8 max-w-sm">
              <h1 className="text-4xl md:text-5xl font-bold text-[#573B2D] mb-2">{product.name}</h1>
              <p className="text-base text-[#573B2D]/75">
                Collection: <span className="font-semibold text-[#573B2D]">{product.collection?.name}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 mb-8 mt-4">
              <span className="text-3xl font-bold text-[#573B2D]">
                ₹{product.discount_price || product.price}
              </span>
              {product.discount_price && (
                <span className="text-lg text-[#573B2D]/60 line-through">
                  ₹{product.price}
                </span>
              )}
            </div>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mb-8">
                <label className="block text-base font-bold mb-3 text-[#573B2D]">Size</label>
                <div className="flex gap-3 flex-wrap">
                  {sizes.map((size) => {
                    const stock = getSizeStock(size);
                    const isSizeOutOfStock = stock <= 0;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                        disabled={isSizeOutOfStock && selectedColor !== ''}
                        className={`px-5 py-2.5 border-2 rounded-lg transition text-base font-medium flex flex-col items-center min-w-[70px] cursor-pointer ${
                          selectedSize === size
                            ? 'border-[#573B2D] bg-[#573B2D] text-[#FEFFEF]'
                            : isSizeOutOfStock
                            ? 'border-[#573B2D]/15 text-[#573B2D]/40 bg-[#573B2D]/5 cursor-not-allowed opacity-60'
                            : 'border-[#573B2D]/30 text-[#573B2D] hover:border-[#573B2D]'
                        }`}
                      >
                        <span className="font-bold text-sm">{size}</span>
                        <span className="text-[9px] font-normal opacity-80 mt-0.5">
                          {stock > 0 ? `${stock} left` : 'Sold out'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && !(colors.length === 1 && colors[0] === 'Default') && (
              <div className="mb-8">
                <label className="block text-base font-bold mb-3 text-[#573B2D]">Color</label>
                <div className="flex gap-3 flex-wrap">
                  {colors.map((color) => {
                    const stock = getColorStock(color);
                    const isColorOutOfStock = stock <= 0;
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                        disabled={isColorOutOfStock && selectedSize !== ''}
                        className={`px-5 py-2.5 border-2 rounded-lg transition text-base font-medium flex flex-col items-center min-w-[80px] cursor-pointer ${
                          selectedColor === color
                            ? 'border-[#573B2D] bg-[#573B2D] text-[#FEFFEF]'
                            : isColorOutOfStock
                            ? 'border-[#573B2D]/15 text-[#573B2D]/40 bg-[#573B2D]/5 cursor-not-allowed opacity-60'
                            : 'border-[#573B2D]/30 text-[#573B2D] hover:border-[#573B2D]'
                        }`}
                      >
                        <span className="font-bold text-sm">{color}</span>
                        <span className="text-[9px] font-normal opacity-80 mt-0.5">
                          {stock > 0 ? `${stock} left` : 'Sold out'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#573B2D]/75 mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(selectedVariantStock > 0 ? 1 : 0, quantity - 1))}
                  className="w-9 h-9 border border-[#573B2D]/30 rounded-md hover:bg-[#573B2D]/10 flex items-center justify-center text-sm font-medium transition cursor-pointer text-[#573B2D]"
                  type="button"
                >
                  −
                </button>
                <span className="text-sm font-bold min-w-8 text-center text-[#573B2D]">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(selectedVariantStock, quantity + 1)
                    )
                  }
                  className="w-9 h-9 border border-[#573B2D]/30 rounded-md hover:bg-[#573B2D]/10 flex items-center justify-center text-sm font-medium transition cursor-pointer text-[#573B2D]"
                  type="button"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock */}
            <div className="mb-6">
              {!isSelectionMissing ? (
                selectedVariantStock > 0 ? (
                  <p className="text-sm text-green-700 font-semibold">✓ {selectedVariantStock} available in stock</p>
                ) : (
                  <p className="text-sm text-[#573B2D] font-semibold">Out of Stock</p>
                )
              ) : (
                <p className="text-sm text-[#573B2D]/70 font-medium">Please select size and color to view availability</p>
              )}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isSelectionMissing || isOutOfStock}
              className="w-full bg-[#573B2D] text-[#FEFFEF] py-3 rounded-lg text-xs uppercase font-bold tracking-widest hover:bg-[#3d291f] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {buttonText}
            </button>

            {/* Collapsible Description Accordion */}
            <div className="border-t border-b border-[#573B2D]/20 py-4 mt-8">
              <button
                onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                className="flex w-full items-center justify-between text-left focus:outline-none cursor-pointer"
              >
                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#573B2D]">
                  Description
                </span>
                <span className="text-xl font-light text-[#573B2D]/70">
                  {isDescriptionOpen ? '−' : '+'}
                </span>
              </button>
              
              {isDescriptionOpen && (
                <div 
                  className="mt-4 text-[13px] text-[#573B2D]/80 leading-relaxed prose prose-sm max-w-none transition-all duration-300"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* Description */}
        {product.rich_description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-16 border-t border-[#573B2D]/20 pt-8 px-4 md:px-8"
          >
            <h2 className="text-2xl font-bold mb-4 text-[#573B2D]">Description</h2>
            <div
              className="text-[#573B2D]/80"
              dangerouslySetInnerHTML={{ __html: product.rich_description }}
            />
          </motion.div>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 border-t border-[#573B2D]/20 pt-10 pb-16 px-4 md:px-8"
          >
            <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#573B2D] mb-8 text-center">
              View Similar Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {similarProducts.map((item: any) => {
                const imgUrl = item.images?.[0]?.image_url || '';
                const displayPrice = item.discount_price || item.price;
                return (
                  <Link
                    key={item.id}
                    href={`/product/${item.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#FEFFEF] mb-3">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={item.name}
                          fill
                          className="object-contain object-top transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          onError={(e) => {
                            e.currentTarget.srcset = '';
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=1000';
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#573B2D]/40 text-xs">No Image</div>
                      )}
                    </div>
                    <h3 className="text-[12px] font-semibold text-[#573B2D] truncate group-hover:underline">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[13px] font-bold text-[#573B2D]">₹{displayPrice}</span>
                      {item.discount_price && item.discount_price < item.price && (
                        <span className="text-[11px] text-[#573B2D]/50 line-through">₹{item.price}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
