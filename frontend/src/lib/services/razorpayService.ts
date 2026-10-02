declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export const razorpayService = {
  // Load Razorpay script
  loadScript: async () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  // Create Razorpay order
  createOrder: async (amount: number) => {
    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch {
          errData = null;
        }
        throw new Error(errData?.error || `Failed to create order: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  },

  // Open Razorpay payment modal
  openPaymentModal: async (options: RazorpayOptions) => {
    try {
      const isLoaded = await razorpayService.loadScript();
      if (!isLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay(options);
        rzp.open();

        rzp.on('payment.failed', function (response: any) {
          reject(response.error);
        });
      });
    } catch (error) {
      console.error('Error opening payment modal:', error);
      throw error;
    }
  },

  // Verify payment signature
  verifyPayment: async (orderId: string, paymentId: string, signature: string) => {
    try {
      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, paymentId, signature }),
      });

      if (!response.ok) throw new Error('Payment verification failed');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return null;
    }
  },
};
