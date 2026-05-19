import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '@/api/auth';
import useAuthStore from '@/store/authStore';
import useToastStore from '@/store/toastStore';
import './LoginPage.css';

const SAVED_EMAIL_KEY = 'saved_email';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberEmail, setRememberEmail] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();

  // 저장된 이메일 복원
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) {
      setForm((f) => ({ ...f, email: saved }));
      setRememberEmail(true);
    }
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: () => login(form),
    onSuccess: ({ data }) => {
      if (rememberEmail) {
        localStorage.setItem(SAVED_EMAIL_KEY, form.email);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
      setAuth(data.user, data.token, autoLogin);
      showToast(`${data.user.name}님 환영합니다! 🎉`);
      navigate('/');
    },
    onError: (err) => {
      setErrorMsg(
        err.response?.data?.message ||
        (err.response ? '이메일 또는 비밀번호를 확인해주세요.' : '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'),
      );
    },
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="login-logo">ShopMall</p>
        <h1 className="login-title">로그인</h1>
        <p className="login-subtitle">계정에 로그인하고 다양한 혜택을 누려보세요</p>

        <form className="login-form" onSubmit={(e) => { e.preventDefault(); mutate(); }}>
          <input
            className="form-input"
            type="email"
            name="email"
            placeholder="이메일 주소"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
          <input
            className="form-input"
            type="password"
            name="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />

          {errorMsg && (
            <div className="login-error-box" role="alert">
              <span className="login-error-icon">!</span>
              {errorMsg}
            </div>
          )}

          <div className="login-options">
            <div className="login-checkboxes">
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                />
                {' '}이메일 기억
              </label>
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  checked={autoLogin}
                  onChange={(e) => setAutoLogin(e.target.checked)}
                />
                {' '}자동 로그인
              </label>
            </div>
            <div className="login-links">
              <Link to="#">이메일 찾기</Link>
              <span className="login-links-divider" />
              <Link to="#">비밀번호 찾기</Link>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isPending}>
            {isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-divider">
          <span>간편 로그인</span>
        </div>

        <div className="sns-login">
          <button type="button" className="sns-btn sns-btn-kakao">
            <span className="sns-btn-icon kakao-icon">K</span>
            {' '}카카오로 로그인
          </button>
          <button type="button" className="sns-btn sns-btn-naver">
            <span className="sns-btn-icon naver-icon">N</span>
            {' '}네이버로 로그인
          </button>
        </div>

        <div className="login-footer">
          아직 회원이 아니신가요?{' '}
          <Link to="/register">회원가입</Link>
        </div>
      </div>
    </div>
  );
}
