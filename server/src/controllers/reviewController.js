import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// GET /api/reviews/recent  (관리자 전용)
export const getRecentReviews = async (req, res, next) => {
  try {
    const safeLimit = Math.min(Number(req.query.limit ?? 8), 20);
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .populate('user',    'name')
      .populate('product', 'name images')
      .lean();
    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id/reviews
export const getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const productId = req.params.id;
    const safeLimit = Math.min(Number(limit), 20);

    const [reviews, total] = await Promise.all([
      Review.find({ product: productId })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * safeLimit)
        .limit(safeLimit)
        .populate('user', 'name')
        .lean(),
      Review.countDocuments({ product: productId }),
    ]);

    res.json({
      success: true,
      reviews,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / safeLimit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id/reviews/my  (로그인 필요)
// 본인 리뷰 + 구매 여부 확인
export const getMyReview = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;

    const [review, hasPurchased] = await Promise.all([
      Review.findOne({ product: productId, user: userId }).lean(),
      Order.exists({
        user: userId,
        'items.product': productId,
        status: { $ne: 'cancelled' },
      }),
    ]);

    res.json({ success: true, review: review ?? null, canReview: !!hasPurchased });
  } catch (err) {
    next(err);
  }
};

// POST /api/products/:id/reviews  (로그인 필요, 구매자만)
// 리뷰 작성 또는 수정 (upsert)
export const upsertReview = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;

    const hasPurchased = await Order.exists({
      user: userId,
      'items.product': productId,
      status: { $ne: 'cancelled' },
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: '해당 상품을 구매한 고객만 리뷰를 작성할 수 있습니다.',
      });
    }

    const { rating, content, images } = req.body;

    const review = await Review.findOneAndUpdate(
      { product: productId, user: userId },
      { rating, content, images: images ?? [] },
      { new: true, upsert: true, runValidators: true }
    ).populate('user', 'name');

    // 상품 평점 재계산
    const [stats] = await Review.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats) {
      await Product.findByIdAndUpdate(productId, {
        'ratings.average': Math.round(stats.avg * 10) / 10,
        'ratings.count': stats.count,
      });
    }

    res.json({ success: true, review });
  } catch (err) {
    next(err);
  }
};
