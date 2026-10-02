'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function ComingSoon() {
  return (
    <div className="min-h-screen h-screen w-full bg-[#FEFFEF] text-[#543827] flex flex-col items-center justify-center relative overflow-hidden select-none px-6 py-12">
      {/* Subtle corner framing / luxury editorial borders */}
      <div 
        className="absolute inset-4 sm:inset-8 md:inset-12 pointer-events-none border border-[#C9B9A5]/30"
        aria-hidden="true"
      />
      <div 
        className="absolute inset-5 sm:inset-9 md:inset-13 pointer-events-none border border-[#C9B9A5]/15"
        aria-hidden="true"
      />

      {/* Main Content Container */}
      <main className="relative z-10 max-w-2xl w-full mx-auto flex flex-col items-center text-center">
        {/* Step 1: Subtle Royal Emblem & Hatton Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center w-full"
        >
          {/* Subtle Crest / Motif */}
          <div className="mb-6 md:mb-8 text-[#C9B9A5]">
            <svg 
              width="40" 
              height="40" 
              viewBox="0 0 64 64" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 sm:w-10 sm:h-10 opacity-80"
              aria-hidden="true"
            >
              <path 
                d="M32 6C32 6 36 18 48 20C38 24 35 34 32 46C29 34 26 24 16 20C28 18 32 6 32 6Z" 
                stroke="#C9B9A5" 
                strokeWidth="1.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <circle cx="32" cy="48" r="1.5" fill="#C9B9A5" />
              <path 
                d="M20 54H44" 
                stroke="#C9B9A5" 
                strokeWidth="1" 
                strokeLinecap="round" 
              />
            </svg>
          </div>

          {/* Hatton Font LOTUS AND LION Wordmark */}
          <div className="w-full flex justify-center px-4 max-w-[360px] sm:max-w-[480px] md:max-w-[580px] lg:max-w-[660px]">
            <Image 
              src="/lotus-and-lion-wordmark.png"
              alt="LOTUS AND LION"
              width={1024}
              height={97}
              priority
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Delicate Accent Line */}
          <div className="w-12 sm:w-16 h-[1px] bg-[#C9B9A5] my-7 sm:my-9 opacity-70" />
        </motion.div>

        {/* Step 2: "COMING SOON" */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 sm:mb-5"
        >
          <span 
            className="text-xs sm:text-sm md:text-[15px] font-medium tracking-[0.38em] sm:tracking-[0.45em] text-[#765B48] uppercase block pl-[0.38em] sm:pl-[0.45em]"
            style={{ fontFamily: '"Bodoni Moda", "Italiana", "Cormorant Garamond", Georgia, serif' }}
          >
            COMING SOON
          </span>
        </motion.div>

        {/* Step 3: Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p 
            className="text-base sm:text-lg md:text-xl text-[#765B48] italic tracking-[0.04em] font-light max-w-md mx-auto leading-relaxed px-4"
            style={{ fontFamily: '"Cormorant Garamond", "Bodoni Moda", Georgia, serif' }}
          >
            A new expression of timeless elegance.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
