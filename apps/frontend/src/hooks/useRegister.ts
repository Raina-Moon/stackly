import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type RegisterStep = 'email' | 'verify' | 'profile';

export function useRegister() {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
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

  const register = async () => {
    if (!firstName) {
      setError('이름을 입력해주세요');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
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
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      const data = await res.json();

      if (data.success) {
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
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

  return {
    step,
    isLoading,
    error,
    email,
    setEmail,
    code,
    setCode,
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
