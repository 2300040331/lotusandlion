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
    <div className="min-h-[80vh] flex items-center justify-center bg-white dark:bg-black text-black dark:text-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold uppercase tracking-widest mb-4">Sign In</h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Return to your Lotus & Lion account</p>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-700 dark:text-gray-300">Email Address</label>
            <input
              type="text"
              inputMode="email"
              autoComplete="username"
              required
              className="w-full bg-transparent border border-border dark:border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-primary dark:focus:border-[#c8a45d] transition-colors tracking-wide text-black dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              required
              className="w-full bg-transparent border border-border dark:border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-primary dark:focus:border-[#c8a45d] transition-colors tracking-wide text-black dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary dark:hover:bg-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <Link href="/forgot-password" className="block text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest hover:text-primary dark:hover:text-[#c8a45d] transition-colors">
            Forgotten your password?
          </Link>
          <div className="pt-8 border-t border-border dark:border-white/10">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Don't have an account?</p>
            <Link
              href={`/register?redirect=${redirect}`}
              className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-[#c8a45d] hover:text-black dark:hover:text-white transition-colors border-b border-primary dark:border-[#c8a45d] pb-1"
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
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center uppercase tracking-widest text-xs">Preparing sign in...</div>}>
      <LoginContent />
    </Suspense>
  );
}
