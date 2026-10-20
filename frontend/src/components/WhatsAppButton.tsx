'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

const WhatsAppButton = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Direct fetch for settings to avoid any aggregated data issues
    api.get(`/cms/settings?t=${Date.now()}`).then(({ data }) => {
      const dbNumber = data.whatsapp_number;
      if (dbNumber) {
        setWhatsappNumber(dbNumber);
      } else {
        // Ultimate fallback if DB is truly empty
        setWhatsappNumber('918888888888');
      }
    }).catch(() => {
      setWhatsappNumber('918888888888');
    });
  }, []);

  if (!whatsappNumber) return null;

  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  return (
    <div className="fixed bottom-10 right-10 z-[9999] flex items-center gap-4">
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="bg-[#FEFFEF] text-[#573B2D] px-5 py-2.5 text-[11px] uppercase font-bold tracking-[0.25em] rounded-full shadow-[0_10px_30px_rgba(87,59,45,0.15)] border border-[#573B2D]/20 pointer-events-none"
          >
            Contact Support
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ borderRadius: '50%' }}
        className="relative flex items-center justify-center h-12 w-12 bg-[#25D366] shadow-[0_8px_30px_rgba(37,211,102,0.3)] hover:bg-[#20ba5a] transition-all duration-300 group overflow-hidden"
        aria-label="Contact us on WhatsApp"
      >
        {/* Pulsing Outer Ring */}
        <span style={{ borderRadius: '50%' }} className="absolute inset-0 bg-[#25D366] animate-ping opacity-20"></span>
        
        {/* WhatsApp Logo SVG */}
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="currentColor"
          className="text-white relative z-10"
        >
          <path d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.175.201-.351.226-.652.076-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.675-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.301.301-.501.101-.201.05-.376-.025-.527-.075-.15-.678-1.633-.929-2.238-.244-.59-.492-.51-.678-.52l-.578-.01c-.2 0-.527.075-.803.376s-1.054 1.03-1.054 2.511 1.079 2.912 1.23 3.113c.15.201 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.379.197 1.9.12.58-.088 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.076-.125-.276-.201-.577-.351zM12.04 2C6.52 2 2.03 6.49 2.03 12.01c0 1.97.57 3.81 1.57 5.37L2 22l4.78-1.54c1.51.93 3.27 1.46 5.26 1.46 5.52 0 10.01-4.49 10.01-10.01S17.56 2 12.04 2zm0 18.23c-1.73 0-3.35-.49-4.73-1.35l-.34-.21-2.82.91.93-2.75-.23-.37c-.96-1.53-1.49-3.32-1.49-5.18 0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.54-3.7 8.24-8.24 8.24z" />
        </svg>
      </motion.a>

    </div>
  );
};

export default WhatsAppButton;
