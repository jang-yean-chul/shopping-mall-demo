import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password, phone, birth_date, gender, marketing_agreed } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: '이미 사용 중인 이메일입니다.' });
    }

    const user = await User.create({
      name, email, password, phone,
      birth_date, gender,
      marketing_agreed: Boolean(marketing_agreed),
    });
    res.status(201).json({ success: true, token: signToken(user._id), user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: '비활성화된 계정입니다. 고객센터에 문의해주세요.' });
    }

    await User.findByIdAndUpdate(user._id, { last_login_at: new Date() });
    res.json({ success: true, token: signToken(user._id), user });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const getMe = (req, res) => {
  res.json({ success: true, user: req.user });
};
