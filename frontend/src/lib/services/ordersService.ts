import { supabase } from '@/lib/supabase';

export const ordersService = {
  // Create order
  async createOrder(orderData: any) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  },

  // Add order items
  async addOrderItems(items: any[]) {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .insert(items)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding order items:', error);
      return null;
    }
  },

  // Fetch user orders
  async getUserOrders(userId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  // Fetch single order
  async getOrder(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:product_id(name, slug)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      return null;
    }
  },

  // Update payment status
  async updatePaymentStatus(orderId: string, paymentStatus: string, razorpayPaymentId?: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          payment_status: paymentStatus,
          razorpay_payment_id: razorpayPaymentId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return null;
    }
  },

  async updateOrderToPaid(orderId: string, paymentId: string, signature: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          is_paid: true,
          paid_at: new Date().toISOString(),
          payment_result: { id: paymentId, signature, status: 'success' },
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating order to paid:', error);
      return null;
    }
  },
};

export const authService = {
  // Signup
  async signup(email: string, password: string, userData: any) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: userError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email,
            name: userData.name,
            phone: userData.phone || null,
          }]);

        if (userError) throw userError;
      }

      return authData;
    } catch (error) {
      console.error('Error signing up:', error);
      return null;
    }
  },

  // Login
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging in:', error);
      return null;
    }
  },

  // Logout
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get user profile
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  // Check if user is admin
  async isAdmin(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.role === 'admin' || data?.role === 'superadmin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },
};
