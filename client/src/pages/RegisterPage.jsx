import PropTypes from 'prop-types';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register } from '@/api/auth';
import useAuthStore from '@/store/authStore';
import './RegisterPage.css';

const STEPS = ['약관동의', '정보입력', '가입완료'];

/* ── 1단계: 약관 동의 ─────────────────────────────── */
function StepTerms({ onNext }) {
  const [agreed, setAgreed] = useState({
    all: false, service: false, privacy: false, marketing: false,
  });

  const handleAll = (e) => {
    const v = e.target.checked;
    setAgreed({ all: v, service: v, privacy: v, marketing: v });
  };

  const handleOne = (key) => (e) => {
    const next = { ...agreed, [key]: e.target.checked };
    next.all = next.service && next.privacy && next.marketing;
    setAgreed(next);
  };

  return (
    <div className="register-form">
      <div className="terms-box">
        <label className="terms-all">
          <input type="checkbox" checked={agreed.all} onChange={handleAll} />
          {' '}전체 동의합니다
        </label>
        <label className="terms-item">
          <input type="checkbox" checked={agreed.service} onChange={handleOne('service')} />
          {' '}[필수] 이용약관 동의
          <span className="terms-link">보기</span>
        </label>
        <label className="terms-item">
          <input type="checkbox" checked={agreed.privacy} onChange={handleOne('privacy')} />
          {' '}[필수] 개인정보 수집 및 이용 동의
          <span className="terms-link">보기</span>
        </label>
        <label className="terms-item">
          <input type="checkbox" checked={agreed.marketing} onChange={handleOne('marketing')} />
          {' '}[선택] 마케팅 정보 수신 동의
          <span className="terms-link">보기</span>
        </label>
      </div>
      <div className="register-actions">
        <button
          className="btn btn-primary btn-full"
          onClick={() => onNext({ marketing_agreed: agreed.marketing })}
          disabled={!agreed.service || !agreed.privacy}
        >
          다음 단계
        </button>
      </div>
    </div>
  );
}

StepTerms.propTypes = {
  onNext: PropTypes.func.isRequired,
};

/* ── 2단계: 정보 입력 ─────────────────────────────── */
function StepInfo({ onNext, onBack, isPending, error }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', passwordConfirm: '',
    phone: '', birth_date: '', gender: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const pwMismatch = form.passwordConfirm && form.password !== form.passwordConfirm;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pwMismatch) return;
    const data = { ...form };
    delete data.passwordConfirm;
    onNext(data);
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="reg-name">
            이름<span className="required">*</span>
          </label>
          <input
            id="reg-name"
            className="form-input"
            name="name"
            placeholder="홍길동"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="reg-gender">
            성별<span className="required">*</span>
          </label>
          <select
            id="reg-gender"
            className="form-input"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
          >
            <option value="" disabled>선택하세요</option>
            <option value="M">남성</option>
            <option value="F">여성</option>
            <option value="other">기타</option>
          </select>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="reg-email">
          이메일<span className="required">*</span>
        </label>
        <input
          id="reg-email"
          className="form-input"
          type="email"
          name="email"
          placeholder="example@email.com"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="reg-password">
          비밀번호<span className="required">*</span>
        </label>
        <input
          id="reg-password"
          className="form-input"
          type="password"
          name="password"
          placeholder="6자 이상 입력"
          value={form.password}
          onChange={handleChange}
          minLength={6}
          required
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="reg-password-confirm">
          비밀번호 확인<span className="required">*</span>
        </label>
        <input
          id="reg-password-confirm"
          className="form-input"
          type="password"
          name="passwordConfirm"
          placeholder="비밀번호 재입력"
          value={form.passwordConfirm}
          onChange={handleChange}
          required
        />
        {pwMismatch && <p className="form-error">비밀번호가 일치하지 않습니다.</p>}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="reg-phone">
          휴대폰 번호<span className="required">*</span>
        </label>
        <input
          id="reg-phone"
          className="form-input"
          type="tel"
          name="phone"
          placeholder="010-0000-0000"
          value={form.phone}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="reg-birth">
          생년월일<span className="required">*</span>
        </label>
        <input
          id="reg-birth"
          className="form-input"
          type="date"
          name="birth_date"
          value={form.birth_date}
          onChange={handleChange}
          max={new Date().toISOString().split('T')[0]}
          required
        />
        <span className="form-hint">생일 쿠폰 발급에 활용됩니다.</span>
      </div>

      {error && (
        <p className="form-error">
          {error.response
            ? (error.response.data?.message || '회원가입에 실패했습니다.')
            : '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'}
        </p>
      )}

      <div className="register-actions">
        <button
          type="button"
          className="btn btn-outline"
          style={{ flex: 1 }}
          onClick={onBack}
        >
          이전
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ flex: 2 }}
          disabled={isPending}
        >
          {isPending ? '처리 중...' : '가입하기'}
        </button>
      </div>
    </form>
  );
}

StepInfo.propTypes = {
  onNext:    PropTypes.func.isRequired,
  onBack:    PropTypes.func.isRequired,
  isPending: PropTypes.bool,
  error:     PropTypes.shape({
    response: PropTypes.shape({
      data: PropTypes.shape({ message: PropTypes.string }),
    }),
  }),
};

/* ── 3단계: 완료 ──────────────────────────────────── */
function StepDone({ name }) {
  return (
    <div className="register-done">
      <div className="register-done-icon">🎉</div>
      <h3 className="register-done-title">가입을 축하합니다!</h3>
      <p className="register-done-desc">{name}님, ShopMall 회원이 되신 것을 환영합니다.</p>
      <Link to="/" className="btn btn-primary btn-lg">쇼핑 시작하기</Link>
    </div>
  );
}

StepDone.propTypes = {
  name: PropTypes.string,
};

/* ── 메인 컴포넌트 ────────────────────────────────── */
export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [stepData, setStepData] = useState({});
  const setAuth = useAuthStore((s) => s.setAuth);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data) => register(data),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.token, true);
      setStep(2);
    },
  });

  const handleStep1 = (data) => {
    setStepData((prev) => ({ ...prev, ...data }));
    setStep(1);
  };

  const handleStep2 = (data) => mutate({ ...stepData, ...data });

  return (
    <div className="register-page">
      <div className="register-card">
        <h1 className="register-title">회원가입</h1>
        <p className="register-subtitle">ShopMall과 함께 다양한 혜택을 누려보세요</p>

        {/* 단계 표시 */}
        <div className="register-steps">
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
              <div className={`register-step${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
                <div className="step-number">{i + 1}</div>
                <div className="step-label">{label}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-connector${i < step ? ' done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {step === 0 && <StepTerms onNext={handleStep1} />}
        {step === 1 && (
          <StepInfo
            onNext={handleStep2}
            onBack={() => setStep(0)}
            isPending={isPending}
            error={error}
          />
        )}
        {step === 2 && <StepDone name={stepData.name} />}

        {step < 2 && (
          <div className="register-footer">
            이미 계정이 있으신가요?{' '}
            <Link to="/login">로그인</Link>
          </div>
        )}
      </div>
    </div>
  );
}
