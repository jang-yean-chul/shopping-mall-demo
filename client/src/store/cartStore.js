import { create } from 'zustand';

export const makeCartId = (id, size, color) => `${id}|${size || ''}|${color?.name || ''}`;

const KEY = (uid) => `cart_${uid}`;

const load = (uid) => {
  try {
    const raw = localStorage.getItem(KEY(uid));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const save = (uid, items) => {
  if (uid) localStorage.setItem(KEY(uid), JSON.stringify(items));
};

const useCartStore = create((set, get) => ({
  items: [],
  _uid: null,

  hydrate: (userId) => {
    set({ items: load(userId), _uid: userId });
  },

  clear: () => set({ items: [], _uid: null }),

  addItem: (product, quantity = 1) => {
    const cartId = makeCartId(product._id, product.size, product.color);
    const { items, _uid } = get();
    const existing = items.find((i) => (i.cartId ?? i._id) === cartId);
    const next = existing
      ? items.map((i) => (i.cartId ?? i._id) === cartId ? { ...i, quantity: i.quantity + quantity } : i)
      : [...items, { ...product, quantity, cartId }];
    set({ items: next });
    save(_uid, next);
  },

  removeItem: (cartId) => {
    const { items, _uid } = get();
    const next = items.filter((i) => (i.cartId ?? i._id) !== cartId);
    set({ items: next });
    save(_uid, next);
  },

  updateQuantity: (cartId, quantity) => {
    if (quantity < 1) return;
    const { items, _uid } = get();
    const next = items.map((i) => (i.cartId ?? i._id) === cartId ? { ...i, quantity } : i);
    set({ items: next });
    save(_uid, next);
  },

  clearCart: () => {
    const { _uid } = get();
    set({ items: [] });
    save(_uid, []);
  },
}));

export default useCartStore;
