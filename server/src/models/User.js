/**
 * User Model
 * 쇼핑몰 회원 정보 스키마
 * 배송지는 Address 컬렉션으로 분리 관리 (다중 배송지 지원)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // ── 필수 정보 ──────────────────────────────────────
    name:     { type: String, required: [true, '이름을 입력해주세요.'], trim: true },
    email:    { type: String, required: [true, '이메일을 입력해주세요.'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, '비밀번호를 입력해주세요.'], minlength: [6, '비밀번호는 6자 이상이어야 합니다.'] },
    phone:    { type: String, required: [true, '휴대폰 번호를 입력해주세요.'], trim: true },

    /** customer: 일반 회원 / admin: 관리자 */
    user_type: { type: String, enum: ['customer', 'admin'], default: 'customer' },

    // ── 선택 정보 ──────────────────────────────────────
    /** 생년월일 - 생일 쿠폰 발급, 성인 인증에 활용 */
    birth_date:    { type: Date, required: [true, '생년월일을 입력해주세요.'] },
    gender:        { type: String, enum: { values: ['M', 'F', 'other'], message: '올바른 성별 값이 아닙니다.' }, required: [true, '성별을 선택해주세요.'] },
    profile_image: { type: String },

    // ── 배송지 ─────────────────────────────────────────
    /** 기본 배송지 참조 (Address 컬렉션에서 상세 관리) */
    default_address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },

    // ── 계정 상태 ──────────────────────────────────────
    /** 이메일 인증 완료 여부 */
    email_verified:   { type: Boolean, default: false },
    /** false 시 로그인 차단 (관리자 정지 또는 탈퇴 처리) */
    is_active:        { type: Boolean, default: true },
    /** 마케팅 수신 동의 (개인정보보호법 준수) */
    marketing_agreed: { type: Boolean, default: false },
    /** 마지막 로그인 시각 - 휴면 계정 처리 기준으로 활용 */
    last_login_at:    { type: Date },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

/** 비밀번호 저장 전 bcrypt 해싱 (변경된 경우에만 실행) */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/** 입력된 비밀번호와 해시된 비밀번호 비교 */
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** API 응답 시 password 필드 자동 제거 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
