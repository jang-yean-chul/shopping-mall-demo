import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect, adminOnly } from '../middleware/auth.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//i.test(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('이미지 파일만 업로드 가능합니다.'), { status: 400 }));
  },
});

const router = express.Router();

router.post('/', protect, adminOnly, (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? '파일 크기는 5MB 이하여야 합니다.'
        : (err.message || '업로드에 실패했습니다.');
      return res.status(400).json({ success: false, message: msg });
    }
    if (!req.file) return res.status(400).json({ success: false, message: '파일이 없습니다.' });

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'shopping-mall', resource_type: 'image' },
          (error, uploadResult) => {
            if (error) {
              reject(new Error(error?.message ?? '업로드 실패'));
            } else {
              resolve(uploadResult);
            }
          }
        );
        stream.end(req.file.buffer);
      });
      res.json({ success: true, url: result.secure_url });
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
});

// Cloudinary 위젯 서명 — API Secret을 클라이언트에 노출하지 않기 위해 서버에서 서명
router.post('/sign', protect, adminOnly, (req, res) => {
  const signature = cloudinary.utils.api_sign_request(req.body, process.env.CLOUDINARY_API_SECRET);
  res.json({ signature });
});

// 리뷰 이미지 업로드 — 로그인한 일반 회원 허용 (관리자 전용 아님)
router.post('/user', protect, (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? '파일 크기는 5MB 이하여야 합니다.'
        : (err.message || '업로드에 실패했습니다.');
      return res.status(400).json({ success: false, message: msg });
    }
    if (!req.file) return res.status(400).json({ success: false, message: '파일이 없습니다.' });

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'shopping-mall/reviews', resource_type: 'image' },
          (error, uploadResult) => {
            if (error) reject(new Error(error?.message ?? '업로드 실패'));
            else resolve(uploadResult);
          }
        );
        stream.end(req.file.buffer);
      });
      res.json({ success: true, url: result.secure_url });
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
});

export default router;
