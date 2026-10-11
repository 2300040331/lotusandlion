'use client';

import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import api from '@/lib/api';

type CartAvailability = {
  available: boolean;
  stock: number;
  message?: string;
};

export default function CartPage() {
  const { cartItems, removeFromCart, addToCart } = useStore();
  const [availability, setAvailability] = useState<Record<string, CartAvailability>>({});
  const [checkingStock, setCheckingStock] = useState(true);
  const safeCartItems = useMemo(() => Array.isArray(cartItems) ? cartItems : [], [cartItems]);

  const getAvailabilityKey = (item: any) => `${item.product}-${item.size || ''}-${item.color || ''}`;

  useEffect(() => {
    let mounted = true;

    const checkCartStock = async () => {
      if (safeCartItems.length === 0) {
        setAvailability({});
        setCheckingStock(false);
        return;
      }

      setCheckingStock(true);
      const results = await Promise.all(
        safeCartItems.map(async (item) => {
          const availabilityKey = getAvailabilityKey(item);
          try {
            const { data } = await api.get(`/products/${item.product}`);
            let stock = Number(data.countInStock ?? data.stock_quantity ?? 0);
            
            if (data.variants && data.variants.length > 0) {
              const hasColors = data.variants.some((v: any) => v.color && v.color !== 'Default');
              const hasSizes = data.variants.some((v: any) => v.size && v.size !== 'Default');
              
              if ((hasSizes && item.size) || (hasColors && item.color)) {
                const variant = data.variants.find((v: any) => {
                  const matchSize = !item.size || v.size === item.size;
                  const matchColor = !item.color || v.color === item.color;
                  return matchSize && matchColor;
                });
                stock = variant ? Number(variant.quantity) : 0;
              }
            }

            const requestedQty = Number(item.qty) || 0;
            return [availabilityKey, {
              available: stock > 0 && stock >= requestedQty,
              stock,
              message: stock <= 0 ? 'Out of stock' : stock < requestedQty ? `Only ${stock} left` : undefined,
            }] as const;
          } catch {
            return [availabilityKey, {
              available: false,
              stock: 0,
              message: 'No longer available',
            }] as const;
          }
        })
      );

      if (mounted) {
        setAvailability(Object.fromEntries(results));
        setCheckingStock(false);
      }
    };

    checkCartStock();
    return () => {
      mounted = false;
    };
  }, [safeCartItems]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const unavailableItems = safeCartItems.filter((item) => availability[getAvailabilityKey(item)]?.available === false);
  const canCheckout = !checkingStock && unavailableItems.length === 0;
  const subtotal = safeCartItems.reduce((acc, item) => {
    if (availability[getAvailabilityKey(item)]?.available === false) return acc;
    return acc + (Number(item.qty) || 0) * (Number(item.price) || 0);
  }, 0);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FEFFEF] py-24 flex items-center justify-center">
        <div className="text-xs uppercase tracking-[0.2em] text-[#573B2D]/70">Loading your bag...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFFEF] text-[#573B2D] py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold uppercase tracking-tight mb-12 text-[#573B2D]">Your Bag</h1>

        {safeCartItems.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#573B2D]/20">
            <ShoppingBag className="w-12 h-12 mx-auto text-[#573B2D]/40 mb-6" />
            <p className="text-[#573B2D]/70 uppercase tracking-widest mb-8">Your bag is empty.</p>
            <Link
              href="/products"
              className="inline-block bg-[#573B2D] text-[#FEFFEF] px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#573B2D]/90 transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-8">
              {safeCartItems.map((item) => {
                const availabilityKey = getAvailabilityKey(item);
                return (
                  <div key={availabilityKey} className={`flex gap-6 pb-8 border-b border-[#573B2D]/15 ${availability[availabilityKey]?.available === false ? 'opacity-70' : ''}`}>
                    <div className="w-24 h-32 md:w-32 md:h-44 bg-[#FEFFEF] border border-[#573B2D]/10 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-2">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-sm font-bold uppercase tracking-wide text-[#573B2D]">{item.name}</h3>
                          <button
                            onClick={() => removeFromCart(item.product, item.size, item.color)}
                            className="text-[#573B2D]/40 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {item.size && (
                          <p className="text-[10px] text-[#573B2D]/70 uppercase tracking-wider mb-0.5">
                            Size: <span className="font-semibold text-[#573B2D]">{item.size}</span>
                          </p>
                        )}
                        {item.color && item.color !== 'Default' && (
                          <p className="text-[10px] text-[#573B2D]/70 uppercase tracking-wider mb-2">
                            Color: <span className="font-semibold text-[#573B2D]">{item.color}</span>
                          </p>
                        )}
                        <p className="text-xs text-[#573B2D] font-medium tracking-widest">{formatINR(item.price)}</p>
                        {availability[availabilityKey]?.available === false && (
                          <p className="mt-2 inline-block bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600">
                            {availability[availabilityKey]?.message || 'Out of stock'}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex items-center border border-[#573B2D]/20">
                          <button
                            onClick={() => addToCart({ ...item, qty: Math.max(1, item.qty - 1) })}
                            disabled={availability[availabilityKey]?.available === false}
                            className="px-3 py-1 hover:bg-[#573B2D]/10 transition-colors border-r border-[#573B2D]/20 text-xs cursor-pointer text-[#573B2D]"
                          >
                            -
                          </button>
                          <span className="px-4 py-1 text-xs font-medium text-[#573B2D]">{item.qty}</span>
                          <button
                            onClick={() => addToCart({ ...item, countInStock: availability[availabilityKey]?.stock ?? item.countInStock, qty: Math.min(availability[availabilityKey]?.stock ?? item.countInStock, item.qty + 1) })}
                            disabled={availability[availabilityKey]?.available === false}
                            className="px-3 py-1 hover:bg-[#573B2D]/10 transition-colors border-l border-[#573B2D]/20 text-xs cursor-pointer text-[#573B2D]"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-bold tracking-widest uppercase text-[#573B2D]">
                          {formatINR(item.qty * item.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#FEFFEF] p-8 h-fit border border-[#573B2D]/20 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-[#573B2D]">Summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-xs tracking-widest uppercase text-[#573B2D]">
                  <span className="text-[#573B2D]/70">Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs tracking-widest uppercase text-[#573B2D]">
                  <span className="text-[#573B2D]/70">Shipping</span>
                  <span className="text-[#573B2D] font-medium">Complimentary</span>
                </div>
                <div className="pt-4 border-t border-[#573B2D]/20 flex justify-between font-bold text-sm tracking-widest uppercase text-[#573B2D]">
                  <span>Total</span>
                  <span className="text-[#573B2D]">{formatINR(subtotal)}</span>
                </div>
              </div>
              {unavailableItems.length > 0 && (
                <p className="mb-6 bg-red-50 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-red-600">
                  Remove unavailable or out-of-stock products before checkout.
                </p>
              )}
              <Link
                href="/checkout"
                aria-disabled={!canCheckout}
                onClick={(e) => {
                  if (!canCheckout) e.preventDefault();
                }}
                className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                  canCheckout
                    ? 'bg-[#573B2D] text-[#FEFFEF] hover:bg-[#573B2D]/90'
                    : 'pointer-events-none bg-[#573B2D]/20 text-[#573B2D]/40'
                }`}
              >
                {checkingStock ? 'Checking Stock...' : 'Checkout'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-6 text-[10px] text-center text-[#573B2D]/70 uppercase tracking-widest">
                Prices include all applicable taxes and duties.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
