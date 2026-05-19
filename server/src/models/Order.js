import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const orderSchema = new mongoose.Schema(
  {
    // ── 주문 식별 ──────────────────────────────────────────
    orderNumber: { type: String, unique: true }, // ORD-20250518-00001

    user: { type: ObjectId, ref: 'User', required: true },

    // ── 주문 상품 (주문 시점 스냅샷) ───────────────────────
    items: [
      {
        product:  { type: ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price:    { type: Number, required: true },   // 결제 당시 단가
        name:     { type: String, required: true },   // 상품명
        image:    { type: String },                   // 대표 이미지 URL
        size:     { type: String },                   // 선택 사이즈
        color: {
          name: { type: String },
          hex:  { type: String },
        },
      },
    ],

    // ── 금액 ───────────────────────────────────────────────
    itemsTotal:     { type: Number, required: true },  // 상품 합계
    shippingFee:    { type: Number, default: 0 },      // 배송비
    discountAmount: { type: Number, default: 0 },      // 쿠폰/할인
    totalAmount:    { type: Number, required: true },  // 최종 결제금액

    // ── 배송지 스냅샷 ──────────────────────────────────────
    shippingAddress: {
      recipient: { type: String, required: true },
      phone:     { type: String, required: true },
      zipCode:   { type: String, required: true },
      street:    { type: String, required: true },
      detail:    { type: String },
      memo:      { type: String },  // 배송 메모
    },

    // ── 주문 상태 ──────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },

    // ── 결제 상태 ──────────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },

    // ── 결제 정보 (PG 연동 기준) ───────────────────────────
    payment: {
      method: {
        type: String,
        enum: ['card', 'transfer', 'kakao', 'naver', 'vbank'],
      },
      // PG사 식별자 (iamport: "imp_uid", toss: "paymentKey" 등)
      pgProvider:      { type: String },
      pgTransactionId: { type: String },
      // 가상계좌 발급 시 입금 정보
      vbankNum:        { type: String },
      vbankHolder:     { type: String },
      vbankExpiredAt:  { type: Date },
      // 영수증 URL (PG사 제공)
      receiptUrl:      { type: String },
      paidAt:          { type: Date },
    },

    // ── 배송 추적 ──────────────────────────────────────────
    delivery: {
      carrier:        { type: String },  // "CJ대한통운", "한진택배" 등
      trackingNumber: { type: String },
      shippedAt:      { type: Date },
      deliveredAt:    { type: Date },
    },

    // ── 취소 / 환불 ────────────────────────────────────────
    cancellation: {
      reason:       { type: String },
      requestedAt:  { type: Date },
      cancelledAt:  { type: Date },
      refundAmount: { type: Number },
      refundedAt:   { type: Date },
    },

    // ── 상태 변경 이력 ─────────────────────────────────────
    statusHistory: [
      {
        _id:       false,
        status:    { type: String },
        changedAt: { type: Date, default: Date.now },
        note:      { type: String },
      },
    ],
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.pgTransactionId': 1 }, { sparse: true });

export default mongoose.model('Order', orderSchema);
