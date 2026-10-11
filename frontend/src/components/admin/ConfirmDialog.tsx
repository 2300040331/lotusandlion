'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  type = 'danger'
}: ConfirmDialogProps) {
  const colorMap = {
    danger: 'bg-red-500 text-white hover:bg-red-600',
    warning: 'bg-yellow-500 text-black hover:bg-yellow-600',
    info: 'bg-blue-500 text-white hover:bg-blue-600',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-white border border-[#573B2D]/20 rounded-2xl p-6 shadow-2xl text-[#573B2D]"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-xl font-bold text-[#573B2D] uppercase tracking-tight">{title}</h2>
            </div>

            <p className="text-[#573B2D]/80 text-sm mb-8">{message}</p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-grow py-3 px-4 rounded-xl border border-[#573B2D]/30 text-[#573B2D] font-bold uppercase tracking-widest text-[10px] hover:bg-[#573B2D]/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-grow py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${colorMap[type]}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
