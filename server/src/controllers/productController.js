import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary URL에서 public_id 추출
// 예: https://res.cloudinary.com/xxx/image/upload/v123/shopping-mall/abc.jpg → shopping-mall/abc
const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  return url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)?.[1] ?? null;
};

const SKU_CAT = {
  top: 'TOP', bottom: 'BOT', outer: 'OUT', dress: 'DRS',
  bag: 'BAG', shoes: 'SHO', acc: 'ACC', outlet: 'OTL',
};

const buildSku = (category, brand) => {
  const cat  = SKU_CAT[category] ?? (category ?? 'GEN').slice(0, 3).toUpperCase();
  const br   = brand
    ? brand.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'GEN'
    : 'GEN';
  const rand = String(Math.floor(Math.random() * 90000) + 10000);
  return `${cat}-${br}-${rand}`;
};

const generateUniqueSku = async (category, brand, maxTries = 5) => {
  for (let i = 0; i < maxTries; i++) {
    const sku = buildSku(category, brand);
    if (!await Product.exists({ sku })) return sku; // eslint-disable-line no-await-in-loop
  }
  throw new Error('SKU 생성에 실패했습니다. 다시 시도해주세요.');
};

// GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      page  = 1,
      limit = 20,
      sort  = '-createdAt',
    } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search)   filter.$text = { $search: search };

    // limit는 최대 100개로 제한 (과도한 요청 방지)
    const safeLimit = Math.min(Number(limit), 100);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip((Number(page) - 1) * safeLimit)
        .limit(safeLimit)
        .lean(), // plain object 반환으로 성능 개선
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / safeLimit),
      products,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/admin  (관리자 — 전체 상품, 이름/SKU 검색)
export const getAdminProducts = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const safeLimit = Math.min(Number(limit), 100);
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku:  { $regex: search, $options: 'i' } },
      ];
    }
    const [products, total] = await Promise.all([
      Product.find(filter).sort('-createdAt').skip((Number(page) - 1) * safeLimit).limit(safeLimit).lean(),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, total, page: Number(page), totalPages: Math.ceil(total / safeLimit), products });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// POST /api/products  (관리자 전용)
export const createProduct = async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (body.sku) {
      // 수동 입력: 중복 확인
      body.sku = body.sku.trim().toUpperCase();
      if (await Product.exists({ sku: body.sku })) {
        return res.status(400).json({ success: false, message: `SKU "${body.sku}"는 이미 사용 중입니다.` });
      }
    } else {
      // 자동 생성
      body.sku = await generateUniqueSku(body.category, body.brand);
    }

    const product = await Product.create(body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id  (관리자 전용)
export const updateProduct = async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (body.sku !== undefined) {
      body.sku = body.sku ? body.sku.trim().toUpperCase() : undefined;
      if (body.sku) {
        // 다른 상품에서 같은 SKU를 쓰고 있는지 확인
        if (await Product.exists({ sku: body.sku, _id: { $ne: req.params.id } })) {
          return res.status(400).json({ success: false, message: `SKU "${body.sku}"는 이미 사용 중입니다.` });
        }
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id  (관리자 전용, hard delete + Cloudinary 이미지 삭제)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }

    // Cloudinary 이미지 삭제 (실패해도 상품 삭제는 진행)
    const publicIds = (product.images ?? []).map(extractPublicId).filter(Boolean);
    if (publicIds.length > 0) {
      await Promise.allSettled(publicIds.map((id) => cloudinary.uploader.destroy(id)));
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '상품이 삭제되었습니다.' });
  } catch (err) {
    next(err);
  }
};
