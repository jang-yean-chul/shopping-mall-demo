/**
 * 서버 진입점 (Entry Point)
 * .env 로드 → MongoDB 연결 → Express 서버 시작
 * app.js와 분리해 테스트 환경에서 서버를 실제로 띄우지 않고 앱만 사용할 수 있도록 구성
 */

import { setServers, setDefaultResultOrder } from 'node:dns';
setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); // Windows c-ares SRV 조회 실패 방지 (공개 DNS 사용)
setDefaultResultOrder('ipv4first');

import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/database.js';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
