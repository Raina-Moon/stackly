import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useToast } from '@/contexts/ToastContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 비밀번호 유효성 검사
function isPasswordValid(password: string) {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

export type RegisterStep = 'email' | 'verify' | 'profile';

export function useRegister() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<RegisterStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const sendCode = async () => {
    if (!email) {
      setError('이메일을 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('verify');
      } else {
        setError(data.message);
      }
    } catch {
      setError('서버 연결에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('6자리 인증코드를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('profile');
      } else {
        setError(data.message);
      }
    } catch {
      setError('서버 연결에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const checkNickname = async () => {
    if (nickname.length < 2 || nickname.length > 20) {
      setError('닉네임은 2~20자여야 합니다');
      setNicknameAvailable(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/check-nickname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });
      const data = await res.json();

      setNicknameAvailable(data.available);
      if (!data.available) {
        setError(data.message);
      }
    } catch {
      setError('서버 연결에 실패했습니다');
      setNicknameAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async () => {
    if (!nickname || nickname.length < 2) {
      setError('닉네임을 입력해주세요 (2자 이상)');
      return;
    }
    if (nicknameAvailable !== true) {
      setError('닉네임 중복확인을 해주세요');
      return;
    }
    if (!firstName) {
      setError('이름을 입력해주세요');
      return;
    }
    if (!isPasswordValid(password)) {
      setError('비밀번호는 8자 이상, 대소문자/숫자/특수문자를 포함해야 합니다');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname, firstName, lastName }),
      });
      const data = await res.json();

      if (data.success) {
        showToast('회원가입이 완료되었습니다! 로그인해주세요.', 'success');
        router.push('/login');
      } else {
        setError(data.message);
      }
    } catch {
      setError('서버 연결에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => setStep('email');

  // 닉네임이 변경되면 중복확인 상태 리셋
  const handleSetNickname = (value: string) => {
    setNickname(value);
    setNicknameAvailable(null);
  };

  return {
    step,
    isLoading,
    error,
    email,
    setEmail,
    code,
    setCode,
    nickname,
    setNickname: handleSetNickname,
    nicknameAvailable,
    checkNickname,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    sendCode,
    verifyCode,
    register,
    goBack,
  };
}
