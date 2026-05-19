import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { adminGetProducts, adminGetOrders, adminGetUsers, adminGetRecentReviews } from '@/api/admin';
import './AdminDashboard.css';

const STATUS_LABEL = {
  pending: '결제대기', confirmed: '결제확인', shipped: '배송중',
  delivered: '배송완료', cancelled: '취소',
};
const STATUS_CLS = {
  pending: 'admin-badge--pending', confirmed: 'admin-badge--confirmed',
  shipped: 'admin-badge--shipped', delivered: 'admin-badge--delivered',
  cancelled: 'admin-badge--cancelled',
};

const DAY = 86400000;

const startOfDay = (d) => { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; };

const calcRevenue = (list) =>
  list.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + (o.totalAmount || 0), 0);

const trendPct = (cur, prev) => {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
};

function timeSince(dateStr) {
  const ms = Date.now() - new Date(dateStr);
  const m = Math.floor(ms / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return <div style={{ height: 32 }} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 80, H = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 6) - 3;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ label, value, trend, sparkline, color }) {
  const isUp = trend > 0;
  const isFlat = trend === 0;
  return (
    <div className="dash-stat-card">
      <div className="dash-stat-top">
        <p className="dash-stat-label">{label}</p>
        <span className={`dash-trend ${isFlat ? 'flat' : isUp ? 'up' : 'down'}`}>
          {isFlat ? '─' : isUp ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      </div>
      <p className="dash-stat-value">{value}</p>
      <Sparkline data={sparkline} color={color} />
    </div>
  );
}

function HighlightItem({ icon, label, value, small, accent }) {
  return (
    <div className="dash-highlight-item">
      <span className="dash-hi-icon">{icon}</span>
      <span className="dash-hi-label">{label}</span>
      <span className={`dash-hi-val${small ? ' small' : ''}${accent ? ' accent' : ''}`}>{value}</span>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 8, border: 'none',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12,
};

export default function AdminDashboard() {
  const { data: productsData, refetch: rp } = useQuery({ queryKey: ['admin-products'],       queryFn: adminGetProducts });
  const { data: ordersData,   refetch: ro } = useQuery({ queryKey: ['admin-orders'],         queryFn: adminGetOrders });
  const { data: usersData,    refetch: ru } = useQuery({ queryKey: ['admin-users'],          queryFn: adminGetUsers });
  const { data: reviewsData,  refetch: rr } = useQuery({ queryKey: ['admin-recent-reviews'], queryFn: () => adminGetRecentReviews(8) });

  const products = productsData?.data?.products ?? [];
  const orders   = ordersData?.data?.orders ?? [];
  const users    = usersData?.data?.users ?? [];

  const now          = new Date();
  const todayStart   = startOfDay(now);
  const ystdStart    = startOfDay(new Date(now - DAY));
  const weekStart    = startOfDay(new Date(now - 6 * DAY));
  const lastWkStart  = startOfDay(new Date(now - 13 * DAY));
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const inRange = (o, from, to) => {
    const d = new Date(o.createdAt);
    return d >= from && (!to || d < to);
  };

  const todayOrders   = orders.filter((o) => inRange(o, todayStart));
  const ystdOrders    = orders.filter((o) => inRange(o, ystdStart, todayStart));
  const weekOrders    = orders.filter((o) => inRange(o, weekStart));
  const lastWkOrders  = orders.filter((o) => inRange(o, lastWkStart, weekStart));
  const monthOrders   = orders.filter((o) => inRange(o, monthStart));
  const lastMonOrders = orders.filter((o) => inRange(o, lastMonStart, new Date(lastMonEnd.getTime() + 1)));

  const todayRev   = calcRevenue(todayOrders);
  const weekRev    = calcRevenue(weekOrders);
  const monthRev   = calcRevenue(monthOrders);
  const ystdRev    = calcRevenue(ystdOrders);
  const lastWkRev  = calcRevenue(lastWkOrders);
  const lastMonRev = calcRevenue(lastMonOrders);

  // 7일 일별 매출
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const ds = startOfDay(new Date(now - (6 - i) * DAY));
    const de = new Date(ds.getTime() + DAY);
    const rev = calcRevenue(orders.filter((o) => inRange(o, ds, de)));
    const cnt = orders.filter((o) => inRange(o, ds, de)).length;
    return { date: `${ds.getMonth() + 1}/${ds.getDate()}`, 매출: rev, 주문: cnt };
  });

  // 4주 주별 매출
  const monthlyData = Array.from({ length: 4 }, (_, i) => {
    const offset = (3 - i) * 7 * DAY;
    const we = new Date(now.getTime() - offset);
    const ws = new Date(we.getTime() - 7 * DAY);
    const rev = calcRevenue(orders.filter((o) => inRange(o, ws, we)));
    return { week: i === 3 ? '이번주' : `${3 - i}주전`, 매출: rev };
  });

  // 인기 상품 집계
  const productMap = {};
  orders.filter((o) => o.status !== 'cancelled').forEach((o) => {
    (o.items ?? []).forEach((item) => {
      const name = item.name ?? item.product?.name ?? '상품';
      const id   = item.product?._id ?? name;
      if (!productMap[id]) productMap[id] = { name, revenue: 0, qty: 0 };
      productMap[id].revenue += (item.price ?? 0) * item.quantity;
      productMap[id].qty     += item.quantity;
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // 재고 부족
  const lowStock = products
    .filter((p) => p.stock <= 10 && p.isActive !== false)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  // 기타 지표
  const todayMembers = users.filter((u) => new Date(u.createdAt) >= todayStart).length;
  const cancelRate   = orders.length > 0
    ? Math.round((orders.filter((o) => o.status === 'cancelled').length / orders.length) * 100)
    : 0;

  // 최근 주문 피드
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const sparkRev     = weeklyData.map((d) => d.매출);
  const sparkCnt     = weeklyData.map((d) => d.주문);
  const recentReviews = reviewsData?.data?.reviews ?? [];

  return (
    <div>
      {/* 헤더 */}
      <div className="dash-header">
        <div>
          <p className="dash-eyebrow">실시간 현황</p>
          <h1 className="dash-title">어드민 대시보드</h1>
          <p className="dash-sub">오늘의 쇼핑몰 현황을 한눈에 확인하세요.</p>
        </div>
        <button className="dash-refresh-btn" onClick={() => { rp(); ro(); ru(); rr(); }}>
          ↺ 새로고침
        </button>
      </div>

      {/* 통계 카드 4개 */}
      <div className="dash-stats">
        <StatCard
          label="오늘 매출"
          value={`₩${todayRev.toLocaleString()}`}
          trend={trendPct(todayRev, ystdRev)}
          sparkline={sparkRev}
          color="#4f46e5"
        />
        <StatCard
          label="이번주 매출"
          value={`₩${weekRev.toLocaleString()}`}
          trend={trendPct(weekRev, lastWkRev)}
          sparkline={sparkRev}
          color="#0891b2"
        />
        <StatCard
          label="이번달 매출"
          value={`₩${monthRev.toLocaleString()}`}
          trend={trendPct(monthRev, lastMonRev)}
          sparkline={sparkRev}
          color="#059669"
        />
        <StatCard
          label="오늘 주문"
          value={`${todayOrders.length}건`}
          trend={trendPct(todayOrders.length, ystdOrders.length)}
          sparkline={sparkCnt}
          color="#d97706"
        />
      </div>

      {/* 중단: 주간 매출 차트 + 하이라이트 */}
      <div className="dash-mid">
        <div className="dash-chart-card">
          <p className="dash-card-label">일주일간 매출 추이</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#c0c0c0' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#c0c0c0' }}
                axisLine={false} tickLine={false} width={48}
                tickFormatter={(v) => v === 0 ? '0' : v >= 10000 ? `${(v / 10000).toFixed(0)}만` : `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(v) => [`₩${v.toLocaleString()}`, '매출']}
                contentStyle={tooltipStyle}
              />
              <Area type="monotone" dataKey="매출" stroke="#4f46e5" strokeWidth={2}
                fill="url(#gRev)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="dash-highlights">
          <p className="dash-card-label">오늘의 하이라이트</p>
          <div className="dash-highlight-list">
            <HighlightItem icon="📦" label="신규 주문"     value={`${todayOrders.length}건`} />
            <HighlightItem icon="💰" label="오늘 매출"     value={`₩${todayRev.toLocaleString()}`} />
            <HighlightItem icon="👤" label="신규 회원"     value={`${todayMembers}명`} />
            <HighlightItem icon="🏆" label="베스트셀러"    value={topProducts[0]?.name ?? '-'} small />
            <HighlightItem icon="❌" label="주문 취소율"   value={`${cancelRate}%`} accent={cancelRate >= 10} />
            <HighlightItem icon="⚠️" label="재고부족 상품" value={`${lowStock.length}개`} accent={lowStock.length > 0} />
          </div>
        </div>
      </div>

      {/* 하단: 주문 피드 + 우측 컬럼 */}
      <div className="dash-bottom">
        {/* 최근 주문 피드 */}
        <div className="dash-feed-card">
          <div className="dash-feed-hd">
            <p className="dash-card-label" style={{ marginBottom: 0 }}>최근 주문 현황</p>
            <span className="dash-feed-count">{recentOrders.length}건</span>
          </div>
          <div className="dash-feed-list">
            {recentOrders.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
                주문 내역이 없습니다.
              </p>
            ) : recentOrders.map((order) => {
              const isLive = Date.now() - new Date(order.createdAt) < 3600000;
              return (
                <div key={order._id} className="dash-feed-item">
                  {isLive
                    ? <span className="dash-live-badge">LIVE</span>
                    : <span className={`admin-badge ${STATUS_CLS[order.status] ?? ''}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                  }
                  <div className="dash-feed-info">
                    <span className="dash-feed-name">{order.user?.name ?? '비회원'}</span>
                    <span className="dash-feed-sub">
                      {(order.items ?? []).map((i) => i.name ?? i.product?.name ?? '상품').slice(0, 2).join(', ')}
                      {(order.items?.length ?? 0) > 2 ? ' 외...' : ''}
                    </span>
                  </div>
                  <span className="dash-feed-amount">₩{order.totalAmount.toLocaleString()}</span>
                  <span className="dash-feed-time">{timeSince(order.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 우측 컬럼 */}
        <div className="dash-right-col">
          {/* 월간 주별 매출 비교 */}
          <div className="dash-chart-card">
            <p className="dash-card-label">한달간 주별 매출 비교</p>
            <ResponsiveContainer width="100%" height={148}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#c0c0c0' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#c0c0c0' }}
                  axisLine={false} tickLine={false} width={36}
                  tickFormatter={(v) => v === 0 ? '0' : v >= 10000 ? `${(v / 10000).toFixed(0)}만` : `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(v) => [`₩${v.toLocaleString()}`, '매출']}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="매출" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 인기 상품 TOP 5 */}
          <div className="dash-top-products">
            <p className="dash-card-label">인기 상품 TOP 5</p>
            {topProducts.length === 0 ? (
              <p style={{ color: '#bbb', fontSize: 12, padding: '8px 0' }}>판매 데이터 없음</p>
            ) : topProducts.map((p, i) => (
              <div key={i} className="dash-top-item">
                <span className={`dash-rank${i === 0 ? ' gold' : i === 1 ? ' silver' : i === 2 ? ' bronze' : ''}`}>
                  {i + 1}
                </span>
                <span className="dash-product-name">{p.name}</span>
                <div className="dash-product-meta">
                  <span className="dash-product-qty">{p.qty}개 판매</span>
                  {p.revenue > 0 && <span className="dash-product-rev">₩{p.revenue.toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* 재고 부족 알림 */}
          {lowStock.length > 0 && (
            <div className="dash-low-stock">
              <p className="dash-card-label">⚠️ 재고 부족 알림</p>
              {lowStock.map((p) => (
                <div key={p._id} className="dash-low-item">
                  <span className="dash-product-name">{p.name}</span>
                  <span className={`dash-stock-badge ${p.stock === 0 ? 'out' : p.stock <= 3 ? 'danger' : 'warn'}`}>
                    {p.stock === 0 ? '품절' : `재고 ${p.stock}개`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 최근 리뷰 */}
      <div className="dash-reviews-card">
        <div className="dash-feed-hd">
          <p className="dash-card-label" style={{ marginBottom: 0 }}>최근 구매자 리뷰</p>
          <span className="dash-feed-count">{recentReviews.length}건</span>
        </div>
        {recentReviews.length === 0 ? (
          <p className="dash-reviews-empty">등록된 리뷰가 없습니다.</p>
        ) : (
          <div className="dash-reviews-list">
            {recentReviews.map((rv) => (
              <div key={rv._id} className="dash-review-item">
                <div className="dash-review-stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`dash-review-star${i < rv.rating ? ' filled' : ''}`}>★</span>
                  ))}
                </div>
                <div className="dash-review-body">
                  <p className="dash-review-product">{rv.product?.name ?? '삭제된 상품'}</p>
                  <p className="dash-review-content">{rv.content}</p>
                </div>
                {rv.images?.[0] && (
                  <img src={rv.images[0]} alt="리뷰 이미지" className="dash-review-thumb" />
                )}
                <div className="dash-review-meta">
                  <span className="dash-review-author">{rv.user?.name ?? '구매자'}</span>
                  <span className="dash-review-time">{timeSince(rv.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
