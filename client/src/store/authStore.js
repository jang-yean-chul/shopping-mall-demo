import { create } from 'zustand';

const parse = (storage, key) => {
  try { return JSON.parse(storage.getItem(key) || 'null'); }
  catch { return null; }
};

// localStorage(자동 로그인) → sessionStorage(일반 로그인) 순서로 복원
const loadToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token') || null;

const loadUser = () =>
  parse(localStorage, 'user') || parse(sessionStorage, 'user');

const useAuthStore = create((set) => ({
  user:  loadUser(),
  token: loadToken(),

  // persist=true → localStorage(브라우저 닫아도 유지)
  // persist=false → sessionStorage(탭 닫으면 로그아웃)
  setAuth: (user, token, persist = true) => {
    const storage = persist ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },

  // 토큰 재저장 없이 user 정보만 갱신 (AuthSync 전용)
  setUser: (user) => {
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
