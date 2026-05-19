# Shopping Mall Server

## 구조

```
server/
├── src/                        # Node.js + Express (메인 API)
│   ├── app.js                  # 엔트리포인트
│   ├── config/database.js      # MongoDB 연결
│   ├── middleware/auth.js      # JWT 인증 미들웨어
│   ├── models/                 # Mongoose 모델
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   └── routes/                 # API 라우터
│       ├── auth.js             # /api/auth
│       ├── products.js         # /api/products
│       ├── orders.js           # /api/orders
│       └── users.js            # /api/users
└── python/                     # FastAPI (추천/분석 서비스)
    ├── main.py
    ├── database.py
    ├── requirements.txt
    └── routers/
        ├── recommendations.py  # /recommendations
        └── analytics.py        # /analytics
```

## 시작 방법

### Node.js 서버 (포트 5000)
```bash
cd server
cp .env.example .env       # .env 수정 후
npm install
npm run dev
```

### Python 서비스 (포트 8000)
```bash
cd server/python
cp .env.example .env
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 |
| GET | /api/auth/me | 내 정보 |
| GET | /api/products | 상품 목록 |
| GET | /api/products/:id | 상품 상세 |
| POST | /api/products | 상품 등록 (admin) |
| GET | /api/orders | 내 주문 목록 |
| POST | /api/orders | 주문 생성 |
| GET | /recommendations/:id | 추천 상품 (Python) |
| GET | /analytics/sales-summary | 매출 통계 (Python) |
| GET | /analytics/top-products | 인기 상품 (Python) |
