import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import reviewsRouter from './routes/reviews.js';
import ordersRouter from './routes/orders.js';
import usersRouter from './routes/users.js';
import addressesRouter from './routes/addresses.js';
import uploadRouter from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

// ── 보안 미들웨어 ──────────────────────────────────────
app.use(helmet());

const allowedOrigins = new Set([process.env.CLIENT_URL || 'http://localhost:3000']);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── 요청 로깅 및 파싱 ─────────────────────────────────
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 업로드 파일 정적 서빙 ─────────────────────────────
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsDir));

// ── API 라우터 ────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/reviews',  reviewsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/upload', uploadRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 핸들러 ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: '요청한 리소스를 찾을 수 없습니다.' });
});

// ── 글로벌 에러 핸들러 ────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);

  // Mongoose 유효성 검사 오류 (required, enum, minlength 등)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)[0]?.message ?? '입력값을 확인해주세요.';
    return res.status(400).json({ success: false, message });
  }

  // MongoDB 중복 키 오류 (unique index 위반)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0];
    const label = field === 'email' ? '이메일' : field;
    return res.status(400).json({ success: false, message: `이미 사용 중인 ${label}입니다.` });
  }

  // Mongoose ObjectId 형식 오류
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: '잘못된 요청입니다.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 오류가 발생했습니다.',
  });
});

export default app;
