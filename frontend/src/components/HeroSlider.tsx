'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Slide {
  title: string;
  showTitle?: boolean;
  subtitle: string;
  eyebrow?: string;
  ctaText?: string;
  ctaLink?: string;
  image?: string;
  mobileImage?: string;
  desktopObjectPosition?: string;
  mobileObjectPosition?: string;
}

interface HeroSliderProps {
  slides: Slide[];
}

const HeroSlider = ({ slides = [] }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    if (!slides || slides.length === 0) return;
    setDirection(1);
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides]);

  const prevSlide = useCallback(() => {
    if (!slides || slides.length === 0) return;
    setDirection(-1);
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides]);

  useEffect(() => {
    if (!slides || slides.length === 0) return;

    const timer = window.setInterval(() => {
      nextSlide();
    }, 6000);
    return () => window.clearInterval(timer);
  }, [nextSlide, slides]);

  if (!slides || slides.length === 0) {
    return (
      <section className="relative h-[72vh] min-h-[560px] overflow-hidden border-b border-[#573B2D]/15 bg-[#FEFFEF] animate-pulse flex items-center justify-center">
        <div className="text-[10px] uppercase tracking-[0.5em] text-[#573B2D]/50">Lotus & Lion Archive Loading...</div>
      </section>
    );
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const slide = slides[current];

  if (!slide) return null;

  const isFlyer = !!(
    slide.mobileImage?.includes('flyer') ||
    slide.mobileImage?.includes('1781967736031') ||
    slide.mobileImage?.includes('1781971916536') ||
    slide.image?.includes('flyer') ||
    slide.image?.includes('1781967736031') ||
    slide.image?.includes('1781971916536')
  );

  return (
    <section className="relative h-[72vh] min-h-[620px] overflow-hidden border-b border-[#573B2D]/15 bg-[#FEFFEF] sm:h-[72vh] sm:min-h-[560px]">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 },
          }}
          className="absolute inset-0"
          style={{
            backgroundColor: isFlyer ? '#f5c5cc' : undefined
          }}
        >
          {slide.image ? (
            <>
              <img
                src={slide.image}
                alt={slide.title}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80';
                }}
                style={{ objectPosition: slide.desktopObjectPosition || 'center center' }}
                className="absolute inset-0 hidden h-full w-full object-cover sm:block"
              />
              <img
                src={slide.mobileImage || slide.image}
                alt={slide.title}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80';
                }}
                style={{ objectPosition: slide.mobileObjectPosition || 'center center' }}
                className={`absolute inset-0 h-full w-full sm:hidden ${isFlyer ? 'object-contain' : 'object-cover'}`}
              />
            </>
          ) : (
            <div className="hero-editorial absolute inset-0" />
          )}
          <div className={`absolute inset-0 bg-[#573B2D]/20 ${isFlyer ? 'hidden sm:block' : ''}`} />
          
          <div className={`absolute inset-0 z-10 flex items-center justify-center px-8 text-center text-[#FEFFEF] sm:px-12 ${isFlyer ? 'hidden sm:flex' : ''}`}>
            <div className="max-w-4xl">
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-3 text-[12px] uppercase tracking-[0.28em] sm:mb-4 sm:text-[13px] sm:tracking-[0.32em] text-[#FEFFEF]/90"
              >
                {slide.eyebrow}
              </motion.p>
              {slide.showTitle !== false && (
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="brand-heading text-5xl leading-none sm:text-6xl md:text-7xl text-[#FEFFEF]"
                >
                  {slide.title}
                </motion.h1>
              )}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mx-auto mt-4 max-w-2xl text-[12px] leading-relaxed opacity-90 sm:mt-5 sm:text-sm sm:leading-7 text-[#FEFFEF]/90"
              >
                {slide.subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href={slide.ctaLink || '/products'}
                  className="mt-8 inline-flex rounded-full bg-[#573B2D] px-10 py-4 text-[13px] uppercase tracking-[0.08em] text-[#FEFFEF] transition-colors hover:bg-[#3d291f] sm:px-12 sm:text-[12px] sm:tracking-[0.18em]"
                >
                  {slide.ctaText || 'Shop Now'}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-5 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/50 text-white hover:bg-white/10 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-5 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/50 text-white hover:bg-white/10 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > current ? 1 : -1);
                  setCurrent(idx);
                }}
                className={`h-1.5 transition-all duration-300 ${
                  current === idx ? 'w-12 bg-[#FEFFEF]' : 'w-6 bg-[#FEFFEF]/40 hover:bg-[#FEFFEF]/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroSlider;
