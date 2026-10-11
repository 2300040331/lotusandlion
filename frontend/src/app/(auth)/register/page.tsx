'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';

function RegisterContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const { userInfo, setUserInfo } = useStore();

  useEffect(() => {
    if (userInfo) {
      router.push(redirect);
    }
  }, [userInfo, router, redirect]);

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setUserInfo(data);
      toast.success('Account created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#FEFFEF] text-[#573B2D] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold uppercase tracking-widest mb-4 text-[#573B2D]">Register</h1>
          <p className="text-[10px] text-[#573B2D]/70 uppercase tracking-[0.2em]">Join the Lotus & Lion community</p>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-[#573B2D]/80">Full Name</label>
            <input
              type="text"
              required
              className="w-full bg-transparent border border-[#573B2D]/30 px-4 py-3 text-sm focus:outline-none focus:border-[#573B2D] transition-colors tracking-wide text-[#573B2D]"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-[#573B2D]/80">Email Address</label>
            <input
              type="email"
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
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-[#573B2D]/80">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full bg-transparent border border-[#573B2D]/30 px-4 py-3 text-sm focus:outline-none focus:border-[#573B2D] transition-colors tracking-wide text-[#573B2D]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#573B2D] text-[#FEFFEF] py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#573B2D]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center pt-8 border-t border-[#573B2D]/20">
          <p className="text-[10px] text-[#573B2D]/60 uppercase tracking-widest mb-4">Already have an account?</p>
          <Link
            href={`/login?redirect=${redirect}`}
            className="text-[10px] font-bold uppercase tracking-widest text-[#573B2D] hover:opacity-80 transition-colors border-b border-[#573B2D] pb-1"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center uppercase tracking-widest text-xs bg-[#FEFFEF] text-[#573B2D]/70">Preparing registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
