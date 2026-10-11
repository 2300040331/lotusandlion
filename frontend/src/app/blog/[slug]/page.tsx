'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/cms/blogs/${slug}`).then(({ data }) => setBlog(data)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-[#FEFFEF] py-24 text-center uppercase tracking-[0.18em] text-[#573B2D]/70">Loading journal...</div>;
  if (!blog) return <div className="min-h-screen bg-[#FEFFEF] py-24 text-center uppercase tracking-[0.18em] text-[#573B2D]/70">Journal not found</div>;

  return (
    <main className="bg-[#FEFFEF] text-[#573B2D]">
      <article className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
        <Link href="/" className="text-[12px] uppercase tracking-[0.18em] text-[#573B2D] hover:opacity-75">Back to store</Link>
        <p className="mt-10 text-[12px] uppercase tracking-[0.22em] text-[#573B2D]/70">{blog.category}</p>
        <h1 className="brand-heading mt-4 text-4xl uppercase md:text-6xl text-[#573B2D]">{blog.title}</h1>
        {blog.excerpt && <p className="mt-6 text-lg leading-8 text-[#573B2D]/80">{blog.excerpt}</p>}
        {blog.coverImage && <img src={blog.coverImage} alt={blog.title} className="mt-10 aspect-[16/9] w-full object-cover" />}
        <div className="prose prose-neutral mt-10 max-w-none text-[#573B2D]/90" dangerouslySetInnerHTML={{ __html: blog.body || '' }} />
      </article>
    </main>
  );
}
