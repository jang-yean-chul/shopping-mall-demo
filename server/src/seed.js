/**
 * 시드 데이터 스크립트
 * 실행: node src/seed.js
 *
 * - 기존 상품/유저 데이터를 초기화하고 샘플 데이터를 삽입합니다.
 * - 관리자 계정과 테스트 고객 계정도 함께 생성됩니다.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-mall';

// ── 샘플 유저 ───────────────────────────────────────────
const users = [
  {
    name:             '관리자',
    email:            'admin@shopmall.com',
    password:         'admin1234',
    phone:            '010-0000-0000',
    birth_date:       new Date('1990-01-01'),
    gender:           'M',
    user_type:        'admin',
    marketing_agreed: false,
  },
  {
    name:             '홍길동',
    email:            'test@shopmall.com',
    password:         'test1234',
    phone:            '010-1234-5678',
    birth_date:       new Date('1995-06-15'),
    gender:           'M',
    marketing_agreed: true,
  },
  {
    name:             '김지수',
    email:            'jisoo@shopmall.com',
    password:         'test1234',
    phone:            '010-9876-5432',
    birth_date:       new Date('1998-11-20'),
    gender:           'F',
    marketing_agreed: true,
  },
];

// ── 샘플 상품 ───────────────────────────────────────────
const products = [
  // 상의 (top)
  {
    name: '오버핏 코튼 티셔츠',
    description: '부드러운 코튼 소재의 오버핏 반팔 티셔츠입니다. 일상적인 캐주얼 룩에 잘 어울립니다.',
    price: 29000,
    category: 'top',
    brand: 'BASIC',
    stock: 50,
    isNew: true,
    ratings: { average: 4.5, count: 128 },
  },
  {
    name: '린넨 스트라이프 셔츠',
    description: '통기성이 좋은 린넨 원단의 스트라이프 패턴 셔츠. 반팔/긴팔 선택 가능.',
    price: 45000,
    originalPrice: 59000,
    category: 'top',
    brand: 'LINEN+',
    stock: 35,
    isNew: false,
    ratings: { average: 4.3, count: 87 },
  },
  {
    name: '슬림핏 니트 반팔',
    description: '가볍고 신축성 있는 소재로 체형을 예쁘게 잡아주는 니트 반팔입니다.',
    price: 38000,
    category: 'top',
    brand: 'KNIT CO',
    stock: 40,
    isNew: true,
    ratings: { average: 4.7, count: 203 },
  },

  // 하의 (bottom)
  {
    name: '와이드 데님 팬츠',
    description: '편안한 착용감의 와이드 핏 데님 팬츠. 다양한 상의와 매치하기 좋습니다.',
    price: 59000,
    category: 'bottom',
    brand: 'DENIM LAB',
    stock: 60,
    isNew: false,
    ratings: { average: 4.6, count: 315 },
  },
  {
    name: '코튼 슬랙스',
    description: '깔끔한 실루엣의 코튼 슬랙스. 오피스룩부터 캐주얼까지 활용도 높은 아이템.',
    price: 49000,
    originalPrice: 65000,
    category: 'bottom',
    brand: 'OFFICE LOOK',
    stock: 45,
    isNew: false,
    ratings: { average: 4.4, count: 156 },
  },
  {
    name: '린넨 와이드 팬츠',
    description: '여름철 시원하게 입을 수 있는 린넨 소재의 와이드 팬츠입니다.',
    price: 42000,
    category: 'bottom',
    brand: 'LINEN+',
    stock: 30,
    isNew: true,
    ratings: { average: 4.2, count: 74 },
  },

  // 아우터 (outer)
  {
    name: '오버핏 트렌치코트',
    description: '클래식한 트렌치코트 디자인에 모던한 오버핏 실루엣을 더한 아우터입니다.',
    price: 129000,
    originalPrice: 169000,
    category: 'outer',
    brand: 'COAT STUDIO',
    stock: 20,
    isNew: false,
    ratings: { average: 4.8, count: 512 },
  },
  {
    name: '레더 바이커 재킷',
    description: '고급 인조가죽 소재의 바이커 재킷. 세련된 엣지 있는 스타일링에 포인트.',
    price: 89000,
    category: 'outer',
    brand: 'LEATHER X',
    stock: 25,
    isNew: true,
    ratings: { average: 4.5, count: 178 },
  },

  // 원피스 (dress)
  {
    name: '플로럴 미디 원피스',
    description: '화사한 꽃 패턴의 미디 길이 원피스. 봄/여름 데이트룩에 완벽합니다.',
    price: 69000,
    category: 'dress',
    brand: 'BLOOM',
    stock: 30,
    isNew: true,
    ratings: { average: 4.9, count: 423 },
  },
  {
    name: '리넨 셔츠 원피스',
    description: '데일리로 입기 편한 셔츠 원피스. 벨트 연출로 다양한 분위기 연출 가능.',
    price: 55000,
    originalPrice: 72000,
    category: 'dress',
    brand: 'LINEN+',
    stock: 40,
    isNew: false,
    ratings: { average: 4.4, count: 267 },
  },

  // 가방 (bag)
  {
    name: '미니 크로스백',
    description: '가볍고 실용적인 미니 크로스백. 외출 시 필수품을 깔끔하게 수납할 수 있습니다.',
    price: 49000,
    category: 'bag',
    brand: 'BAG STORY',
    stock: 55,
    isNew: false,
    ratings: { average: 4.6, count: 389 },
  },
  {
    name: '캔버스 토트백',
    description: '튼튼한 캔버스 소재의 대용량 토트백. 학교, 직장, 장보기 등 다용도로 사용 가능.',
    price: 35000,
    category: 'bag',
    brand: 'DAILY BAG',
    stock: 70,
    isNew: true,
    ratings: { average: 4.3, count: 211 },
  },

  // 신발 (shoes)
  {
    name: '클래식 화이트 스니커즈',
    description: '어떤 룩에도 잘 어울리는 베이직한 화이트 스니커즈입니다.',
    price: 79000,
    category: 'shoes',
    brand: 'STEP',
    stock: 45,
    isNew: false,
    ratings: { average: 4.7, count: 634 },
  },
  {
    name: '플랫 뮬 슬리퍼',
    description: '편안하게 신을 수 있는 플랫 뮬. 캐주얼부터 세미포멀까지 활용 가능.',
    price: 42000,
    originalPrice: 55000,
    category: 'shoes',
    brand: 'COMFY',
    stock: 35,
    isNew: true,
    ratings: { average: 4.4, count: 182 },
  },

  // 액세서리 (acc)
  {
    name: '실버 체인 목걸이',
    description: '심플한 실버 체인 목걸이. 단독 착용 또는 레이어드 연출에 어울립니다.',
    price: 25000,
    category: 'acc',
    brand: 'SILVER CO',
    stock: 80,
    isNew: false,
    ratings: { average: 4.5, count: 298 },
  },
  {
    name: '와이드 버킷햇',
    description: '자외선 차단에 효과적인 와이드 브림 버킷햇. 여름 필수 아이템.',
    price: 32000,
    category: 'acc',
    brand: 'SUN HAT',
    stock: 60,
    isNew: true,
    ratings: { average: 4.2, count: 143 },
  },

  // 아울렛 (outlet) — 기존 상품 할인
  {
    name: '[아울렛] 울 블렌드 코트',
    description: '프리미엄 울 혼방 소재의 롱 코트. 시즌 오프 특가 상품입니다.',
    price: 89000,
    originalPrice: 199000,
    category: 'outlet',
    brand: 'COAT STUDIO',
    stock: 10,
    isNew: false,
    ratings: { average: 4.8, count: 89 },
  },
  {
    name: '[아울렛] 가죽 크로스백',
    description: '고급 소가죽 소재의 크로스백. 재고 소진 시 판매 종료됩니다.',
    price: 65000,
    originalPrice: 145000,
    category: 'outlet',
    brand: 'BAG STORY',
    stock: 5,
    isNew: false,
    ratings: { average: 4.9, count: 47 },
  },
];

// ── 실행 ────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB 연결됨');

  // 기존 데이터 삭제
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
  ]);
  console.log('기존 데이터 초기화 완료');

  // 유저 생성 (비밀번호 bcrypt 해싱은 User 모델 pre-save 훅에서 처리)
  const createdUsers = await User.insertMany(
    await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 10),
      }))
    )
  );
  console.log(`유저 ${createdUsers.length}명 생성 완료`);
  console.log('  - 관리자: admin@shopmall.com / admin1234');
  console.log('  - 테스트: test@shopmall.com / test1234');

  // 상품 생성
  const createdProducts = await Product.insertMany(products);
  console.log(`상품 ${createdProducts.length}개 생성 완료`);

  await mongoose.disconnect();
  console.log('\n시드 데이터 삽입 완료!');
}

seed().catch((err) => {
  console.error('시드 실패:', err.message);
  process.exit(1);
});
