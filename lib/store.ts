import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  productType: string;
  quantity: number;
  deliveryTimeMinutes?: number;
  serviceRequirements?: string | null;
}

interface AppliedCoupon {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  discountAmount: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  appliedCoupon: AppliedCoupon | null;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  applyCoupon: (coupon: AppliedCoupon | null) => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,

      addItem: (item, qty = 1) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.productId === item.productId);

        if (existingIndex > -1) {
          // If unique digital or account, keep qty at 1
          if (item.productType === "ACCOUNT" || item.productType === "UNIQUE_DIGITAL") {
            return;
          }
          const updated = [...currentItems];
          updated[existingIndex].quantity += qty;
          set({ items: updated, isOpen: true });
        } else {
          set({
            items: [...currentItems, { ...item, quantity: qty }],
            isOpen: true,
          });
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((i) => i.productId !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null });
      },

      setIsOpen: (isOpen) => set({ isOpen }),

      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getDiscount: () => {
        const subtotal = get().getSubtotal();
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        return Math.min(coupon.discountAmount, subtotal);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        return Math.max(0, subtotal - discount);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "cpm_cart_storage",
    }
  )
);
