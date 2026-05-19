import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;
const PENDING_EXPIRE_MS = 3 * 24 * 60 * 60 * 1000; // 3일

async function autoExpirePendingOrders(userId) {
  const cutoff = new Date(Date.now() - PENDING_EXPIRE_MS);
  const now    = new Date();
  await Order.updateMany(
    { user: userId, status: 'pending', paymentStatus: 'unpaid', createdAt: { $lt: cutoff } },
    {
      status: 'cancelled',
      cancellation: {
        reason:      '결제 대기 기간 초과 (자동 취소)',
        requestedAt: now,
        cancelledAt: now,
        refundAmount: 0,
      },
      $push: { statusHistory: { status: 'cancelled', note: '결제 대기 3일 초과 자동 취소' } },
    },
  );
}

// 주문번호 생성: ORD-YYYYMMDD-NNNNN
async function generateOrderNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replaceAll('-', '');
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const count = await Order.countDocuments({ createdAt: { $gte: startOfDay } });
  return `ORD-${dateStr}-${String(count + 1).padStart(5, '0')}`;
}

// GET /api/orders/all  (관리자)
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const safeLimit = Math.min(Number(limit), 100);
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const matchedUsers = await User.find(
        { name: { $regex: search, $options: 'i' } },
        '_id',
      ).lean();
      const userIds = matchedUsers.map((u) => u._id);
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        ...(userIds.length ? [{ user: { $in: userIds } }] : []),
      ];
    }
    const [orders, total, statusCountsRaw] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort('-createdAt')
        .skip((Number(page) - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      Order.countDocuments(filter),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const statusCounts = statusCountsRaw.reduce(
      (acc, { _id, count }) => { acc[_id] = count; return acc; },
      { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 },
    );

    res.json({ success: true, orders, total, totalPages: Math.ceil(total / safeLimit), statusCounts });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders  (본인 주문 목록)
export const getOrders = async (req, res, next) => {
  try {
    await autoExpirePendingOrders(req.user._id);
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .lean();
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders
export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items?.length) {
      return res.status(400).json({ success: false, message: '주문 상품이 없습니다.' });
    }
    if (!shippingAddress?.recipient || !shippingAddress?.phone || !shippingAddress?.zipCode || !shippingAddress?.street) {
      return res.status(400).json({ success: false, message: '배송지 정보를 모두 입력해주세요.' });
    }

    // DB에서 실제 가격 재조회 (클라이언트 가격 조작 방지)
    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();

    let itemsTotal = 0;
    const orderItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.product);
      if (!product) {
        const err = new Error(`상품(${item.product})을 찾을 수 없습니다.`);
        err.status = 400;
        throw err;
      }
      itemsTotal += product.price * item.quantity;
      return {
        product:  product._id,
        quantity: item.quantity,
        price:    product.price,
        name:     product.name,
        image:    product.images?.[0] ?? null,
        size:     item.size  ?? null,
        color:    item.color ?? null,
      };
    });

    const shippingFee    = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const discountAmount = 0; // 추후 쿠폰 연동 시 계산
    const totalAmount    = itemsTotal + shippingFee - discountAmount;
    const orderNumber    = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      user:    req.user._id,
      items:   orderItems,
      itemsTotal,
      shippingFee,
      discountAmount,
      totalAmount,
      shippingAddress,
      payment: { method: paymentMethod ?? null },
      statusHistory: [{ status: 'pending', note: '주문 접수' }],
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status  (관리자)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 주문 상태입니다.' });
    }

    const update = {
      status,
      $push: { statusHistory: { status, note: note ?? '' } },
    };

    if (status === 'cancelled') {
      update['cancellation.cancelledAt'] = new Date();
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/cancel  (구매자 본인)
export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' });
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: '배송 시작 이후에는 취소할 수 없습니다.' });
    }

    const now    = new Date();
    const isPaid = order.paymentStatus === 'paid';

    order.status = 'cancelled';
    order.cancellation = {
      reason:       reason ?? '',
      requestedAt:  now,
      cancelledAt:  now,
      refundAmount: isPaid ? order.totalAmount : 0,
      ...(isPaid && { refundedAt: now }),
    };
    order.statusHistory.push({ status: 'cancelled', note: reason ?? '구매자 취소' });
    if (isPaid) order.paymentStatus = 'refunded';

    await order.save({ validateModifiedOnly: true });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:id/payment/confirm  (PG 결제 완료 콜백 또는 수동 확인)
export const confirmPayment = async (req, res, next) => {
  try {
    const { pgProvider, pgTransactionId, receiptUrl, paidAt } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: '이미 결제 완료된 주문입니다.' });
    }

    order.paymentStatus       = 'paid';
    order.status              = 'confirmed';
    order.payment.pgProvider      = pgProvider      ?? order.payment.pgProvider;
    order.payment.pgTransactionId = pgTransactionId ?? order.payment.pgTransactionId;
    order.payment.receiptUrl      = receiptUrl      ?? order.payment.receiptUrl;
    order.payment.paidAt          = paidAt ? new Date(paidAt) : new Date();
    order.statusHistory.push({ status: 'confirmed', note: '결제 완료' });

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/delivery  (관리자 - 운송장 등록)
export const updateDelivery = async (req, res, next) => {
  try {
    const { carrier, trackingNumber } = req.body;
    if (!carrier || !trackingNumber) {
      return res.status(400).json({ success: false, message: '택배사와 운송장 번호를 입력해주세요.' });
    }

    const now = new Date();
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: 'shipped',
        delivery: { carrier, trackingNumber, shippedAt: now },
        $push: { statusHistory: { status: 'shipped', note: `${carrier} ${trackingNumber}` } },
      },
      { new: true },
    );
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
