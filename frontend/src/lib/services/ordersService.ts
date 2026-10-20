import api from '@/lib/api';

export const ordersService = {
  // Create order
  async createOrder(orderData: any) {
    try {
      const { data } = await api.post('/orders', orderData);
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  },

  // Add order items
  async addOrderItems(items: any[]) {
    try {
      const { data } = await api.post('/orders', { orderItems: items });
      return data;
    } catch (error) {
      console.error('Error adding order items:', error);
      return null;
    }
  },

  // Fetch user orders
  async getUserOrders(_userId?: string) {
    try {
      const { data } = await api.get('/orders/myorders');
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  // Fetch single order
  async getOrder(orderId: string) {
    try {
      const { data } = await api.get(`/orders/${encodeURIComponent(orderId)}`);
      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: string) {
    try {
      const { data } = await api.put(`/admin/orders/${encodeURIComponent(orderId)}/status`, { status });
      return data?.order || data;
    } catch (error) {
      console.error('Error updating order status:', error);
      return null;
    }
  },

  // Update order to paid
  async updateOrderToPaid(orderId: string, paymentId: string, signature: string) {
    try {
      const { data } = await api.put(`/orders/${encodeURIComponent(orderId)}/pay`, {
        paymentId,
        signature,
      });
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
      const { data } = await api.post('/auth/register', {
        name: userData.name,
        email,
        password,
      });
      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      return null;
    }
  },

  // Login
  async login(email: string, password: string) {
    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
      });
      return data;
    } catch (error) {
      console.error('Error logging in:', error);
      return null;
    }
  },

  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data } = await api.get('/auth/me');
      return data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get user profile
  async getUserProfile(_userId?: string) {
    try {
      const { data } = await api.get('/auth/me');
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  // Check if user is admin
  async isAdmin() {
    try {
      const { data } = await api.get('/auth/me');
      return Boolean(data?.isAdmin || data?.role === 'admin' || data?.role === 'super-admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },
};
