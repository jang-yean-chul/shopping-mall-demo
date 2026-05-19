/**
 * Auth Middleware
 * JWT 인증 및 권한 검사
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * 로그인 인증 미들웨어
 * Authorization 헤더의 Bearer 토큰을 검증하고 req.user에 유저 정보를 주입
 * 이후 라우트 핸들러에서 req.user로 로그인 유저 정보에 접근 가능
 */
export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    // 토큰 유효성 검증 및 payload 추출
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // DB에서 유저 조회 (탈퇴하거나 비활성화된 유저 차단)
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    // 토큰 만료 또는 변조 시
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

/**
 * 관리자 전용 접근 제한 미들웨어
 * protect 미들웨어 이후에 사용
 * 예: router.post('/', protect, adminOnly, createProduct)
 */
export const adminOnly = (req, res, next) => {
  if (req.user?.user_type !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};
