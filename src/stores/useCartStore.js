import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialState = {
  company: null,
  items: [],
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      addItem(company, product, quantity = 1) {
        const currentCompany = get().company;
        const currentItems = get().items;
        const safeQuantity = Math.max(1, Number(quantity || 1));

        if (currentCompany && currentCompany.id !== company.id) {
          set({
            company,
            items: [buildCartItem(product, safeQuantity)],
          });
          return 'replaced';
        }

        const existingItem = currentItems.find((item) => item.product_id === product.id);
        if (existingItem) {
          set({
            company,
            items: currentItems.map((item) =>
              item.product_id === product.id ? { ...item, quantity: item.quantity + safeQuantity } : item,
            ),
          });
          return 'updated';
        }

        set({ company, items: [...currentItems, buildCartItem(product, safeQuantity)] });
        return 'added';
      },

      updateQuantity(productId, quantity) {
        const safeQuantity = Math.max(1, Number(quantity || 1));
        set({
          items: get().items.map((item) => (item.product_id === productId ? { ...item, quantity: safeQuantity } : item)),
        });
      },

      removeItem(productId) {
        const items = get().items.filter((item) => item.product_id !== productId);
        set({ items, company: items.length > 0 ? get().company : null });
      },

      clearCart() {
        set(initialState);
      },
    }),
    {
      name: 'delivery-cart-storage',
      partialize: (state) => ({ company: state.company, items: state.items }),
    },
  ),
);

function buildCartItem(product, quantity) {
  return {
    product_id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
    quantity,
  };
}
