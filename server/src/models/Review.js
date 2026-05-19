import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    images:  [{ type: String }],
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // 상품당 유저 1개 리뷰

export default mongoose.model('Review', reviewSchema);
