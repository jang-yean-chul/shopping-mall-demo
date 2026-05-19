import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-section">
            <h4>고객센터</h4>
            <p className="footer-cs-number">1577-0000</p>
            <p className="footer-cs-hours">평일 09:00 ~ 18:00 (주말·공휴일 휴무)</p>
          </div>

          <div className="footer-section">
            <h4>쇼핑 안내</h4>
            <ul>
              <li><Link to="#">공지사항</Link></li>
              <li><Link to="#">자주 묻는 질문</Link></li>
              <li><Link to="#">상품 Q&A</Link></li>
              <li><Link to="#">온라인 특가</Link></li>
              <li><Link to="#">매장 안내</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>이용 안내</h4>
            <ul>
              <li><Link to="#">배송 안내</Link></li>
              <li><Link to="#">교환 / 반품</Link></li>
              <li><Link to="#">사이즈 가이드</Link></li>
              <li><Link to="#">회원 혜택</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-company-info">
            (주)쇼핑몰 &nbsp;|&nbsp; 대표이사: 홍길동 &nbsp;|&nbsp; 사업자등록번호: 000-00-00000<br />
            서울특별시 강남구 테헤란로 000 &nbsp;|&nbsp; 통신판매업신고: 제2024-서울강남-0000호
          </p>
          <div className="footer-policy-links">
            <Link to="#">이용약관</Link>
            <Link to="#"><strong>개인정보처리방침</strong></Link>
            <Link to="#">청소년보호정책</Link>
          </div>
        </div>
      </div>

      <p className="footer-copyright">© 2025 ShopMall. All rights reserved.</p>
    </footer>
  );
}
