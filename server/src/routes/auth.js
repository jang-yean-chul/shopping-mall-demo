import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const registerRules = [
  body('name').trim().notEmpty().withMessage('이름을 입력해주세요.'),
  body('email').isEmail().withMessage('올바른 이메일 형식이 아닙니다.'),
  body('password').isLength({ min: 6 }).withMessage('비밀번호는 6자 이상이어야 합니다.'),
  body('phone').trim().notEmpty().withMessage('휴대폰 번호를 입력해주세요.'),
  body('gender')
    .notEmpty().withMessage('성별을 선택해주세요.')
    .isIn(['M', 'F', 'other']).withMessage('올바른 성별 값이 아닙니다.'),
  body('birth_date')
    .notEmpty().withMessage('생년월일을 입력해주세요.')
    .isISO8601().withMessage('생년월일 형식이 올바르지 않습니다.'),
];

router.post('/register', registerRules, register);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
