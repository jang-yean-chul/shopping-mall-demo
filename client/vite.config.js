import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,           // 클라이언트 개발 서버 포트 (브라우저 접속 주소)
    proxy: {
      // /api 로 시작하는 요청은 Express 서버(5000)로 자동 중계
      // axios baseURL을 ''로 두는 이유: 직접 5000번 호출 시 CORS 오류 발생
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
