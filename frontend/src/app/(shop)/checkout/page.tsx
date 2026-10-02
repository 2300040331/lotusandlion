'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CreditCard, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { razorpayService } from '@/lib/services/razorpayService';
import { ordersService } from '@/lib/services/ordersService';

type CartAvailability = {
  available: boolean;
  stock: number;
  message?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, userInfo, clearCart } = useStore();
  const safeCartItems = useMemo(() => Array.isArray(cartItems) ? cartItems : [], [cartItems]);
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<Record<string, CartAvailability>>({});
  const [checkingStock, setCheckingStock] = useState(true);
  
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const getAvailabilityKey = (item: any) => `${item.product}-${item.size || ''}-${item.color || ''}`;
  const unavailableItems = safeCartItems.filter((item) => availability[getAvailabilityKey(item)]?.available === false);
  const canPlaceOrder = !checkingStock && unavailableItems.length === 0;
  const subtotal = safeCartItems.reduce((acc, item) => {
    if (availability[getAvailabilityKey(item)]?.available === false) return acc;
    return acc + (Number(item.qty) || 0) * (Number(item.price) || 0);
  }, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!userInfo) {
      router.push('/login?redirect=/checkout');
      return;
    }
    if (safeCartItems.length === 0 && !success) {
      router.push('/cart');
    }
  }, [mounted, userInfo, safeCartItems.length, router, success]);

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

  const placeOrderHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPlaceOrder) {
      toast.error('Please remove unavailable or out-of-stock products before checkout');
      router.push('/cart');
      return;
    }
    setLoading(true);
    try {
      // 1. Create order in database (Status: Pending, Unpaid)
      const orderData = {
        orderItems: safeCartItems,
        shippingAddress: { address, city, postalCode, country },
        paymentMethod: 'Razorpay',
        itemsPrice: subtotal,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: subtotal,
      };
      
      const { data: dbOrder } = await api.post('/orders', orderData);

      // 2. Create Razorpay order on Razorpay servers
      const razorpayOrder = await razorpayService.createOrder(subtotal);
      if (!razorpayOrder) {
        throw new Error('Failed to initiate payment. Please try again.');
      }

      // 3. Open Razorpay modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'Lotus & Lion',
        description: `Order #${dbOrder.order_number || dbOrder.id.slice(0, 8)}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: userInfo?.name || '',
          email: userInfo?.email || '',
          contact: '',
        },
        theme: {
          color: '#c8a45d',
        },
        handler: async (response: any) => {
          setLoading(true);
          try {
            // 4. Verify signature in Next.js API route
            const verification = await razorpayService.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verification && verification.success) {
              // 5. Update database order to paid (directly in Supabase)
              const updatedOrder = await ordersService.updateOrderToPaid(
                dbOrder.id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );
              
              toast.success('Payment successful & Order placed!');
              setPlacedOrder(updatedOrder || dbOrder);
              clearCart();
              setSuccess(true);
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            console.error('Verification error:', err);
            toast.error('Verification error occurred');
          } finally {
            setLoading(false);
          }
        }
      };

      await razorpayService.openPaymentModal(options);
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      const message = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : error instanceof Error ? error.message : undefined;
      toast.error(message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-black py-24 flex items-center justify-center">
        <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Preparing checkout...</div>
      </div>
    );
  }

  if (success && placedOrder) {
    return (
      <div className="min-h-screen bg-white dark:bg-black py-24 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-600 mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary mb-4">Payment Confirmed</p>
            <h1 className="brand-heading text-4xl md:text-5xl uppercase text-black dark:text-white">Thank You For Your Order</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-4">Order Number: <span className="font-bold text-black dark:text-white">{placedOrder.order_number || placedOrder.id}</span></p>
          </div>
          <div className="border border-border p-8 text-left space-y-6 bg-secondary/5 dark:bg-[#111]/30">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] border-b border-border pb-4">Shipping Information</h3>
            <div className="text-xs space-y-2 uppercase tracking-wider text-gray-600 dark:text-gray-400">
              <p className="font-bold text-black dark:text-white">{userInfo?.name}</p>
              <p>{placedOrder.shipping_address?.address}</p>
              <p>{placedOrder.shipping_address?.city}, {placedOrder.shipping_address?.postalCode}</p>
              <p>{placedOrder.shipping_address?.country}</p>
            </div>
            <div className="border-t border-border pt-4 flex justify-between text-xs font-bold uppercase tracking-widest">
              <span>Amount Paid</span>
              <span className="text-primary text-base">{formatINR(placedOrder.total_price || subtotal)}</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/products')}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary dark:hover:bg-primary transition-all flex items-center justify-center gap-2"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold uppercase tracking-tight mb-12">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2">
            <form onSubmit={placeOrderHandler} className="space-y-12">
              {/* Shipping section */}
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-xs">1</div>
                  <h2 className="text-xl font-bold uppercase tracking-wider">Shipping Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-700 dark:text-gray-300">Street Address</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-transparent border border-border dark:border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-primary dark:focus:border-[#c8a45d] transition-colors text-black dark:text-white"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-700 dark:text-gray-300">City</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-transparent border border-border dark:border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-primary dark:focus:border-[#c8a45d] transition-colors text-black dark:text-white"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-700 dark:text-gray-300">Postal Code</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-transparent border border-border dark:border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-primary dark:focus:border-[#c8a45d] transition-colors text-black dark:text-white"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-700 dark:text-gray-300">Country</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-transparent border border-border dark:border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-primary dark:focus:border-[#c8a45d] transition-colors text-black dark:text-white"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Payment section */}
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-xs">2</div>
                  <h2 className="text-xl font-bold uppercase tracking-wider">Payment Method</h2>
                </div>
                <div className="border border-primary dark:border-[#c8a45d] bg-primary/5 dark:bg-[#c8a45d]/5 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CreditCard className="w-6 h-6 text-primary dark:text-[#c8a45d]" />
                    <span className="text-sm font-bold uppercase tracking-widest">Razorpay UPI & Cards Payment</span>
                  </div>
                  <div className="flex gap-2 text-[10px] uppercase font-bold text-primary dark:text-[#c8a45d] tracking-widest">
                     UPI, Cards, NetBanking
                  </div>
                </div>
              </section>

              <button
                type="submit"
                disabled={loading || !canPlaceOrder}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary dark:hover:bg-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {checkingStock ? 'Checking Stock...' : loading ? 'Processing...' : 'Pay & Place Order'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="bg-secondary dark:bg-[#111] p-8 border border-border">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-8">Order Review</h2>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-8">
                {safeCartItems.map((item) => {
                  const availabilityKey = getAvailabilityKey(item);
                  return (
                    <div key={availabilityKey} className="flex gap-4">
                      <img src={item.image} alt={item.name} className="w-12 h-20 object-contain bg-white" />
                      <div className="flex-grow">
                        <h4 className="text-[10px] font-bold uppercase tracking-wide truncate w-32">{item.name}</h4>
                        {item.size && <p className="text-[9px] text-gray-500 uppercase">Size: {item.size}</p>}
                        {item.color && item.color !== 'Default' && <p className="text-[9px] text-gray-500 uppercase">Color: {item.color}</p>}
                        <p className="text-[10px] text-gray-500 uppercase">Qty: {item.qty}</p>
                        {availability[availabilityKey]?.available === false && (
                          <p className="text-[10px] font-bold uppercase text-red-600">{availability[availabilityKey]?.message || 'Out of stock'}</p>
                        )}
                        <p className="text-[10px] font-bold text-primary dark:text-[#c8a45d]">{formatINR(item.qty * item.price)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {unavailableItems.length > 0 && (
                <p className="mb-6 bg-red-50 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-600">
                  Some cart products are unavailable. Please return to cart and remove them.
                </p>
              )}
              <div className="pt-8 border-t border-border space-y-4">
                <div className="flex justify-between text-xs tracking-widest uppercase font-bold">
                  <span>Total</span>
                  <span className="text-primary dark:text-[#c8a45d] text-lg">{formatINR(subtotal)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[10px] text-gray-500 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                SSL Encrypted Connection
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500 uppercase tracking-widest">
                <Truck className="w-4 h-4 text-primary dark:text-[#c8a45d]" />
                Insured Global Shipping
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
