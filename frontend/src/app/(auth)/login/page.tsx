'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const { userInfo, setUserInfo } = useStore();

  useEffect(() => {
    if (userInfo) {
      if (userInfo.isAdmin && redirect === '/') {
        router.push('/admin');
      } else {
        router.push(redirect);
      }
    }
  }, [userInfo, router, redirect]);

  const submitHandler = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      sessionStorage.removeItem('lotus-lion-auth-expired');
      setUserInfo(data);
      toast.success('Welcome back to the legacy');
      if (data.isAdmin || data.role === 'admin' || data.role === 'super-admin' || data.role === 'editor') {
        router.push(redirect === '/' ? '/admin/control-center' : redirect);
      } else {
        router.push(redirect);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#FEFFEF] text-[#573B2D] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold uppercase tracking-widest mb-4 text-[#573B2D]">Sign In</h1>
          <p className="text-[10px] text-[#573B2D]/70 uppercase tracking-[0.2em]">Return to your Lotus & Lion account</p>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-[#573B2D]/80">Email Address</label>
            <input
              type="text"
              inputMode="email"
              autoComplete="username"
              required
              className="w-full bg-transparent border border-[#573B2D]/30 px-4 py-3 text-sm focus:outline-none focus:border-[#573B2D] transition-colors tracking-wide text-[#573B2D]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-[#573B2D]/80">Password</label>
            <input
              type="password"
              required
              className="w-full bg-transparent border border-[#573B2D]/30 px-4 py-3 text-sm focus:outline-none focus:border-[#573B2D] transition-colors tracking-wide text-[#573B2D]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#573B2D] text-[#FEFFEF] py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#573B2D]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <Link href="/forgot-password" className="block text-[10px] text-[#573B2D]/70 uppercase tracking-widest hover:text-[#573B2D] transition-colors">
            Forgotten your password?
          </Link>
          <div className="pt-8 border-t border-[#573B2D]/20">
            <p className="text-[10px] text-[#573B2D]/60 uppercase tracking-widest mb-4">Don't have an account?</p>
            <Link
              href={`/register?redirect=${redirect}`}
              className="text-[10px] font-bold uppercase tracking-widest text-[#573B2D] hover:opacity-80 transition-colors border-b border-[#573B2D] pb-1"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center uppercase tracking-widest text-xs bg-[#FEFFEF] text-[#573B2D]/70">Preparing sign in...</div>}>
      <LoginContent />
    </Suspense>
  );
}
