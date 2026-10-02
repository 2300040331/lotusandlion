import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super-admin';
  isAdmin: boolean;
  token: string;
}

interface CartItem {
  product: string;
  name: string;
  image: string;
  price: number;
  countInStock: number;
  qty: number;
  size?: string;
  color?: string;
}

interface StoreState {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo | null) => void;
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, size?: string, color?: string) => void;
  clearCart: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      userInfo: null,
      setUserInfo: (info) => set({ userInfo: info }),
      cartItems: [],
      addToCart: (item) =>
        set((state) => {
          const cartItems = Array.isArray(state.cartItems) ? state.cartItems : [];
          const existItem = cartItems.find(
            (x) =>
              x.product === item.product &&
              x.size === item.size &&
              x.color === item.color
          );
          if (existItem) {
            return {
              cartItems: cartItems.map((x) =>
                x.product === existItem.product &&
                x.size === existItem.size &&
                x.color === existItem.color
                  ? item
                  : x
              ),
            };
          } else {
            return { cartItems: [...cartItems, item] };
          }
        }),
      removeFromCart: (id, size, color) =>
        set((state) => {
          const cartItems = Array.isArray(state.cartItems) ? state.cartItems : [];
          return {
            cartItems: cartItems.filter(
              (x) =>
                !(
                  x.product === id &&
                  x.size === size &&
                  x.color === color
                )
            ),
          };
        }),
      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: 'lotus-lion-storage',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<StoreState> | undefined;
        return {
          ...currentState,
          ...persisted,
          cartItems: Array.isArray(persisted?.cartItems) ? persisted.cartItems : [],
        };
      },
    }
  )
);
