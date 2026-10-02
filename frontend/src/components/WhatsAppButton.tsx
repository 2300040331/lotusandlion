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
            className="bg-white text-[#1c1c1c] px-5 py-2.5 text-[11px] uppercase font-bold tracking-[0.25em] rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 pointer-events-none"
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
        
        {/* WhatsApp Logo Image */}
        <img 
          src="https://mxwmpivtusrpktzptmqt.supabase.co/storage/v1/object/public/lotus-lion/lotus-lion/brand/whatsapp-logo-1781973033703.png"
          alt="WhatsApp"
          className="h-full w-full object-cover rounded-full relative z-10"
        />
      </motion.a>

    </div>
  );
};

export default WhatsAppButton;
