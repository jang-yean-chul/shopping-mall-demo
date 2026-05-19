import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    sku:         { type: String, trim: true, uppercase: true },
    description: { type: String, default: '' },
    price:       { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    category:    { type: String, required: true, trim: true },
    brand:       { type: String, trim: true },
    stock:       { type: Number, required: true, default: 0, min: 0 },
    images:       [{ type: String }],
    detailImages: [{ type: String }],
    isNew:   { type: Boolean, default: false },
    isSale:  { type: Boolean, default: false },
    sizes:   [{ type: String }],
    colors:  [{
      name: { type: String },
      hex:  { type: String },
    }],
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true }, // false: soft delete
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true, // isNew는 Mongoose 예약어지만 의도적으로 사용
  }
);

productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ sku: 1 }, { unique: true, sparse: true }); // sparse: SKU 없는 기존 상품 허용

export default mongoose.model('Product', productSchema);
