import { create } from 'zustand';

const KEY = (uid) => `wishlist_${uid}`;

const load = (uid) => {
  try {
    const raw = localStorage.getItem(KEY(uid));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const save = (uid, items) => {
  if (uid) localStorage.setItem(KEY(uid), JSON.stringify(items));
};

const useWishlistStore = create((set, get) => ({
  items: [],
  _uid: null,

  hydrate: (userId) => {
    set({ items: load(userId), _uid: userId });
  },

  clear: () => set({ items: [], _uid: null }),

  toggleItem: (product) => {
    const { items, _uid } = get();
    const exists = items.some((i) => i._id === product._id);
    const next = exists ? items.filter((i) => i._id !== product._id) : [...items, product];
    set({ items: next });
    save(_uid, next);
  },

  isInWishlist: (id) => get().items.some((i) => i._id === id),

  removeItem: (id) => {
    const { items, _uid } = get();
    const next = items.filter((i) => i._id !== id);
    set({ items: next });
    save(_uid, next);
  },

  clearWishlist: () => {
    const { _uid } = get();
    set({ items: [] });
    save(_uid, []);
  },
}));

export default useWishlistStore;
