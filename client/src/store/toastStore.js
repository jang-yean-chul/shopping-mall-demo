import { create } from 'zustand';

const useToastStore = create((set) => ({
  message: null,
  show: (message, duration = 3000) => {
    set({ message });
    setTimeout(() => set({ message: null }), duration);
  },
}));

export default useToastStore;
