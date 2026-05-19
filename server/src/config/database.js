/**
 * MongoDB 연결 설정
 * .env의 MONGODB_URI를 사용해 Mongoose로 연결
 * 연결 실패 시 에러를 throw해 index.js에서 process.exit 처리
 */

import mongoose from 'mongoose';

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    family: 4, // Windows에서 IPv6 SRV 조회 실패 방지
  });
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;
