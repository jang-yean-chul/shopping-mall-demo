import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="not-found container">
      <p className="not-found-code">404</p>
      <p>페이지를 찾을 수 없습니다.</p>
      <Link to="/">홈으로 돌아가기</Link>
    </div>
  );
}
