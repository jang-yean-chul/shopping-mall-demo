import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label:     { type: String, default: '집', trim: true }, // 집, 회사, 기타
    recipient: { type: String, required: true, trim: true },
    phone:     { type: String, required: true, trim: true },
    zipCode:   { type: String, required: true, trim: true },
    street:    { type: String, required: true, trim: true }, // 도로명/지번 주소
    detail:    { type: String, trim: true },                 // 상세 주소
    city:      { type: String, trim: true },                 // 시/도
  },
  {
    timestamps: true,
  }
);

addressSchema.index({ user: 1 });

export default mongoose.model('Address', addressSchema);
